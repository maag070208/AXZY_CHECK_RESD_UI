import { render, screen, waitFor } from "@app/core/utils/test-utils";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import * as residentsService from "../services/ResidentsService";
import { ResidentContactsDialog } from "./ResidentContactsDialog";

// Mock ResidentsService and AccessesService
vi.mock("../services/ResidentsService", () => ({
  getPaginatedContacts: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
}));

vi.mock("@app/modules/accesses/services/AccessesService", () => ({
  createAccess: vi.fn(),
}));

// Mock window.confirm
const mockConfirm = vi.fn().mockReturnValue(true);
window.confirm = mockConfirm;

const mockResident = {
  id: "resident-uuid-1",
  house: {
    street: "Av. Tulipanes",
    number: "A-102",
  },
};

const mockContacts = {
  data: [
    {
      id: "contact-uuid-1",
      residentId: "resident-uuid-1",
      name: "MARIA PEREZ",
      relationship: "Hermana",
      phone: "5544332211",
      email: "hermano@mail.com",
      canGenerateAccess: false,
      active: true,
      createdAt: "2099-01-01T00:00:00.000Z",
      updatedAt: "2099-01-01T00:00:00.000Z",
      deletedAt: null,
    },
  ],
  total: 1,
};

describe("ResidentContactsDialog (Pruebas del diálogo de contactos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(residentsService.getPaginatedContacts).mockResolvedValue({
      data: mockContacts.data,
      total: mockContacts.total,
    });
  });

  it("debe renderizar el diálogo y listar los contactos del residente", async () => {
    render(
      <ResidentContactsDialog
        isOpen={true}
        onClose={vi.fn()}
        resident={mockResident}
      />,
    );

    expect(screen.getByText(/Contactos del Residente/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("MARIA PEREZ")).toBeInTheDocument();
      expect(screen.getByText("Hermana")).toBeInTheDocument();
      expect(screen.getByText(/Tel: 5544332211/i)).toBeInTheDocument();
    });
  });

  it("debe abrir formulario para agregar contacto", async () => {
    const user = userEvent.setup();
    render(
      <ResidentContactsDialog
        isOpen={true}
        onClose={vi.fn()}
        resident={mockResident}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("MARIA PEREZ")).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /nuevo contacto/i });
    await user.click(addBtn);

    expect(screen.getByRole("heading", { name: "Nuevo Contacto" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Parentesco \/ Relación/i),
    ).toBeInTheDocument();
  });

  it("debe permitir eliminar un contacto", async () => {
    const user = userEvent.setup();
    vi.mocked(residentsService.deleteContact).mockResolvedValue({
      success: true,
      data: mockContacts.data[0] as any,
      messages: ["Contacto eliminado"],
    });

    render(
      <ResidentContactsDialog
        isOpen={true}
        onClose={vi.fn()}
        resident={mockResident}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("MARIA PEREZ")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle("Eliminar");
    await user.click(deleteBtn);

    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(residentsService.deleteContact).toHaveBeenCalledWith(
        "contact-uuid-1",
      );
    });
  });
});
