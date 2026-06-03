import { render, screen, waitFor } from "@app/core/utils/test-utils";
import IncidentsPage from "./IncidentsPage";
import * as incidentService from "../services/IncidentService";
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

// Mock IncidentService
vi.mock("../services/IncidentService", () => ({
  getPaginatedIncidents: vi.fn(),
  resolveIncident: vi.fn(),
  deleteIncident: vi.fn(),
}));

// Mock catalog hook
vi.mock("@app/core/hooks/catalog.hook", () => ({
  useCatalog: vi.fn(() => ({
    data: [{ id: "guard-1", name: "Guardia Test", value: "Guardia Test" }],
    loading: false,
    error: null,
    refresh: vi.fn(),
  })),
  clearSpecificCatalogCache: vi.fn(),
}));

// Mock IncidentDetailDialog
vi.mock("../components/IncidentDetailDialog", () => ({
  default: () => <div data-testid="incident-detail-dialog">Incident Detail Dialog Mock</div>,
}));

// Mock useSelector for auth role
const mockAdminUser = {
  role: "ADMIN",
  token: "fake-admin-token",
  name: "Administrador",
};

vi.mock("react-redux", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useSelector: vi.fn(() => mockAdminUser),
  };
});

const mockIncidents = {
  rows: [
    {
      id: "incident-uuid-1",
      title: "Fuga de Agua",
      description: "Fuga en pasillo principal",
      media: [],
      createdAt: "2024-01-01T12:00:00.000Z",
      status: "PENDING" as const,
      guardId: "guard-1",
      guard: { id: "guard-1", name: "Juan", lastName: "Pérez", username: "juanperez" },
      categoryId: "cat-1",
      category: { id: "cat-1", name: "Mantenimiento" },
      typeId: "type-1",
      type: { id: "type-1", name: "Fuga" },
    },
  ],
  total: 1,
};

describe("IncidentsPage (Pruebas del módulo de Incidencias)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(incidentService.getPaginatedIncidents).mockResolvedValue({
      data: mockIncidents.rows,
      total: mockIncidents.total,
    });
  });

  it("debe renderizar el encabezado y listar las incidencias", async () => {
    render(<IncidentsPage />);

    expect(screen.getByText("Gestión de Incidencias")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/fuga de agua/i)).toBeInTheDocument();
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/^pendiente$/i)).toBeInTheDocument();
    });
  });

  it("debe permitir resolver una incidencia pendiente", async () => {
    const user = userEvent.setup();
    vi.mocked(incidentService.resolveIncident).mockResolvedValue({
      success: true,
      data: mockIncidents.rows[0] as any,
      messages: ["Incidencia resuelta"],
    });

    render(<IncidentsPage />);

    await screen.findByText(/fuga de agua/i);

    const resolveButtons = screen.getAllByTitle("Resolver");
    expect(resolveButtons.length).toBeGreaterThan(0);

    await user.click(resolveButtons[0]);

    expect(screen.getByText(/¿Confirmar Resolución?/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /^confirmar$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(incidentService.resolveIncident).toHaveBeenCalledWith("incident-uuid-1");
    });
  });

  it("debe permitir eliminar una incidencia", async () => {
    const user = userEvent.setup();
    vi.mocked(incidentService.deleteIncident).mockResolvedValue({
      success: true,
      data: true,
      messages: ["Reporte eliminado"],
    });

    render(<IncidentsPage />);

    await screen.findByText(/fuga de agua/i);

    const deleteButtons = screen.getAllByTitle("Eliminar");
    expect(deleteButtons.length).toBeGreaterThan(0);

    await user.click(deleteButtons[0]);

    expect(screen.getByText(/¿Eliminar Reporte?/i)).toBeInTheDocument();

    const confirmButton = screen.getAllByRole("button", { name: /eliminar/i }).pop() as HTMLElement;
    await user.click(confirmButton);

    await waitFor(() => {
      expect(incidentService.deleteIncident).toHaveBeenCalledWith("incident-uuid-1");
    });
  });
});
