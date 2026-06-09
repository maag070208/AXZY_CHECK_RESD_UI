import { test, expect, type Page } from "@playwright/test";

test.describe("Módulo de Quejas - Buzón de Quejas y Sugerencias", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";

  const complaintA = {
    id: "comp-1",
    residentId: "res-1",
    categoryId: "cat-1",
    title: "Luminaria fundida en calle principal",
    description: "La luminaria de la entrada principal no enciende desde hace 3 d\u00edas",
    status: "OPEN",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    resident: { id: "res-1", phone: "5512345678", user: { id: "usr-1", name: "ROSA", lastName: "VEGA CONTRERAS" } },
    category: { id: "cat-1", name: "ALUMBRADO", icon: null, color: null },
    resolvedBy: null,
    resolvedAt: null,
  };

  const complaintB = {
    id: "comp-2",
    residentId: "res-2",
    categoryId: "cat-2",
    title: "Ruido excesivo vecino",
    description: "M\u00fasica alta despu\u00e9s de las 11pm en casa 203",
    status: "IN_PROGRESS",
    createdAt: "2026-06-02T15:00:00.000Z",
    updatedAt: "2026-06-03T08:00:00.000Z",
    resident: { id: "res-2", phone: "5598765432", user: { id: "usr-2", name: "MAR\u00cdA", lastName: "L\u00d3PEZ" } },
    category: { id: "cat-2", name: "RUIDO", icon: null, color: null },
    resolvedBy: { id: "usr-admin", name: "ADMIN", lastName: "SISTEMA" },
    resolvedAt: null,
  };

  async function mockAllApi(page: Page) {
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (url.includes("/users/login")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: mockToken, messages: [] }) });
      } else if (url.includes("/users/me")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { id: 1, name: "ADMIN", lastName: "SISTEMA", role: "ADMIN", clientId: null, residences: [], token: mockToken }, messages: [] }) });
      } else if (url.includes("/complaints/categories")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [{ id: "cat-1", name: "ALUMBRADO" }, { id: "cat-2", name: "RUIDO" }], messages: [] }) });
      } else if (url.includes("/complaints/datatable")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { rows: [complaintA, complaintB], total: 2, page: 1, limit: 10 }, messages: [] }) });
      } else if (url.includes("/complaints/")) {
        const id = url.split("/").pop();
        if (method === "PUT") {
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { ...(id === "comp-1" ? complaintA : complaintB), status: "IN_PROGRESS" }, messages: [] }) });
        } else if (method === "DELETE") {
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: true, messages: [] }) });
        } else {
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: id === "comp-1" ? complaintA : complaintB, messages: [] }) });
        }
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: null, messages: [] }) });
      }
    });
  }

  test.beforeEach(async ({ page }) => {
    if (!useRealApi) {
      await mockAllApi(page);
      await page.goto("/");
      await page.evaluate(() => { window.location.hash = "#/login"; });
      await page.fill('input[name="username"]', "admin");
      await page.fill('input[name="password"]', "123456");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*#\/home/, { timeout: 10000 });
      await page.evaluate(() => { window.location.hash = "#/complaints"; });
    } else {
      await page.goto("/#/login");
      await page.fill('input[name="username"]', "admin");
      await page.fill('input[name="password"]', "123456");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*#\/home/, { timeout: 10000 });
      await page.goto("/#/complaints");
      await page.waitForLoadState("networkidle");
    }
  });

  test("listado y detalle de quejas", async ({ page }) => {
    if (!useRealApi) {
      await expect(page.getByText("Luminaria fundida en calle principal").first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Ruido excesivo vecino").first()).toBeVisible();
      await expect(page.getByText(/ABIERTA|EN PROCESO/i).first()).toBeVisible({ timeout: 5000 });
      const eyeBtn = page.locator('[title="Ver detalle"]').first();
      await expect(eyeBtn).toBeVisible({ timeout: 5000 });
      await eyeBtn.click();
      await expect(page.getByText(/Luminaria fundida/i).first()).toBeVisible({ timeout: 5000 });
      await page.keyboard.press("Escape");
      const deleteBtn = page.locator('[title="Eliminar Queja"]').first();
      await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    } else {
      // Real API: verificar que carga la pagina de quejas con datos del seed
      await expect(page.getByRole("heading", { name: /quejas/i })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/ruido|basura|seguridad/i).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
