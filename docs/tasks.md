# Phase 2 — Product Catalog & Customer Base

**Source:** backend-plan.md §Phase 2
**Endpoints:** API-Contract.md §§ 4, 7, 8
**Models:** architecture.md §§ 7.2 (products), 7.4 (customers), 7.5 (suppliers)

---

## Overview

Build three new modules following the same pattern as Phase 1:
- **Product** – admin CRUD + employee read/search
- **Customer** – admin CRUD + debt management
- **Supplier** – admin CRUD + debt management (mirrors customer)

All new files go under `apps/backend/src/modules/<name>/`.

---

## Task 1 — Product Model & Validation

**Files to create:**
- `apps/backend/src/modules/product/product.model.ts`
- `apps/backend/src/modules/product/product.validation.ts`

**Model (products collection):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | yes | unique, trim, min 2 max 100 |
| category | String | yes | trim, min 2 max 50 |
| price | Number | yes | int >= 0 |
| quantity | Number | yes | int >= 0 |
| alertThreshold | Number | no | int >= 0, default 5 |
| createdAt | Date | auto | timestamps: true |
| updatedAt | Date | auto | timestamps: true |

Indexes: `name` (unique), `name` (text for search), `category`.

**Validation schemas (Zod):**
- `createProductSchema` – name, category, price, quantity, alertThreshold (optional)
- `updateProductSchema` – all optional, at least one field required
- `productListQuerySchema` – page, limit, category (optional), lowStock (coerce boolean), search (optional)

Export inferred types as `CreateProductInput`, `UpdateProductInput`, `ProductListQuery`.

---

## Task 2 — Product Service

**File to create:** `apps/backend/src/modules/product/product.service.ts`

Implement `productService` object with:

| Method | Input | Returns |
|--------|-------|---------|
| `createProduct(input)` | CreateProductInput | Product DTO (201) |
| `getProducts(query)` | ProductListQuery | `{ data: ProductDTO[], meta }` |
| `getProductById(id)` | string | Product DTO |
| `updateProduct(id, input)` | string, UpdateProductInput | Product DTO |
| `deleteProduct(id)` | string | void (204) |

**Critical rules:**
- `deleteProduct` must check that the product does **not** appear in any sale. Use `Sale.countDocuments({ "items.productId": id })`. If count > 0, throw `AppError(409, "INVALID_STATE", ...)`. *(Sale model belongs to Phase 3 – check the collection name / model once it exists. For now you can check against the `sales` collection directly with mongoose.)*
- `getProducts` query: build a `filter` object. If `search` is provided, add `{ name: { $regex: query.search, $options: "i" } }`. If `category` is provided, add `{ category }`. If `lowStock === true`, add `{ $expr: { $lte: ["$quantity", "$alertThreshold"] } }`. Sort by `createdAt: -1`.
- `createProduct` must catch duplicate name (code 11000) → `AppError(409, "DUPLICATE", ...)`.

---

## Task 3 — Product Controller & Routes

**Files to create:**
- `apps/backend/src/modules/product/product.controller.ts`
- `apps/backend/src/modules/product/product.routes.ts`

**Controller** – thin layer following employee controller pattern:
- `create`, `list`, `getById`, `update`, `delete` handlers.

**Routes:**
```
POST   /v1/products     -> admin
GET    /v1/products     -> both   (query)
GET    /v1/products/:id -> both
PUT    /v1/products/:id -> admin
DELETE /v1/products/:id -> admin
```

Use `requireAuth`, `requireRole("admin")` where needed, `validate(...)` middleware.

Register routes in `apps/backend/src/app.ts`:
```ts
import { productRoutes } from "./modules/product/product.routes";
// ...
app.use("/v1/products", productRoutes);
```

---

## Task 4 — Customer Model & Validation

**Files to create:**
- `apps/backend/src/modules/customer/customer.model.ts`
- `apps/backend/src/modules/customer/customer.validation.ts`

