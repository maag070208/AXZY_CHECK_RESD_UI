# WEB — AGENTS.md

Vite + React 19 admin dashboard for AXZY CHECK Residenciales. Port 12345.

> **Before writing code, load**: `.opencode/skills/ui/SKILL.md` (theme + design system rules) and `.opencode/skills/web-test/SKILL.md` (Vitest + Playwright patterns). The skill files are the source of truth — do not duplicate their rules here.

## Quick commands

```bash
cd WEB
pnpm dev                  # Vite --port 12345 --strictPort
pnpm test                 # Vitest (src/**/*.test.tsx)
pnpm test:e2e:mock        # Playwright, default (page.route mocks, fully parallel)
pnpm test:e2e:real        # USE_REAL_API=true, serial, requires API on :4444
pnpm test:e2e:mock:ui     # Playwright with UI
pnpm test:e2e:real:ui
pnpm build                # tsc -b + vite build (development mode)
pnpm build:prod           # production build
pnpm lint
```

## Layout

```
WEB/
├── src/
│   ├── main.tsx           # entry: ITThemeProvider + Provider + HashRouter
│   ├── App.tsx            # routes
│   ├── index.css          # global Tailwind + index.css variables
│   ├── core/
│   │   ├── axios/axios.ts # configured axios instance
│   │   ├── store/         # Redux Toolkit (auth, app slices)
│   │   ├── routes/        # central route map
│   │   ├── services/      # cross-module services (table-fetcher, catalog)
│   │   ├── types/         # TResult, datatable, etc.
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── mappers/
│   │   └── utils/         # test-utils.tsx (ITThemeProvider wrapper)
│   ├── providers/         # toast, etc.
│   ├── theme/             # theme tokens (consumed by ITThemeProvider)
│   └── modules/
│       └── <name>/
│           ├── pages/     # one per route
│           ├── components/
│           ├── services/  # module-specific API calls
│           └── types/     # module-specific types
├── test/
│   └── e2e/               # Playwright tests (*.spec.ts)
├── playwright.config.ts   # baseURL :12345, USE_REAL_API toggle
├── vitest.config.ts (implicit) / vite.config.ts
├── jest.setup.ts          # MSW, matchMedia, ResizeObserver mocks
├── tailwind.config.js
└── react_llm_reference.txt # API catalog (generated)
```

## Critical conventions

### Routing
- `HashRouter` (not BrowserRouter) — URLs are `/#/path`. e2e tests must use `page.goto("/#/path")` and assert `toHaveURL(/.*#\/path/)`.

### API client
- Base URL: `VITE_BASE_URL=http://localhost:4444/api/v1` (from `WEB/.env`).
- Every request gets the Bearer token from Redux. **Auth middleware on the API expects `res.locals.user`** — the axios interceptor must include the token.

### UI system (`@axzydev/axzy_ui_system`)
- Every visible component is from this package: `ITCard`, `ITButton`, `ITBadget`, `ITDataTable`, `ITInput`, `ITFormBuilder`, `ITTable`, `ITTabs`, `ITDialog`, `ITDatePicker`, `ITTimePicker`, `ITToast`, `ITLoader`, `ITNavbar`, `ITSidebar`, `ITSlideToggle`, `ITStepper`, `ITSearchSelect`, `ITSelect`, `ITTripleFilter`, `ITDropfile`, `ITImage`, `ITLayout`, `ITText`, `ITCalendar`, `ITPagination`.
- **Do not use raw HTML for UI primitives** (no `<button>`, `<input>`, `<table>`) except inside `IT*` components or for layout wrappers.
- Theme access: `const { palette } = useITTheme();`. Helpers: `resolveCssColor(hex)`, `getContrastTextColor(hex)`, `isLightColor(hex)`.
- **CSS variable injection**: `ITThemeProvider` injects `--color-primary-50..900`, etc. on `document.documentElement.style` at runtime. The palette is **flat** (e.g. `primary: "#065911"`, not `{ 50, 100, ... }`) — the 50-900 shades are **not** auto-generated. Use:
  - `var(--color-primary-500)` directly, OR
  - `buildShades(hex)` helper (see `src/modules/home/utils/theme.utils.ts`).
- **No hardcoded Tailwind color classes** for theme-driven UI (no `bg-emerald-50`, `text-emerald-600`). Use `useITTheme()` and the CSS vars / shade helpers.
- **Floating color picker** is on by default (`showFab={true}` in `main.tsx`). Don't disable it unless asked.

### Datatables
- Server-side via `ITDataTable fetchData={async (params) => fetchDataTable<Row>(url, params)}`.
- `fetchDataTable` (`src/core/services/table-fetcher.service.ts`) already handles the success/failure response — pass it `page`, `limit`, `filters`, `sort` (see `ITDataTableFetchParams`).
- Response shape from API: `{ data: { rows: T[], total: number } }`.

