import { render, screen, waitFor } from "@app/core/utils/test-utils";
import ResidentsPage from "./ResidentsPage";
import * as residentsService from "../services/ResidentsService";
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

// Mock component children to isolate page test
vi.mock("../components/ResidentForm", () => ({
  ResidentForm: ({ onCancel }: any) => (
    <div>
      <span>Formulario de Residente Mock</span>
      <button onClick={onCancel}>Cancelar Form</button>
    </div>
  ),
}));

// Mock ResidentsService
vi.mock("../services/ResidentsService", () => ({
  getPaginatedResidents: vi.fn(),
  createResident: vi.fn(),
  updateResident: vi.fn(),
  deleteResident: vi.fn(),
}));

const mockResidents = {
  rows: [
    {
      id: "resident-uuid-1",
      userId: "user-uuid-1",
      houseId: "house-uuid-1",
      email: "juan.perez@test.com",
      phone: "5544332211",
      isOwner: true,
      active: true,
      user: {
        id: "user-uuid-1",
        name: "JUAN",
        lastName: "PEREZ",
        username: "juanperez",
      },
      house: {
        id: "house-uuid-1",
        number: "10",
        street: "AV PRINCIPAL",
        block: "A",
        occupied: true,
        reference: null,
        latitude: null,
        longitude: null,
      },
      createdAt: "2099-01-01T00:00:00.000Z",
      updatedAt: "2099-01-01T00:00:00.000Z",
      deletedAt: null,
    },
  ],
  total: 1,
};

describe("ResidentsPage (Pruebas de la página de Residentes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(residentsService.getPaginatedResidents).mockResolvedValue({
      data: mockResidents.rows,
      total: mockResidents.total,
    });
  });

  it("debe renderizar el encabezado y listar los residentes", async () => {
    render(<ResidentsPage />);

    expect(screen.getByText("Directorio de Residentes")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/JUAN PEREZ/i)).toBeInTheDocument();
      expect(screen.getByText(/Calle AV PRINCIPAL 10/i)).toBeInTheDocument();
      expect(screen.getByText(/juan.perez@test.com/i)).toBeInTheDocument();
    });
  });

  it("debe abrir el modal para agregar residente", async () => {
    const user = userEvent.setup();
    render(<ResidentsPage />);

    const newBtn = screen.getByRole("button", { name: /nuevo residente/i });
    await user.click(newBtn);

    expect(screen.getByText("Formulario de Residente Mock")).toBeInTheDocument();
  });

  it("debe permitir eliminar un residente", async () => {
    const user = userEvent.setup();
    vi.mocked(residentsService.deleteResident).mockResolvedValue({
      success: true,
      data: mockResidents.rows[0] as any,
      messages: ["Residente disociado"],
    });

    render(<ResidentsPage />);

    const deleteBtn = await screen.findByRole("button", { name: /eliminar/i }, { timeout: 3000 });
    await user.click(deleteBtn);

    expect(screen.getByText(/¿Estás seguro de eliminar el registro de este residente/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /^eliminar residente$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(residentsService.deleteResident).toHaveBeenCalledWith("resident-uuid-1");
    });
  });
});
