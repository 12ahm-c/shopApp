Here is the frontend-plan.md file for ShopManager, designed to align with the provided API-Contract.md and architecture.md, while reusing the structure of the previous frontend-plan 2.md as a template.

---

ShopManager Frontend Team Plan

1. Purpose

This document defines the frontend team's work for ShopManager, enabling parallel development with the backend while strictly adhering to the agreed contracts. It does not authorize new endpoints, DTO fields, Socket.IO events, business rules, dependencies, or environment variables.

Frontend source of truth:

· API shapes, events, errors: docs/API-Contract.md.
· System structure and modules: docs/architecture.md.
· Cross-team sequencing: docs/master-plan.md (if applicable).

2. Ownership

The frontend team owns:

· shopmanager-frontend/** (or the designated frontend project folder).
· Frontend-specific tests, UI components, and local state management.
· Integration with backend via the documented API client.

The frontend team must not modify backend, real-time, or worker internals unless explicitly assigned.

3. Current Runtime

Run from the project root:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173   (default Vite)
```

Backend REST base URL is:

```text
http://localhost:3001/v1
```

Socket.IO URL (when enabled):

```text
ws://localhost:3001
```

4. Frontend Rules

· Use the central API client shell; do not scatter raw fetch logic.
· Every async screen must handle loading, error, empty, and success states.
· Mobile behavior (responsive design) is required for each visible feature.
· Frontend mocks must match the API contract exactly and be clearly labeled as mocks.
· Do not invent DTO fields to simplify UI logic.
· Do not expose secrets in VITE_* (or NEXT_PUBLIC_*) variables.
· Do not import backend code.
· Do not implement hidden business rules in the UI; the backend remains authoritative.

UI Component and Icon Rules

· Prefer shadcn/ui-style components for reusable primitives (after approval).
· Use lucide-react as the default icon library.
· Use react-icons only for brand/platform icons missing in lucide-react.
· Do not run UI generators or add dependencies without explicit approval.
· Keep shared components accessible: semantic HTML, keyboard support, focus states, labels, sufficient contrast.
· Keep UI primitives presentation-focused; do not embed API or business logic.

5. Mock Data and Backend Swap Rule

Before backend endpoints are ready, the frontend may use mocks, provided they match docs/API-Contract.md exactly.

Mock rules:

· Mock responses must use the standard envelope: { success, data, error, meta }.
· Mock success data must match the documented endpoint response shape exactly.
· Mock errors must use documented error.code, error.message, and error.fields.
· Mock IDs must be 24-hex ObjectId strings.
· Mock timestamps must be ISO 8601 UTC strings.
· Mock amounts must be integers (MRU, no decimals).
· Mock phone numbers must be E.164 format (+222...).
· All list endpoints use offset pagination: page, limit, total.
· Mock Socket.IO events must use only names and payloads defined in the API contract.
· Mock files must be clearly named or documented as mocks.

Backend swap rule:

· UI code must call an adapter/API-client layer – never hardcode mock imports inside components.
· Replacing mocks with real backend calls should require changing only the data source (e.g., switching from a mock service to the API client), not rewriting screens.
· If a needed field is missing from the API contract, stop and request contract approval.

6. Phase-by-Phase Frontend Work

Phase 1 — Identity & Store Setup

Deliverables:

· Login screen (/login).
· Authenticated layout with role-based redirection (Admin → Dashboard, Employee → POS).
· Profile view (/profile) with name/password update.
· Store settings page (/settings) – Admin only (store name, address, phone, logo, theme, language).
· First-time admin seed handling (if applicable – backend responsibility, but frontend shows a setup indicator).

Parallel work allowed:

· Build static screens with contract-matching mocks.
· Wire real API only after backend endpoints are ready.

Do not:

· Store tokens in localStorage (use httpOnly cookies or memory + refresh).
· Hardcode role assumptions beyond token claims.
· Invent auth fields beyond the contract.

---

Phase 2 — Product Catalog

Deliverables:

· Product list page with search, category filter, and low-stock filter (/products).
· Product detail page (/products/:id).
· Product creation/editing forms – Admin only.
· Category management (as part of product form, not a standalone module in MVP).

Parallel work allowed:

· UI shell and mocks from documented Product DTO.
· Search and filter UI with mock data.

Do not:

· Implement product deletion logic that bypasses backend checks (sales reference).
· Allow employees to edit/delete products.

---

Phase 3 — POS (Point of Sale)

Deliverables:

· POS screen (/pos) – accessible by Admin and Employee.
· Product autocomplete search (by name).
· Cart management: add/remove items, modify quantity, temporary price override.
· Real-time stock validation before checkout.
· Customer selection (existing or quick add with name/phone).
· Payment method selection (cash, card, bankily).
· Invoice generation and display after sale.

Parallel work allowed:

· Full POS UI with mock cart and mock stock checks.
· Invoice preview mock.

Do not:

· Finalize sale without stock decrement simulation matching the contract.
· Store temporary price changes in the product master.
· Implement idempotency keys unless required by the backend.

---

Phase 4 — Money, Customers & Debt

Deliverables:

· Customer list page (/customers) – Admin only.
· Customer detail page with transaction history and debt adjustment form.
· Supplier list and detail pages (/suppliers) – Admin only, with debt adjustment form (same as customers).
· Invoice history page (/invoices) – Employees see only their own, Admin sees all.
· Invoice detail page (same as sale detail).
· Admin dashboard (/admin) with key metrics: today's sales, low stock count, outstanding debt, etc.
· Employee dashboard (/employee) with personal sales stats.

Parallel work allowed:

· Mocked customer/supplier lists and debt adjustment UI.
· Mocked dashboard charts and stats.

Do not:

· Calculate total debt or any money amount on the frontend – display only backend-provided values.
· Allow debt decrease below zero without backend error handling.
· Implement invoice deletion (Admin only) without confirming stock restoration.

---

Phase 5 — Realtime & Notifications

Deliverables:

· Notification center (/notifications) with list, unread count, and mark-as-read.
· Real-time in-app notifications via Socket.IO for:
  · Low stock alerts.
  · Daily summary.
  · Invoice deleted.
  · Debt updated (Admin only).
· Web push notifications (FCM) – optional for MVP, but socket layer must be ready.

Parallel work allowed:

· Mock notification list and UI.
· Socket.IO client integration with mocked server events.

Do not:

· Implement any notification triggering logic on the frontend.
· Assume push notifications are available without device token registration.

---

Phase 6 — Employees & Activity Logs

Deliverables:

· Employee list page (/employees) – Admin only.
· Employee creation/editing form (name, phone, salary, password).
· Attendance marking UI (date picker + present/absent toggle).
· Activity log page (/activity-logs) – Admin sees all, Employee sees own.
· Filterable logs by action type, date range, and user (Admin only).

Parallel work allowed:

· Mock employee list and attendance grid.
· Mock activity log entries.

Do not:

· Expose other employees' salary/attendance to an employee.
· Allow an employee to edit their own salary or role.

---

Phase 7 — Production Hardening

Deliverables:

· Accessibility pass (keyboard navigation, screen reader labels, focus management).
· Responsive/mobile pass (especially POS and dashboard).
· Performance pass: lazy loading routes, optimizing re-renders.
· Empty/error/loading state consistency across all pages.
· Production build verification (npm run build).
· Environment variable audit (no secrets exposed).

7. Frontend Definition of Done

· Uses documented API/event contracts only.
· Mock data, if used, matches docs/API-Contract.md exactly and is swappable via the API client layer.
· Handles loading, error, empty, and success states.
· Mobile layout reviewed.
· No backend imports.
· No secret exposure.
· npm run lint, npm run typecheck, and npm run build pass (when applicable).

---

This frontend plan is a living document. Update it only when the API contract or architecture changes, and always keep it in sync with the backend team.