# SaaS Deployment Strategy — Implementation Plan
## One Codebase, Many Independent Deployments

---

## Overview

This document describes the step-by-step plan to transform the current ShopManager project into a
multi-client SaaS deployment model. No business logic changes. No new frameworks. Just configuration
and deployment process changes.

**Core principle:** One GitHub repository → Many independent deployments, one per client.

---

## Current State

| Layer    | Stack              | Notes                                           |
|----------|--------------------|-------------------------------------------------|
| Frontend | React + Vite       | `apps/frontend/`, deployed on Vercel            |
| Backend  | Node + Express/TS  | `apps/backend/`, deployed on Render             |
| Database | MongoDB Atlas      | Single DB `shopAPP` hardcoded in `database.ts`  |

---

## What Needs to Change

### Problem 1 — Hardcoded Database Name

`apps/backend/src/config/database.ts` hardcodes two things that block multi-client deployments:

```ts
const REQUIRED_DATABASE = "shopAPP";                    // ← hardcoded
if (databaseName !== REQUIRED_DATABASE) { throw ... }   // ← validation rejects any other DB name
```

This validation must be relaxed so that each client deployment can point to its own database
(`db_client_a`, `db_client_b`, etc.) via environment variable.

### Problem 2 — Missing CLIENT_NAME in .env.example

The `.env.example` does not include `CLIENT_NAME` or `VITE_API_BASE_URL`. These are needed to
identify deployments and connect frontend to the correct backend per client.

### Problem 3 — Frontend has no API base URL variable

`apps/frontend/.env` only contains `VITE_USE_MOCK_API`. There is no `VITE_API_BASE_URL` variable,
so every Vercel project for a new client would point to the same backend by default.

---

## Step-by-Step Implementation Plan

---

### Step 1 — Relax the Database Name Validation in Backend

**File:** `apps/backend/src/config/database.ts`

**Change:** Remove the hardcoded `REQUIRED_DATABASE` constant and the name-equality check.
Instead, read the database name from the `MONGODB_URI` itself (it is already embedded in the
connection string path). Keep the Atlas-only (`mongodb+srv`) enforcement.

**Before:**
```ts
const REQUIRED_DATABASE = "shopAPP";

export const validateAtlasUri = (mongodbUri: string): void => {
  ...
  const databaseName = parsed.pathname.replace(/^\//, "");
  if (databaseName !== REQUIRED_DATABASE) {
    throw new Error(`MONGODB_URI must target the ${REQUIRED_DATABASE} Atlas database`);
  }
};

export const connectDatabase = async (): Promise<void> => {
  const mongodbUri = env.mongodbUri();
  validateAtlasUri(mongodbUri);
  await mongoose.connect(mongodbUri, { dbName: REQUIRED_DATABASE });
};
```

**After:**
```ts
export const validateAtlasUri = (mongodbUri: string): void => {
  let parsed: URL;
  try {
    parsed = new URL(mongodbUri);
  } catch {
    throw new Error("MONGODB_URI must be a valid MongoDB Atlas connection string");
  }
  if (parsed.protocol !== ATLAS_PROTOCOL) {
    throw new Error("MONGODB_URI must use MongoDB Atlas (mongodb+srv) only");
  }
  // Database name is provided by the URI path — no hardcoded name check
};

export const connectDatabase = async (): Promise<void> => {
  const mongodbUri = env.mongodbUri();
  validateAtlasUri(mongodbUri);
  // dbName is read from the URI path automatically by mongoose
  await mongoose.connect(mongodbUri);
};
```

> **Why:** Each client's Render service will have its own `MONGODB_URI` pointing to its own
> database (e.g., `db_client_a`). The old validation would throw an error for any name that is
> not `shopAPP`.

---

### Step 2 — Add CLIENT_NAME to Backend Environment Config

**File:** `apps/backend/src/config/env.ts`

Add `CLIENT_NAME` as an optional (non-throwing) env var. This is useful for logging and
identifying which deployment is running.

```ts
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  clientName: process.env.CLIENT_NAME ?? "default",   // ← add this line
  mongodbUri: () => getRequiredEnv("MONGODB_URI"),
  jwtSecret: () => getRequiredEnv("JWT_SECRET"),
  jwtRefreshSecret: () => getRequiredEnv("JWT_REFRESH_SECRET"),
};
```

---

### Step 3 — Update Backend .env.example

**File:** `apps/backend/.env.example`

Add the two new variables so any developer or deployment knows what to fill in.

```dotenv
NODE_ENV=development
PORT=3001

# --- Client Identity ---
CLIENT_NAME=client_a

# --- Database (one DB per client) ---
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/db_client_a

# --- Auth ---
JWT_SECRET=replace-with-local-access-secret
JWT_REFRESH_SECRET=replace-with-local-refresh-secret

# --- Optional Services ---
REDIS_URL=redis://localhost:6379
FIREBASE_SERVICE_ACCOUNT_JSON={}
FIREBASE_FCM_API_KEY=replace-with-sandbox-key
```

---

### Step 4 — Add VITE_API_BASE_URL to Frontend

