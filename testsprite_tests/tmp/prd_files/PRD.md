# PRD — AXZY CHECK Residenciales

> **Audience:** TestSprite AI for end-to-end test planning. Plus human context.
> **Scope:** Monorepo with 3 packages — `API/` (Express+Prisma+PostgreSQL :4444), `WEB/` (Vite+React 19 :12345), `APP/` (React Native 0.80 Android+iOS).
> **Language:** Spanish (user-facing copy, entity names, log messages). Code identifiers in English.

---

## 1. Purpose

AXZY CHECK Residenciales is an **offline-first residential complex management platform** for guard, maintenance, and administrative staff to register incidents, visitor passes, payment collections, maintenance rounds, and resident operations at the gate and on the go.

Three products share one business domain:

| Product | Audience | Goal |
|---|---|---|
| **API** | Backend | Single source of truth. JWT-protected REST API over PostgreSQL. Drives sync for offline clients. |
| **WEB** | Admins, supervisors, accountants | Dashboard, CRUD for residents/properties/fees/payments, reports, user management. |
| **APP** | Guards, shift leads, maintenance | Mobile-first, works offline at the gate. Rounds, incidents, visitor passes, scans. |

---

## 2. High-level architecture

```
┌──────────────────┐         ┌──────────────────┐
│  WEB (port 12345)│ ──────▶ │                  │
│  HashRouter      │  HTTPS  │                  │
│  React 19        │         │                  │
│  Redux Toolkit   │         │  API             │
└──────────────────┘         │  (port 4444)     │
                             │  Express + Zod   │
┌──────────────────┐  HTTPS  │  Prisma ORM      │
│  APP (RN 0.80)   │ ──────▶ │                  │
│  WatermelonDB    │         │                  │
│  react-native-   │         │                  │
│    paper         │  sync   │                  │
└──────────────────┘ ──────▶ │  GET /sync       │
                             │  POST /sync      │
                             └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  PostgreSQL      │
                             │  (Prisma)        │
                             └──────────────────┘
```

### Tech stack (locked)

| Layer | API | WEB | APP |
|---|---|---|---|
| Language | TypeScript (strict) | TypeScript (strict) | TypeScript (strict) |
| Framework | Express 4 | Vite + React 19 | React Native 0.80 |
| DB / state | Prisma + PostgreSQL | Redux Toolkit + redux-persist | WatermelonDB (offline) + Redux |
| Validation | Zod | Yup (Formik) | Yup (Formik) / react-hook-form |
| Auth | JWT (bcrypt) | JWT (redux-persist) | JWT (jwt-decode) + AsyncStorage |
| Tests | Jest + Supertest | Vitest + Playwright (mock + real) | Jest (RN preset) + Maestro E2E |
| UI | n/a | `@axzydev/axzy_ui_system` (flat palette, CSS vars) | react-native-paper MD3 + `IT*` components |
| Payments | Stripe (LIVE keys in `.env`) | — | — |
| Email | Resend | — | — |
| PDF | pdfkit (direct buffer; **AWS S3 blocked**) | — | — |
| Maps | Google Maps key in `.env` | — | react-native-maps |

### Repo-wide gotchas (apply to all)

- **No AWS S3** in this env (`AWSCompromisedKeyQuarantineV3`). PDFs are streamed direct via pdfkit.
- **Stripe keys in `.env` are LIVE** (`sk_live_...`). Use test keys for any new integration.
- **No comments in code**, **no `any`**, **Spanish** for user copy.
- **Remote Railway DB not reachable from this env** — apply Prisma migrations via SQL files in `API/prisma/migrations/`.
- **Jest 30 patch** (API only): top-level `node_modules/jest-mock/build/index.js` must include `clearMocksOnScope`.
- **Prisma Decimal** arrives as `string` in JSON — convert with `Number()` before formatting.
- **Endpoint naming**: `House` is the Prisma model. On WEB, route is `/properties`; on API it is `/houses/datatable`. Do not rename.

---

## 3. User roles

Defined in `API/src/core/config/constants.ts`:

