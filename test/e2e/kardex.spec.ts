import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Kardex - Bitácora", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  const mockEntries = [
    {
      id: "kdx-1",
      userId: "user-1",
      user: { id: "user-1", name: "MARIO", lastName: "MANTENIMIENTO", username: "mario", role: "MAINT" },
      locationId: "loc-1",
      location: { id: "loc-1", name: "Plaza 2000 - Pasillo A", aisle: "A", spot: "1", number: "10" },
      timestamp: "2026-06-03T07:00:00.000Z",
      scanType: "RECURRING",
      notes: "Entrada turno matutino",
      media: [],
    },
    {
      id: "kdx-2",
      userId: "user-2",
      user: { id: "user-2", name: "RICARDO", lastName: "SHIFT", username: "ricardo", role: "SHIFT" },
      locationId: "loc-2",
      location: { id: "loc-2", name: "Plaza 2000 - Entrada", aisle: "B", spot: "1", number: "1" },
      timestamp: "2026-06-03T15:00:00.000Z",
      scanType: "FREE",
      notes: "Salida turno vespertino",
      media: [],
    },
    {
      id: "kdx-3",
      userId: "user-1",
      user: { id: "user-1", name: "MARIO", lastName: "MANTENIMIENTO", username: "mario", role: "MAINT" },
      locationId: "loc-1",
      location: { id: "loc-1", name: "Plaza 2000 - Pasillo A", aisle: "A", spot: "1", number: "10" },
      timestamp: "2026-06-03T10:30:00.000Z",
      scanType: "ASSIGNMENT",
      notes: "Subió evidencia fotográfica",
      media: [],
    },
  ];

  const validMockToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";

  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[Navegador] ${msg.type()}: ${msg.text()}`);
    });

    if (!useRealApi) {
      await page.route("**/users/login", async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "*",
            },
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, data: validMockToken, messages: [] }),
          });
        }
      });

      // Generic catalog mock
      await page.route(/\/api\/v\d+\/catalog\/.*/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "*",
            },
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ success: true, data: [], messages: [] }),
        });
      });

      await page.route(/\/api\/v\d+\/kardex.*/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "*",
            },
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            success: true,
            data: { data: mockEntries, total: mockEntries.length, page: 1, limit: 10 },
            messages: [],
          }),
        });
      });
    }

    await page.goto("/#/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*#\/home/);
    await page.goto("/#/kardex");
  });

  test("debería mostrar el expediente Kardex", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/kardex|expediente/i);
  });

  test("debería listar entradas con sus tipos de marcaje", async ({ page }) => {
    if (useRealApi) {
      await expect(page.locator("h1")).toContainText(/kardex|expediente/i);
    } else {
      await expect(page.getByText("MARIO").first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("RICARDO").first()).toBeVisible();
      const hasLabels = await page.getByText(/entrada turno matutino|salida turno vespertino|evidencia/i).count();
      expect(hasLabels).toBeGreaterThan(0);
    }
  });

  test("debería permitir abrir el detalle de una entrada", async ({ page }) => {
    test.skip(useRealApi, "Modal interaction not testable against real API");
    if (!useRealApi) {
      const detailBtn = page.locator("button[title*='detalle' i], button[title*='ver' i]").first();
      if ((await detailBtn.count()) > 0) {
        await detailBtn.click();
        await expect(page.getByText(/entrada turno matutino|salida turno|notas/i).first()).toBeVisible({ timeout: 5000 });
        await page.keyboard.press("Escape");
      }
    }
  });
});
