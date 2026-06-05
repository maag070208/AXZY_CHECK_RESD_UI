import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Propiedades - Gestión de Propiedades", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  const mockHouses = [
    { id: "house-1", number: "A-101", street: "AV TULIPANES", block: "MZN 1", reference: "Portón café", latitude: 19.4326, longitude: -99.1332, occupied: false, active: true },
    { id: "house-2", number: "B-205", street: "CALLE ROSAS", block: null, reference: null, latitude: null, longitude: null, occupied: true, active: false },
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

      await page.route(/\/api\/v\d+\/houses.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();
        if (method === "OPTIONS") {
          await route.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } });
          return;
        }
        if (url.includes("/datatable")) {
          const postData = JSON.parse(route.request().postData() || "{}");
          const filters = postData.filters || {};
          let filtered = [...mockHouses];
          if (filters.search) {
            const s = filters.search.toLowerCase();
            filtered = filtered.filter(h => h.number.toLowerCase().includes(s) || h.street.toLowerCase().includes(s));
          }
          if (filters.active !== undefined) {
            const active = filters.active === "true" || filters.active === true;
            filtered = filtered.filter(h => h.active === active);
          }
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: { rows: filtered, total: filtered.length, page: 1, limit: 10 }, messages: [] }) });
        } else if (method === "POST" && !url.includes("/datatable")) {
          const data = JSON.parse(route.request().postData() || "{}");
          const newHouse = { id: `house-${Date.now()}`, number: data.number || "", street: data.street || "", block: data.block || null, reference: data.reference || null, latitude: data.latitude ?? null, longitude: data.longitude ?? null, occupied: data.occupied ?? false, active: true };
          mockHouses.push(newHouse);
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: newHouse, messages: [] }) });
        } else if (method === "PUT") {
          const id = url.split("/").pop();
          const idx = mockHouses.findIndex(h => h.id === id);
          const data = JSON.parse(route.request().postData() || "{}");
          if (idx !== -1) Object.assign(mockHouses[idx], data);
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: idx !== -1 ? mockHouses[idx] : null, messages: [] }) });
        } else if (method === "DELETE") {
          const id = url.split("/").pop();
          const idx = mockHouses.findIndex(h => h.id === id);
          if (idx !== -1) mockHouses.splice(idx, 1);
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: true, messages: [] }) });
        }
      });
    }

    await page.goto("/#/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*#\/home/);
    await page.goto("/#/properties");
  });

  test("debería mostrar el Control de Propiedades", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Control de Propiedades");

    if (useRealApi) {
      // Real DB: houses on Calle Los Olivos (209, 207, 205, 203, 201)
      await expect(page.getByText(/Número: 209/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/Calle Los Olivos/i).first()).toBeVisible();
      await expect(page.getByText(/Número: 201/i)).toBeVisible();
    } else {
      await expect(page.getByText(/Número: A-101/i)).toBeVisible();
      await expect(page.getByText(/AV TULIPANES/i)).toBeVisible();
    }
  });

  test("debería mostrar estados ACTIVA e INACTIVA en propiedades", async ({ page }) => {
    if (useRealApi) {
      await expect(page.getByText("ACTIVA").first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.getByText("ACTIVA")).toBeVisible();
      await expect(page.getByText("INACTIVA")).toBeVisible();
    }
  });

  test("debería abrir el formulario de nueva propiedad", async ({ page }) => {
    await page.click('button:has-text("Nueva Propiedad")');
    await expect(page.getByRole("heading", { name: /Nueva Propiedad/i })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("debería permitir registrar una nueva propiedad", async ({ page }) => {
    test.skip(useRealApi, "Creación omitida en modo real API para no contaminar la BD");

    await page.click('button:has-text("Nueva Propiedad")');
    await expect(page.getByRole("heading", { name: /Nueva Propiedad/i })).toBeVisible();

    await page.fill('input[name="number"]', "C-310");
    await page.fill('input[name="street"]', "BLVD CENTRAL");
    await page.fill('input[name="block"]', "MZN 3");
    await page.click('button:has-text("Registrar Propiedad")');

    await expect(page.getByText("Propiedad creada con éxito")).toBeVisible();
    await expect(page.getByText(/Número: C-310/i)).toBeVisible();
  });

  test("debería permitir editar una propiedad", async ({ page }) => {
    if (useRealApi) {
      // Real DB: editar la primera propiedad de página 1 (Número: 209, Calle Los Olivos)
      await page.waitForSelector("text=Número: 209", { timeout: 10000 });
      const row = page.locator("tr", { hasText: /Número: 209/ });
      await row.getByTitle("Editar").click();
      await expect(page.getByRole("heading", { name: /Editar Propiedad/i })).toBeVisible();
      // Solo abrir y cerrar — no modificar datos reales
      await page.keyboard.press("Escape");
    } else {
      await page.waitForSelector("text=Número: A-101");
      const row = page.locator("tr", { hasText: /A-101/ });
      await row.getByTitle("Editar").click();
      await expect(page.getByRole("heading", { name: /Editar Propiedad/i })).toBeVisible();
      await page.fill('input[name="street"]', "AV MODIFICADA");
      await page.click('button:has-text("Actualizar Propiedad")');
      await expect(page.getByText("Propiedad actualizada con éxito")).toBeVisible();
    }
  });

  test("debería permitir eliminar una propiedad", async ({ page }) => {
    test.skip(useRealApi, "Eliminación destructiva omitida en modo real API");

    await page.waitForSelector("text=Número: A-101");
    const row = page.locator("tr", { hasText: /A-101/ });
    await row.getByTitle("Eliminar").click();
    await expect(page.getByText(/¿Estás seguro de eliminar el registro de esta propiedad/i)).toBeVisible();
    await page.click('button:has-text("Eliminar Propiedad")');
    await expect(page.getByText("Propiedad eliminada")).toBeVisible();
  });
});