| Role | Spanish label | Scope | Where |
|---|---|---|---|
| `ADMIN` | Administrador | Full access. Default seeded user. | WEB |
| `LIDER` | Supervisor | Read all + operational dashboards. | WEB |
| `SHIFT` | Jefe de Guardias | Operational + reports. Shift lead. | WEB + APP |
| `GUARD` | Guardia | Guard-facing screens. Bound to shift hours. | APP |
| `MAINT` | Mantenimiento | Maintenance workflows. | APP |
| `RESDN` | Residente | Resident self-service. | APP |

`OPERATIONAL_ROLES = [GUARD, SHIFT, MAINT]`. Guards additionally have **shift-window enforcement**: a token outside the guard's shift returns `403` with `shiftCheck.message`.

---

## 4. Core features (per product)

### 4.1 API (Express + Prisma + PostgreSQL)

Mounted under `/api/v1` via `API/src/modules/api.router.ts`. 30+ modules, ~170 routes.

**Critical modules** (must be exercised by tests):

| Module | Key endpoints | Notes |
|---|---|---|
| `auth` | `POST /users/login`, `POST /users/logout`, `POST /users/:id/password`, `POST /users/:id/reset-password` | Returns `{ data: { token, user } }`. |
| `users` | `POST /users/datatable`, `GET/POST/PUT/DELETE /users/:id` | Datatable filters: `role` (string→relation), `active`, search. Fixed bug at `user.service.ts:87` (was spreading string chars into Prisma where). |
| `houses` | `POST /houses/datatable` (used by WEB `/properties` page) | Prisma model = `House`. |
| `residents` | `POST /residents/datatable`, CRUD | Cascade deactivation in `$transaction` (user.active = false on resident deactivation). |
| `accesses` | `POST /accesses/datatable`, CRUD, `GET /accesses/types`, `GET /accesses/statuses` | Status: `PENDING, ACTIVE, FINISHED, EXPIRED, REJECTED`. Type: `TEMPORARY, RECURRING, DELIVERY, SERVICE`. |
| `incidents` | `POST /incidents/datatable`, CRUD | Status: `PENDING, ATTENDED`. `createIncident` returns immediately; `setImmediate` fires email (Resend) + WhatsApp. |
| `payments` | `POST /payments/datatable`, CRUD, `GET /payments/summary`, `POST /payments/fees/datatable`, `GET /payments/receipt/:id/download` | Status: `PENDING, PAID, CANCELLED, FAILED`. `handleRecurringPayment` creates next month's Payment for MONTHLY fees. ONE_TIME requires `dueDate`; MONTHLY does not. |
| `maintenance` | `POST /maintenance/datatable` (singular path!) | — |
| `kardex` | `POST /kardex/datatable`, CRUD | Inventory movements. |
| `rounds` | CRUD + scans | Guards scan round locations. |
| `assignments` | CRUD | Status: `PENDING, CHECKING, UNDER_REVIEW, REVIEWED, ANOMALY`. |
| `complaints` | CRUD | Status: `OPEN, IN_PROGRESS, RESOLVED, CLOSED`. |
| `schedules` | CRUD | Shift schedules. |
| `locations`, `zones`, `clients` | CRUD | Soft-delete models. |
| `reports` | Aggregated metrics | — |
| `catalog` | `GET /catalog/:key` | Generic lookup (e.g. roles, statuses, types). |
| `home` | `GET /home/stats` | Dashboard counters (used by WEB). |
| `sync` | `GET /sync`, `GET /sync/check`, `POST /sync` | **WatermelonDB sync** for APP. `LOCAL_TO_API_MAP` translates table→Prisma. |
| `uploads` | `POST /uploads` | **S3-backed; blocked in this env.** |

**Middleware chain (typical route):** `authenticate` → `validate(zodSchema)` → `authorize(roles)` → controller.

**Auth contract:**
- Header: `Authorization: Bearer <jwt>`
- In test env, accepts `req.headers['user']` as JSON
- `token-validator.middleware.ts` checks shift hours for guards → 403 with `shiftCheck.message`

**Datatable contract** (every `*_datatable` route):
```
Request:  { page, limit, filters: { ... }, sort: [{ field, dir }] }
Response: { success: true, data: { rows: T[], total: number, page, limit }, messages: [] }
```

