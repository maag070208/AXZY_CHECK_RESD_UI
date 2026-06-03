import { render, screen, waitFor } from "@app/core/utils/test-utils";
import GuardsPage from "./GuardsPage";
import * as userService from "../../users/services/UserService";
import * as schedulesService from "../../schedules/SchedulesService";
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

// Mock UserService
vi.mock("../../users/services/UserService", () => ({
  getPaginatedUsers: vi.fn(),
  updateUser: vi.fn(),
}));

// Mock SchedulesService
vi.mock("../../schedules/SchedulesService", () => ({
  getSchedules: vi.fn(),
}));

// Mock catalog hook
vi.mock("@app/core/hooks/catalog.hook", () => ({
  useCatalog: vi.fn(() => ({
    data: [{ id: "client-1", name: "Cliente Test", value: "Cliente Test" }],
    loading: false,
    error: null,
    refresh: vi.fn(),
  })),
  clearSpecificCatalogCache: vi.fn(),
}));

// Mock child modals
vi.mock("../components/AssignmentModal", () => ({
  AssignmentModal: () => <div data-testid="assignment-modal">Assignment Modal Mock</div>,
}));
vi.mock("../components/ViewAssignmentsModal", () => ({
  ViewAssignmentsModal: () => <div data-testid="view-assignments-modal">View Assignments Modal Mock</div>,
}));

const mockGuards = {
  rows: [
    {
      id: "guard-uuid-1",
      name: "Juan",
      lastName: "Pérez",
      username: "juanperez",
      active: true,
      isLoggedIn: false,
      roleId: "1",
      role: { id: "1", name: "GUARD", value: "Guardia" },
      scheduleId: "sched-1",
      schedule: { id: "sched-1", name: "Turno A", startTime: "08:00", endTime: "18:00", active: true },
      assignmentLogs: [],
    },
    {
      id: "guard-uuid-2",
      name: "Pedro",
      lastName: "Gómez",
      username: "pedrogomez",
      active: false,
      roleId: "2",
      role: { id: "2", name: "SHIFT", value: "Jefe de Turno" },
      scheduleId: null,
      schedule: undefined,
      assignmentLogs: [],
      isLoggedIn: false,
    },
  ],
  total: 2,
};

const mockSchedules = [
  { id: "sched-1", name: "Turno A", startTime: "08:00", endTime: "18:00", active: true },
  { id: "sched-2", name: "Turno B", startTime: "18:00", endTime: "08:00", active: true },
];

describe("GuardsPage (Pruebas del módulo de Guardias)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.getPaginatedUsers).mockResolvedValue({
      data: mockGuards.rows,
      total: mockGuards.total,
    });
    vi.mocked(schedulesService.getSchedules).mockResolvedValue(mockSchedules);
  });

  it("debe renderizar el encabezado y listar los guardias en la tabla", async () => {
    render(<GuardsPage />);

    expect(screen.getByText("Directorio de Guardias")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/pedro gómez/i)).toBeInTheDocument();
      expect(screen.getByText(/@juanperez/i)).toBeInTheDocument();
      expect(screen.getByText(/@pedrogomez/i)).toBeInTheDocument();
    });
  });

  it("debe permitir cambiar el estado de un guardia (activo/inactivo)", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.updateUser).mockResolvedValue({
      success: true,
      data: mockGuards.rows[0] as any,
      messages: ["Guardia actualizado"],
    });

    render(<GuardsPage />);

    // Esperar a que carguen los datos
    await screen.findByText(/juan pérez/i);

    // Buscar los botones de control de estado (ícono de FaPowerOff / titulo "Desactivar")
    const deactivateButtons = screen.getAllByTitle("Desactivar");
    expect(deactivateButtons.length).toBeGreaterThan(0);

    // Clic en desactivar del primer guardia
    await user.click(deactivateButtons[0]);

    // Verificar modal de confirmación
    expect(screen.getByText(/¿Desactivar Guardia?/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /confirmar acción/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith("guard-uuid-1", { active: false });
    });
  });

  it("debe abrir el modal de tareas asignadas al hacer clic en ver tareas", async () => {
    const user = userEvent.setup();
    render(<GuardsPage />);

    await screen.findByText(/juan pérez/i);

    const viewTasksButtons = screen.getAllByTitle("Ver Tareas");
    await user.click(viewTasksButtons[0]);

    expect(screen.getByTestId("view-assignments-modal")).toBeInTheDocument();
  });
});
