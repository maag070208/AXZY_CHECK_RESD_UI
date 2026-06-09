import { test, expect } from "@playwright/test";

test.describe("Portal de Residente - Vista RESDN", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  test.beforeEach(async ({ page }) => {
    await page.goto("/#/login");
    await page.fill('input[name="username"]', "raul.gutierrez");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*#\/home/, { timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test("debería mostrar el panel de bienvenida del residente", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/Bienvenido|Raúl/i, { timeout: 10000 });
  });

  test("debería poder navegar a pagos", async ({ page }) => {
    await page.goto("/#/payments");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });

  test("debería poder navegar al buzón de quejas", async ({ page }) => {
    await page.goto("/#/complaints");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });

  test("debería poder navegar a accesos", async ({ page }) => {
    await page.goto("/#/accesses");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });
});