### 4.2 WEB (Vite + React 19 admin)

19 modules, 46 pages. Entry: `WEB/src/main.tsx` wraps with `ITThemeProvider` (custom palette) + `Provider` (Redux) + `HashRouter`.

**Theme system (load `ui` skill before touching):**
- `ITThemeProvider` injects CSS vars on `document.documentElement.style` at runtime: `--color-primary-{50,100,...,900}` for `primary, secondary, ternary, danger, success, info, alert, warning`.
- Palette is **flat** (e.g. `primary: "#065911"`) — 50-900 shades are **not** auto-generated. Use `var(--color-primary-500)` or `buildShades(hex)` from `WEB/src/modules/home/utils/theme.utils.ts`.
- Hook: `useITTheme()` → `{ palette, colors, setPalette, ... }`. `useITThemeSafe()` returns `undefined` outside provider.
- No raw HTML primitives for UI; everything is `IT*` components from `@axzydev/axzy_ui_system`.
- Floating color picker (`showFab={true}`) is on by default.
- No hardcoded Tailwind color classes for theme-driven UI (no `bg-emerald-50`).

**HashRouter** — URLs are `/#/path`. Tests must use `page.goto("/#/path")`.

**Critical pages / flows:**

| Page | Route | Notes |
|---|---|---|
| Login | `/#/login` | `admin` / `123456` default credentials. |
| Home | `/#/` | 5-KPI admin dashboard: Residentes, Cuotas vencidas, Pases activos, Guardias, Incidencias pendientes. Three tabs: `nav`, `analytics`, `detail`. Theme uses `useITTheme()` + `buildShades()`. |
| Users | `/#/users` | `ITDataTable` server-side via `fetchDataTable`. Filters: `role`, `active`. |
| Properties | `/#/properties` | Hits `GET /houses/datatable`. |
| Residents | `/#/residents` | Cascade deactivation. Substring search (Unicode names). |
| Payments | `/#/payments` | `PaymentFormDialog` + `BulkAssignFeeDialog`. Stripe integration. |
| Incidents | `/#/incidents` | Tabbed. `getRecentIncidents()` for the home page. |
| Accesses | `/#/accesses` | Pass management. |
| Guards | `/#/guards` | Uses `/users/datatable?role=GUARD&active=true`. |
| Schedules | `/#/schedules` | Shift scheduling. |
| Locations, Zones, Clients, Settings, Reports, Rounds, Kardex, Maintenances, Fees, Complaints, Recurring | `/#/...` | CRUD + catalogs. |

**State management:** Redux Toolkit. `auth` slice (token + user) persisted via redux-persist. `app` slice for global UI state.

**API client:** `WEB/src/core/axios/axios.ts` — baseURL `VITE_BASE_URL=http://localhost:4444/api/v1`, Bearer token from Redux, error toast on 4xx/5xx.

### 4.3 APP (React Native 0.80)

68 screens across 14 folders. Bare workflow. Entry: `APP/App.tsx` wraps with `GestureHandlerRootView` + `DatabaseProvider` (WatermelonDB) + `SafeAreaProvider` + `Provider` (Redux) + `PersistGate` + `PaperProvider` + `MainNavigator`.

**Mobile design system:**
- `react-native-paper` MD3, custom theme at `APP/src/shared/theme/theme.ts`. Primary `#46a545` (emerald/slate).
- All primitives are `IT*` components in `APP/src/shared/components/`: `ITButton, ITCard, ITBadge, ITAlert, ITInput, ITDatePicker, ITDateRangePicker, ITTimePicker, ITSelect, ITToast, ITSwitch, ITModal, Camera, ITCategorySelector, CustomToast`.
- No raw `react-native` primitives for new code; no hardcoded hex (use `theme.colors.*`).
- Formik + Yup OR react-hook-form — pick one per screen, stay consistent.

**Routing:** `@react-navigation/native` + `drawer` + `bottom-tabs` + `native-stack`. `MainNavigation.tsx` splits by role.

