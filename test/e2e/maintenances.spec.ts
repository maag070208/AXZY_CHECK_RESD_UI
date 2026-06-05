import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Mantenimientos", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  const mockMaintenances = [
    {
      id: 1,
      title: "Cambio de foco en lobby",
      description: "Reemplazar foco fundido",
      status: "PENDING",
      category: "ELÉCTRICO",
      guardId: 1,
      guard: { id: 1, name: "MARIO", lastName: "MANTENIMIENTO", username: "mario" },
      media: [],
      createdAt: "2026-06-01T08:00:00.000Z",
    },
    {
      id: 2,
      title: "Reparar aire acondicionado",
      description: "A/C de la oficina no enfría",
      status: "ATTENDED",
      category: "CLIMATIZACIÓN",
      guardId: 2,
      guard: { id: 2, name: "RICARDO", lastName: "SHIFT", username: "ricardo" },
      media: [],
      resolvedAt: "2026-06-02T14:00:00.000Z",
      resolvedBy: { id: 2, name: "RICARDO", lastName: "SHIFT", username: "ricardo" },
      createdAt: "2026-06-01T10:00:00.000Z",
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

      await page.route(/\/api\/v\d+\/maintenance.*/, async (route) => {
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

        if (method === "POST" && url.endsWith("/maintenance/datatable")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
              success: true,
              data: { rows: mockMaintenances, total: mockMaintenances.length, page: 1, limit: 10 },
              messages: [],
            }),
          });
        } else if (method === "PUT" && url.match(/\/maintenance\/\d+\/resolve$/)) {
          const parts = url.split("/");
          const id = Number(parts[parts.length - 2]);
          const idx = mockMaintenances.findIndex((m) => m.id === id);
          if (idx !== -1) {
            mockMaintenances[idx] = {
              ...mockMaintenances[idx],
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
              data: idx !== -1 ? mockMaintenances[idx] : null,
              messages: [],
            }),
          });
        } else if (method === "DELETE") {
          const id = Number(url.split("/").pop());
          const idx = mockMaintenances.findIndex((m) => m.id === id);
          if (idx !== -1) mockMaintenances.splice(idx, 1);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, data: true, messages: [] }),
          });
        } else {
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
    await page.goto("/#/maintenances");
  });

  test("debería mostrar el listado de mantenimientos", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/mantenimiento/i);
    if (!useRealApi) {
      await expect(page.getByText("Cambio de foco en lobby")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Reparar aire acondicionado")).toBeVisible();
    }
  });

  test("debería mostrar estados pendiente y atendido", async ({ page }) => {
    if (!useRealApi) {
      await expect(page.getByText(/PENDIENTE/i).first()).toBeVisible();
      await expect(page.getByText(/ATENDIDA/i).first()).toBeVisible();
    }
  });

  test("debería permitir abrir el detalle de un mantenimiento", async ({ page }) => {
    test.skip(useRealApi, "Modal interaction not testable against real API");
    if (!useRealApi) {
      const detailBtn = page.locator("button[title*='detalle' i], button[title*='ver' i]").first();
      if ((await detailBtn.count()) > 0) {
        await detailBtn.click();
        await expect(page.getByText(/Reemplazar foco|descripci/i).first()).toBeVisible({ timeout: 5000 });
        await page.keyboard.press("Escape");
      }
    }
  });
});