### Forms
- **Formik + Yup** via `ITFormBuilder`. Don't write raw `onChange` handlers for forms.
- Field config: `FieldConfigV2` (`src/modules/*/types/forms.types.ts` per module) for type safety.
- Currency inputs: `currencyFormat: true` on `ITInput` or the `FieldConfig`.
- Dialogs: `ITDialog` (portaled) — not browser `dialog` or custom modals.

### Style
- **No comments** in code.
- **Spanish** for user-facing copy and entity names.
- Strict types: no `any`. Use `TResult<T>` from `core/types/TResult.ts`.
- All Prisma Decimal values arrive as **strings** in JSON; convert with `Number(...)` or `parseFloat` before formatting.
- Dayjs with `dayjs.locale("es")` and `utc` + `timezone` plugins (configured in `main.tsx`).

## Mock auth (unit tests + mock e2e)

Default admin token (decoded payload):
```ts
{
  id: 1, name: "Administrador", email: "admin@example.com",
  role: "Admin", clientId: null, exp: 2524608000
}
```
JWT string: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature`

Default mock admin credentials: `admin` / `123456`.

Test stores set the token via `store.dispatch(setAuth(token))`; reset with `store.dispatch(logout())`.

## Testing

### Unit (Vitest)
- `pnpm test` — runs all `*.test.tsx` colocated next to source.
- Wrap with the helper: `import { render, screen, fireEvent, waitFor, store } from "@app/core/utils/test-utils";` (provides `ITThemeProvider` + `Provider` + `BrowserRouter`).
- Mock `react-jwt` and `react-router-dom` per file if needed.
- Mock `IT*` complex components only when JSDOM can't render them (e.g. Chart.js canvas).

### E2E (Playwright)
- `pnpm test:e2e:mock` — DEFAULT. `page.route("**/api/...", ...)` mocks, fully parallel, no API needed.
- `pnpm test:e2e:real` — `USE_REAL_API=true`, **serial** (`workers: 1`), requires API on :4444.
- `baseURL: http://localhost:12345`, projects: chromium, firefox, webkit.
- `SLOWMO=<ms>` env for debugging.
- **Pattern for mock tests**:
  ```ts
  test.beforeEach(async ({ page }) => {
    await page.route("**/users/login", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, data: validMockToken, messages: [] }) });
    });
    // generic catalog mock to avoid 401 logout on useCatalog("anything")
    await page.route(/\/api\/v\d+\/catalog\/.*/, async (route) =>
      route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], messages: [] }) }));
    // per-test specific routes
    await page.route(/\/api\/v\d+\/incidents\/datatable/, ...);
  });
  ```
- **Real-mode data quirks**:
  - Resident `Rosa María Vega Contreras` lives in `Calle Los Olivos 203`. Her contacts are `Empleada doméstica de Rosa` and `Hijo(a) de Rosa`. Use `.includes("rosa")` not `===`.
  - Guards: `Mario García Sandoval` (MAINT, `@mario`), `Ricardo Mendoza Ríos` (SHIFT), `Asael Morales Rivera` (GUARD). Use `sandoval` or `.toLowerCase()` for substring matches (Unicode: `García` ≠ `Garcia`).
  - `Asael Morales` and `Isabel` are on page 2 of the users table — search or paginate before asserting.
  - Houses use `Calle Los Olivos` 201-209, `Paseo del Bosque` 1-19, `Privada de las Flores` 102-110.

## Known bugs / gotchas

- **Jest 30 patch** in `node_modules` of API: shared lockfile sometimes affects the WEB if a hoisted module is broken. Symptom: `clearMocksOnScope` undefined.
- **Endpoint `/properties` → `/houses/datatable`** (API model is `House`, not `Property`). Don't rename the API route; the WEB route `/properties` is fine.
- **Datatable filters** with `role: "GUARD"` as a string need the API service to convert to `role: { name: "GUARD" }`. If `POST /users/datatable` errors with `Unknown argument '0'`, that's the API bug — see `API/AGENTS.md`.
- **Mock e2e users page** is flaky at `test/e2e/users.spec.ts:478` because the first `<h1>` is on the login page; pre-existing, fix in tests not in code.
- **`residents.spec.ts` `text=ROSA VEGA`** assertion — use `Rosa María Vega` (full name) or `.includes()`.
- **HashRouter + page.goto** — use `/#/path`, not `/path`.

## Files / references

- Skill: `.opencode/skills/ui/SKILL.md` (theme + components)
- Test skill: `.opencode/skills/web-test/SKILL.md`
- API catalog: `WEB/react_llm_reference.txt`
- Coverage map: `WEB/COBERTURA_TEST.txt`
- E2E config: `WEB/playwright.config.ts`
- E2E mock patterns: `WEB/test/e2e/home.spec.ts`, `incidents.spec.ts`, `payments.spec.ts`
- API rules: `../API/AGENTS.md` (cross-read for backend changes)
