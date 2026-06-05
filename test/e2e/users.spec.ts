import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Usuarios - Gestión de Usuarios", () => {
  // Lista de usuarios mock mutable
  const mockUsers = [
    {
      id: "user-1",
      name: "MARIO",
      lastName: "MANTENIMIENTO",
      username: "mario",
      active: true,
      roleId: "role-maint",
      role: { id: "role-maint", name: "MAINT", value: "Mantenimiento" },
      clientId: "client-1",
      client: { id: "client-1", name: "PLAZA 2000", active: true },
      scheduleId: "sched-2",
      schedule: {
        id: "sched-2",
        name: "SIN HORARIO",
        startTime: "00:00",
        endTime: "00:00",
        active: true,
      },
    },
    {
      id: "user-2",
      name: "RICARDO",
      lastName: "SHIFT",
      username: "ricardo",
      active: true,
      roleId: "role-shift",
      role: { id: "role-shift", name: "SHIFT", value: "Jefe de Turno" },
      clientId: "client-1",
      client: { id: "client-1", name: "PLAZA 2000", active: true },
      scheduleId: "sched-3",
      schedule: {
        id: "sched-3",
        name: "VESPERTINO",
        startTime: "15:00",
        endTime: "23:00",
        active: true,
      },
    },
    {
      id: "user-3",
      name: "ASAEL",
      lastName: "GUARDIA",
      username: "asael",
      active: true,
      roleId: "role-guard",
      role: { id: "role-guard", name: "GUARD", value: "Guardia" },
      clientId: "client-1",
      client: { id: "client-1", name: "PLAZA 2000", active: true },
      scheduleId: "sched-4",
      schedule: {
        id: "sched-4",
        name: "NOCTURNO",
        startTime: "23:00",
        endTime: "07:00",
        active: true,
      },
    },
    {
      id: "user-4",
      name: "ISABEL",
      lastName: "ADMIN",
      username: "isabel",
      active: true,
      roleId: "role-admin",
      role: { id: "role-admin", name: "ADMIN", value: "Administrador" },
    },
  ];

  const mockClients = [
    { id: "client-1", name: "PLAZA 2000" },
    { id: "client-2", name: "CORPO CENTRO" },
  ];

  const mockSchedules = [
    {
      id: "sched-1",
      name: "SIN HORARIO",
      startTime: "00:00",
      endTime: "00:00",
      active: true,
    },
    {
      id: "sched-2",
      name: "SIN HORARIO",
      startTime: "00:00",
      endTime: "00:00",
      active: true,
    },
    {
      id: "sched-3",
      name: "VESPERTINO",
      startTime: "15:00",
      endTime: "23:00",
      active: true,
    },
    {
      id: "sched-4",
      name: "NOCTURNO",
      startTime: "23:00",
      endTime: "07:00",
      active: true,
    },
  ];

  const mockRoles = [
    { id: "role-admin", name: "ADMIN", value: "Administrador" },
    { id: "role-guard", name: "GUARD", value: "Guardia" },
    { id: "role-shift", name: "SHIFT", value: "Jefe de Turno" },
    { id: "role-maint", name: "MAINT", value: "Mantenimiento" },
  ];

  const useRealApi = !!process.env.USE_REAL_API;

  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[Navegador] ${msg.type()}: ${msg.text()}`);
    });

    if (!useRealApi) {
      const validMockToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";

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

      // Mock Catalog Client
      await page.route("**/catalog/client", async (route) => {
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
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: mockClients,
              messages: [],
            }),
          });
        }
      });

      // Mock Catalog Role
      await page.route("**/catalog/role", async (route) => {
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
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: mockRoles,
              messages: [],
            }),
          });
        }
      });

      // Mock Schedules List
      await page.route("**/schedules", async (route) => {
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
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: mockSchedules,
              messages: [],
            }),
          });
        }
      });

      // Mock Users API
      await page.route(/\/api\/v\d+\/users.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (url.endsWith("/users/login")) {
          await route.fallback();
          return;
        }

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

        if (url.endsWith("/users/datatable")) {
          const postData = JSON.parse(route.request().postData() || "{}");
          const filters = postData.filters || {};
          let filtered = [...mockUsers];

          if (filters.name) {
            const search = filters.name.toLowerCase();
            filtered = filtered.filter(
              (u) =>
                u.name.toLowerCase().includes(search) ||
                u.lastName.toLowerCase().includes(search) ||
                u.username.toLowerCase().includes(search),
            );
          }

          if (filters.active !== undefined) {
            filtered = filtered.filter((u) => u.active === filters.active);
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
        } else if (method === "POST") {
          const postData = JSON.parse(route.request().postData() || "{}");
          const role = mockRoles.find(
            (r) => String(r.id) === String(postData.roleId),
          );
          const client = mockClients.find(
            (c) => String(c.id) === String(postData.clientId),
          );
          const schedule = mockSchedules.find(
            (s) => String(s.id) === String(postData.scheduleId),
          );

          const newUser = {
            id: `user-${mockUsers.length + 1}`,
            name: postData.name || "",
            lastName: postData.lastName || "",
            username: postData.username || "",
            active: true,
            roleId: postData.roleId || "",
            role: role
              ? { id: role.id, name: role.name, value: role.value }
              : undefined,
            clientId: postData.clientId,
            client: client
              ? { id: client.id, name: client.name, active: true }
              : undefined,
            scheduleId: postData.scheduleId,
            schedule: schedule
              ? {
                  id: schedule.id,
                  name: schedule.name,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime,
                  active: true,
                }
              : undefined,
          } as any;

          mockUsers.push(newUser);

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: newUser,
              messages: [],
            }),
          });
        } else if (url.includes("/reset-password")) {
          // Reset password route
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
        } else if (method === "PUT") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          const postData = JSON.parse(route.request().postData() || "{}");
          const idx = mockUsers.findIndex((u) => u.id === id);

          if (idx !== -1) {
            if (postData.active !== undefined) {
              mockUsers[idx].active = postData.active;
            }
            if (postData.name !== undefined) {
              mockUsers[idx].name = postData.name;
            }
            if (postData.lastName !== undefined) {
              mockUsers[idx].lastName = postData.lastName;
            }
            if (postData.roleId !== undefined) {
              const role = mockRoles.find(
                (r) => String(r.id) === String(postData.roleId),
              );
              mockUsers[idx].roleId = postData.roleId;
              mockUsers[idx].role = role
                ? { id: role.id, name: role.name, value: role.value }
                : undefined;
            }
            if (postData.clientId !== undefined) {
              const client = mockClients.find(
                (c) => String(c.id) === String(postData.clientId),
              );
              mockUsers[idx].clientId = postData.clientId;
              mockUsers[idx].client = client
                ? { id: client.id, name: client.name, active: true }
                : undefined;
            }
            if (postData.scheduleId !== undefined) {
              const schedule = mockSchedules.find(
                (s) => String(s.id) === String(postData.scheduleId),
              );
              mockUsers[idx].scheduleId = postData.scheduleId;
              mockUsers[idx].schedule = schedule
                ? {
                    id: schedule.id,
                    name: schedule.name,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    active: true,
                  }
                : undefined;
            }
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: idx !== -1 ? mockUsers[idx] : null,
              messages: [],
            }),
          });
        } else if (method === "DELETE") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          const idx = mockUsers.findIndex((u) => u.id === id);

          if (idx !== -1) {
            mockUsers.splice(idx, 1);
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

    // 4. Navegar a usuarios
    await page.goto("/#/users");
  });

  const uniqueUserId = Date.now().toString().slice(-4);
  const uniqueUserName = `JUAN ${uniqueUserId}`;
  const uniqueUserLastName = `PÉREZ ${uniqueUserId}`;
  const uniqueUserFullName = `JUAN ${uniqueUserId} PÉREZ ${uniqueUserId}`;
  const uniqueUserUsername = `jperez_${uniqueUserId}`;

  const modifiedUserName = `JUAN ${uniqueUserId} MODIFICADO`;
  const modifiedUserFullName = `JUAN ${uniqueUserId} MODIFICADO PÉREZ ${uniqueUserId}`;

  test("debería mostrar el Directorio de Usuarios", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Directorio de Usuarios");
    if (useRealApi) {
      await expect(page.getByText(/mario.*Mantenimiento/is)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/ricardo.*Jefe de Turno/is)).toBeVisible({ timeout: 10000 });
      // Asael is on page 2; search for him
      await page.fill('input[placeholder="BUSCAR USUARIO..."]', "asael");
      await expect(page.getByText(/asael.*Guardia/is)).toBeVisible({ timeout: 10000 });
      await page.fill('input[placeholder="BUSCAR USUARIO..."]', "");
      // Isabel is on page 2; search for her
      await page.fill('input[placeholder="BUSCAR USUARIO..."]', "isabel");
      await expect(page.getByText(/isabel.*Administrador/is)).toBeVisible({ timeout: 10000 });
      await page.fill('input[placeholder="BUSCAR USUARIO..."]', "");
    } else {
      await expect(page.getByText(/mario mantenimiento/i)).toBeVisible();
      await expect(page.getByText(/ricardo shift/i)).toBeVisible();
      await expect(page.getByText(/asael guardia/i)).toBeVisible();
      await expect(page.getByText(/isabel admin/i)).toBeVisible();
    }
  });

  test("debería permitir registrar un nuevo usuario exitosamente", async ({
    page,
  }) => {
    await page.click('button:has-text("Nuevo Usuario")');

    await expect(
      page.getByRole("heading", { name: "Registro de Usuario", exact: true }),
    ).toBeVisible();

    // Rellenar detalles del perfil
    await page.fill('input[name="name"]', uniqueUserName);
    await page.fill('input[name="lastName"]', uniqueUserLastName);

    // Rellenar credenciales
    await page.fill('input[name="username"]', uniqueUserUsername);
    await page.selectOption('select[name="roleId"]', { label: "Guardia" });
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");

    await page.selectOption('select[name="scheduleId"]', { label: "Matutino" });
    if (!useRealApi) {
      await page.selectOption('select[name="clientId"]', {
        label: "CORPO CENTRO",
      });
    }
    // Guardar
    await page.click('button:has-text("Registrar Usuario")');

    await expect(page.getByText("Usuario creado con éxito")).toBeVisible();
    await expect(page.getByText(uniqueUserFullName)).toBeVisible();
  });

  async function focusUser(page: any) {
    if (useRealApi) {
      await page.fill('input[placeholder="BUSCAR USUARIO..."]', uniqueUserUsername);
      await page.waitForTimeout(600);
    }
  }

  test("debería permitir editar un usuario", async ({ page }) => {
    await focusUser(page);
    const row = page.locator("tr", { hasText: uniqueUserFullName });
    await row.getByRole("button", { name: "Editar" }).click();

    await expect(
      page.getByRole("heading", { name: "Editar Usuario", exact: true }),
    ).toBeVisible();

    // Editar nombre
    await page.fill('input[name="name"]', modifiedUserName);
    await page.click('button:has-text("Actualizar Usuario")');

    await expect(page.getByText("Usuario editado con éxito")).toBeVisible();
    await expect(page.getByText(modifiedUserFullName)).toBeVisible();
  });

  test("debería permitir cambiar la contraseña", async ({ page }) => {
    await focusUser(page);
    const row = page.locator("tr", { hasText: modifiedUserFullName });
    await row.getByRole("button", { name: "Seguridad" }).click();

    await expect(
      page.getByRole("heading", { name: "Cambiar Contraseña", exact: true }),
    ).toBeVisible();

    await page.fill('input[name="newPassword"]', "newpassword123");
    await page.fill('input[name="confirmPassword"]', "newpassword123");

    await page.click('button:has-text("Actualizar Clave")');

    await expect(
      page.getByText("Contraseña actualizada con éxito"),
    ).toBeVisible();
  });

  test("debería permitir reasignar cliente", async ({ page }) => {
    test.skip(useRealApi, "Clients module not available in real API");
    const row = page.locator("tr", { hasText: modifiedUserFullName });
    await row.getByRole("button", { name: "Cliente" }).click();

    await expect(
      page.getByText("Reasignar Cliente", { exact: true }),
    ).toBeVisible();

    await page.selectOption('select[name="clientId"]', {
      label: "CORPO CENTRO",
    });

    await expect(page.getByText("Cliente reasignado")).toBeVisible();
    await expect(row.getByText("CORPO CENTRO")).toBeVisible();
  });

  test("debería permitir cambiar el turno", async ({ page }) => {
    await focusUser(page);
    const row = page.locator("tr", { hasText: modifiedUserFullName });
    await row.getByRole("button", { name: "Horario" }).click();

    await expect(
      page.getByText("Cambiar Turno", { exact: true }),
    ).toBeVisible();

    const option = page.locator('select[name="scheduleId"] option', {
      hasText: /nocturno/i,
    });
    const value = await option.getAttribute("value");
    await page.selectOption('select[name="scheduleId"]', value);

    await expect(page.getByText("Horario actualizado")).toBeVisible();
    await expect(row.getByText(/nocturno/i)).toBeVisible();
  });

  test("debería permitir eliminar el usuario", async ({ page }) => {
    await focusUser(page);
    const row = page.locator("tr", { hasText: modifiedUserFullName });
    await row.getByRole("button", { name: "Eliminar" }).click();

    await expect(
      page.getByRole("heading", { name: "Eliminar Registro", exact: true }),
    ).toBeVisible();

    await page.click('button:has-text("ELIMINAR AHORA")');

    await expect(page.getByText("Usuario eliminado")).toBeVisible();
    await expect(page.getByText(modifiedUserFullName)).not.toBeVisible();
  });
});