**File:** `apps/frontend/.env` (local development default)

```dotenv
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3001
```

**File:** `apps/frontend/.env.example` *(create this file if it does not exist)*

```dotenv
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://api-<client>.onrender.com
```

Then, wherever the frontend initializes its API client (the Axios/fetch base URL config),
replace any hardcoded URL with:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
```

Locate the API client file (e.g., `apps/frontend/src/lib/api.ts` or similar) and apply this
substitution. Do **not** hardcode the URL.

---

### Step 5 — Verify .gitignore Excludes All .env Files

**File:** `apps/backend/.gitignore` and `apps/frontend/.gitignore`

Confirm these patterns are present:

```
.env
.env.local
.env.*.local
```

Only `.env.example` files should be committed to Git. Never commit actual secrets.

---

## Per-Client Deployment Workflow

Follow these steps every time you onboard a new client.

### A. MongoDB Atlas — Create Client Database

1. Open MongoDB Atlas → your cluster.
2. Go to **Collections** → **Add Database**.
3. Name it using the convention: `db_<client_name>` (e.g., `db_acme`, `db_school_b`).
4. Copy the full connection string, replacing the path with the new DB name:
   ```
   mongodb+srv://user:pass@cluster.mongodb.net/db_acme
   ```

---

### B. Render — Deploy Client Backend

1. Open [Render Dashboard](https://dashboard.render.com).
2. Click **New → Web Service**.
3. Connect to the **same GitHub repository**.
4. Set:
   - **Name:** `shopmanager-api-<client>` (e.g., `shopmanager-api-acme`)
   - **Root Directory:** `apps/backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/server.js`
5. Under **Environment Variables**, add:

   | Key                  | Value                                              |
   |----------------------|----------------------------------------------------|
   | `NODE_ENV`           | `production`                                       |
   | `PORT`               | `3001`                                             |
   | `CLIENT_NAME`        | `acme`                                             |
   | `MONGODB_URI`        | `mongodb+srv://user:pass@cluster.net/db_acme`      |
   | `JWT_SECRET`         | *(generate a unique secret per client)*            |
   | `JWT_REFRESH_SECRET` | *(generate a unique secret per client)*            |

6. Deploy. Note the service URL: `https://shopmanager-api-acme.onrender.com`

---

### C. Vercel — Deploy Client Frontend

1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New → Project**.
3. Import the **same GitHub repository**.
4. Set:
   - **Project Name:** `shopmanager-<client>` (e.g., `shopmanager-acme`)
   - **Root Directory:** `apps/frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:

   | Key                  | Value                                              |
   |----------------------|----------------------------------------------------|
   | `VITE_API_BASE_URL`  | `https://shopmanager-api-acme.onrender.com`        |
   | `VITE_USE_MOCK_API`  | `false`                                            |

6. Deploy. The client gets their URL: `https://shopmanager-acme.vercel.app`

---

## Result Per Client

| Item             | Example Value                                   |
|------------------|-------------------------------------------------|
| Frontend URL     | `https://shopmanager-acme.vercel.app`           |
| Backend URL      | `https://shopmanager-api-acme.onrender.com`     |
| Database         | `db_acme` on shared Atlas cluster               |
| Isolation        | Full — no data shared between clients           |
| Code changes     | None — only environment variables differ        |

---

## Important Constraints (from AGENTS.md)

- **Do not** change any API endpoint shape, response field, or error code.
- **Do not** add new environment variables beyond those listed here without escalating to `@tech-lead`.
- **Do not** create Dockerfiles or docker-compose files.
- **Do not** store any secret in Git. Use `.env.example` as the only committed env file.
- **Do not** hardcode any client name inside application logic.
- The `MONGODB_URI` change in `database.ts` is the only schema-adjacent change — it removes a
  hardcoded database name restriction but does **not** change any collection, index, or field.
  If this requires approval, escalate before applying Step 1.

---

## Files Changed Summary

| File                                          | Change Type | Description                                  |
|-----------------------------------------------|-------------|----------------------------------------------|
| `apps/backend/src/config/database.ts`         | Modify      | Remove hardcoded DB name check               |
| `apps/backend/src/config/env.ts`              | Modify      | Add `CLIENT_NAME` optional env var           |
| `apps/backend/.env.example`                   | Modify      | Add `CLIENT_NAME` and update `MONGODB_URI`   |
| `apps/frontend/.env`                          | Modify      | Add `VITE_API_BASE_URL` for local dev        |
| `apps/frontend/.env.example`                  | Create      | Document required frontend env vars          |
| `apps/frontend/src/lib/api.ts` *(or similar)* | Modify      | Use `VITE_API_BASE_URL` instead of hardcode  |

---

## No Changes Required To

- All route files, controllers, services, models, or middleware.
- MongoDB schemas, indexes, or relationships.
- Authentication flow or JWT logic.
- Business rules (stock, debt, notifications).
- The GitHub repository structure.

---

*This plan follows the "One Codebase — Many Independent Deployments" architecture.
All changes are purely configuration and environment-variable driven.*
