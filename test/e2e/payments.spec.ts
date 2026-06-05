import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Pagos - Gestión de Pagos", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  const mockPayments = [
    {
      id: "pay-1",
      residentId: "res-1",
      feeId: "fee-1",
      amount: 1500,
      reference: "FOL-0001",
      status: "PENDING",
      period: "2026-06",
      paidAt: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
      deletedAt: null,
      resident: {
        id: "res-1",
        email: "juan@example.com",
        phone: "5551234567",
        user: { id: "user-1", name: "JUAN", lastName: "PÉREZ" },
      },
      fee: { id: "fee-1", name: "Cuota de Mantenimiento", amount: 1500, type: "MONTHLY", dueDate: null },
    },
    {
      id: "pay-2",
      residentId: "res-2",
      feeId: "fee-2",
      amount: 5500,
      reference: "FOL-0002",
      status: "PAID",
      period: null,
      paidAt: "2026-06-02T10:00:00.000Z",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-06-02T10:00:00.000Z",
      deletedAt: null,
      resident: {
        id: "res-2",
        email: "maria@example.com",
        phone: "5559876543",
        user: { id: "user-2", name: "MARÍA", lastName: "LÓPEZ" },
      },
      fee: { id: "fee-2", name: "Cuota Extraordinaria 2026", amount: 5500, type: "ONE_TIME", dueDate: "2026-07-15" },
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

      // Mock summary
      await page.route(/\/api\/v\d+\/payments\/summary$/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "*" },
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            success: true,
            data: {
              pending: { total: 1500, count: 1 },
              paid: { total: 5500, count: 1 },
            },
            messages: [],
          }),
        });
      });

      // Mock datatable
      await page.route(/\/api\/v\d+\/payments\/datatable/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "*" },
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            success: true,
            data: { rows: mockPayments, total: mockPayments.length, page: 1, limit: 10 },
            messages: [],
          }),
        });
      });

      // Mock fees
      await page.route(/\/api\/v\d+\/payments\/fees.*/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "*" },
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            success: true,
            data: mockPayments.map((p) => p.fee).filter(Boolean),
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
    await page.goto("/#/payments");
  });

  test("debería mostrar el módulo de pagos", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/pago/i);
  });

  test("debería mostrar las tarjetas de resumen", async ({ page }) => {
    if (!useRealApi) {
      await expect(page.getByText(/pendiente|cobrado/i).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("debería mostrar la lista de pagos", async ({ page }) => {
    if (!useRealApi) {
      await expect(page.getByText("JUAN").first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("MARÍA").first()).toBeVisible();
    }
  });

  test("debería diferenciar pagos pendientes de pagados", async ({ page }) => {
    if (!useRealApi) {
      await expect(page.getByText(/PENDIENTE/i).first()).toBeVisible();
      await expect(page.getByText(/PAGADO/i).first()).toBeVisible();
    }
  });
});
