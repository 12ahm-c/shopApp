Here is the ai-workflow.md for ShopManager, adapted from the previous project’s structure but tailored to ShopManager’s architecture, modules, and master plan. It enforces strict control, step‑by‑step execution, and hallucination prevention.

```markdown
# ShopManager – AI Workflow

## 1. Purpose

This is the AI operating manual for ShopManager. The workflow is intentionally simple, safe, and contract‑first:

```text
Orchestrator → Build → Review/Security → User approval / PR
```

There are no separate frontend/backend AI agents in the default workflow.

· Orchestrator reads docs, scopes the task, protects business rules and data integrity.
· Build Agent implements only the approved scoped work (backend, frontend, infra, or docs).
· Review/Security Agent performs read‑only checks before merge or handoff.

All work must respect the API contract, architecture decisions, and the phased master plan.

---

2. Agent Roles

Agent Responsibility
Orchestrator Reads master-plan.md, architecture.md, API-Contract.md. Determines phase, scope, allowed files, and whether work can proceed. Escalates risky or out‑of‑scope requests.
Build Agent Implements only the approved scoped work. May touch backend, frontend, infra, or docs. Must follow contract, architecture rules, and phase handshake conditions.
Review/Security Agent Read‑only review for scope drift, contract compliance, RBAC, debt/payment logic, stock integrity, employee permissions, notification rules, activity logging, and test coverage.

---

3. Orchestrator Workflow

1. Read master-plan.md, architecture.md, and the relevant section of API-Contract.md.
2. Identify the current phase (1–6) from the master plan.
3. Classify the task:
   auth | product | customer | supplier | sale | debt | dashboard | notification | activity_log | employee | settings | cron | infra
4. Check dependencies and blockers (e.g., phase handshake not completed).
5. Define exact scope, referencing specific endpoints, UI pages, or business rules.
6. List allowed files and forbidden files (e.g., no touching product.model.ts during a debt task).
7. Confirm whether API changes, schema changes, new dependencies, env vars, or cron jobs are allowed.
8. Assign the work to Build only when scope is safe and within the current phase.
9. Send risky work (debt logic, stock mutations, employee salary, RBAC changes) to Review/Security before final handoff.
10. Summarise changed files and verification steps required for the phase handshake.

---

4. Build Agent Rules

Build may work on backend, frontend, infra, or documentation, only inside the Orchestrator‑approved scope.

Must do:

· Read master-plan.md, architecture.md, API-Contract.md, and the phase’s handshake checklist.
· Restate the task scope and the current phase before editing.
· List planned files before code edits (e.g., src/modules/sale/sale.service.ts, src/pages/pos/Pos.tsx).
· Keep changes minimal and reviewable — one PR = one task or one module slice.
· Follow the API contract exactly (endpoints, DTOs, error codes, response envelopes).
· Follow architecture business rules exactly (e.g., debt updates require transaction history, stock decrement must be atomic).
· Use the central API client on frontend; never call backend directly with raw fetch.
· Keep backend business logic in services, not in controllers or routes.
· Add or update tests when the testing infrastructure exists (integration tests for critical flows).
· Stop immediately if another module or file outside scope is needed — escalate to Orchestrator.

Must not:

· Invent endpoints, DTO fields, query params, error codes, Socket.IO events, env vars, dependencies, scripts, database fields, or business rules.
· Change API contract, schema, RBAC rules, debt calculation logic, stock transaction safety, employee salary fields, or notification rules silently.
· Add tooling, dependencies, package files, CI steps, env files, scaffolding, or provider config without approval.
· Mix unrelated refactors, formatting changes, or features from different phases.
· Store uploads, sessions, secrets, or durable state on API/worker filesystems (use cloud storage or database only).
· Modify the product’s price field during a POS sale — only the temporary unitPrice in sale items may be overridden.

---

5. Review/Security Workflow

Review/Security is read‑only unless explicitly asked to fix.

Review must check:

· Scope drift – changes outside the Orchestrator‑approved files or phase.
· API contract compliance – request/response shapes match API-Contract.md.
· Standard response envelope – { success, data, error, meta }.
· Auth & RBAC – JWT expiration (24h / 7d refresh), role checks (admin vs employee), no leaked admin endpoints to employees.
· Debt & payment logic – idempotency for debt adjustments, transaction history integrity, totalDebt recalculated correctly.
· Stock & sales – atomic decrement on sale, restoration on cancellation, INSUFFICIENT_STOCK error when needed.
· Invoice numbering – sequential, no gaps, stored in a dedicated counter collection.
· Employee permissions – employees cannot create/update products, cannot see other employees’ sales, cannot modify debt.
· Activity logging – sale, delete_invoice, login, logout are logged; stock/pricing changes outside sales are not logged.
· Notifications – low stock, daily summary, debt update, invoice deletion trigger correct in‑app (and push if FCM enabled).
· Cron jobs – idempotent, no duplicate notifications, respect time windows.
· Test gaps – missing integration tests for critical flows (login → sale → stock decrement → invoice generation).

Output format:

1. Findings first, ordered by severity (high → medium → low), with file/line references when possible.
2. Open questions for unclear intent or missing contract details.
3. Residual risk summary (e.g., “employee could modify debt if frontend bypasses RBAC – backend should double‑check”).
4. Do not rewrite code unless separately requested.

---

6. Anti‑Hallucination Rules

Before using any endpoint, DTO field, error code, pagination rule, idempotency behaviour, or Socket.IO event:

1. Locate it in docs/API-Contract.md (or the shared contract document).
2. If it is missing, treat it as unavailable.
3. Ask for contract approval instead of inventing it.
4. Verify final changes do not contain undocumented fields or behaviours.

Before applying any business rule (debt calculation, stock threshold, employee salary, daily summary aggregation):

1. Locate it in docs/architecture.md or docs/master-plan.md.
2. If unclear (e.g., “how often is daily summary sent?” → check cron section in architecture), stop and ask.
3. Do not silently choose between conflicting rules — escalate to Orchestrator.

---

7. Critical Escalation Rules

Stop and escalate immediately when the task touches or changes:

· API contract or DTOs (any endpoint, request/response shape).
· Database schema, indexes, or validation rules.
· Auth/RBAC/JWT/session behaviour (including refresh token rotation).
· Debt adjustment logic or totalDebt calculation.
· Stock transaction safety (atomic decrement, restore on cancellation).
· Invoice numbering or invoice deletion rules.
· Employee salary fields or attendance logic.
· Real‑time Socket.IO rooms or events (notification:new, stock:alert).
· Activity log filtering or retention (cron cleanup).
· Cron job scheduling or idempotency.
· Environment variables, secrets, package files, dependencies, or scaffold.

---

8. PR and Task Size Rules

· One PR = one task or one module/feature slice from the master plan.
· Keep critical flows split (e.g., debt UI in one PR, debt backend in another, but they must handshake).
· Contract/schema changes must be isolated in their own PR and approved by both backend and frontend leads.
· No broad rewrites of existing modules unless explicitly requested.
· No formatting‑only churn mixed with logic changes.

---

9. Prompt Templates

Build Task

```md
Task: <name>
Phase: <1–6>
Type: <auth | product | customer | supplier | sale | debt | dashboard | notification | activity_log | employee | settings | cron | infra>
Read first:
- master-plan.md (current phase handshake)
- architecture.md (relevant module section)
- API-Contract.md (relevant endpoints)
- (if frontend) frontend-plan.md

