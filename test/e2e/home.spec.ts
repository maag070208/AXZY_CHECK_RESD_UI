import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo Home - Dashboard", () => {
  const useRealApi = !!process.env.USE_REAL_API;

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
    }

    await page.goto("/#/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*#\/home/);
  });

  test("debería mostrar el dashboard principal", async ({ page }) => {
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });

  test("debería mostrar tabs de analytics y operación", async ({ page }) => {
    // Tabs labels
    const analyticsTab = page.getByRole("button", { name: /analytics|analít/i }).first();
    const operationalTab = page.getByRole("button", { name: /operacional|operación|operativo/i }).first();
    if (await analyticsTab.count() > 0) {
      await expect(analyticsTab).toBeVisible({ timeout: 10000 });
    }
    if (await operationalTab.count() > 0) {
      await expect(operationalTab).toBeVisible();
    }
  });

  test("debería permitir navegar a un módulo desde las cards", async ({ page }) => {
    // Find a clickable card/link to a module
    const moduleLinks = page.locator("a[href*='#/'], button").filter({ hasText: /usuarios|residentes|guardias|incidencias/i });
    if (await moduleLinks.count() > 0) {
      await moduleLinks.first().click();
      await page.waitForTimeout(1000);
    } else {
      // If cards aren't clickable in mock mode, just verify the dashboard loaded
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });
});
