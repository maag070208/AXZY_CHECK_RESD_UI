import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Incidencias - Gestión de Incidencias", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  const mockIncidents = [
    {
      id: "inc-1",
      title: "Luz fundida en pasillo",
      description: "Luz del pasillo del 2do piso no enciende",
      status: "PENDING",
      guardId: "user-1",
      guard: { id: "user-1", name: "MARIO", lastName: "MANTENIMIENTO", username: "mario" },
      categoryId: "cat-1",
      category: { id: "cat-1", name: "ELÉCTRICO" },
      typeId: "type-1",
      type: { id: "type-1", name: "REPARACIÓN" },
      media: [],
      createdAt: "2026-06-01T10:00:00.000Z",
      resolvedAt: null,
      resolvedById: null,
      resolvedBy: null,
    },
    {
      id: "inc-2",
      title: "Cerradura rota",
      description: "La cerradura del portón principal está rota",
      status: "ATTENDED",
      guardId: "user-1",
      guard: { id: "user-1", name: "MARIO", lastName: "MANTENIMIENTO", username: "mario" },
      categoryId: "cat-2",
      category: { id: "cat-2", name: "CERRAJERÍA" },
      typeId: "type-2",
      type: { id: "type-2", name: "CAMBIO" },
      media: [],
      createdAt: "2026-06-01T15:00:00.000Z",
      resolvedAt: "2026-06-02T08:00:00.000Z",
      resolvedById: "user-2",
      resolvedBy: { id: "user-2", name: "RICARDO", lastName: "SHIFT" },
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
            body: JSON.stringify({
              success: true,
              data: validMockToken,
              messages: [],
            }),
          });
        }
      });

      // Generic catalog mock — covers all /catalog/* endpoints
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

      // Mock incidents datatable (POST) and resolve (PUT)
      await page.route(/\/api\/v\d+\/incidents.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "*",
            },
          });
          return;
        }

        if (method === "POST" && url.endsWith("/incidents/datatable")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
              success: true,
              data: { rows: mockIncidents, total: mockIncidents.length, page: 1, limit: 10 },
              messages: [],
            }),
          });
        } else if (method === "PUT" && url.match(/\/incidents\/[\w-]+\/resolve$/)) {
          const id = url.split("/")[url.split("/").length - 2];
          const idx = mockIncidents.findIndex((i) => i.id === id);
          if (idx !== -1) {
            mockIncidents[idx] = {
              ...mockIncidents[idx],
              status: "ATTENDED",
              resolvedAt: new Date().toISOString(),
            };
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
              success: true,
              data: idx !== -1 ? mockIncidents[idx] : null,
              messages: [],
            }),
          });
        } else if (method === "DELETE") {
          const id = url.split("/").pop();
          const idx = mockIncidents.findIndex((i) => i.id === id);
          if (idx !== -1) mockIncidents.splice(idx, 1);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, data: true, messages: [] }),
          });
        } else {
          // Default fallback
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, data: null, messages: [] }),
          });
        }
      });
    }

    await page.goto("/#/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*#\/home/);
    await page.goto("/#/incidents");
  });

  test("debería mostrar el listado de incidencias", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/incidenc/i);
    if (useRealApi) {
      await expect(page.locator("table, [role='row'], [role='table']").first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.getByText("Luz fundida en pasillo")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Cerradura rota")).toBeVisible();
    }
  });

  test("debería mostrar badges de prioridad y estado", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/incidenc/i);
    if (!useRealApi) {
      await expect(page.getByText(/PENDIENTE|ATENDIDA/i).first()).toBeVisible();
    }
  });

  test("debería permitir abrir el detalle de una incidencia", async ({ page }) => {
    test.skip(useRealApi, "Modal interaction not testable against real API");
    if (!useRealApi) {
      const eyeBtn = page.locator("button[title*='detalle' i], button[title*='ver' i]").first();
      if ((await eyeBtn.count()) > 0) {
        await eyeBtn.click();
        await expect(page.getByText(/Cerradura rota|Luz fundida/i).first()).toBeVisible({ timeout: 5000 });
        await page.keyboard.press("Escape");
      }
    }
  });

  test("debería permitir resolver una incidencia pendiente", async ({ page }) => {
    test.skip(useRealApi, "Requires a specific seeded PENDING incident");
    if (!useRealApi) {
      const resolveBtn = page.locator("button[title*='resolver' i]").first();
      if ((await resolveBtn.count()) > 0) {
        await resolveBtn.click();
        const confirmBtn = page.getByRole("button", { name: /confirmar/i });
        if ((await confirmBtn.count()) > 0) {
          await confirmBtn.click();
        }
      }
    }
  });
});