**Offline-first (CRITICAL — load `offline` skill):**
- WatermelonDB is the local source of truth.
- `APP/src/core/database/sync.ts` runs `@nozbe/watermelondb/sync` against `GET /sync` and `POST /sync`.
- 13 WatermelonDB models: `Client, Incident, IncidentCategory, IncidentType, Kardex, Location, Maintenance, RecurringConfiguration, RecurringLocation, RecurringTask, Round, User, Role, House, Vehicle, Zone`.
- `LOCAL_TO_API_MAP` translates table names → Prisma model names (`roles` → `role`).
- `NetInfo` gates sync; `NoInternetScreen` overlays on disconnect.
- Status: `offline_migration_checklist.txt` (per-screen) and `offline_test_scenarios.txt` (test cases).

**Auth:** `jwt-decode` (not `react-jwt`). Token in Redux `user` slice. On app load, `MainNavigation.tsx` decodes and routes.

**Native deps:** `react-native-fs` (attachments), `react-native-compressor` (image/video), `react-native-maps` (Google), `react-native-linear-gradient`, `react-native-gesture-handler`, `react-native-reanimated` (babel plugin **last**), `react-native-paper-dates` (locale via `react-native-localize`).

**S3 is blocked** — uploads via `upload.service.ts` may fail until API moves off S3.

---

## 5. End-to-end user journeys

### 5.1 Admin: register a new resident and collect a payment

1. Login as `admin` / `123456` → Home dashboard.
2. Navigate to `Residencias` → create a `Client` (residential complex).
3. Navigate to `Zonas` → create a `Zone` in that client.
4. Navigate to `Residentes` → create a `Resident` linked to a `House` (auto-generated or pre-existing).
5. Navigate to `Cuotas` → create a `Fee` (ONE_TIME with `dueDate` or MONTHLY).
6. Navigate to `Pagos` → record a `Payment` against the resident's outstanding fee.
7. **Optional**: complete via Stripe checkout (LIVE keys; minimum $1 test / $10 live).
8. **Optional**: download PDF receipt from `GET /payments/receipt/:id/download`.

### 5.2 Guard: register an incident at the gate (offline-capable)

1. Login as guard `Asael Morales Rivera` (`@asael` / password from seed) in APP.
2. If offline: app must still let the guard log the incident into WatermelonDB.
3. Open `Incidencias` → select `IncidentCategory` → `IncidentType` → add description, attach photo (compressed via `react-native-compressor`).
4. Submit. If online: `POST /sync` pushes the new incident. If offline: queued.
5. When online returns: `setImmediate` fires Resend email + WhatsApp to the assigned supervisor.
6. WEB `Incidencias` page shows the new record in datatable.

### 5.3 Shift lead: review rounds and assign maintenance

1. Login as `Ricardo Mendoza Ríos` (SHIFT) in WEB.
2. Open `Rondas` → see today's completed and pending rounds.
3. Open a round → see scanned locations (each scan recorded by a guard at the location).
4. Open `Asignaciones` → create new `Assignment` from the round findings.
5. Assign to `Mario García Sandoval` (MAINT). Status starts at `PENDING`.
6. MAINT sees the assignment in APP, transitions: `PENDING → CHECKING → UNDER_REVIEW → REVIEWED` (or `ANOMALY`).

### 5.4 Resident: request a temporary visitor pass

1. Resident opens APP, logs in (role `RESDN`).
2. `Pases` → create new `Access` (type `TEMPORARY`).
3. Specify visitor, valid from/until window.
4. Guard at the gate sees the pass in `Accesses` datatable (status `PENDING` → flips to `ACTIVE` on first scan, `FINISHED` after the window, `EXPIRED` if not used).

### 5.5 Auth: shift enforcement

1. Guard `Asael Morales Rivera` logs in outside their shift window.
2. API returns 403 with `shiftCheck.message`.
3. APP shows the message and routes back to login.

---

## 6. Data model (Prisma)

`API/prisma/schema.prisma` (698 lines). Key models:

