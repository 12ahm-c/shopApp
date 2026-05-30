# Phase 6 — Cron Jobs & Production Hardening — Tasks

## A. Cron Jobs

### A1. dailySummary.job.ts
- **File:** `apps/backend/src/jobs/dailySummary.job.ts`
- Scheduled at: `00:00` daily (`0 0 * * *`)
- Aggregates yesterday's stats: total sales amount, order count
- Creates one `daily_summary` notification for each admin user
- **Idempotent:** Only runs once per day

### A2. lowStockAlert.job.ts
- **File:** `apps/backend/src/jobs/lowStockAlert.job.ts`
- Scheduled at: hourly (`0 * * * *`)
- Queries all products where `quantity <= alertThreshold`
- For each low-stock product, creates a `low_stock` notification for all admin users
- **Idempotent:** Skip products that already have a recent `low_stock` notification created in the last hour

### A3. cleanup.job.ts
- **File:** `apps/backend/src/jobs/cleanup.job.ts`
- Scheduled at: `02:00` daily (`0 2 * * *`)
- Deletes activity logs where `timestamp < 6 months ago`
- Deletes read notifications older than 3 months
- **Idempotent:** Safe to run multiple times (deletes by date range)

### A4. Job Scheduler
- **File:** `apps/backend/src/jobs/scheduler.ts`
- Imports and starts all cron jobs
- Called once during server bootstrap in `server.ts`
- Each job wraps its handler in try/catch and logs errors (never crash the process)

---

## B. Structured Logging — Pino

### B1. Install Pino
- Run: `npm install pino`

### B2. Replace Console Logger
- **Modify:** `apps/backend/src/utils/logger.ts`
- Replace the current `console.log`-based logger with Pino
- Keep the same API signature: `log(level, message, meta)`
- Configure:
  - Development: `pino-pretty` (human-readable)
  - Production: JSON output to stdout
- Redact sensitive fields: `password`, `token`, `refreshToken`, `accessToken`, `authorization`

### B3. Add Request ID Middleware
- **Create:** `apps/backend/src/middlewares/requestId.middleware.ts`
- Generate UUID per request using `crypto.randomUUID()`, attach to `req` and response header (`X-Request-Id`)
- Include `requestId` in every log call within the request lifecycle

### B4. Wire Request ID Middleware
- **Modify:** `apps/backend/src/app.ts`
- Add request ID middleware as the first middleware (before `cors`)

---

## C. Integration Tests for Critical Flows

### C1. Login Flow Test
- **File:** `apps/backend/tests/phase6-critical.test.ts`
- Successful login returns user + tokens
- Wrong phone returns 401 AUTH_REQUIRED
- Wrong password returns 401 AUTH_REQUIRED

### C2. Sale Creation + Stock Decrement Test
- Sale creation decrements product quantity correctly
- INSUFFICIENT_STOCK error when quantity exceeds available
- Stock is restored on sale cancellation

### C3. Debt Update Test
- Customer debt increase/decrease works
- Decrease > current debt returns VALIDATION_ERROR

### C4. Notification Trigger Tests
- Low stock notification created after sale that depletes stock
- Debt update notification created for admin

---

## D. Production Readiness

### D1. Environment Variables Audit
- **File:** `apps/backend/.env.example` (update if needed)
- Verify all required vars are documented: `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Add placeholders for optional vars: `REDIS_URL`

### D2. MongoDB Indexes Verification
- Verify all collections have proper indexes

### D3. Staging/Production Readiness Checklist
- **Create:** `docs/deploy-checklist.md`
  - All required env vars set on staging and production
  - MongoDB Atlas indexes created
  - First admin user seeded
  - JWT secrets rotated
  - CORS origin configured for frontend domain
  - Health check endpoint responds at `/health`
  - Socket.IO configured with correct CORS
  - Structured logging to stdout (no files)
  - `NODE_ENV=production` disables debug endpoints

---

## E. App Wiring

### E1. Wire Scheduler
- **Modify:** `apps/backend/src/server.ts`
- Import and call `startScheduler()` after `setupSocket()`

### E2. Wire Request ID Middleware
- **Modify:** `apps/backend/src/app.ts`
- Add `app.use(requestIdMiddleware);` before other middleware

---

## F. Critical Compliance Checklist

- [ ] Cron jobs never crash the process (try/catch around each handler)
- [ ] Notifications are idempotent (never duplicated per trigger)
- [ ] Daily summary runs once per day
- [ ] Low stock alert runs hourly, deduplicates recent notifications
- [ ] Cleanup deletes only old logs (6 months) and old notifications (3 months)
- [ ] Pino JSON logs to stdout, no file storage
- [ ] Request IDs on every log entry
- [ ] Sensitive fields are redacted in logs
- [ ] Integration tests cover: login, sale+stock, debt, notifications
- [ ] `.env.example` documents all required and optional vars
- [ ] `npm run test`, `npm run typecheck`, `npm run build` pass
