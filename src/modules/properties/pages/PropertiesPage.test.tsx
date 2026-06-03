import { render, screen, waitFor } from "@app/core/utils/test-utils";
import PropertiesPage from "./PropertiesPage";
import * as propertiesService from "../services/PropertiesService";
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

// Mock PropertiesService
vi.mock("../services/PropertiesService", () => ({
  getPaginatedHouses: vi.fn(),
  createHouse: vi.fn(),
  updateHouse: vi.fn(),
  deleteHouse: vi.fn(),
}));

const mockHouses = {
  rows: [
    {
      id: "house-uuid-1",
      number: "A-102",
      street: "Av. Tulipanes",
      block: "Mzn 4",
      reference: "Portón Café",
      occupied: true,
      active: true,
      latitude: null,
      longitude: null,
      createdAt: "2099-01-01T00:00:00.000Z",
      updatedAt: "2099-01-01T00:00:00.000Z",
      deletedAt: null,
    },
    {
      id: "house-uuid-2",
      number: "B-205",
      street: "Calle Rosas",
      block: "Mzn 1",
      reference: "Frente a parque",
      occupied: false,
      active: false,
      latitude: null,
      longitude: null,
      createdAt: "2099-01-01T00:00:00.000Z",
      updatedAt: "2099-01-01T00:00:00.000Z",
      deletedAt: null,
    },
  ],
  total: 2,
};

describe("PropertiesPage (Pruebas del módulo de Propiedades)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(propertiesService.getPaginatedHouses).mockResolvedValue({
      data: mockHouses.rows,
      total: mockHouses.total,
    });
  });

  it("debe renderizar el encabezado y listar las propiedades", async () => {
    render(<PropertiesPage />);

    expect(screen.getByText("Control de Propiedades")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Número: A-102/i)).toBeInTheDocument();
      expect(screen.getByText(/Av. Tulipanes/i)).toBeInTheDocument();
      expect(screen.getByText(/Calle Rosas/i)).toBeInTheDocument();
    });
  });

  it("debe abrir el modal para agregar propiedad", async () => {
    const user = userEvent.setup();
    render(<PropertiesPage />);

    const newBtn = screen.getByRole("button", { name: /nueva propiedad/i });
    await user.click(newBtn);

    expect(screen.getByText("Registrar Propiedad")).toBeInTheDocument();
  });

  it("debe abrir el modal para editar propiedad", async () => {
    const user = userEvent.setup();
    render(<PropertiesPage />);

    await screen.findByText(/Número: A-102/i, undefined, { timeout: 3000 });

    const editButtons = screen.getAllByTitle("Editar");
    await user.click(editButtons[0]);

    expect(screen.getByText("Actualizar Propiedad")).toBeInTheDocument();
  });

  it("debe permitir eliminar una propiedad", async () => {
    const user = userEvent.setup();
    vi.mocked(propertiesService.deleteHouse).mockResolvedValue({
      success: true,
      data: mockHouses.rows[0] as any,
      messages: ["Propiedad eliminada"],
    });

    render(<PropertiesPage />);

    await screen.findByText(/Número: A-102/i, undefined, { timeout: 3000 });

    const deleteButtons = screen.getAllByTitle("Eliminar");
    await user.click(deleteButtons[0]);

    expect(screen.getByText(/¿Estás seguro de eliminar el registro de esta propiedad/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /^eliminar propiedad$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(propertiesService.deleteHouse).toHaveBeenCalledWith("house-uuid-1");
    });
  });
});