| Model | Purpose | Notes |
|---|---|---|
| `Role` | `ADMIN, LIDER, SHIFT, GUARD, MAINT, RESDN` | Lookup. |
| `User` | System user (staff + residents) | Soft-delete. `active` flag. `clientId` for multi-tenant. |
| `Resident` | Resident profile | `userId` 1:1. Cascade deactivation. |
| `House` | A residential unit | Prisma model name (not `Property`). |
| `Vehicle` | Registered vehicles at a house | — |
| `Visitor` | Known visitors (catalog) | — |
| `Access` | A pass (temporary/recurring/delivery/service) | Status enum, type enum. |
| `AccessLog` | Audit trail of pass scans/uses | — |
| `Contact` | House contacts (e.g. doméstica, hijo) | — |
| `Client` | Residential complex (tenant) | Soft-delete. |
| `Zone` | A zone inside a client | Soft-delete. |
| `Location` | A round/checkpoint location | Soft-delete. |
| `Incident` | A reported incident | Status `PENDING, ATTENDED`. |
| `IncidentCategory`, `IncidentType` | Lookup | — |
| `Round` | A guard's round of locations | — |
| `RoundLocation` | Location within a round | — |
| `Scan` | A guard's scan of a location | — |
| `Assignment` | A work item for a guard/maintenance worker | Status `PENDING, CHECKING, UNDER_REVIEW, REVIEWED, ANOMALY`. |
| `AssignmentTask` | Subtask on an assignment | — |
| `Maintenance` | Maintenance record | — |
| `MaintenanceCategory`, `MaintenanceType` | Lookup | — |
| `Kardex`, `KardexDetail` | Inventory movements | — |
| `RecurringConfiguration`, `RecurringTask`, `RecurringLocation` | Recurring task config | Soft-delete. |
| `Complaint`, `ComplaintCategory` | Resident complaints | Status `OPEN, IN_PROGRESS, RESOLVED, CLOSED`. |
| `Notification` | In-app notifications | — |
| `Payment`, `PaymentLog` | A payment + its history | Indexes: `(residentId, status)`, `(feeId)`, `(period)`, `(deletedAt)`, `(status, period, deletedAt)`. `paymentListSelect` excludes `logs` for performance. |
| `Fee`, `ResidentFee` | A fee template + assignment to resident | — |
| `AuditLog` | Audit trail | — |
| `Schedule` | Shift schedule | — |

**Soft-delete models:** `Client, Zone, User, Location, RecurringConfiguration` (handled by Prisma middleware).

---

## 7. Integrations

| Integration | Where | Env | Notes |
|---|---|---|---|
| **Stripe** | `API/src/modules/payments/stripe*` | `sk_live_...` LIVE keys | Webhook forwarder; min charge $1 test / $10 live. **Do not hardcode test/live.** |
| **Resend** | `API/src/modules/incidents` + `notifications` | `re_Kf3gqhj1_Gf3c8HwnXSVFENa97CQG6MHQ` | Fire-and-forget via `setImmediate` on incident create. |
| **Google Maps** | `react-native-maps` (APP) | `AIzaSyBEcey4scuaufZ6TD4oOZZKjO-CIOVXa8w` | Same key as WEB. |
| **AWS S3** | `API/src/modules/uploads` | **BLOCKED** (`AWSCompromisedKeyQuarantineV3`) | Quarantined keys. PDFs use pdfkit direct buffer. |
| **PostgreSQL** | Prisma | `DATABASE_URL` (env) | Remote Railway not reachable from this env. |
| **WatermelonDB sync** | APP ⇄ API | `/api/v1/sync` | Pull + push. |

---

## 8. Authentication, authorization, security

