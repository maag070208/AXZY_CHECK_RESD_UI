import { render, screen, waitFor } from "@app/core/utils/test-utils";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import PaymentsPage from "./PaymentsPage";
import * as PaymentsService from "../services/PaymentsService";
import type { PaymentResponse } from "../services/PaymentsService";
import * as ResidentsService from "@app/modules/residents/services/ResidentsService";
import { useSelector } from "react-redux";

const mockPayments: { rows: PaymentResponse[]; total: number } = {
  rows: [
    {
      id: "pay-1",
      residentId: "res-1",
      feeId: "fee-1",
      amount: 500,
      reference: null,
      status: "PENDING",
      period: null,
      stripePaymentIntentId: null,
      stripeInvoiceId: null,
      s3ReceiptUrl: null,
      paidAt: null,
      createdAt: "2026-06-01T12:00:00.000Z",
      updatedAt: "2026-06-01T12:00:00.000Z",
      deletedAt: null,
      resident: { id: "res-1", phone: "555-0101", user: { id: "user-1", name: "Juan", lastName: "Perez" } },
      fee: { id: "fee-1", name: "Mantenimiento", amount: 500 },
    },
    {
      id: "pay-2",
      residentId: "res-2",
      feeId: "fee-2",
      amount: 1000,
      reference: "stripe_123",
      status: "PAID",
      period: null,
      stripePaymentIntentId: "pi_123",
      stripeInvoiceId: "in_123",
      s3ReceiptUrl: null,
      paidAt: "2026-06-02T12:00:00.000Z",
      createdAt: "2026-06-01T12:00:00.000Z",
      updatedAt: "2026-06-02T12:00:00.000Z",
      deletedAt: null,
      resident: { id: "res-2", phone: "555-0202", user: { id: "user-2", name: "Maria", lastName: "Lopez" } },
      fee: { id: "fee-2", name: "Cuota Anual", amount: 1000 },
    },
  ] as unknown as PaymentResponse[],
  total: 2,
};

const mockSummary = {
  paid: { count: 1, total: 1000 },
  pending: { count: 1, total: 500 },
};

vi.mock("../services/PaymentsService", () => ({
  getPaginatedPayments: vi.fn(),
  getPaymentSummary: vi.fn(),
  deletePayment: vi.fn(),
  createPaymentCheckout: vi.fn(),
  createPayment: vi.fn(),
  getFees: vi.fn(),

  createFee: vi.fn(),
  deleteFee: vi.fn(),
  getPaginatedFees: vi.fn(),
}));

vi.mock("@app/modules/residents/services/ResidentsService", () => ({
  getPaginatedResidents: vi.fn(),
}));

vi.mock("react-redux", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useSelector: vi.fn(),
  };
});

describe("PaymentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSelector).mockImplementation((selector: any) =>
      selector({ auth: { role: "ADMIN", token: "fake" } }),
    );
    vi.mocked(PaymentsService.getPaginatedPayments).mockResolvedValue({
      data: mockPayments.rows,
      total: mockPayments.total,
    });
    vi.mocked(PaymentsService.getPaymentSummary).mockResolvedValue({
      success: true,
      data: mockSummary,
      messages: [],
    });
    vi.mocked(PaymentsService.deletePayment).mockResolvedValue({
      success: true,
      data: mockPayments.rows[0] as any,
      messages: [],
    });
    vi.mocked(PaymentsService.getFees).mockResolvedValue({
      success: true,
      data: [],
      messages: [],
    });
    vi.mocked(ResidentsService.getPaginatedResidents).mockResolvedValue({
      data: [],
      total: 0,
    } as any);
  });

  it("debe renderizar el encabezado y las tarjetas de resumen", async () => {
    render(<PaymentsPage />);

    expect(screen.getByText("Control de Pagos")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Total Recaudado")).toBeInTheDocument();
      expect(screen.getByText("Total Pendiente")).toBeInTheDocument();
      expect(screen.getByText("$1,000.00")).toBeInTheDocument();
      expect(screen.getByText("$500.00")).toBeInTheDocument();
    });
  });

  it("debe mostrar el botón Nuevo Pago para administradores", async () => {
    render(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /nuevo pago/i })).toBeInTheDocument();
    });
  });

  it("debe ocultar Nuevo Pago para residentes", async () => {
    vi.mocked(useSelector).mockImplementation(
      (selector: any) => selector({ auth: { role: "RESDN", token: "fake" } }),
    );

    render(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /nuevo pago/i })).not.toBeInTheDocument();
    });
  });

  it("debe abrir el diálogo de registro de pago al hacer clic en Nuevo Pago", async () => {
    const user = userEvent.setup();
    render(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /nuevo pago/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /nuevo pago/i }));

    expect(screen.getByText(/asignación manual de cobro/i)).toBeInTheDocument();
  });

  it("debe abrir confirmación al hacer clic en eliminar y confirmar cancelación", async () => {
    const user = userEvent.setup();
    render(<PaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    });

    const deleteButtons = await screen.findAllByTitle("Cancelar Pago");
    expect(deleteButtons.length).toBe(2);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/¿Cancelar este pago\?/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "CANCELAR PAGO" }));

    await waitFor(() => {
      expect(PaymentsService.deletePayment).toHaveBeenCalledWith("pay-1");
    });
  });
});
