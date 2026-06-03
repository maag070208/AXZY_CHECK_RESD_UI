import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Residentes - Gestión de Residentes", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  const mockHouses = [
    { id: "house-1", number: "A-101", street: "AV TULIPANES", block: "MZN 1", reference: "Portón café", occupied: false, active: true },
  ];

  const mockResidents = [
    {
      id: "res-1",
      userId: "usr-1",
      houseId: "house-1",
      phone: "5544332211",
      email: "juan@test.com",
      isOwner: true,
      active: true,
      user: { id: "usr-1", name: "JUAN", lastName: "PEREZ", username: "jperez" },
      house: { id: "house-1", number: "A-101", street: "AV TULIPANES", block: "MZN 1", reference: "Portón café", occupied: false },
    },
    {
      id: "res-2",
      userId: "usr-2",
      houseId: "house-1",
      phone: "5599887766",
      email: "ana@test.com",
      isOwner: false,
      active: true,
      user: { id: "usr-2", name: "ANA", lastName: "GARCIA", username: "agarcia" },
      house: { id: "house-1", number: "A-101", street: "AV TULIPANES", block: "MZN 1", reference: "Portón café", occupied: false },
    },
  ];

  const mockContacts = [
    {
      id: "contact-1",
      residentId: "res-1",
      name: "MARIA PEREZ",
      phone: "5544332211",
      email: "maria@test.com",
      relationship: "Hermana",
      canGenerateAccess: true,
      active: true,
    },
  ];

  const validMockToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";

  test.beforeEach(async ({ page }) => {
    if (!useRealApi) {
      await page.route("**/users/login", async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "*" } });
        } else {
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: validMockToken, messages: [] }) });
        }
      });

      await page.route(/\/api\/v\d+\/residents.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();
        if (method === "OPTIONS") { await route.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }); return; }
        if (url.includes("/datatable")) {
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: { rows: mockResidents, total: mockResidents.length, page: 1, limit: 10 }, messages: [] }) });
        } else if (method === "DELETE") {
          const id = url.split("/").pop();
          const idx = mockResidents.findIndex(r => r.id === id);
          if (idx !== -1) mockResidents.splice(idx, 1);
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: true, messages: [] }) });
        }
      });

      await page.route(/\/api\/v\d+\/contacts.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();
        if (method === "OPTIONS") { await route.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }); return; }
        if (url.includes("/datatable")) {
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: { rows: mockContacts, total: mockContacts.length, page: 1, limit: 10 }, messages: [] }) });
        }
      });

      await page.route(/\/api\/v\d+\/houses.*/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") { await route.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "*" } }); return; }
        await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: { rows: mockHouses, total: mockHouses.length, page: 1, limit: 100 }, messages: [] }) });
      });

      await page.route(/\/api\/v\d+\/accesses.*/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") { await route.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "*" } }); return; }
        await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: { id: "acc-new", qrCode: "AXZ-TEST01", type: "TEMPORARY", status: "PENDING", validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 86400000).toISOString(), used: false, residentId: "res-1", visitorId: "v-1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, messages: [] }) });
      });
    }

    await page.goto("/#/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*#\/home/);
    await page.goto("/#/residents");
  });

  test("debería mostrar el Directorio de Residentes", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Directorio de Residentes");

    if (useRealApi) {
      // Real DB: search for Juan Garcia (page 2 otherwise) then clear filter
      await page.fill('input[placeholder="BUSCAR RESIDENTE..."]', "Juan");
      await expect(page.getByText(/Juan Garcia/i)).toBeVisible({ timeout: 10000 });
      // Clear search and search for Rosa (also on page 2)
      await page.fill('input[placeholder="BUSCAR RESIDENTE..."]', "");
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="BUSCAR RESIDENTE..."]', "Rosa");
      await expect(page.getByText(/ROSA VEGA/i)).toBeVisible();
    } else {
      await expect(page.getByText(/JUAN PEREZ/i)).toBeVisible();
      await expect(page.getByText(/ANA GARCIA/i)).toBeVisible();
    }
  });

  test("debería mostrar propietarios e inquilinos correctamente", async ({ page }) => {
    if (useRealApi) {
      await expect(page.getByText("PROPIETARIO").first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("INQUILINO").first()).toBeVisible();
    } else {
      await expect(page.getByText("PROPIETARIO")).toBeVisible();
      await expect(page.getByText("INQUILINO")).toBeVisible();
    }
  });

  test("debería abrir el formulario de nuevo residente", async ({ page }) => {
    await page.click('button:has-text("Nuevo Residente")');
    await expect(page.getByRole("heading", { name: /nuevo residente/i })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("debería navegar al detalle del residente y ver la Red de Contactos", async ({ page }) => {
    // Click "Ver Detalle" → navigate to /residents/:id detail page
    if (useRealApi) {
      await expect(page.locator("h1")).toContainText("Directorio de Residentes");
      // Search for Juan Garcia (page 2 by default)
      await page.fill('input[placeholder="BUSCAR RESIDENTE..."]', "Juan");
      await page.waitForTimeout(600);
      const row = page.locator("tr", { hasText: /JUAN GARCIA/i });
      await row.getByText("Ver Detalle").click();
      await expect(page).toHaveURL(/.*\/residents\/[\w-]+/);
      await expect(page.getByText(/Visión 360°/i)).toBeVisible({ timeout: 8000 });
      // Switch to Contacts tab
      await page.getByRole("button", { name: /Red de Contactos/i }).click();
      await expect(page.getByText(/Contactos Autorizados/i)).toBeVisible({ timeout: 8000 });
      // Go back to residents list
      await page.goto("/#/residents");
    } else {
      await page.waitForSelector("text=JUAN PEREZ", { timeout: 8000 });
      const row = page.locator("tr", { hasText: /JUAN PEREZ/i });
      await row.getByText("Ver Detalle").click();
      await expect(page).toHaveURL(/.*\/residents\/[\w-]+/);
      // No mock for contacts endpoint, just check navigation worked
      await page.goto("/#/residents");
    }
  });

  test("debería abrir el diálogo de QR del residente", async ({ page }) => {
    test.skip(!useRealApi, "Mock mode does not have resident detail routes");
    // Click "Ver Detalle" → navigate to /residents/:id → Contacts tab → Crear Pase
    await expect(page.locator("h1")).toContainText("Directorio de Residentes");
    await page.fill('input[placeholder="BUSCAR RESIDENTE..."]', "Juan");
    await page.waitForTimeout(600);
    const row = page.locator("tr", { hasText: /JUAN GARCIA/i });
    await row.getByText("Ver Detalle").click();
    await expect(page).toHaveURL(/.*\/residents\/[\w-]+/);
    await expect(page.getByText(/Visión 360°/i)).toBeVisible({ timeout: 8000 });

    // Switch to Contacts tab
    await page.getByRole("button", { name: /Red de Contactos/i }).click();
    await expect(page.getByText(/Contactos Autorizados/i)).toBeVisible({ timeout: 8000 });

    // Hover card to reveal action buttons, then click Crear Pase
    const firstContactCard = page.locator("div.group").first();
    await firstContactCard.hover();
    await firstContactCard.getByRole("button", { name: /Crear Pase/i }).click();
    await expect(page.getByText(/Generar Pase de Acceso/i)).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await page.goto("/#/residents");
  });

  test("debería permitir eliminar un residente", async ({ page }) => {
    test.skip(useRealApi, "Eliminación destructiva omitida en modo real API");

    await page.waitForSelector("text=JUAN PEREZ", { timeout: 8000 });
    const row = page.locator("tr", { hasText: /JUAN PEREZ/i });
    await row.getByTitle("Eliminar").click();
    await expect(page.getByText(/¿Estás seguro de eliminar/i)).toBeVisible();
    await page.click('button:has-text("Eliminar Residente")');
    await expect(page.getByText("Residente eliminado")).toBeVisible();
  });
});
