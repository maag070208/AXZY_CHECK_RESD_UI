import { test, expect, Browser, BrowserContext, Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Accesos - Control de Pases e Invitaciones", () => {
  const useRealApi = !!process.env.USE_REAL_API;

  // ── Shared state for real-API mode ────────────────────────────────────────
  let createdQrCode: string | null = null;

  // ── Mock data for non-real API mode ──────────────────────────────────────
  const mockAccesses = [
    {
      id: "access-1",
      qrCode: "AXZ-ABCD01",
      type: "TEMPORARY",
      status: "PENDING",
      validFrom: "2099-06-01T10:00:00.000Z",
      validUntil: "2099-06-02T10:00:00.000Z",
      used: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      residentId: "res-1",
      visitorId: "vis-1",
      visitor: { id: "vis-1", name: "CARLOS VISITANTE", phone: "5512345678" },
      resident: {
        id: "res-1",
        phone: "5544332211",
        user: { id: "usr-1", name: "JUAN", lastName: "PEREZ" },
        house: { id: "house-1", number: "A-101", street: "AV TULIPANES" },
      },
    },
    {
      id: "access-2",
      qrCode: "AXZ-EFGH02",
      type: "DELIVERY",
      status: "ACTIVE",
      validFrom: "2099-06-01T09:00:00.000Z",
      validUntil: "2099-06-01T11:00:00.000Z",
      used: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      residentId: "res-1",
      visitorId: "vis-2",
      visitor: { id: "vis-2", name: "REPARTIDOR EXPRESS", phone: "5598765432" },
      resident: {
        id: "res-1",
        phone: "5544332211",
        user: { id: "usr-1", name: "JUAN", lastName: "PEREZ" },
        house: { id: "house-1", number: "A-101", street: "AV TULIPANES" },
      },
    },
  ];

  const validMockToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";

  // ── Setup mock routes ─────────────────────────────────────────────────────
  async function setupMockRoutes(page: Page) {
    await page.route("**/users/login", async (route) => {
      const method = route.request().method();
      if (method === "OPTIONS") {
        await route.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "*" } });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: validMockToken, messages: [] }) });
      }
    });

    await page.route(/\/api\/v\d+\/accesses.*/, async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === "OPTIONS") {
        await route.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } });
        return;
      }
      if (url.includes("/datatable")) {
        await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: { rows: mockAccesses, total: mockAccesses.length, page: 1, limit: 10 }, messages: [] }) });
      } else if (method === "PUT") {
        const id = url.split("/").pop();
        const idx = mockAccesses.findIndex(a => a.id === id);
        const data = JSON.parse(route.request().postData() || "{}");
        if (idx !== -1) Object.assign(mockAccesses[idx], data);
        await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: idx !== -1 ? mockAccesses[idx] : null, messages: [] }) });
      } else if (method === "DELETE") {
        const id = url.split("/").pop();
        const idx = mockAccesses.findIndex(a => a.id === id);
        if (idx !== -1) mockAccesses.splice(idx, 1);
        await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, data: true, messages: [] }) });
      }
    });
  }

  async function login(page: Page) {
    await page.goto("/#/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*#\/home/);
  }

  // ── Real API: generate a PENDING access from ROSA VEGA → Madre de Rosa ─
  test.beforeAll(async ({ browser }) => {
    if (!useRealApi) return;

    // Use direct API calls instead of UI interaction for reliability
    const apiBase = "http://localhost:4444/api/v1";

    // 1. Login to get token
    const loginRes = await fetch(`${apiBase}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456" }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data;

    // 2. Find Rosa Vega resident
    const residentsRes = await fetch(`${apiBase}/residents/datatable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ page: 1, limit: 100 }),
    });
    const residentsData = await residentsRes.json();
    const rosaResident = residentsData.data.rows.find(
      (r: any) => r.user?.name === "Rosa" && r.user?.lastName === "Vega"
    );
    if (!rosaResident) throw new Error("Rosa Vega resident not found");
    console.log(`[Setup] Rosa Vega resident ID: ${rosaResident.id}`);

    // 3. Get Madre de Rosa contact info (for visitor data)
    const contactsRes = await fetch(`${apiBase}/contacts/datatable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ page: 1, limit: 100, filters: { residentId: rosaResident.id } }),
    });
    const contactsData = await contactsRes.json();
    const madreContact = contactsData.data.rows?.find(
      (c: any) => c.name && c.name.startsWith("Madre")
    );
    if (!madreContact) throw new Error("Madre de Rosa contact not found");
    console.log(`[Setup] Madre de Rosa contact: ${madreContact.name} tel: ${madreContact.phone}`);

    // 4. Create PENDING access (2 hours duration) via visitor data (not visitorId)
    const now = new Date();
    const validFrom = now.toISOString();
    const validUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const createRes = await fetch(`${apiBase}/accesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        residentId: rosaResident.id,
        visitor: { name: madreContact.name, phone: madreContact.phone },
        type: "TEMPORARY",
        validFrom,
        validUntil,
      }),
    });
    const createData = await createRes.json();
    if (!createData.success) throw new Error(`Failed to create access: ${JSON.stringify(createData)}`);
    createdQrCode = createData.data.qrCode;
    console.log(`[Setup] Pase PENDING creado para Madre de Rosa (2h) — QR: ${createdQrCode}`);
  });

  test.beforeEach(async ({ page }) => {
    if (!useRealApi) {
      await setupMockRoutes(page);
    }
    await login(page);
    await page.goto("/#/accesses");
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test("debería mostrar el Control de Accesos con pases listados", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Control de Accesos");

    if (useRealApi) {
      // Real DB: Madre de Rosa existe + el pase recién creado (PENDING)
      await expect(page.getByText(/Madre de Rosa/i).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/AXZ-/i).first()).toBeVisible();
    } else {
      await expect(page.getByText(/CARLOS VISITANTE/i)).toBeVisible();
      await expect(page.getByText(/REPARTIDOR EXPRESS/i)).toBeVisible();
      await expect(page.getByText(/AXZ-ABCD01/i)).toBeVisible();
    }
  });

  test("debería mostrar los estados de los pases correctamente", async ({ page }) => {
    if (useRealApi) {
      await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });
      const badges = page.locator("table tbody").getByText(/EXPIRADO|COMPLETADO|RECHAZADO|VÁLIDO|DENTRO/i);
      await expect(badges.first()).toBeVisible();
    } else {
      await expect(page.getByText(/VÁLIDO/i).or(page.getByText(/DENTRO/i)).first()).toBeVisible();
    }
  });

  test("debería permitir validar la entrada usando el pase PENDING de Madre de Rosa", async ({ page }) => {
    if (useRealApi) {
      // Find Madre de Rosa row that has "Validar Entrada" button (PENDING status)
      await page.waitForSelector("text=Madre de Rosa", { timeout: 10000 });

      const pendingRow = page.locator("tr", { hasText: /Madre de Rosa/i })
        .filter({ has: page.getByTitle("Validar Entrada") })
        .first();

      // Read QR code directly from the table cell (shown as CÓD: AXZ-XXXXXX)
      const qrText = await pendingRow.locator("text=/AXZ-/").first().textContent({ timeout: 5000 });
      const qrCode = qrText?.match(/AXZ-[A-F0-9]+/i)?.[0] ?? "";
      console.log(`[Test] QR code leído de tabla: ${qrCode}`);

      await pendingRow.getByTitle("Validar Entrada").click();
      await expect(page.getByRole("heading", { name: "Confirmar Entrada" })).toBeVisible();

      await page.getByLabel(/Código de Acceso/i).fill(qrCode);

      const confirmBtn = page.getByRole("button", { name: /^Confirmar Entrada$/i });
      await expect(confirmBtn).not.toBeDisabled({ timeout: 3000 });
      await confirmBtn.click();

      await expect(page.getByText("Entrada registrada con éxito")).toBeVisible({ timeout: 8000 });
    } else {
      await page.waitForSelector("text=CARLOS VISITANTE");
      const row = page.locator("tr", { hasText: /CARLOS VISITANTE/i });
      await row.getByTitle("Validar Entrada").click();

      await expect(page.getByRole("heading", { name: "Confirmar Entrada" })).toBeVisible();
      await page.getByLabel(/Código de Acceso/i).fill("AXZ-ABCD01");

      const confirmBtn = page.getByRole("button", { name: /^Confirmar Entrada$/i });
      await expect(confirmBtn).not.toBeDisabled();
      await confirmBtn.click();

      await expect(page.getByText("Entrada registrada con éxito")).toBeVisible();
    }
  });


  test("debería permitir rechazar un pase PENDING con motivo", async ({ page }) => {
    test.skip(useRealApi, "El pase PENDING ya fue usado en el test anterior (validar entrada) — skip para no crear conflicto");

    await page.waitForSelector("text=CARLOS VISITANTE");
    const row = page.locator("tr", { hasText: /CARLOS VISITANTE/i });
    await row.getByTitle("Rechazar Entrada").click();

    await expect(page.getByRole("heading", { name: "Rechazar Entrada" })).toBeVisible();
    await page.getByLabel(/Motivo de Rechazo/i).fill("No coincide identificación");
    await page.getByRole("button", { name: /^Rechazar Entrada$/i }).click();

    await expect(page.getByText("Pase rechazado con éxito")).toBeVisible();
  });

  test("debería permitir registrar la salida de un pase ACTIVE", async ({ page }) => {
    if (useRealApi) {
      // El pase fue validado como ACTIVE en el test anterior — registrar salida
      await page.waitForSelector("text=Madre de Rosa", { timeout: 10000 });

      const row = page.locator("tr", { hasText: /Madre de Rosa/i })
        .filter({ has: page.getByTitle("Registrar Salida") })
        .first();

      await row.getByTitle("Registrar Salida").click();
      await expect(page.getByRole("heading", { name: "Confirmar Salida" })).toBeVisible();
      await page.getByRole("button", { name: /^Confirmar Salida$/i }).click();
      await expect(page.getByText("Salida registrada con éxito")).toBeVisible({ timeout: 8000 });
    } else {
      await page.waitForSelector("text=REPARTIDOR EXPRESS");
      const row = page.locator("tr", { hasText: /REPARTIDOR EXPRESS/i });
      await row.getByTitle("Registrar Salida").click();

      await expect(page.getByRole("heading", { name: "Confirmar Salida" })).toBeVisible();
      await page.getByRole("button", { name: /^Confirmar Salida$/i }).click();
      await expect(page.getByText("Salida registrada con éxito")).toBeVisible();
    }
  });

  test("debería permitir ver el código QR de un pase", async ({ page }) => {
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });
    const firstQrBtn = page.locator("table tbody tr").first().getByTitle("Ver Código QR");
    await firstQrBtn.click();
    // Overlay del ticket visible
    await expect(
      page.getByText(/PASE DE ACCESO/i).or(page.locator("canvas").first())
    ).toBeVisible({ timeout: 8000 });
    await page.keyboard.press("Escape");
  });

  test("debería permitir eliminar un pase de acceso", async ({ page }) => {
    test.skip(useRealApi, "Eliminación destructiva omitida en modo real API");

    await page.waitForSelector("text=CARLOS VISITANTE");
    const row = page.locator("tr", { hasText: /CARLOS VISITANTE/i });
    await row.getByTitle("Eliminar Pase").click();

    await expect(page.getByText(/¿Estás seguro de eliminar este pase/i)).toBeVisible();
    await page.getByRole("button", { name: /^Eliminar Pase$/i })
      .filter({ hasNot: page.locator('[title]') }).click();

    await expect(page.getByText("Pase de acceso eliminado")).toBeVisible();
  });
});
