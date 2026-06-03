import { render, screen, waitFor } from "@app/core/utils/test-utils";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import FeesPage from "./FeesPage";
import * as PaymentsService from "../services/PaymentsService";

const mockFeesData = {
  data: [
    {
      id: "fee-1",
      name: "Mantenimiento",
      description: "Cuota mensual ordinaria",
      amount: 500,
      type: "MONTHLY",
      dueDate: "2026-07-01",
      active: true,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
    },
  ],
  total: 1,
};

const mockPlans = [
  {
    id: "plan-1",
    name: "Premium",
    description: "Suscripción anual",
    amount: 2400,
    stripePriceId: "price_xxx",
    active: true,
    interval: "month",
    createdAt: "",
    updatedAt: "",
  },
];

vi.mock("../services/PaymentsService", () => ({
  getPaginatedFees: vi.fn(),
  getSubscriptionPlans: vi.fn(),
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
    vi.mocked(PaymentsService.getSubscriptionPlans).mockResolvedValue({
      success: true,
      data: mockPlans,
      messages: [],
    });
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

  it("debe renderizar el encabezado, tabla de cuotas y planes", async () => {
    render(<FeesPage />);

    expect(screen.getByText("Catálogo de Cuotas y Planes")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Mantenimiento")).toBeInTheDocument();
      expect(screen.getByText("Premium")).toBeInTheDocument();
    });
  });

  it("debe mostrar el formulario de alta al hacer clic en Nueva Cuota", async () => {
    const user = userEvent.setup();
    render(<FeesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /nueva cuota/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /nueva cuota/i }));

    expect(screen.getByText("Alta de Tipo de Pago")).toBeInTheDocument();
  });

  it("debe crear una cuota al llenar el formulario", async () => {
    const user = userEvent.setup();
    render(<FeesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /nueva cuota/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /nueva cuota/i }));

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Seguridad");

    const amountInput = screen.getByLabelText(/monto/i);
    await user.clear(amountInput);
    await user.type(amountInput, "300");

    const submitBtn = screen.getByRole("button", { name: /guardar cuota/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(PaymentsService.createFee).toHaveBeenCalled();
    });
  });

  it("debe abrir confirmación al eliminar una cuota", async () => {
    const user = userEvent.setup();
    render(<FeesPage />);

    await waitFor(() => {
      expect(screen.getByText("Mantenimiento")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle("Eliminar");
    await user.click(deleteBtn);

    expect(screen.getByText(/¿Eliminar Tipo de Pago\?/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /eliminar ahora/i }));

    await waitFor(() => {
      expect(PaymentsService.deleteFee).toHaveBeenCalledWith("fee-1");
    });
  });
});
