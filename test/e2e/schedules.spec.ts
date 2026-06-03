import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Horarios - Gestión de Horarios", () => {
  // Lista de horarios mock mutable
  const mockSchedules = [
    {
      id: "sched-1",
      name: "ADMINISTRACION",
      startTime: "00:00",
      endTime: "23:59",
      active: true,
      _count: { users: 0 }
    },
    {
      id: "sched-2",
      name: "NOCTURNO",
      startTime: "23:00",
      endTime: "07:00",
      active: true,
      _count: { users: 1 }
    },
    {
      id: "sched-3",
      name: "VESPERTINO",
      startTime: "15:00",
      endTime: "23:00",
      active: true,
      _count: { users: 2 }
    },
    {
      id: "sched-4",
      name: "MATUTINO",
      startTime: "07:00",
      endTime: "15:00",
      active: true,
      _count: { users: 2 }
    }
  ];

  const mockUsers = [
    {
      id: "user-1",
      name: "MARIO",
      lastName: "MANTENIMIENTO",
      username: "mario",
      active: true
    },
    {
      id: "user-2",
      name: "RICARDO",
      lastName: "SHIFT",
      username: "ricardo",
      active: true
    }
  ];

  test.beforeEach(async ({ page }) => {
    const useRealApi = !!process.env.USE_REAL_API;

    page.on("console", (msg) => {
      console.log(`[Navegador] ${msg.type()}: ${msg.text()}`);
    });

    if (!useRealApi) {
      const validMockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";

      // Mock Login
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
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: validMockToken,
              messages: [],
            }),
          });
        }
      });

      // Mock Schedules API
      await page.route(/\/api\/v\d+\/schedules.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
              "Access-Control-Allow-Headers": "*",
            },
          });
          return;
        }

        // Case 1: Datatable
        if (url.endsWith("/schedules/datatable")) {
          const postData = JSON.parse(route.request().postData() || "{}");
          const filters = postData.filters || {};
          let filtered = [...mockSchedules];

          if (filters.name) {
            const search = filters.name.toLowerCase();
            filtered = filtered.filter((s) => s.name.toLowerCase().includes(search));
          }

          if (filters.active !== undefined) {
            filtered = filtered.filter((s) => s.active === filters.active);
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: {
                rows: filtered,
                total: filtered.length,
                page: 1,
                limit: 10,
              },
              messages: [],
            }),
          });
        }
        // Case 2: Get Users by Schedule
        else if (url.includes("/users")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: mockUsers,
              messages: [],
            }),
          });
        }
        // Case 3: Create Schedule
        else if (method === "POST") {
          const postData = JSON.parse(route.request().postData() || "{}");
          const newSched = {
            id: `sched-${mockSchedules.length + 1}`,
            name: postData.name || "NUEVO TURNO",
            startTime: postData.startTime || "09:00",
            endTime: postData.endTime || "18:00",
            active: postData.active !== undefined ? postData.active : true,
            _count: { users: 0 }
          };
          mockSchedules.push(newSched);

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: newSched,
              messages: [],
            }),
          });
        }
        // Case 4: Update Schedule
        else if (method === "PUT") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          const postData = JSON.parse(route.request().postData() || "{}");
          const idx = mockSchedules.findIndex((s) => s.id === id);

          if (idx !== -1) {
            mockSchedules[idx] = {
              ...mockSchedules[idx],
              ...postData
            };
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: idx !== -1 ? mockSchedules[idx] : null,
              messages: [],
            }),
          });
        }
        // Case 5: Delete Schedule
        else if (method === "DELETE") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          const idx = mockSchedules.findIndex((s) => s.id === id);

          if (idx !== -1) {
            mockSchedules.splice(idx, 1);
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: true,
              messages: [],
            }),
          });
        }
      });
    }

    // 1. Ir a login
    await page.goto("/#/login");

    // 2. Autenticarse
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');

    // 3. Confirmar login
    await expect(page).toHaveURL(/.*#\/home/);

    // 4. Navegar a schedules
    await page.goto("/#/schedules");
  });

  const uniqueSchedId = Date.now().toString().slice(-4);
  const newScheduleName = `NUEVO TURNO E2E ${uniqueSchedId}`;
  const modifiedScheduleName = `NUEVO TURNO E2E ${uniqueSchedId} MODIFICADO`;

  test("debería mostrar el Directorio de Horarios", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Directorio de Horarios");

    if (process.env.USE_REAL_API) {
      // Real DB may have 11+ schedules paginated at 10/page.
      // Use search to guarantee each seed schedule is visible.
      for (const term of ["Administracion", "Nocturno", "Vespertino", "Matutino"]) {
        await page.fill('input[placeholder="BUSCAR HORARIO..."]', term);
        await page.waitForTimeout(600); // debounce
        await expect(page.getByText(new RegExp(term, "i"))).toBeVisible();
      }
      // Clear search
      await page.fill('input[placeholder="BUSCAR HORARIO..."]', "");
      await page.waitForTimeout(400);
    } else {
      await expect(page.getByText(/administracion/i)).toBeVisible();
      await expect(page.getByText(/nocturno/i)).toBeVisible();
      await expect(page.getByText(/vespertino/i)).toBeVisible();
      await expect(page.getByText(/matutino/i)).toBeVisible();
    }
  });

  test("debería permitir registrar un nuevo horario exitosamente", async ({ page }) => {
    await page.click('button:has-text("Nuevo Horario")');

    await expect(page.getByRole("heading", { name: "Gestión de Horarios", exact: true })).toBeVisible();

    // Rellenar formulario
    await page.fill('input[name="name"]', newScheduleName);
    await page.fill('input[name="startTime"]', "08:00");
    await page.fill('input[name="endTime"]', "20:00");

    await page.click('button:has-text("Guardar Turno")');

    await expect(page.getByText("Horario creado")).toBeVisible();
    await expect(page.getByText(newScheduleName)).toBeVisible();
  });

  test("debería permitir editar el horario recién creado y ver el cambio en la tabla", async ({ page }) => {
    // Ubicar fila recién creada
    const row = page.locator("tr", { hasText: newScheduleName });
    await row.getByRole("button", { name: "Editar" }).click();

    await expect(page.getByRole("heading", { name: "Gestión de Horarios", exact: true })).toBeVisible();

    // Editar nombre
    await page.fill('input[name="name"]', modifiedScheduleName);
    await page.click('button:has-text("Guardar Turno")');

    await expect(page.getByText("Horario actualizado")).toBeVisible();
    await expect(page.getByText(modifiedScheduleName)).toBeVisible();
  });

  test("debería permitir ver el personal asignado al horario", async ({ page }) => {
    // Vespertino: real seed → Marco Guardia + Ricardo Shift; mock → mario + ricardo
    // Use search to avoid pagination issues (E2E runs may have created extra schedules)
    if (process.env.USE_REAL_API) {
      await page.fill('input[placeholder="BUSCAR HORARIO..."]', "Vespertino");
      await page.waitForTimeout(600);
    }
    const row = page.locator("tr", { hasText: /vespertino/i });
    await row.getByText(/asignado/i).click();

    await expect(page.getByRole("heading", { name: "Personal Asignado", exact: true })).toBeVisible();

    if (process.env.USE_REAL_API) {
      // Dialog shows name + username only (no role)
      await expect(page.getByText(/Marco Solis/i)).toBeVisible();
      await expect(page.getByText(/Ricardo Mendoza/i)).toBeVisible();
    } else {
      await expect(page.getByText(/mario mantenimiento/i)).toBeVisible();
      await expect(page.getByText(/ricardo shift/i)).toBeVisible();
    }

    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  });

  test("debería permitir eliminar el horario tras confirmar en el modal", async ({ page }) => {
    // Ubicar fila modificada
    const row = page.locator("tr", { hasText: modifiedScheduleName });
    await row.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByRole("heading", { name: "¿Eliminar Horario?", exact: true })).toBeVisible();

    await page.click('button:has-text("ELIMINAR AHORA")');

    await expect(page.getByText("Horario eliminado con éxito")).toBeVisible();
    await expect(page.getByText(modifiedScheduleName)).not.toBeVisible();
  });
});