- **JWT** signed with secret from env. Expiry encoded in token.
- **Default seeded admin**: `{ id: 1, name: "Administrador", role: "Admin", clientId: null }`. Mock JWT:
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature
  ```
- **bcrypt** for password hashing.
- **Helmet** + CORS + rate-limit on global middleware in `API/src/index.ts`.
- **Zod** validation on every route with `validate()` middleware.
- **Role-based** `authorize(roles[])` factory.
- **Test bypass**: `req.headers['user']` accepted in test env.
- **Soft-delete** middleware for `Client, Zone, User, Location, RecurringConfiguration`.
- **Decimal-as-string** — never assume Prisma Decimals arrive as numbers in JSON.

---

## 9. Critical test areas (priority for TestSprite)

### 9.1 High priority — must pass

1. **Login flow** (WEB) — valid + invalid creds; token persistence; 401 logout.
2. **Home dashboard** (WEB) — 5 KPIs render, dark/light theme switching, theme color picker (`showFab`).
3. **Datatable filters** (WEB) — server-side `filters.role: "GUARD"`, `filters.active: true` (regression of `user.service.ts:87` bug).
4. **Resident CRUD + cascade deactivation** (WEB → API) — deactivating a resident flips `user.active` to false in a single `$transaction`.
5. **Payment flow** (WEB) — `PaymentFormDialog` (type strict), `BulkAssignFeeDialog`, Stripe redirect (test mode if possible).
6. **Incident creation + Resend + WhatsApp** (WEB) — verify the response is immediate (no await on `setImmediate`).
7. **WatermelonDB sync** (APP → API) — round-trip push of a new incident created offline, then pulled on the next open.
8. **HashRouter URL handling** (WEB e2e) — `/#/users`, `/#/residents`, etc.
9. **Access pass lifecycle** (WEB) — `PENDING → ACTIVE → FINISHED/EXPIRED/REJECTED`.
10. **PDF receipt download** (WEB) — `GET /payments/receipt/:id/download` returns a stream; click → file download.
11. **Role-based redirects** (WEB) — non-admin user can't see admin-only pages.
12. **Theme system** (WEB) — `useITTheme()` returns valid palette; `buildShades(hex)` produces 50-900; CSS vars resolve.

### 9.2 Medium priority

13. **Guard shift enforcement** (APP) — login outside shift window returns 403 with `shiftCheck.message`.
14. **Rounds + scans** (APP) — guard scans a location; appears in the round.
15. **Maintenance categories** (WEB) — CRUD + lookups via `GET /catalog/maintenance-categories`.
16. **Recurring fees** (API) — `handleRecurringPayment` creates next-month Payment for MONTHLY fees.
17. **Bulk fee assignment** (WEB) — `BulkAssignFeeDialog` assigns a fee to many residents at once.
18. **Audit log** (API) — sensitive mutations write to `AuditLog`.

### 9.3 Low priority / nice-to-have

19. **i18n / Spanish copy** — every user-facing string is Spanish; assert on Spanish in e2e.
20. **Responsive layout** — WEB sidebar collapses on small screens; APP drawer on tablets.
21. **Reports module** — aggregated metrics; can take a while (skip in fast suites).
22. **Kardex inventory** — movements, current stock.
23. **Complaints** — open → in-progress → resolved → closed.

### 9.4 Known flaky / pre-existing

- `test/e2e/users.spec.ts:478` — first `<h1>` is on login page, not users page. Use a more specific selector.

---

## 10. E2E scenarios to cover

