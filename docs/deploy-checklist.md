# ShopManager — Deploy Checklist

## Pre-Deploy

- [ ] **Environment Variables** — all set on staging/production:
  - `NODE_ENV=production`
  - `PORT` (default 3001)
  - `MONGODB_URI` → MongoDB Atlas connection string, database `shopAPP`
  - `JWT_SECRET` → unique random string (not the default)
  - `JWT_REFRESH_SECRET` → unique random string (not the default)
  - `REDIS_URL` (optional) → Redis Upstash or local
- [ ] **JWT secrets rotated** — never use `.env.example` defaults in production
- [ ] **CORS origin** configured in `app.ts` for the frontend domain

## Database

- [ ] **MongoDB Atlas** cluster running (M0 free tier sufficient for MVP)
- [ ] **MongoDB indexes** synced (run seed script on fresh DB, or call `syncIndexes()`)
- [ ] **First admin user seeded** — run `seedAtlas.ts` or `seedAll.ts` on first deploy
- [ ] **Automated backups** enabled in Atlas (daily snapshots)
- [ ] **Connection string** validated: must use `mongodb+srv://` protocol

## Build & Deploy

- [ ] `npm run build` passes (TypeScript compiles without errors)
- [ ] `npm run test` passes (all integration tests)
- [ ] Deploy backend to Railway / Render / similar platform
- [ ] Deploy frontend to Vercel / Netlify / similar platform
- [ ] Health check: `GET /health` returns `{ success: true, data: { status: "ok" } }`

## Runtime

- [ ] **Socket.IO** configured with correct CORS origin
- [ ] **Cron jobs** running (daily summary 00:00, low stock hourly, cleanup 02:00)
- [ ] **Structured logging** to stdout (Pino JSON output — no log files)
- [ ] **Request IDs** present on every response header (`X-Request-Id`)
- [ ] **Redis** configured if caching is desired (optional, graceful fallback)
- [ ] **`NODE_ENV=production`** disables all debug/staging endpoints

## Post-Deploy Verification

- [ ] Login with admin credentials works
- [ ] POS sale flow: create sale → stock decremented → invoice generated
- [ ] Activity logs recorded on login, sale, and invoice deletion
- [ ] Notifications visible in notification center
- [ ] Store settings readable and updatable
- [ ] Admin and employee dashboards load with correct data
- [ ] WebSocket connection established on frontend
- [ ] Unauthenticated requests return 401
- [ ] Employee role cannot access admin-only endpoints (403)
