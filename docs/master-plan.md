Here is the master-plan.md for ShopManager, orchestrating backend and frontend work across MVP phases, ensuring incremental delivery, contract safety, and parallel development.

```markdown
# ShopManager – Master Development Plan

**Version:** 1.0 – MVP + Foundation for V2  
**Last Updated:** June 2025  
**Source of truth:** This document coordinates backend-plan.md, frontend-plan.md, API-Contract.md, and architecture.md.

---

## 1. Guiding Principles

- **Contract-first:** No code drifts from API contract. Mocks match real endpoints exactly.
- **Incremental & safe:** Each phase produces working, testable features. No big‑bang integration.
- **Parallel development:** Backend builds endpoints; frontend builds against contract‑matching mocks. Integration happens per phase.
- **Backend owns business rules, data, security.** Frontend owns UI, state, and real‑time integration.
- **Handshake required:** Before marking a phase complete, both teams verify contract compatibility and run a minimal integration test.

---

## 2. Suggested Timeline (MVP)

| Phase | Focus | Backend days | Frontend days | Integration |
|-------|-------|--------------|---------------|--------------|
| 1 | Identity & Store | 5 | 4 | 1 |
| 2 | Products & Customers | 4 | 4 | 1 |
| 3 | POS (Sales) | 5 | 5 | 1 |
| 4 | Debt, Dashboards, Invoices | 4 | 4 | 1 |
| 5 | Notifications & Activity Logs | 4 | 3 | 1 |
| 6 | Cron Jobs & Production Hardening | 3 | 2 | 1 |
| **Total** | **MVP** | **25 days** | **22 days** | **6 days** |

> *Timeline assumes 2 backend + 2 frontend developers. Adjust based on team size.*

---

## 3. Phase Details

### Phase 1 – Identity & Store Setup

**Goal:** Working authentication, role‑based layout, store settings, and employee creation (admin only).

#### Backend Tasks (from backend-plan Phase 1)
- User model (users collection) with phone, role, salary, attendance.
- Auth endpoints: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
- JWT with refresh token rotation (24h / 7d).
- Auth middleware & RBAC (admin / employee).
- Profile update: `PUT /users/me`.
- Employee management foundations: `POST /employees`, `GET /employees`, `GET /employees/:id`, `PUT /employees/:id`.
- Attendance marking: `PUT /employees/:id/attendance`.
- Seed first admin on installation (no API creation).

#### Frontend Tasks (from frontend-plan Phase 1)
- Login screen (`/login`).
- Authenticated layout with role‑based redirect (Admin → Dashboard, Employee → POS).
- Profile view (`/profile`) with name/password update.
- Store settings page (`/settings`) – Admin only.
- First‑time admin setup indicator (if needed).

#### Handshake Checkpoint
- [x] `POST /auth/login` returns correct user DTO + tokens.
- [x] `GET /auth/me` returns authenticated user.
- [x] Admin can create an employee via `POST /employees`.
- [x] Frontend profile update calls `PUT /users/me` with matching contract.
- [x] Role‑based redirects work with real tokens.

---

### Phase 2 – Product Catalog & Customer Base

**Goal:** Full CRUD for products, customers, and suppliers. Search, filtering, and low‑stock flag.

#### Backend Tasks (from backend-plan Phase 2)
- Product CRUD: `POST /products`, `GET /products`, `GET /products/:id`, `PUT /products/:id`, `DELETE /products/:id`.
- Category filtering, low‑stock flag, search by name.
- Customer CRUD: `POST /customers`, `GET /customers`, `GET /customers/:id`, `PUT /customers/:id/debt`, `DELETE /customers/:id`.
- Supplier CRUD: `POST /suppliers`, `GET /suppliers`, `GET /suppliers/:id`, `PUT /suppliers/:id`, `PUT /suppliers/:id/debt`, `DELETE /suppliers/:id`.

#### Frontend Tasks (from frontend-plan Phase 2 & part of Phase 4)
- Product list page with search, category filter, low‑stock filter (`/products`).
- Product detail page (`/products/:id`).
- Product creation/editing forms – Admin only.
- Customer list page (`/customers`) – Admin only.
- Customer detail page with transaction history and debt adjustment form.
- Supplier list & detail pages (`/suppliers`) – Admin only.

#### Handshake Checkpoint
- [x] Product deletion fails with `INVALID_STATE` if product has sales.
- [x] Customer deletion fails if customer has sales.
- [x] Phone numbers are unique per customer.
- [x] Frontend displays low‑stock flag exactly as returned by backend.
- [x] Debt adjustment on `PUT /customers/:id/debt` updates totalDebt and shows transaction in UI.

---

### Phase 3 – Point of Sale (Sales & Invoices)

**Goal:** Working POS with cart, stock checks, invoice generation, and sale cancellation (admin).

#### Backend Tasks (from backend-plan Phase 3)
- Sale creation: `POST /sales` – atomic stock decrement, invoice number generation, activity logging.
- Sale listing: `GET /sales` with filters (date, employee, customer). Admin sees all, employee sees own.
- Invoice details: `GET /invoices/:id`.
- Print‑ready data: `GET /invoices/print/:id`.
- Sale cancellation (admin only): `DELETE /sales/:id` with stock restoration.

#### Frontend Tasks (from frontend-plan Phase 3)
- POS screen (`/pos`) – accessible by Admin and Employee.
- Product autocomplete search (by name).
- Cart: add/remove items, modify quantity, temporary price override.
- Real‑time stock validation before checkout.
- Customer selection (existing or quick add with name/phone).
- Payment method selection (cash, card, bankily).
- Invoice generation and display after sale.

#### Handshake Checkpoint
- [x] `POST /sales` returns `INSUFFICIENT_STOCK` when quantity exceeds available stock.
- [x] `DELETE /sales/:id` (admin) restores stock and returns updated quantities.
- [x] Invoice numbers are sequential across all sales.
- [x] Frontend POS uses unitPrice override without modifying product master.
- [x] Employee sees only their own sales in `GET /sales`.

---

### Phase 4 – Debt, Dashboards & Invoice History

**Goal:** Admin dashboard with KPIs, employee dashboard, invoice history, and debt management.

#### Backend Tasks (from backend-plan Phase 4 & Phase 5)
- Admin dashboard: `GET /dashboard/admin` – today’s sales, monthly totals, low stock count, outstanding debt, recent sales, recent activity.
- Employee dashboard: `GET /dashboard/employee` – own today’s sales, monthly sales, average ticket, recent sales, unread notifications count.
- Store settings: `GET /settings`, `PUT /settings` (admin only).
- Ensure dashboard aggregations use MongoDB pipelines + optional Redis cache.

#### Frontend Tasks (from frontend-plan Phase 4)
- Admin dashboard page (`/admin`) with charts and stats.
- Employee dashboard page (`/employee`) with personal stats.
- Invoice history page (`/invoices`) – employees see only their own, admin sees all.
- Invoice detail page (same as sale detail).
- Ensure debt adjustment UI uses `PUT /customers/:id/debt` and displays updated total.

#### Handshake Checkpoint
- [x] `GET /dashboard/admin` returns all required aggregated fields.
- [x] `GET /dashboard/employee` returns only employee‑specific data.
- [x] `GET /invoices/:id` works for own invoices (employee) and any invoice (admin).
- [x] Frontend dashboards refresh data on page load (no manual cache invalidation needed).

---

### Phase 5 – Notifications & Activity Logs

**Goal:** Real‑time in‑app notifications, activity logs, and Socket.IO integration.

#### Backend Tasks (from backend-plan Phase 4)
- Activity log listing: `GET /activity-logs` with filters (action, user, date range). Admin sees all, employee sees own.
- Notification endpoints: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
- In‑app notification generation for low stock, daily summary, debt updates, invoice deletion.
- Socket.IO server with rooms: `user:{userId}`, `admin`.
- Events: `notification:new`, `stock:alert`.

#### Frontend Tasks (from frontend-plan Phase 5 & Phase 6)
- Notification center (`/notifications`) with list, unread count, and mark‑as‑read.
- Real‑time in‑app notifications via Socket.IO for low stock, daily summary, invoice deleted, debt updated.
- Activity log page (`/activity-logs`) – Admin sees all, employee sees own.
- Filterable logs by action type, date range, and user (Admin only).

#### Handshake Checkpoint
- [x] `GET /activity-logs` respects role‑based visibility.
- [x] Socket.IO emits `notification:new` when a low stock alert is created.
- [x] `PATCH /notifications/read-all` marks all unread for the user.
- [x] Frontend receives real‑time notifications and updates unread count.
- [x] Activity log shows `sale`, `delete_invoice`, `login`, `logout` actions.

---

### Phase 6 – Cron Jobs & Production Hardening

**Goal:** Automated jobs, logging, security review, and staging readiness.

#### Backend Tasks (from backend-plan Phase 6)
- `dailySummary.job.ts` – daily summary notification to admin at 00:00.
- `lowStockAlert.job.ts` – hourly check for products with quantity <= alertThreshold.
- `cleanup.job.ts` – delete activity logs older than 6 months (02:00).
- Structured logging (Winston/Pino) with request IDs.
- Basic integration tests for critical flows (login, sale creation, stock decrement, debt update).
- Staging/production readiness checklist (env vars, MongoDB indexes, backup plan).

#### Frontend Tasks (from frontend-plan Phase 7)
- Accessibility pass (keyboard navigation, screen reader labels).
- Responsive/mobile pass (especially POS and dashboards).
- Performance pass: lazy loading routes, optimizing re-renders.
- Empty/error/loading state consistency across all pages.
- Production build verification (`npm run build`).
- Environment variable audit (no secrets exposed).

#### Handshake Checkpoint
- [x] Cron jobs run without duplication (idempotent).
- [x] Integration tests pass on CI (GitHub Actions or similar).
- [x] Frontend build has no type errors, lint warnings, or secrets.
- [x] Both teams sign off on staging deployment.

---

## 4. Parallel Development Strategy

| Phase | Backend starts | Frontend starts | Integration point |
|-------|----------------|----------------|-------------------|
| 1 | Day 1 | Day 2 (after contract review) | Day 6 |
| 2 | Day 7 | Day 8 | Day 12 |
| 3 | Day 13 | Day 14 | Day 19 |
| 4 | Day 20 | Day 21 | Day 25 |
| 5 | Day 26 | Day 27 | Day 31 |
| 6 | Day 32 | Day 33 | Day 36 |

**How frontend works before backend endpoints are ready:**
- Use mock files that match API-Contract.md exactly (same DTOs, pagination, error codes).
- Mock data lives in `src/mocks/` and is swapped via API client adapter.
- When backend endpoint is ready, change one line in the API client to point to real URL.

**How backend validates contract compatibility:**
- Run `npm run test:contract` (Postman/Newman or Jest + supertest) against local backend.
- Tests verify request/response shapes against API-Contract.md.

---

## 5. Definition of Done per Phase

- [ ] All planned endpoints for the phase are implemented and match API-Contract.md.
- [ ] All planned frontend screens for the phase are built and use mocks (or real endpoints).
- [ ] Handshake checkpoint tests pass (manual or automated).
- [ ] No lint or type errors in backend or frontend.
- [ ] Phase-specific business rules are covered by backend integration tests.
- [ ] Frontend responsive design is verified on at least one mobile and one desktop viewport.
- [ ] Phase is deployed to a shared staging environment and demoed to the team.

---

## 6. Risk Management & Rollback Plan

| Risk | Mitigation | Rollback |
|------|------------|----------|
| Breaking contract change | Weekly contract review; any deviation requires PR comment + approval | Revert PR; redeploy previous backend version |
| Backend endpoint delayed | Frontend continues with mocks; phase handshake delayed | No rollback – mocks keep frontend unblocked |
| Socket.IO real‑time fails | Fallback to polling (HTTP) for notifications | Disable Socket.IO, use REST + manual refresh |
| Database migration error | All migrations are idempotent; tested on staging first | Restore from backup + replay migration logs |
| Frontend production bug | Feature flags for each phase (e.g., `ENABLE_POS`) | Disable flag; deploy hotfix |

---

## 7. Communication & Meetings

- **Daily standup (15 min)** – sync on handshake progress, blockers, contract changes.
- **Phase handshake meeting (30 min)** – demo integration, verify checkpoints, sign off.
- **Contract change review (async)** – PR that modifies API-Contract.md requires backend + frontend approval.

---

## 8. Next Steps After MVP

- V2 planning (PDF printing, barcode scanner, push notifications, payroll automation).
- Performance tuning (Redis cache, CDN for assets).
- Horizontal scaling (load balancer, multiple backend instances).
- Mobile app (React Native / Flutter using same API contract).

---

**This master plan is a living document. Update it whenever the API contract or architecture changes significantly.**
```

This plan gives your teams a clear, phased roadmap with precise handshake points, parallel development rules, and a shared definition of done. It ensures that the backend never outruns the contract and the frontend never guesses API shapes.