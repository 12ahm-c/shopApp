```markdown
# Infrastructure Plan – ShopManager

## 1. Purpose

This document defines the infrastructure governance for ShopManager, covering runtime responsibilities, local development topology, database and caching services, real‑time communication, background jobs, environments, CI/CD, monitoring, secrets, and networking.

**Principle:** Direct Node/npm execution during development. Containers (Docker, Compose, Makefile) are **not** part of the active local plan. Reintroducing container orchestration requires explicit approval and updates to this document, `master-plan.md`, and `AGENTS.md` in the same change.

---

## 2. Runtime Responsibilities

ShopManager separates responsibilities to keep the system stateless, scalable, and maintainable.

| Runtime | Responsibility | Local command |
|---------|----------------|----------------|
| `frontend` | React + Vite SPA, served on `:5173` (dev) or built static files | `npm run dev:frontend` |
| `backend`  | Express REST API + cron jobs (daily summary, low stock, cleanup) on `:3001` | `npm run dev:backend` |
| `realtime` | Socket.IO server for live notifications on `:3002` | `npm run dev:realtime` |
| `mongodb`  | MongoDB Atlas (or local service) – external | `mongod` (local) |
| `redis`    | Redis for cache, rate limiting, JWT deny‑list – external | `redis-server` (local) |

**Root local startup (all core services):**
```bash
npm run dev
```

This starts frontend + backend by default. realtime is started separately when required.

Rules:

· All runtimes are stateless – no uploads, sessions, or durable app state stored on local filesystems.
· Backend API and workers must remain isolated (different processes).
· Local MongoDB and Redis are external services reached via localhost.

---

3. Local Runtime Topology

```text
Browser -> frontend http://localhost:5173
Browser / frontend -> backend REST http://localhost:3001/v1
Browser -> realtime ws://localhost:3002
backend -> MongoDB :27017, Redis :6379, Firebase FCM
realtime -> Redis :6379, shared auth state (JWT verified)
```

· All internal communication uses localhost with distinct ports.
· Production URLs use HTTPS/WSS and managed domain names.

---

4. Redis Strategy

Redis is required in production and strongly recommended for staging. For MVP it is optional (fallback to in‑memory or no cache), but enabling it improves performance and notification reliability.

Redis responsibilities:

· Cache – search results (products:search:*), dashboard aggregates (dashboard:admin, dashboard:employee:*) with 5–10 minute TTL.
· Rate limiting – store request counters per endpoint/user/IP.
· JWT deny‑list – store jti of revoked tokens until expiry.
· Socket.IO adapter – for horizontal scaling (multiple realtime instances).

---

5. Socket.IO Deployment

· Runs as a separate process (realtime runtime) on port 3002.
· Handshake authenticated using the same JWT access token as the REST API.
· Room membership (user:{userId}, admin) managed server‑side.
· Events and payloads follow the API contract (see docs/API-Contract.md §14 Appendix A, §15 Appendix B).
· In production with multiple instances: Redis adapter is mandatory.
· Local development: single instance, no Redis adapter required.

---

6. MongoDB Strategy

Environment Database Notes
Local MongoDB Community (mongod) or Atlas free tier Use MONGODB_URI=mongodb://localhost:27017/shopmanager
Staging MongoDB Atlas M2 (or shared) Isolated from production data
Production MongoDB Atlas M10+ (or dedicated) Replica set required for transactions & high availability

Financial integrity:

· Multi‑document writes (e.g., sale: decrement stock + create invoice + log activity) must use MongoDB transactions.
· Indexes: plan changes in pull requests; include rollback notes.

Production launch prerequisites:

· Automated backup policy (Atlas cloud backup or custom mongodump).
· Restore test documented and executed.
· RPO ≤ 24h, RTO ≤ 4h.
· Database access controlled via IP whitelist / VPC peering.

---

7. Environments

Environment Purpose Rules
Local Developer and AI reproducibility npm run dev, .env.local, local MongoDB/Redis, sandbox Firebase credentials.
Staging Production‑like validation Managed services (Atlas, Upstash, Firebase), isolated data, production‑shaped secrets, real‑time push enabled but sandbox FCM.
Production Live store operation Managed secrets, full HTTPS/WSS, monitoring, backup/restore, rollback plan.

· Never commit .env files. Provide .env.example with safe placeholders only.
· .env.local is git‑ignored for local overrides.

---

8. CI/CD

CI may be added only after explicit approval.
Recommended pipeline stages (when approved):

1. Lint (npm run lint)
2. Typecheck (npm run typecheck)
3. Unit / integration tests (npm run test)
4. Build (npm run build)
5. Security‑sensitive checks (e.g., no secrets in env example, dependency audit)

Deployment jobs:

· Must be separate from validation jobs.
· Production deployment requires manual approval until confidence is established.
· Staging can be automatic on main branch updates.

---

9. Monitoring & Logging

Logging:

· Structured JSON logs to stdout/stderr for backend, realtime, worker.
· Log levels: error, warn, info, debug (debug only in local/staging).
· Never log: passwords, OTPs, JWTs, refresh tokens, Firebase secrets, full database URIs, environment files.

Metrics to monitor (production):

· API latency (p95, p99) and error rate (per endpoint).
· Socket.IO connection failures and event processing latency.
· Low‑stock alert generation frequency.
· Daily summary job success/failure.
· Firebase FCM error rate (e.g., invalid tokens, rate limits).
· MongoDB performance (slow queries, connections, replication lag).

Alerts required before production:

· API error rate > 5% for 5 minutes.
· Socket.IO handshake failure rate > 10%.
· MongoDB replica set no primary.
· Daily summary not completed by 01:00.
· Backup failure.

---

10. npm Workflow

Root package.json scripts (workspace‑aware, using npm workspaces or separate folders):

```bash
npm install               # install all dependencies
npm run dev               # start frontend + backend concurrently
npm run dev:frontend      # start Vite dev server on :5173
npm run dev:backend       # start Express + cron jobs on :3001
npm run dev:realtime      # start Socket.IO server on :3002
npm run lint              # ESLint across all packages
npm run typecheck         # TypeScript type checking
npm run test              # run Jest / Vitest tests
npm run build             # build frontend (static) + backend (commonjs)
```

Rules:

· Keep root commands documented in README.md.
· Do not change command semantics silently.
· Do not add new scripts, dependencies, package managers, or process managers without approval.

---

11. Secrets Management

· Local: .env.local (ignored) plus sandbox credentials.
· Staging / Production: Use platform secret manager (e.g., GitHub Secrets, Render Environment Variables, Railway variables).
· Frontend public env: Only VITE_* variables that are safe to expose in the browser. Never put private keys or service account credentials there.
· Rotation: Rotate any secret after suspected exposure. Automatic rotation preferred.
· Zero‑trust: Never paste secrets into AI prompts, PR descriptions, logs, or screenshots.

Required secrets (example):

```
MONGODB_URI
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
FIREBASE_SERVICE_ACCOUNT_JSON  # entire JSON as single env var
FIREBASE_FCM_API_KEY
```

---

12. Networking Rules

Local development URLs (fixed):

```text
MongoDB:      mongodb://localhost:27017/shopmanager
Redis:        redis://localhost:6379
Frontend:     http://localhost:5173
Backend API:  http://localhost:3001/v1
Socket.IO:    ws://localhost:3002
```

Production URLs:

· Frontend: https://shopmanager.example.com (static CDN)
· Backend API: https://api.shopmanager.example.com/v1
· Socket.IO: wss://realtime.shopmanager.example.com

Rules:

· Never hardcode IPs or private provider URLs in code.
· All external connections must use environment variables.
· Staging must use a separate domain or subdomain (e.g., staging-api.shopmanager.example).

---

13. Infrastructure PR Rules

· Infrastructure changes (ports, services, env variables, networking) must be small and modular.
· Each change must document:
  · What is changing (e.g., adding Redis as mandatory).
  · Impact on local development, staging, production.
  · Rollback plan if deployment fails.
· Infrastructure changes require review and, if secrets or deployment are touched, a security review.
· No infrastructure change may break local developer workflow without prior communication and an updated README.md.

---

14. Deployment Strategy (MVP to Scale)

Phase Architecture Capacity
MVP Monolith Node.js backend + separate realtime, MongoDB Atlas M0, optional Redis Upstash, frontend on Netlify/Vercel ~1,000 daily active users
V1 Production 2 backend instances + load balancer (Nginx), realtime cluster with Redis adapter, MongoDB M10, Redis mandatory ~10,000 daily active users
V2 Scale Microservices (auth, sales, stock, notifs), Redis Cluster, MongoDB sharding 100,000+ daily active users

Deployment platforms (recommended):

· Frontend: Netlify / Vercel / AWS S3+CloudFront
· Backend & realtime: Render / Railway / AWS ECS (Fargate)
· MongoDB: MongoDB Atlas
· Redis: Redis Cloud / Upstash / AWS MemoryDB
· Firebase FCM: Google Firebase

Environment promotion:

· Local → Staging → Production
· Each promotion runs the full CI pipeline and any database migrations.

---

15. Production Readiness Checklist

Before production launch, verify:

· All environment‑specific configuration externalised.
· HTTPS/WSS enforced (backend, realtime, frontend).
· Rate limiting configured for all public endpoints.
· JWT refresh token rotation implemented.
· MongoDB indexes created for all query patterns.
· Daily backup verified and restore tested.
· Monitoring and alerting active (API, queue, DB, realtime).
· Secrets rotated since last engineer departure.
· Load testing performed for expected peak (2x daily transaction volume).
· Runbook for common failures (DB failover, Redis outage, FCM quota exhaustion).

---

This document is part of the ShopManager technical governance and must be kept in sync with architecture.md and master-plan.md.

```
```