**Model (customers collection):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | yes | trim, min 2 max 100 |
| phone | String | no | unique if provided, trim |
| totalDebt | Number | no | int, default 0 |
| transactions | [Transaction] | no | default [] |
| createdAt | Date | auto | timestamps: true |

**Transaction sub‑schema** (`{ _id: false }`):
- `date` (Date, required)
- `amount` (Number, required, int)
- `type` (String, enum: "increase" | "decrease", required)
- `note` (String, optional, max 200)
- `newTotalDebt` (Number, required, int)

Indexes: `phone` (sparse unique – only if phone is provided).

**Validation schemas:**
- `createCustomerSchema` – name (required), phone (optional with transform/normalize), initialDebt (optional, default 0)
- `debtSchema` – amount (required, int > 0), type (enum increase/decrease), note (optional max 200)
- `customerListQuerySchema` – page, limit, hasDebt (coerce boolean), search (optional)

---

## Task 5 — Customer Service

**File to create:** `apps/backend/src/modules/customer/customer.service.ts`

Implement `customerService` object with:

| Method | Input | Returns |
|--------|-------|---------|
| `createCustomer(input)` | CreateCustomerInput | Customer DTO (201) |
| `getCustomers(query)` | CustomerListQuery | `{ data: CustomerDTO[], meta }` |
| `getCustomerById(id)` | string | `{ customer, recentSales }` |
| `updateDebt(id, input)` | string, DebtInput | `{ customer, transaction }` |
| `deleteCustomer(id)` | string | void (204) |

**Critical rules:**
- `createCustomer`: if `initialDebt > 0`, prepend an "increase" transaction.
- `getCustomerById`: return customer DTO + `recentSales` (empty array for now – Phase 3 populates). `ensureObjectId` guard.
- `updateDebt`: atomically update `totalDebt` and push a transaction. Use `findOneAndUpdate` with `$inc` and `$push`. Validate that decrease does not exceed current debt (read current debt first or use a pipeline).
- `deleteCustomer`: check customer has no sales (`Sale.countDocuments({ customerId: id })`). Fail with `INVALID_STATE` if > 0.
- Duplicate phone → `AppError(409, "DUPLICATE", ...)`.

---

## Task 6 — Customer Controller & Routes

**Files to create:**
- `apps/backend/src/modules/customer/customer.controller.ts`
- `apps/backend/src/modules/customer/customer.routes.ts`

**Controller handlers:** `create`, `list`, `getById`, `updateDebt`, `delete`.

**Routes (all admin):**
```
POST   /v1/customers           -> admin
GET    /v1/customers           -> admin (query)
GET    /v1/customers/:id       -> admin
PUT    /v1/customers/:id/debt  -> admin
DELETE /v1/customers/:id       -> admin
```

Register in `app.ts`:
```ts
import { customerRoutes } from "./modules/customer/customer.routes";
// ...
app.use("/v1/customers", customerRoutes);
```

---

## Task 7 — Supplier Module

**Files to create:**
- `apps/backend/src/modules/supplier/supplier.model.ts`
- `apps/backend/src/modules/supplier/supplier.validation.ts`
- `apps/backend/src/modules/supplier/supplier.service.ts`
- `apps/backend/src/modules/supplier/supplier.controller.ts`
- `apps/backend/src/modules/supplier/supplier.routes.ts`

**Model (suppliers collection)** – same shape as customers plus an optional `address` field:

| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| phone | String | optional, sparse unique |
| address | String | optional |
| totalDebt | Number | default 0 |
| transactions | [Transaction] | same sub‑schema as customer |
| createdAt | Date | auto |

**Validation schemas:**
- `createSupplierSchema` – name, phone (optional), address (optional), initialDebt (optional)
- `updateSupplierSchema` – name, phone, address (all optional)
- `debtSchema` – same as customer debt schema
- `supplierListQuerySchema` – page, limit, hasDebt, search

