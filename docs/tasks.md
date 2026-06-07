# ShopManager Pro - Frontend Tasks

> Tracks frontend deliverables per phase from `docs/frontend-plan.md`.

---

## Phase 4 - Customers, Loyalty, Debts

- [ ] Customer search and detail
- [ ] Debt and credit limit display
- [ ] Loyalty points display
- [ ] Purchase history
- [ ] Debt payment form (modal)
- [ ] Admin overdue debts view

### API Integration
- [ ] Customer endpoints from API contract section 7

---

## Phase 5 - Suppliers, Wallets, Finance

- [ ] Supplier list/create/detail/debt/payment
- [ ] Wallet overview
- [ ] Wallet transaction history with cursor pagination
- [ ] Wallet transfer form
- [ ] Accountant reconciliation form
- [ ] Financial dashboard shell

### API Integration
- [ ] Supplier endpoints from API contract section 8
- [ ] Wallet endpoints from API contract section 9

---

## Phase 6 - Employees & Activity Logs

- [ ] Employee list page (`/employees`) - Admin only
- [ ] Employee create/edit form with name, phone, salary, and password fields
- [ ] Employee detail view with salary and attendance visible only to Admin
- [ ] Attendance marking UI with date picker and present/absent toggle
- [ ] Activity log page (`/activity-logs`) for Admin all-logs view and Employee own-logs view
- [ ] Activity log filters for action type and date range
- [ ] Admin-only activity log user filter
- [ ] Contract-matching mock employee list, attendance grid, and activity log entries
- [ ] Loading, error, empty, and success states for employee and activity log screens
- [ ] Responsive layouts for employee management, attendance, and log tables

### API Integration
- [ ] Employee endpoints from API contract section 9
- [ ] Activity log endpoint from API contract section 10
- [ ] Route guards prevent employees from viewing salary/attendance for other employees
- [ ] Route guards prevent employees from editing their own salary or role

---

## Phase 7 - Production Hardening

- [ ] Accessibility pass for keyboard navigation, screen reader labels, focus management, and contrast
- [ ] Responsive/mobile pass across all pages, with extra review for POS and dashboards
- [ ] Performance pass for lazy-loaded routes and unnecessary re-render reduction
- [ ] Consistent loading, error, empty, and success states across all async screens
- [ ] API client audit to confirm screens use the adapter layer instead of direct mock imports
- [ ] Mock data audit against `docs/API-Contract.md` envelopes, DTOs, errors, pagination, IDs, timestamps, amounts, and phone formats
- [ ] Environment variable audit to ensure no secrets are exposed through public frontend variables
- [ ] Backend import audit to confirm frontend code does not import backend internals
- [ ] Production build verification

### Verification
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
