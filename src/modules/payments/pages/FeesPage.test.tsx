import { render, screen, waitFor } from "@app/core/utils/test-utils";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import FeesPage from "./FeesPage";
import * as PaymentsService from "../services/PaymentsService";

const mockFeeRow = {
  id: "fee-1",
  name: "Mantenimiento",
  description: "Cuota mensual ordinaria",
  amount: 500,
  type: "MONTHLY" as const,
  dueDate: "2026-07-01",
  active: true,
  createdAt: "",
  updatedAt: "",
  deletedAt: null,
};

const mockFeesData = { data: [mockFeeRow], total: 1 };

vi.mock("../services/PaymentsService", () => ({
  getPaginatedFees: vi.fn(),
  createFee: vi.fn(),
  deleteFee: vi.fn(),
  getFees: vi.fn(),
  getPaymentSummary: vi.fn(),
  createPayment: vi.fn(),
  deletePayment: vi.fn(),
  getPaginatedPayments: vi.fn(),
  createPaymentCheckout: vi.fn(),
}));

describe("FeesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PaymentsService.getPaginatedFees).mockResolvedValue(mockFeesData);
    vi.mocked(PaymentsService.createFee).mockResolvedValue({
      success: true,
      data: mockFeesData.data[0] as any,
      messages: [],
    });
    vi.mocked(PaymentsService.deleteFee).mockResolvedValue({
      success: true,
      data: mockFeesData.data[0] as any,
      messages: [],
    });
  });

  it("debe renderizar el encabezado y boton nueva cuota", () => {
    render(<FeesPage />);
    expect(screen.getByText("Catálogo de Cuotas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nueva cuota/i })).toBeInTheDocument();
  });

  it("debe mostrar el dialogo de alta al hacer clic en Nueva Cuota", async () => {
    const user = userEvent.setup();
    render(<FeesPage />);
    await user.click(screen.getByRole("button", { name: /nueva cuota/i }));
    expect(screen.getByText("Alta de Tipo de Pago")).toBeInTheDocument();
  });

  it("debe crear una cuota mensual sin fecha de vencimiento", async () => {
    const user = userEvent.setup();
    render(<FeesPage />);
    await user.click(screen.getByRole("button", { name: /nueva cuota/i }));

    await user.type(screen.getByLabelText(/nombre/i), "Seguridad");
    await user.type(screen.getByLabelText(/monto/i), "300");

    const typeSelect = screen.getByDisplayValue('Cargo Único (1 a 1)');
    await user.selectOptions(typeSelect, "MONTHLY");

    await user.click(screen.getByRole("button", { name: /guardar cuota/i }));

    await waitFor(() => {
      expect(PaymentsService.createFee).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Seguridad", amount: 300, type: "MONTHLY" }),
      );
    });
  });

  it("debe cerrar el dialogo al cancelar", async () => {
    const user = userEvent.setup();
    render(<FeesPage />);
    await user.click(screen.getByRole("button", { name: /nueva cuota/i }));
    expect(screen.getByText("Alta de Tipo de Pago")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByText("Alta de Tipo de Pago")).not.toBeInTheDocument();
  });
});
