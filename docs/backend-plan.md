ShopManager Backend Team Plan

1. Purpose

This document lets the backend team work in parallel with frontend while protecting API contracts, business rules, data integrity, and security. It does not override the API contract or architecture document.

Backend source of truth:

· Wire contracts: docs/API-Contract.md (39 REST endpoints).
· Business/data/security rules: docs/architecture.md.
· Cross-team sequencing and phase order: docs/master-plan.md (if exists, otherwise inferred from this document).

2. Ownership

Backend owns:

· backend/src/** (Node.js + Express monolith)
· backend/src/socket/** (Socket.IO server)
· backend/src/jobs/** (cron jobs)
· Backend tests (unit + integration)
· Shared TypeScript types in shared/types/** after coordination with frontend.

Backend must not edit frontend UI unless explicitly assigned.

3. Current Runtime

Run full stack from repository root:

```bash
npm run dev
```

Backend‑only runtime:

```bash
npm run dev:backend
```

Local dependencies:

```text
MongoDB: MongoDB Atlas via MONGODB_URI, database `shopAPP`
Redis (optional, for caching): redis://localhost:6379
```

4. Backend Rules

· Controllers stay thin: request parsing, service call, response formatting only.
· Business rules belong in services.
· Models own schema definitions, indexes, and atomic updates.
· All responses use { success, data, error, meta } unless the endpoint returns 204 No Content.
· Error codes must match Appendix B of API contract.
· Permissions come from central ROLE_PERMISSIONS evaluated at request time (admin vs employee).
· Never trust JWT payload alone for sensitive authorization when fresh DB state is required (e.g., role checks).
· Do not store uploads, secrets, or durable state on the API filesystem – use Cloudinary for logos and future assets.
· Do not invent endpoints, DTO fields, schema fields, env vars, dependencies, or business rules beyond the API contract and architecture document.

5. Contract Compatibility Rule

The backend team must implement the exact structure in docs/API-Contract.md so the frontend can replace contract‑shaped mocks with real API calls without rewriting screens.

Compatibility rules:

· Every implemented endpoint path, method, auth requirement, role requirement, request body, query param, response body, error code, and pagination shape must match the API contract.
· Every response must use { success, data, error, meta } unless contract documents 204 No Content.
· Error responses must use documented codes and the fields object for validation errors.
· ObjectId values are 24‑hex strings.
· Timestamps are ISO 8601 UTC strings.
· Amounts are integer MRU (no decimals).
· Phones are E.164 (+222...) – the server normalises local numbers.
· Pagination is offset‑based (page, limit, total) for all list endpoints (no cursor pagination in MVP).
· /dashboard/admin and /dashboard/employee return the exact aggregated shapes.
· Socket.IO events (notifications) follow the contract if explicitly defined; otherwise use notification:new and stock:alert.

Frontend handoff rule:

· When an endpoint is complete, provide the frontend team with: endpoint name, auth/role requirement, success shape example, supported error codes, and any test credentials or seed data.
· If backend behaviour cannot match the contract, stop and request contract clarification before continuing.

6. Phase‑by‑Phase Backend Work

Phase 1 — Identity & Accounts

Deliverables:

· User model (users collection) with indexes on phone, role.
· Authentication: /auth/login, /auth/refresh, /auth/logout, /auth/me.
· JWT generation: access token 24h, refresh token 7 days (stored in DB).
· Auth middleware and RBAC (admin / employee).
· Profile update endpoint: PUT /users/me.
· Employee management foundations: POST /employees, GET /employees, GET /employees/:id, PUT /employees/:id.
· Attendance marking: PUT /employees/:id/attendance.

Critical rules:

· Admin accounts cannot be created via API – the first admin is seeded during installation.
· Refresh token rotation: revoke old refresh token on logout and token refresh.
· Password change invalidates all refresh tokens for that user.

Review/Security required.

Phase 2 — Product Catalog & Customer Base

Deliverables:

· Product CRUD: POST /products, GET /products, GET /products/:id, PUT /products/:id, DELETE /products/:id.
· Category filtering, low‑stock flag, search.
· Customer CRUD: POST /customers, GET /customers, GET /customers/:id, PUT /customers/:id/debt, DELETE /customers/:id.
· Supplier CRUD: POST /suppliers, GET /suppliers, GET /suppliers/:id, PUT /suppliers/:id, PUT /suppliers/:id/debt, DELETE /suppliers/:id.

Critical rules:

· Deleting a product fails if product appears in any sale (INVALID_STATE).
· Deleting a customer fails if customer has any sales (INVALID_STATE).
· Customer and supplier debt transactions are stored in an array; totalDebt is denormalised and updated atomically.
· Phone numbers are unique per customer and supplier (if provided).
· Supplier debt operations follow the same logic as customer debt (increase / decrease, transaction history).

Phase 3 — Point of Sale (Sales & Invoices)

Deliverables:

· Sale creation: POST /sales with atomic stock decrement, invoice number generation, activity logging.
· Sale listing: GET /sales with filters (date range, employee, customer) – admin sees all, employee sees own.
· Invoice details: GET /invoices/:id.
· Print‑ready data: GET /invoices/print/:id (HTML + JSON).
· Sale cancellation (admin only): DELETE /sales/:id with stock restoration.

Critical rules:

· Stock check must be atomic: use MongoDB findOneAndUpdate with condition quantity >= requested before decrement.
· unitPrice in sale items can differ from product’s base price (temporary discount/markup) – never update the product’s price.
· Invoice numbers are auto‑incremented via a dedicated counters collection.
· Activity log entries are created for every sale and every cancellation.
· DELETE /sales/:id is idempotent and returns 409 INVALID_STATE if already cancelled.

Review/Security required.

Phase 4 — Activity Logs & Notifications

Deliverables:

· Activity log listing: GET /activity-logs with filters (action, user, date range). Admin sees all, employee sees own.
· Notification endpoints: GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all.
· In‑app notification generation for:
  · Low stock (triggered after sale or by hourly cron)
  · Daily summary (sent via cron)
  · Debt updates (when /customers/:id/debt is called)
  · Invoice deletion (when admin cancels a sale)
· Socket.IO server with rooms: user:{userId}, admin.
· Events: notification:new, stock:alert.

Critical rules:

· Push notifications (FCM) are excluded from MVP – only in‑app + Socket.IO real‑time.
· Low stock notifications: check every hour via cron, compare quantity <= alertThreshold.
· Daily summary cron runs at 00:00, sends one notification to admin with yesterday’s stats.
· Notifications are never sent more than once per trigger (idempotent cron).

Phase 5 — Dashboard & Store Settings

Deliverables:

· Admin dashboard: GET /dashboard/admin – aggregates today’s sales, monthly totals, low stock count, outstanding debt, recent sales, recent activity.
· Employee dashboard: GET /dashboard/employee – own today’s sales, monthly sales, average ticket, own recent sales, unread notifications count.
· Store settings: GET /settings, PUT /settings (admin only).
· Settings include: store name, address, phone, logo URL, currency, invoice footer, theme, language.

Critical rules:

· Dashboard aggregations must be efficient – use MongoDB aggregation pipelines with indexes on createdAt and userId.
· Cache dashboard results in Redis (optional) with 5‑minute TTL if Redis is available; otherwise compute directly.

Phase 6 — Cron Jobs & Production Hardening

Deliverables:

· dailySummary.job.ts: sends daily summary notification to admin at 00:00.
· lowStockAlert.job.ts: runs hourly, checks all products, creates notifications for any product where quantity <= alertThreshold.
· cleanup.job.ts: runs at 02:00, deletes activity logs older than 6 months.
· Structured logging (Winston or Pino) with request IDs.
· Basic integration tests for critical flows: login, sale creation, stock decrement, debt update.
· Staging/production readiness checklist (environment variables, MongoDB indexes, backup plan).

7. Backend Definition Of Done

· Endpoint exists in API contract before implementation.
· Implemented structure matches the contract so frontend mocks can be swapped without UI rewrites.
· Business rule exists in architecture document before implementation.
· Response envelope and error codes are compliant.
· Validation is centralised (Zod schemas) and tested.
· Services hold business logic; controllers are thin.
· Critical modules (auth, sales, debt, stock) have passed internal security review.
· npm run lint, npm run typecheck, focused tests, and npm run build pass.
· For each completed endpoint, frontend team receives a handoff note (endpoint name, auth, example response, known errors).

---

This document is the backend team’s working plan. Any deviation from API contract or architecture must be discussed and approved before code is written.
