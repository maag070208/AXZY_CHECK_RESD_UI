import { render, screen, fireEvent, waitFor, store } from "@app/core/utils/test-utils";
import HomePage from "./HomePage";
import { vi } from "vitest";
import { setAuth, logout } from "@app/core/store/auth/auth.slice";
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

// Mock react-jwt to allow decoding custom mock tokens
vi.mock("react-jwt", () => ({
  decodeToken: vi.fn((token: string) => {
    if (token === "fake-admin-token") {
      return { id: 1, name: "Administrador", role: "ADMIN", email: "admin@test.com" };
    }
    if (token === "fake-guard-token") {
      return { id: 2, name: "Guardia Turno", role: "SHIFT", email: "guardia@test.com" };
    }
    return null;
  }),
  isExpired: vi.fn(() => false),
}));

// Mock tabs to avoid rendering complex Chart.js canvases in JSDOM
vi.mock("../components/tabs/AnalyticsTab", () => ({
  AnalyticsTab: () => <div data-testid="analytics-tab">Analytics Tab Mock</div>,
}));
vi.mock("../components/tabs/OperationalDetailTab", () => ({
  OperationalDetailTab: () => <div data-testid="operational-detail-tab">Operational Detail Tab Mock</div>,
}));

describe("HomePage (Pruebas del Panel de Control)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(logout());
  });

  it("debe renderizar las tarjetas de navegación autorizadas para el rol ADMIN", async () => {
    store.dispatch(setAuth("fake-admin-token"));

    render(<HomePage />);

    // Admin should see Residentes, Locations, Rounds, etc.
    await waitFor(() => {
      expect(screen.getByText(/^Residentes$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Ubicaciones$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Recorridos$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Configuración de rondas$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Usuarios$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Catálogos$/i)).toBeInTheDocument();
    });
  });

  it("debe ocultar tarjetas restringidas para el rol SHIFT (Guardia)", async () => {
    store.dispatch(setAuth("fake-guard-token"));

    render(<HomePage />);

    await waitFor(() => {
      // Shift Guard should see Locations, Rounds, Guards, etc.
      expect(screen.getByText(/^Ubicaciones$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Recorridos$/i)).toBeInTheDocument();
      
      // Shift Guard should NOT see Residentes or Users
      expect(screen.queryByText(/^Residentes$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Usuarios$/i)).not.toBeInTheDocument();
    });
  });

  it("debe permitir cambiar de pestaña a Security Analytics y Detalle Operativo", async () => {
    store.dispatch(setAuth("fake-admin-token"));

    render(<HomePage />);

    // Should render Tab buttons for Admin
    const analyticsBtn = await screen.findByRole("button", { name: /Security Analytics/i });
    const detailBtn = await screen.findByRole("button", { name: /Detalle Operativo/i });

    expect(analyticsBtn).toBeInTheDocument();
    expect(detailBtn).toBeInTheDocument();

    // Click on Security Analytics
    fireEvent.click(analyticsBtn);
    expect(screen.getByTestId("analytics-tab")).toBeInTheDocument();

    // Click on Detalle Operativo
    fireEvent.click(detailBtn);
    expect(screen.getByTestId("operational-detail-tab")).toBeInTheDocument();
  });
});