**Service** – mirrors customer service exactly:
- `createSupplier` – same logic as createCustomer
- `getSuppliers` – same query pattern
- `getSupplierById` – returns supplier + `recentPurchases` (empty array for now)
- `updateSupplier` – update name/phone/address
- `updateDebt` – same atomic logic as customer debt
- `deleteSupplier` – fails if `totalDebt > 0` (per API-Contract §8.6)

**Routes (all admin):**
```
POST   /v1/suppliers           -> admin
GET    /v1/suppliers           -> admin (query)
GET    /v1/suppliers/:id       -> admin
PUT    /v1/suppliers/:id       -> admin
PUT    /v1/suppliers/:id/debt  -> admin
DELETE /v1/suppliers/:id       -> admin
```

Register in `app.ts`:
```ts
import { supplierRoutes } from "./modules/supplier/supplier.routes";
// ...
app.use("/v1/suppliers", supplierRoutes);
```

---

## Task 8 — Serializers (DTOs)

**File to edit:** `apps/backend/src/utils/serializer.ts`

Add three new serializer functions:

```ts
export const serializeProduct = (product: ProductDocument) => ({ ... });
export const serializeCustomer = (customer: CustomerDocument) => ({ ... });
export const serializeSupplier = (supplier: SupplierDocument) => ({ ... });
```

Each serializer returns a plain object matching the DTO shapes in API-Contract.md Appendix A. Convert `_id` to string, dates to ISO strings. Exclude `__v`, `passwordHash`, or any internal fields.

---

## Task 9 — Integration Tests

**File to create:** `apps/backend/tests/phase2.integration.test.ts`

Follow the pattern from `phase1.integration.test.ts`:
- Use the same `describeWithDb` guard, `uniqueDigits`, `phone()`, `createTestUser` helpers.
- Import the real service functions (not HTTP) for unit-style tests.
- Use `supertest` + `createApp()` for endpoint-level tests.

**Test scenarios:**

1. **Product CRUD** – create, list with filters, get by id, update, delete.
2. **Product duplicate name** – expect `DUPLICATE`.
3. **Product list filters** – category filter, lowStock flag, search.
4. **Customer CRUD** – create with initialDebt, list, get by id.
5. **Customer debt** – increase debt, decrease debt, validate decrease > debt fails.
6. **Customer deletion blocked** – simulate by creating a customer then trying to delete (will pass for now since no sales exist in test – verify the service throws `INVALID_STATE` only when sales exist).
7. **Supplier CRUD** – create, list, get by id, update.
8. **Supplier debt** – increase and decrease.
9. **Supplier deletion blocked** – fails if outstanding debt.
10. **Endpoint auth enforcement** – non-admin gets `403` on product create/customer endpoints.

---

## Task 10 — Wire Routes in App

**File to edit:** `apps/backend/src/app.ts`

Add imports and mount the three new route groups:
```ts
import { productRoutes } from "./modules/product/product.routes";
import { customerRoutes } from "./modules/customer/customer.routes";
import { supplierRoutes } from "./modules/supplier/supplier.routes";

app.use("/v1/products", productRoutes);
app.use("/v1/customers", customerRoutes);
app.use("/v1/suppliers", supplierRoutes);
```

---

## Verification

After all tasks are done, run:

```bash
cd apps/backend
npm run typecheck    # tsc --noEmit
npm run lint         # tsc --noEmit (alias)
npm run test         # jest --runInBand
npm run build        # tsc
```

All new and existing tests must pass. No type errors or lint warnings.

---

## Handoff to Frontend

Once verified, provide frontend team with:

1. Example responses for:
   - `GET /v1/products?category=Épicerie&lowStock=true`
   - `POST /v1/products` (create)
   - `PUT /v1/customers/:id/debt` (increase)
2. Auth/role requirements per endpoint.
3. Test credentials for an admin account.
4. Note that `recentSales` / `recentPurchases` arrays are empty until Phase 3.