| # | Scenario | Type | Critical assertions |
|---|---|---|---|
| E2E-1 | Admin login → home → logout | WEB e2e | Home shows 5 KPI cards; logout clears Redux auth. |
| E2E-2 | Admin creates a resident + assigns house | WEB e2e + API | Resident appears in datatable; house linked. |
| E2E-3 | Admin records a payment (one-time) | WEB e2e | Payment row in datatable; PDF download works. |
| E2E-4 | Admin bulk-assigns a fee to a zone | WEB e2e | All residents in zone get `ResidentFee` rows. |
| E2E-5 | Admin filters users by `role=GUARD` | WEB e2e | Datatable returns guards only. (Regression test for `user.service.ts:87`.) |
| E2E-6 | Admin deactivates a resident | WEB e2e | Resident row's `user.active` becomes `false`; user cannot log in. |
| E2E-7 | Guard logs in APP, creates incident offline | APP e2e (Maestro) | Incident saved to WatermelonDB; syncs to API on reconnect. |
| E2E-8 | Guard scans a round location | APP e2e | Scan row appears in API. |
| E2E-9 | Guard logs in outside shift | APP e2e | 403 with `shiftCheck.message`; routed back to login. |
| E2E-10 | Resident creates a temporary visitor pass | APP e2e | Pass appears in WEB `Accesses` datatable as `PENDING`. |
| E2E-11 | Stripe checkout redirect (test mode if available) | WEB e2e | Redirect URL; webhook flips payment to `PAID`. |
| E2E-12 | Theme color picker (showFab) | WEB e2e | Clicking a preset updates `palette.primary`; CSS var `--color-primary-500` reflects change. |
| E2E-13 | Resend email fires on incident | API integration | Mock Resend; assert call shape. |
| E2E-14 | `GET /sync` round-trip | API integration | Push N changes, pull, expect N-1 returned (one is the change just pushed). |
| E2E-15 | PDF receipt download | API + WEB | `Content-Type: application/pdf`; non-empty body. |
| E2E-16 | HashRouter deep links | WEB e2e | Direct visit to `/#/users?page=2` works; back button preserves URL. |
| E2E-17 | Role redirect (RESDN visits `/users`) | WEB e2e | Redirected to `/login` or `/` with toast. |
| E2E-18 | i18n — every visible string is Spanish | WEB e2e (smoke) | Spot-check header, sidebar, table headers. |
| E2E-19 | APP cold start with persisted Redux | APP e2e | Reopen app; still logged in. |
| E2E-20 | `NoInternetScreen` appears on offline | APP e2e | Toggle airplane mode; overlay shows. |

---

## 11. Edge cases and gotchas

- **Prisma Decimal** is serialized as **string** in JSON responses — UI must `Number()` before formatting.
- **Month boundary for MONTHLY fees** — `handleRecurringPayment` is idempotent; calling it twice in the same month does not double-charge.
- **ONE_TIME fees** must have `dueDate`; MONTHLY must not. Validation in Zod schema.
- **Datatable filter `role: "GUARD"`** — API must convert string → `role: { name: "GUARD" }`. See fixed bug at `user.service.ts:87`.
- **Guard shift window** — token only valid during scheduled shift; otherwise 403.
- **HashRouter** — never use `BrowserRouter`; tests must `page.goto("/#/path")`.
- **Soft-delete models** — `prisma.user.findMany()` etc. exclude `deletedAt != null` automatically.
- **Cascade deactivation** — `deleteResident` runs in `$transaction`; user + house + contact all updated atomically.
- **Async emails/WhatsApp** — `setImmediate` from `incident.service.ts` is fire-and-forget. Do not assert the side effects in request flow.
- **`useITThemeSafe()`** returns `undefined` outside the provider — useful for unit-test isolation.
- **CSS var injection timing** — `ITThemeProvider` injects on mount; first paint may flicker. Account for it in screenshots-based tests.
- **Jest 30 patch** (API) — if tests fail with `clearMocksOnScope is not a function`, apply the patch.
- **AWS S3 dead** — never write new S3 upload code; existing routes return errors. Use pdfkit direct buffer for PDFs.
- **Stripe LIVE keys** — never use them in tests; mock Stripe in Jest and Playwright.
- **Unicode names** — `García` ≠ `Garcia` for substring search. Use `.toLowerCase().includes()`.

---

## 12. Performance, security, reliability requirements

### Performance
- **Datatable response** under 300ms for up to 10k rows (server-side pagination; `paymentListSelect` excludes `logs`).
- **Sync round-trip** under 2s for 100 changes.
- **WEB first contentful paint** under 1.5s on localhost.
- **APP cold start** under 3s on a mid-range Android.

### Security
- All non-auth routes require `Authorization: Bearer <jwt>`.
- Sensitive mutations write to `AuditLog` (who, what, when).
- Passwords bcrypt-hashed (no plaintext in DB, no logs).
- CORS allowlist for `WEB` origin.
- Helmet defaults + rate-limit (e.g. 100 req/min per IP).
- Zod validation on every request body and query.
- No secrets in code; `.env` for everything.

### Reliability
- **Soft-delete** preserves history; `deletedAt` + middleware filter.
- **`$transaction`** for any multi-row mutation (cascade deactivation, recurring payment creation).
- **Async side effects** (email, WhatsApp, push) must not block the response.
- **Idempotency**: `handleRecurringPayment`, `getOrCreateStripeCustomer`, etc.

