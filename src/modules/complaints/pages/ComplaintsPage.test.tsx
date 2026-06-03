import { render, screen, waitFor } from "@app/core/utils/test-utils";
import ComplaintsPage from "./ComplaintsPage";
import * as complaintsService from "../services/ComplaintsService";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ComplaintsService
vi.mock("../services/ComplaintsService", () => ({
  getPaginatedComplaints: vi.fn(),
  getComplaintCategories: vi.fn(),
  createComplaint: vi.fn(),
  updateComplaint: vi.fn(),
  deleteComplaint: vi.fn(),
}));

const mockResidentUser = {
  role: "RESDN",
  token: "fake-resident-token",
  name: "Rosa Vega",
};

vi.mock("react-redux", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useSelector: vi.fn(() => mockResidentUser),
  };
});

const mockCategories = [
  { id: "cat-1", name: "Seguridad", icon: "shield", color: "blue" },
  { id: "cat-2", name: "Mantenimiento", icon: "wrench", color: "green" },
];

const mockComplaints = {
  rows: [
    {
      id: "complaint-uuid-1",
      residentId: "resident-1",
      categoryId: "cat-1",
      title: "Ruidos molesto en lote 45",
      description: "Fiesta a altas horas de la noche en día de semana",
      media: null,
      status: "OPEN" as const,
      resolvedById: null,
      resolvedAt: null,
      createdAt: "2026-06-03T12:00:00.000Z",
      updatedAt: "2026-06-03T12:00:00.000Z",
      resident: {
        id: "resident-1",
        phone: "555-1234",
        user: { id: "user-1", name: "Rosa", lastName: "Vega" },
      },
      category: { id: "cat-1", name: "Seguridad", icon: "shield", color: "blue" },
    },
  ],
  total: 1,
};

describe("ComplaintsPage (Pruebas del módulo de Quejas)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(complaintsService.getComplaintCategories).mockResolvedValue({
      success: true,
      data: mockCategories,
      messages: [],
    });
    vi.mocked(complaintsService.getPaginatedComplaints).mockResolvedValue({
      data: mockComplaints.rows,
      total: mockComplaints.total,
    });
  });

  it("debe renderizar el encabezado y listar las quejas", async () => {
    render(<ComplaintsPage />);

    expect(screen.getByText("Buzón de Quejas")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/ruidos molesto en lote 45/i)).toBeInTheDocument();
      expect(screen.getByText(/seguridad/i)).toBeInTheDocument();
      expect(screen.getByText(/abierta/i)).toBeInTheDocument();
    });
  });

  it("debe abrir el modal al hacer clic en Nueva Queja y permitir enviar el formulario", async () => {
    const user = userEvent.setup();
    vi.mocked(complaintsService.createComplaint).mockResolvedValue({
      success: true,
      data: mockComplaints.rows[0] as any,
      messages: ["Queja registrada con éxito"],
    });

    render(<ComplaintsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /nueva queja/i })).toBeInTheDocument();
    });

    const newBtn = screen.getByRole("button", { name: /nueva queja/i });
    await user.click(newBtn);

    expect(screen.getByText("Registrar Nueva Queja")).toBeInTheDocument();

    // Rellenar campos
    const select = screen.getByLabelText(/categoría de queja/i);
    await user.selectOptions(select, "cat-1");

    const titleInput = screen.getByLabelText(/asunto \/ título/i);
    await user.type(titleInput, "Ruidos molesto en lote 45");

    const descInput = screen.getByLabelText(/descripción detallada/i);
    await user.type(descInput, "Fiesta a altas horas de la noche en día de semana");

    const submitBtn = screen.getByRole("button", { name: /registrar queja/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(complaintsService.createComplaint).toHaveBeenCalledWith({
        categoryId: "cat-1",
        title: "Ruidos molesto en lote 45",
        description: "Fiesta a altas horas de la noche en día de semana",
      });
    });
  });
});
