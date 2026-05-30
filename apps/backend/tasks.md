# Phase 3 – Point of Sale (Sales & Invoices)

> Based on: `backend-plan.md` Phase 3, `API-Contract.md` §§5–6, `architecture.md` §§6.4, 6.9, 7.3, 9.1, 11

---

## Deliverables

### 1. Sale Model (`src/modules/sale/sale.model.ts`)
- [ ] Mongoose schema matching `sales` collection in `architecture.md` §7.3
  - `invoiceNumber: number` (auto-incremented)
  - `employeeId: ObjectId` (ref: User)
  - `customerId: ObjectId` (optional, ref: Customer)
  - `customerName: string`
  - `items: [{ productId, name, quantity, unitPrice, total }]`
  - `totalAmount: number`
  - `paymentMethod: "cash" | "card" | "bankily"`
  - `isDeleted: boolean` (soft delete for idempotent cancellation)
  - `createdAt: Date`
- [ ] Indexes on `employeeId`, `createdAt`, `invoiceNumber`

### 2. Sale Validation (`src/modules/sale/sale.validation.ts`)
- [ ] `createSaleSchema` – items array (productId, quantity, unitPrice), customerId?, customerName?, paymentMethod enum
- [ ] `saleListQuerySchema` – page, limit, from, to, employeeId, customerId
- [ ] `deleteSaleParamsSchema` – id as ObjectId
- [ ] `invoiceParamsSchema` – id as ObjectId
- [ ] Exported types for all inputs

### 3. Counter Utility (`src/utils/counter.util.ts`)
- [ ] Mongoose model for `counters` collection (`{ _id: string, seq: number }`)
- [ ] `getNextInvoiceNumber(): Promise<number>` – atomic `findOneAndUpdate` with `$inc`

### 4. Sale Service (`src/modules/sale/sale.service.ts`)
- [ ] `createSale(input, employeeId)`:
  - Atomic stock decrement via `findOneAndUpdate` with `{ quantity: { $gte: requestedQty } }` for each item
  - If any product has insufficient stock → throw `INSUFFICIENT_STOCK`
  - Generate invoice number via counter util
  - Create sale document
  - Log activity (`action: "sale"`)
  - Return sale DTO + stockUpdates array
  - **Must use MongoDB transaction** (or session) for atomicity
- [ ] `listSales(query, userId, role)`:
  - Admin: all sales with optional employeeId filter
  - Employee: own sales only
  - Support date range (from/to), customerId filters
  - Exclude soft-deleted (`isDeleted: false`) by default
- [ ] `getSaleById(id, userId?, role?)`:
  - Employee can only access own sales
  - Throw `NOT_FOUND` if missing, `INVALID_STATE` if deleted
- [ ] `cancelSale(id)` – admin only:
  - `findOneAndUpdate` to set `isDeleted: true` + check not already cancelled
  - Restore stock for each item atomically
  - Log activity (`action: "delete_invoice"`)
  - Return restored stock + deleted sale DTO

### 5. Sale Controller (`src/modules/sale/sale.controller.ts`)
- [ ] `create` → `POST /sales` (201)
- [ ] `list` → `GET /sales` (200 + meta)
- [ ] `getById` → `GET /sales/:id` (200)
- [ ] `cancel` → `DELETE /sales/:id` (200)
- [ ] `getInvoice` → `GET /invoices/:id` (200)
- [ ] `getPrintData` → `GET /invoices/print/:id` (200) – stub/V2

### 6. Sale Routes (`src/modules/sale/sale.routes.ts`)
- [ ] `POST /` – requireAuth, requireRole("both"), validate(createSaleSchema) → create
- [ ] `GET /` – requireAuth, validate(saleListQuerySchema, "query") → list
- [ ] `GET /:id` – requireAuth → getById
- [ ] `DELETE /:id` – requireAuth, requireRole("admin") → cancel
- [ ] Invoice routes can be on same router or separate:
  - `GET /invoices/:id` – requireAuth → getInvoice
  - `GET /invoices/print/:id` – requireAuth → getPrintData

### 7. Invoice Routes (`src/modules/sale/invoice.routes.ts`) – optional, can inline
- [ ] `GET /v1/invoices/:id` – requireAuth → invoice controller handler
- [ ] `GET /v1/invoices/print/:id` – requireAuth → print data handler

### 8. Update Serializer (`src/utils/serializer.ts`)
- [ ] `serializeSale(sale)` – map to Sale DTO per API-Contract §14.3
  - Include `_id`, `invoiceNumber`, `employeeId`, `employeeName`, `customerId`, `customerName`, `items[].total`, `totalAmount`, `paymentMethod`, `createdAt`
- [ ] `serializeSaleList(sale)` – same as above but exclude cancelled sales if needed

### 9. Update Types (`src/types.ts`)
- [ ] `PaymentMethod = "cash" | "card" | "bankily"`
- [ ] `SaleItem = { productId, name, quantity, unitPrice, total }`

### 10. Register Routes in `src/app.ts`
- [ ] `app.use("/v1/sales", saleRoutes)`
- [ ] `app.use("/v1/invoices", invoiceRoutes)`

### 11. Tests (`tests/phase3.integration.test.ts`)
- [ ] `POST /sales` – creates sale, decrements stock, returns invoice
- [ ] `POST /sales` – returns `INSUFFICIENT_STOCK` when quantity > available
- [ ] `POST /sales` – returns 404 for non-existent productId
- [ ] `GET /sales` – admin sees all, employee sees own
- [ ] `GET /sales` – filters by date range
- [ ] `DELETE /sales/:id` – admin cancels, stock restored
- [ ] `DELETE /sales/:id` – returns `INVALID_STATE` if already cancelled
- [ ] `DELETE /sales/:id` – employee gets 403
- [ ] `GET /invoices/:id` – returns full invoice details
- [ ] Invoice numbers are sequential (no gaps, unique per sale)

### 12. Validation & Lint
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all existing + new tests pass)
- [ ] `npm run build` passes

---

## Critical Rules (from backend-plan §Phase 3)

- [ ] Stock check uses `findOneAndUpdate` with `{ quantity: { $gte: requestedQty } }` – never two-step decrement
- [ ] `unitPrice` in sale items can differ from product's base price – never update product.price
- [ ] Invoice numbers auto-increment via dedicated `counters` collection
- [ ] Activity log entries created for every sale and every cancellation
- [ ] `DELETE /sales/:id` is idempotent – returns `409 INVALID_STATE` if already cancelled
- [ ] Admin sees all sales, employee sees own only
- [ ] Soft delete (`isDeleted`) for cancellations; restore stock atomically

---

## Handshake Checkpoints (from master-plan.md §Phase 3)

- [ ] `POST /sales` returns `INSUFFICIENT_STOCK` when quantity exceeds available stock
- [ ] `DELETE /sales/:id` (admin) restores stock and returns updated quantities
- [ ] Invoice numbers are sequential across all sales
- [ ] Employee sees only their own sales in `GET /sales`