---

## 13. Environment configuration

### `API/.env` (excerpt)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
RESEND_API_KEY=re_Kf3gqhj1_Gf3c8HwnXSVFENa97CQG6MHQ
STRIPE_SECRET_KEY=sk_live_...   # LIVE
STRIPE_PUBLIC_KEY=pk_live_51Oo9x0J46V6Ym5XxPXgfOduK3u7srd0U6SNRhVhSc8Xr8DFSOm9nDbFZF7t0VzTRkEF9YoQh730Riv5snfQ7g7FZ006Wn34rfA
GOOGLE_MAPS_API_KEY=AIzaSyBEcey4scuaufZ6TD4oOZZKjO-CIOVXa8w
```

### `WEB/.env` (excerpt)
```
VITE_BASE_URL=http://localhost:4444/api/v1
```

### `APP/.env` (excerpt)
```
API_BASE_URL=http://localhost:4444/api/v1
GOOGLE_MAPS_API_KEY=AIzaSyBEcey4scuaufZ6TD4oOZZKjO-CIOVXa8w
```

---

## 14. Test execution matrix

| Suite | Command | Network | Workers |
|---|---|---|---|
| API unit + integration (Jest) | `cd API && pnpm test` | localhost | parallel |
| API E2E flows (Jest + Supertest) | `cd API && pnpm test:e2e` | localhost | serial |
| WEB unit (Vitest) | `cd WEB && pnpm test` | localhost | parallel |
| WEB e2e mock (Playwright, default) | `cd WEB && pnpm test:e2e:mock` | page.route | parallel |
| WEB e2e real (Playwright, optional) | `cd WEB && USE_REAL_API=true pnpm test:e2e:real` | localhost API :4444 | **serial** (workers: 1) |
| APP unit (Jest) | `cd APP && npm test` | localhost | parallel |
| APP E2E (Maestro) | `cd APP && maestro test .maestro/` | device/emulator | serial |

### TestSprite run order
1. **API** (`pnpm test` + `pnpm test:e2e`) — verify backend contracts.
2. **WEB** (`pnpm test` + `pnpm test:e2e:mock`) — verify admin flows.
3. **APP** (`npm test` + Maestro) — verify mobile + offline.
4. **Cross-cutting** — `USE_REAL_API=true pnpm test:e2e:real` against a live :4444 API.

### Known test data for real-mode

- Admin: `admin` / `123456`
- MAINT: `Mario García Sandoval` (`@mario`)
- SHIFT: `Ricardo Mendoza Ríos` (`@ricardo`)
- GUARD: `Asael Morales Rivera` (`@asael`) — on page 2 of users
- Resident: `Rosa María Vega Contreras` — lives in `Calle Los Olivos 203`; contacts include `Empleada doméstica de Rosa`, `Hijo(a) de Rosa`
- Houses: `Calle Los Olivos` 201-209, `Paseo del Bosque` 1-19, `Privada de las Flores` 102-110

---

## 15. Glossary (Spanish ⇄ English)

| Spanish | English | Context |
|---|---|---|
| Residente | Resident | Lives in a house. |
| Residencia / Cliente | Residential complex / Client | The complex itself (multi-tenant). |
| Casa | House | A unit. |
| Cuota | Fee | Monthly or one-time. |
| Pago | Payment | A payment record. |
| Pase / Acceso | Pass / Access | A visitor or service pass. |
| Incidencia | Incident | A reportable event. |
| Ronda | Round | A guard's round of locations. |
| Ubicación | Location | A checkpoint or point of interest. |
| Asignación | Assignment | A work item. |
| Mantenimiento | Maintenance | Maintenance record. |
| Queja | Complaint | A resident complaint. |
| Horario | Schedule | A shift schedule. |
| Guardia | Guard | Operational role. |
| Jefe de Guardias | Shift lead | `SHIFT` role. |
| Supervisor | Supervisor | `LIDER` role. |
| Mantenimiento (rol) | Maintenance (role) | `MAINT` role. |
| Kardex | Inventory log | — |
