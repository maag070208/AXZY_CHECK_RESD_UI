import { test, expect } from "@playwright/test";

test.describe("Portal de Jefe de Guardias - Vista SHIFT", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  test.beforeEach(async ({ page }) => {
    await page.goto("/#/login");
    await page.fill('input[name="username"]', "ricardo");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*#\/home/, { timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test("debería mostrar el dashboard del jefe de guardias", async ({ page }) => {
    await expect(page.locator("h1").or(page.getByText(/ricardo/i)).first()).toBeVisible({ timeout: 10000 });
  });

  test("debería NO mostrar Residentes (solo admin)", async ({ page }) => {
    await expect(page.getByText("Residentes", { exact: true })).not.toBeVisible({ timeout: 5000 });
  });

  test("debería poder navegar al módulo de guardias", async ({ page }) => {
    await page.goto("/#/guards");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });

  test("debería poder navegar al módulo de recorridos", async ({ page }) => {
    await page.goto("/#/rounds");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });

  test("debería poder navegar al módulo de accesos", async ({ page }) => {
    await page.goto("/#/accesses");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });

  test("debería poder navegar al módulo de incidencias", async ({ page }) => {
    await page.goto("/#/incidents");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });
});
