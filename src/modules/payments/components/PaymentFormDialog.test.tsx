import { render, screen, waitFor } from "@app/core/utils/test-utils";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { PaymentFormDialog } from "./PaymentFormDialog";
import * as PaymentsService from "../services/PaymentsService";
import * as ResidentsService from "@app/modules/residents/services/ResidentsService";

const mockFees = [
  { id: "fee-1", name: "Mantenimiento", amount: 500, type: "MONTHLY", dueDate: "2026-07-01", active: true, description: null, createdAt: "", updatedAt: "", deletedAt: null },
  { id: "fee-2", name: "Cuota Anual", amount: 1000, type: "ONE_TIME", dueDate: "2026-12-31", active: true, description: null, createdAt: "", updatedAt: "", deletedAt: null },
];

const mockResidents = [
  { id: "res-1", phone: "555-0101", house: { street: "Principal", number: "123" }, user: { id: "user-1", name: "Juan", lastName: "Perez" } },
  { id: "res-2", phone: "555-0202", house: { street: "Roble", number: "45" }, user: { id: "user-2", name: "Maria", lastName: "Lopez" } },
];

vi.mock("../services/PaymentsService", () => ({
  createPayment: vi.fn(),
  getFees: vi.fn(),
  deletePayment: vi.fn(),
  createPaymentCheckout: vi.fn(),
  getPaginatedPayments: vi.fn(),
  deleteFee: vi.fn(),
  createFee: vi.fn(),
  getPaginatedFees: vi.fn(),
  getSubscriptionPlans: vi.fn(),
  getPaymentSummary: vi.fn(),
}));

vi.mock("@app/modules/residents/services/ResidentsService", () => ({
  getPaginatedResidents: vi.fn(),
}));

describe("PaymentFormDialog", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PaymentsService.getFees).mockResolvedValue({
      success: true,
      data: mockFees,
      messages: [],
    });
    vi.mocked(ResidentsService.getPaginatedResidents).mockResolvedValue({
      success: true,
      data: mockResidents,
    });
    vi.mocked(PaymentsService.createPayment).mockResolvedValue({
      success: true,
      data: { id: "pay-new" } as any,
      messages: [],
    });
  });

  it("debe renderizar el diálogo con campos y botones", async () => {
    render(
      <PaymentFormDialog isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
    );

    expect(await screen.findByText(/Asignación Manual de Cobro/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Registrar Pago/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
  });

  it("debe auto-llenar el monto al seleccionar una cuota", async () => {
    const user = userEvent.setup();
    render(
      <PaymentFormDialog isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Asignación Manual de Cobro/i)).toBeInTheDocument();
    });

    const residentInput = screen.getByPlaceholderText(/seleccionar residente/i);
    await user.click(residentInput);

    const firstResident = await screen.findByText(/Juan.*Perez/i);
    await user.click(firstResident);

    const feeInput = screen.getByPlaceholderText(/seleccionar cuota/i);
    await user.click(feeInput);

    const firstFee = await screen.findByText(/Mantenimiento/i);
    await user.click(firstFee);

    await waitFor(() => {
      expect(screen.getByDisplayValue("500")).toBeInTheDocument();
    });
  });

  it("debe llamar a createPayment al enviar el formulario", async () => {
    const user = userEvent.setup();
    render(
      <PaymentFormDialog isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Asignación Manual de Cobro/i)).toBeInTheDocument();
    });

    const residentInput = screen.getByPlaceholderText(/seleccionar residente/i);
    await user.click(residentInput);
    const firstResident = await screen.findByText(/Juan.*Perez/i);
    await user.click(firstResident);

    const feeInput = screen.getByPlaceholderText(/seleccionar cuota/i);
    await user.click(feeInput);
    const firstFee = await screen.findByText(/Mantenimiento/i);
    await user.click(firstFee);

    await waitFor(() => {
      expect(screen.getByDisplayValue("500")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Registrar Pago/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(PaymentsService.createPayment).toHaveBeenCalled();
    });
  });
});
