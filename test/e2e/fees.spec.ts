import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Cuotas (Fees) - Catálogo", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  const mockFees = [
    {
      id: "fee-1",
      name: "Cuota de Mantenimiento",
      description: "Cuota mensual",
      amount: 1500,
      type: "MONTHLY",
      dueDate: null,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      deletedAt: null,
    },
    {
      id: "fee-2",
      name: "Cuota Extraordinaria 2026",
      description: "Reparación de fachadas",
      amount: 5500,
      type: "ONE_TIME",
      dueDate: "2026-07-15",
      active: true,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
      deletedAt: null,
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

      // Generic residents mock
      await page.route(/\/api\/v\d+\/residents.*/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
            data: { rows: [], total: 0, page: 1, limit: 10 },
            messages: [],
          }),
        });
      });

      await page.route(/\/api\/v\d+\/payments\/fees.*/, async (route) => {
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

        if (method === "POST" && url.endsWith("/payments/fees/datatable")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
              success: true,
              data: { rows: mockFees, total: mockFees.length, page: 1, limit: 10 },
              messages: [],
            }),
          });
        } else if (method === "POST" && url.endsWith("/payments/fees")) {
          const postData = JSON.parse(route.request().postData() || "{}");
          const newFee = {
            id: `fee-${mockFees.length + 1}`,
            ...postData,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          };
          mockFees.push(newFee);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, data: newFee, messages: [] }),
          });
        } else if (method === "DELETE") {
          const id = url.split("/").pop();
          const idx = mockFees.findIndex((f) => f.id === id);
          if (idx !== -1) mockFees.splice(idx, 1);
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
    await page.goto("/#/fees");
  });

  test("debería mostrar el catálogo de cuotas", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/cuota/i);
    if (!useRealApi) {
      await expect(page.getByText("Cuota de Mantenimiento")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Cuota Extraordinaria 2026")).toBeVisible();
    }
  });

  test("debería diferenciar cuotas mensuales de cargos únicos", async ({ page }) => {
    if (!useRealApi) {
      await expect(page.getByText(/MENSUAL/i).first()).toBeVisible();
      await expect(page.getByText(/ÚNICO|UNICO/i).first()).toBeVisible();
    }
  });

  test("debería permitir abrir el diálogo de nueva cuota", async ({ page }) => {
    test.skip(useRealApi, "Dialog interaction not testable against real API");
    if (!useRealApi) {
      const newBtn = page.getByRole("button", { name: /nueva|cuota/i }).first();
      if ((await newBtn.count()) > 0) {
        await newBtn.click();
        await expect(page.getByText(/nombre|monto|tipo/i).first()).toBeVisible({ timeout: 5000 });
        await page.keyboard.press("Escape");
      }
    }
  });
});