Scope:
- <exact behaviour, endpoints, or UI components>

Allowed files:
- <paths>

Forbidden files:
- <paths>

Rules:
- No API/schema/env/dependency changes unless explicitly approved.
- Keep changes minimal.
- Stop if scope expands.

Acceptance criteria:
- <list, including handshake checkpoint items>

Before editing:
- Restate scope and phase.
- List planned files.
```

Review/Security Task

```md
Review this change as read-only.
Focus: scope, API contract, RBAC, debt logic, stock integrity, employee permissions, activity logs, notifications, test coverage.
Output: findings first by severity with file/line refs, then open questions, then residual risk summary.
```

---

10. Handshake Enforcement for Phases

The Orchestrator must not assign work from Phase N+1 until the handshake checkpoint for Phase N is verified and signed off (as defined in master-plan.md).
Build must not implement endpoints or UI for a future phase unless explicitly approved as “spike” or “prototype” with a clear rollback plan.

---

11. First‑Time Setup (MVP Installation)

For the initial deployment, the Orchestrator may approve a one‑time task to seed the first admin user.
This task must:

· Use a script that runs only once (check for existing users).
· Hash the password with bcrypt.
· Not expose the seed endpoint via the API.
· Be removed or disabled after successful seeding.

No other “auto‑creation” of users is allowed — all employees are created by an admin via POST /employees.

---

This AI workflow is the authoritative guide for any AI agent working on ShopManager. When in doubt, stop and ask the Orchestrator.

```

This document gives you strict, step‑by‑step control over AI contributions, prevents hallucinations by anchoring everything to the contract and architecture, and aligns with ShopManager’s phased delivery.
```