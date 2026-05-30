# Phase 5 — Dashboard & Store Settings — Tasks

## A. Store Settings Module

### A1. StoreSettings Model
- **File:** `apps/backend/src/modules/storeSettings/settings.model.ts`
- **Fields:** `storeName` (string), `storeAddress` (string), `storePhone` (string), `logoUrl` (string), `currency` (string, default `MRU`), `invoiceFooter` (string), `theme` (enum `light | dark`), `language` (enum `ar | fr`)
- Singleton pattern — only one document ever exists (upsert on write)

### A2. StoreSettings Validation
- **File:** `apps/backend/src/modules/storeSettings/settings.validation.ts`
- `updateSettingsSchema` — all fields optional, validate enum values for `theme` and `language`

### A3. StoreSettings Service
- **File:** `apps/backend/src/modules/storeSettings/settings.service.ts`
- `getSettings()` — fetch the single settings document (create default if missing)
- `updateSettings(input)` — upsert the single document, return updated

### A4. StoreSettings Controller
- **File:** `apps/backend/src/modules/storeSettings/settings.controller.ts`
- `get` — return settings DTO
- `update` — validate body, call service, return updated DTO

### A5. StoreSettings Routes
- **File:** `apps/backend/src/modules/storeSettings/settings.routes.ts`
- `GET /` — `requireAuth`, `requireRole("admin")` (employee gets read-only — use both roles)
- `PUT /` — `requireAuth`, `requireRole("admin")`, `validate(schema)`

### A6. StoreSettings Serializer
- **Add to:** `apps/backend/src/utils/serializer.ts`
- `serializeSettings(settings)` — return DTO matching API Contract §14.8

### A7. StoreSettings Seed
- **Update:** `apps/backend/src/scripts/seedAll.ts`
- Settings already seeded; verify the document shape matches the model

---

## B. Dashboard Module

### B1. Dashboard Service
- **File:** `apps/backend/src/modules/dashboard/dashboard.service.ts`
- `getAdminDashboard()` — use MongoDB aggregation pipelines:
  - Today's sales total + order count (createdAt >= start of today)
  - Monthly sales total + order count (createdAt >= start of month)
  - Total products count + low stock count (quantity <= alertThreshold)
  - Total customers count + outstanding debt (sum of totalDebt)
  - Total employees count
  - Recent 10 sales (Sale.find().sort({ createdAt: -1 }).limit(10))
  - Low stock products (first 10)
  - Recent activity logs (last 10)
- `getEmployeeDashboard(userId)` — similar but scoped to user:
  - Today's sales total + order count (employeeId = userId)
  - Monthly sales total + order count (employeeId = userId)
  - Average ticket (monthly total / monthly orders)
  - Recent 10 own sales
  - Unread notifications count

### B2. Dashboard Controller
- **File:** `apps/backend/src/modules/dashboard/dashboard.controller.ts`
- `admin` — call service, return result
- `employee` — call service with `req.user.userId`, return result

### B3. Dashboard Routes
- **File:** `apps/backend/src/modules/dashboard/dashboard.routes.ts`
- `GET /admin` — `requireAuth`, `requireRole("admin")`, controller.admin
- `GET /employee` — `requireAuth`, `requireRole("employee")`, controller.employee

### B4. Dashboard DTO Shape
- Admin response matches API Contract §13.1
- Employee response matches API Contract §13.2

### B5. Cache (Optional — Redis)
- If `REDIS_URL` is configured, cache dashboard results with 5-minute TTL
- Key pattern: `dashboard:admin`, `dashboard:employee:{userId}`
- If Redis unavailable, compute directly from MongoDB (graceful fallback)

---

## C. App Wiring

### C1. Register StoreSettings Routes
- **In:** `apps/backend/src/app.ts`
- Add `app.use("/v1/settings", settingsRoutes);`

### C2. Register Dashboard Routes
- **In:** `apps/backend/src/app.ts`
- Add `app.use("/v1/dashboard", dashboardRoutes);`

### C3. Install node-cron (if not present)
- Run: `npm install node-cron`

---

## D. Tests

### D1. Store Settings Integration Tests
- **File:** `apps/backend/tests/phase5-settings.test.ts`
- GET /settings returns current settings
- PUT /settings updates fields (admin only)
- Employee cannot update settings (403)
- Unauthenticated requests rejected (401)

### D2. Dashboard Integration Tests
- **File:** `apps/backend/tests/phase5-dashboard.test.ts`
- Admin dashboard returns full stats shape
- Employee dashboard returns own stats shape
- Stats values are numeric and reasonable
- Unauthenticated requests rejected (401)
- Employee cannot access admin dashboard (403)

---

## E. Critical Compliance Checklist

- [ ] GET /settings and PUT /settings match API Contract §12.1 / §12.2
- [ ] StoreSettings DTO matches API Contract §14.8
- [ ] Admin dashboard shape matches API Contract §13.1 exactly
- [ ] Employee dashboard shape matches API Contract §13.2 exactly
- [ ] Aggregation pipelines use indexes on `createdAt` and `employeeId`
- [ ] Redis caching is optional, graceful fallback to direct computation
- [ ] All responses use `{ success, data, error, meta }` envelope
- [ ] `npm run test`, `npm run typecheck`, `npm run build` pass
