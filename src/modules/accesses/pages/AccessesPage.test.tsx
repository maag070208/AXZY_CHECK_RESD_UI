import { render, screen, waitFor } from "@app/core/utils/test-utils";
import AccessesPage from "./AccessesPage";
import * as accessesService from "../services/AccessesService";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock QRCode to avoid canvas issues in jsdom
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
  },
}));

// Mock AccessTicketOverlay to avoid canvas rendering in tests
vi.mock("@app/core/components/AccessTicketOverlay", () => ({
  AccessTicketOverlay: () => null,
}));

// Mock accesses service
vi.mock("../services/AccessesService", () => ({
  getPaginatedAccesses: vi.fn(),
  updateAccess: vi.fn(),
  deleteAccess: vi.fn(),
}));

const mockAccesses = {
  rows: [
    {
      id: "access-uuid-1",
      qrCode: "AXZ-12345",
      type: "TEMPORARY" as const,
      status: "PENDING" as const,
      residentId: "resident-1",
      visitorId: "visitor-1",
      rejectionReason: null,
      createdAt: "2099-06-01T00:00:00.000Z",
      updatedAt: "2099-06-01T00:00:00.000Z",
      // Use future dates so "Validar Entrada" & "Rechazar Entrada" buttons are rendered
      deletedAt: null,
      validFrom: "2099-06-02T00:00:00.000Z",
      validUntil: "2099-06-03T00:00:00.000Z",
      used: false,
      visitor: {
        id: "visitor-1",
        name: "ANNA SMITH",
        phone: "1234567890",
      },
      resident: {
        id: "resident-1",
        phone: null,
        email: null,
        user: {
          id: "user-1",
          name: "JUAN",
          lastName: "PEREZ",
        },
        house: {
          id: "house-1",
          number: "101",
          street: "AV PRINCIPAL",
        },
      },
    },
  ],
  total: 1,
};

describe("AccessesPage (Pruebas del panel de Accesos e Invitaciones)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessesService.getPaginatedAccesses).mockResolvedValue({
      data: mockAccesses.rows,
      total: mockAccesses.total,
    });
  });

  it("debe renderizar el encabezado y listar los pases de acceso", async () => {
    render(<AccessesPage />);

    expect(screen.getByText("Control de Accesos")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("ANNA SMITH")).toBeInTheDocument();
      // qrCode renders as "CÓD: AXZ-12345" inside an ITText
      expect(screen.getByText(/AXZ-12345/i)).toBeInTheDocument();
    });
  });

  it("debe permitir validar la entrada ingresando el código correcto", async () => {
    const user = userEvent.setup();
    vi.mocked(accessesService.updateAccess).mockResolvedValue({
      success: true,
      data: mockAccesses.rows[0],
      messages: ["Entrada registrada con éxito"],
    });

    render(<AccessesPage />);

    await screen.findByText("ANNA SMITH");

    // Button title in component is "Validar Entrada"
    const validateBtn = screen.getByTitle("Validar Entrada");
    await user.click(validateBtn);

    // Dialog heading confirms it's open
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Confirmar Entrada" })).toBeInTheDocument();
    });

    // Input label is "Código de Acceso"
    const input = screen.getByLabelText(/Código de Acceso/i);
    // Default value is "AXZ-", type the rest to match qrCode "AXZ-12345"
    await user.type(input, "12345");

    // The confirm button text matches when code is valid; pick by exact name excluding disabled
    const confirmBtn = await screen.findByRole("button", { name: /^confirmar entrada$/i });
    expect(confirmBtn).not.toBeDisabled();
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(accessesService.updateAccess).toHaveBeenCalledWith("access-uuid-1", {
        status: "ACTIVE",
        used: true,
      });
    });
  });

  it("debe permitir eliminar un pase de acceso", async () => {
    const user = userEvent.setup();
    vi.mocked(accessesService.deleteAccess).mockResolvedValue({
      success: true,
      data: mockAccesses.rows[0] as any,
      messages: ["Pase eliminado"],
    });

    render(<AccessesPage />);

    await screen.findByText("ANNA SMITH");

    // Click the row action delete button (has title attribute)
    const deleteBtn = screen.getByTitle("Eliminar Pase");
    await user.click(deleteBtn);

    // Confirm dialog heading is shown
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Confirmar Eliminación" })).toBeInTheDocument();
    });

    // The confirm button has no title, so getAllByRole and pick the one without title
    const allDeleteBtns = screen.getAllByRole("button", { name: /eliminar pase/i });
    const confirmBtn = allDeleteBtns.find((btn) => !btn.getAttribute("title"));
    expect(confirmBtn).toBeDefined();
    await user.click(confirmBtn!);

    await waitFor(() => {
      expect(accessesService.deleteAccess).toHaveBeenCalledWith("access-uuid-1");
    });
  });

  it("debe permitir rechazar la entrada con un motivo", async () => {
    const user = userEvent.setup();
    vi.mocked(accessesService.updateAccess).mockResolvedValue({
      success: true,
      data: { ...mockAccesses.rows[0], status: "REJECTED" as const },
      messages: ["Pase rechazado con éxito"],
    });

    render(<AccessesPage />);

    await screen.findByText("ANNA SMITH");

    // "Rechazar Entrada" button is shown for PENDING status within future dates
    const rejectBtn = screen.getByTitle("Rechazar Entrada");
    await user.click(rejectBtn);

    // Confirm dialog heading is shown
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Rechazar Entrada" })).toBeInTheDocument();
    });

    const motivoInput = screen.getByLabelText(/Motivo de Rechazo/i);
    await user.type(motivoInput, "No coincide identificación");

    // Both the table action button and the dialog confirm button have text "Rechazar Entrada".
    // Pick the confirm button by absence of a title attribute.
    const allRejectBtns = screen.getAllByRole("button", { name: /^rechazar entrada$/i });
    const confirmBtn = allRejectBtns.find((btn) => !btn.getAttribute("title"));
    expect(confirmBtn).toBeDefined();
    await user.click(confirmBtn!);

    await waitFor(() => {
      expect(accessesService.updateAccess).toHaveBeenCalledWith("access-uuid-1", {
        status: "REJECTED",
        rejectionReason: "No coincide identificación",
      });
    });
  });
});
