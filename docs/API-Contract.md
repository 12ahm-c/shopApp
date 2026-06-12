ShopManager — API Contract

Frontend ↔ Backend communication spec
Companion document to architecture.md
Version 1.0 — MVP Juin 2025

This document is the source of truth for request and response shapes of every HTTP endpoint. The frontend and backend teams MUST keep this file in sync with their implementations. When a discrepancy appears, fix the code OR update this doc — never let them drift.

---

Table of Contents

1. Conventions
2. Auth — 4 endpoints
3. Users — 1 endpoint
4. Products — 5 endpoints
5. Sales (POS) — 3 endpoints
6. Invoices — 2 endpoints
7. Customers — 5 endpoints
8. Suppliers — 4 endpoints
9. Employees — 5 endpoints
10. Activity Logs — 1 endpoint
11. Notifications — 3 endpoints
12. Store Settings — 2 endpoints
13. Dashboard — 2 endpoints
14. Appendix A — Shared DTOs
15. Appendix B — Error Codes

Total: 39 REST endpoints.

---

1. Conventions

1.1 Base URL & Versioning

```
Production : https://api.shopmanager.mr/v1
Staging    : https://api.staging.shopmanager.mr/v1
Local      : http://localhost:3001/v1
```

1.2 Authentication

All endpoints require a JWT access token unless explicitly marked Public.

```
Authorization: Bearer <accessToken>
```

· accessToken lifetime: 24 hours
· refreshToken lifetime: 7 days, stored in httpOnly cookie OR returned in response body
· On 401 with code TOKEN_EXPIRED, the frontend MUST call POST /auth/refresh and retry once.
· Password change invalidates all refresh tokens for the user.

1.3 Standard Response Envelope

Every response (success or failure) uses this envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": null
}
```

On error:

```json
{
  "success": false,
  "data": null,
  "error": { "code": "ERR_CODE", "message": "Human readable description", "fields": { "field": "reason" } },
  "meta": null
}
```

meta is used only for paginated lists:

```json
"meta": { "page": 1, "limit": 20, "total": 150 }
```

1.4 HTTP Status Codes

Code When
200 OK — read or update succeeded
201 Created — resource was created
204 No Content — delete succeeded, no body returned
400 Validation error — request body or query is malformed
401 Unauthenticated — token missing, malformed, or expired
403 Forbidden — authenticated but role lacks permission
404 Not found
409 Conflict — duplicate or invalid state transition
422 Unprocessable — semantically wrong (e.g., insufficient stock)
500 Internal server error

1.5 Standard Error Codes

Code HTTP Description
AUTH_REQUIRED 401 No token provided
TOKEN_EXPIRED 401 Access token expired — call /auth/refresh
TOKEN_INVALID 401 Token signature invalid or revoked
FORBIDDEN 403 Role lacks the required permission
NOT_FOUND 404 Resource does not exist
VALIDATION_ERROR 400 Body/query failed validation (see error.fields)
DUPLICATE 409 Phone or unique field already taken
INSUFFICIENT_STOCK 422 Product quantity is less than requested
INVALID_STATE 409 Operation not allowed in current state
INTERNAL 500 Unhandled server error — check logs

1.6 Pagination

Offset-based pagination for all list endpoints: ?page=1&limit=20. Default limit=20, max limit=100. Response meta includes page, limit, total.

1.7 Field Types

· ObjectId → string of 24 hex characters: "65f2a1b3c4d5e6f7a8b9c0d1"
· timestamp → ISO 8601 UTC string: "2025-06-16T14:32:11.000Z"
· amount → integer MRU (no decimals)
· phone → E.164 international format: "+22236123456" or local format "36123456" (both accepted, normalized on server)


1.8 Notation Used in This Doc

Per-endpoint header looks like:

```
### METHOD /path
**Auth:** Bearer | **Role:** admin | 
```

· Auth: Public (no token) or Bearer (JWT required)
· Role: admin / employee / both (comma-separated means either)

---

2. Auth

Account creation is admin-only (see Employees section). Regular users log in with phone + password.

2.1 POST /auth/login

Auth: Public 
Description: Authenticate with phone and password.

Request body

```json
{
  "phone":    "+22236123456",
  "password": "string (required)"
}
```

Success response (200)

```json
{
  "success": true,
  "data": {
    "user": { /* User DTO — see Appendix A */ },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2025-06-17T14:32:11.000Z",
    "refreshTokenExpiresAt": "2025-06-23T14:32:11.000Z"
  },
  "error": null,
  "meta": null
}
```

Errors

HTTP Code When
401 AUTH_REQUIRED Phone or password wrong
403 FORBIDDEN Account is disabled

---

2.2 POST /auth/refresh

Auth: Public (refresh token in body or cookie)
Description: Exchange a valid refresh token for new access + refresh tokens.

Request body (if not using cookies)

```json
{ "refreshToken": "string (required)" }
```

Success response (200) — same shape as /auth/login.

Errors

HTTP Code When
401 TOKEN_INVALID Refresh token revoked or expired

---

2.3 POST /auth/logout

Auth: Bearer
Description: Revoke the current refresh token.

Request body — empty.

Success response (204) — no body.

---

2.4 GET /auth/me

Auth: Bearer
Description: Return the authenticated user (verify-token endpoint).

Success response (200)

```json
{
  "success": true,
  "data": { /* User DTO */ },
  "error": null,
  "meta": null
}
```

---

3. Users

3.1 PUT /users/me

Auth: Bearer | Role: both
Description: Update own profile (name, password). Admin updates employee profiles via /employees endpoints.

Request body (all fields optional)

```json
{
  "name": "string",
  "password": "string (min 6 chars)"
}
```

Success response (200) — updated User DTO.

Errors

HTTP Code When
400 VALIDATION_ERROR Password too weak

---

4. Products

Admin only — employees have read-only access.

4.1 POST /products

Auth: Bearer | Role: admin
Description: Create a new product.

Request body

```json
{
  "name": "string (required, min 2, max 100)",
  "category": "string (required, min 2, max 50)",
  "price": "integer (required, > 0)",
  "quantity": "integer (required, >= 0)",
  "alertThreshold": "integer (optional, default 5)"
}
```

Success response (201) — Product DTO.

Errors

HTTP Code When
409 DUPLICATE Product name already exists

---

4.2 GET /products

Auth: Bearer | Role: both
Description: List all products with optional filters.

Query params

Name Type Required Default Description
page int no 1 Page number
limit int no 20 Max 100
category string no — Filter by category
lowStock boolean no false Show only products where quantity <= alertThreshold
search string no — Search by name

Success response (200)

```json
{
  "success": true,
  "data": [ /* Product DTO[] */ ],
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 48 }
}
```

---

4.3 GET /products/:id

Auth: Bearer | Role: both
Description: Fetch a single product.

Path params — id: ObjectId.

Success response (200) — Product DTO.

Errors

HTTP Code When
404 NOT_FOUND Product does not exist

---

4.4 PUT /products/:id

Auth: Bearer | Role: admin
Description: Update a product.

Path params — id: ObjectId.

Request body (all fields optional)

```json
{
  "name": "string",
  "category": "string",
  "price": "integer (> 0)",
  "quantity": "integer (>= 0)",
  "alertThreshold": "integer"
}
```

Success response (200) — updated Product DTO.

---

4.5 DELETE /products/:id

Auth: Bearer | Role: admin
Description: Delete a product. Fails if product appears in any sale.

Success response (204) — no body.

Errors

HTTP Code When
409 INVALID_STATE Product has existing sales

---

5. Sales (POS)

5.1 POST /sales

Auth: Bearer | Role: both 
Description: Create a sale (POS transaction). Decrements stock atomically, generates invoice, logs activity.

Request body

```json
{
  "items": [
    {
      "productId": "65f2a1b3c4d5e6f7a8b9c0d1",
      "quantity": 2,
      "unitPrice": 1200
    }
  ],
  "customerId": "65f... (optional, if known customer)",
  "customerName": "string (required if no customerId, max 100)",
  "paymentMethod": "cash | card | bankily | alsadd | bimbank | masrafi"
}
```

unitPrice can differ from product's base price (temporary discount/markup). The product's stored price is never updated.

Success response (201)

```json
{
  "success": true,
  "data": {
    "sale": { /* Sale DTO with full invoice */ },
    "stockUpdates": [
      { "productId": "...", "oldQuantity": 10, "newQuantity": 8 }
    ]
  },
  "error": null,
  "meta": null
}
```

Errors

HTTP Code When
404 NOT_FOUND One or more productIds don't exist
422 INSUFFICIENT_STOCK Requested quantity > available for any product
400 VALIDATION_ERROR Missing items, invalid payment method, etc.

---

5.2 GET /sales

Auth: Bearer | Role: admin (all sales), employee (own sales only)
Description: List sales with filters.

Query params

Name Type Required Default Description
page int no 1 
limit int no 20 
from timestamp no — createdAt >=
to timestamp no — createdAt <=
employeeId ObjectId no — Admin only
customerId ObjectId no — 

Success response (200) — list of Sale DTO (see Appendix A).

---

5.3 DELETE /sales/:id

Auth: Bearer | Role: admin
Description: Cancel/delete an invoice. Restores stock for all items in the sale. Logs the action.

Path params — id: ObjectId (sale ID).

Success response (200)

```json
{
  "success": true,
  "data": {
    "restoredStock": [
      { "productId": "...", "oldQuantity": 8, "newQuantity": 10 }
    ],
    "deletedSale": { /* Sale DTO */ }
  },
  "error": null,
  "meta": null
}
```

Errors

HTTP Code When
404 NOT_FOUND Sale does not exist
409 INVALID_STATE Sale already deleted

---

6. Invoices

6.1 GET /invoices/:id

Auth: Bearer | Role: admin (any), employee (own only)
Description: Get invoice details (same as sale details, but endpoint exists for semantic clarity).

Path params — id: ObjectId (sale ID).

Success response (200) — Sale DTO (full invoice).

---

6.2 GET /invoices/print/:id

Auth: Bearer | Role: both
Description: Get invoice data formatted for printing (HTML or JSON). V2 scope — not implemented in MVP phase.

Success response (200)

```json
{
  "success": true,
  "data": {
    "html": "<div class='invoice'>...</div>",
    "invoice": { /* Sale DTO */ }
  }
}
```

---

7. Customers

Admin only.

7.1 POST /customers

Auth: Bearer | Role: admin
Description: Create a new customer.

Request body

```json
{
  "name": "string (required, min 2, max 100)",
  "phone": "string (optional)",
  "initialDebt": "integer (optional, default 0)"
}
```

Success response (201) — Customer DTO.

Errors

HTTP Code When
409 DUPLICATE Phone already used by another customer

---

7.2 GET /customers

Auth: Bearer | Role: admin
Description: List customers.

Query params

Name Type Required Default Description
page int no 1 
limit int no 20 
hasDebt boolean no false Filter customers with totalDebt > 0
search string no — Search by name or phone

Success response (200) — list of Customer DTO.

---

7.3 GET /customers/:id

Auth: Bearer | Role: admin
Description: Get customer details with full transaction history.

Path params — id: ObjectId.

Success response (200)

```json
{
  "success": true,
  "data": {
    "customer": { /* Customer DTO */ },
    "recentSales": [ /* Sale DTO[], last 10 */ ]
  },
  "error": null,
  "meta": null
}
```

---

7.4 PUT /customers/:id/debt

Auth: Bearer | Role: admin
Description: Increase or decrease a customer's debt.

Path params — id: ObjectId.

Request body

```json
{
  "amount": 5000,
  "type": "increase | decrease",
  "note": "string (optional, max 200)"
}
```

Success response (200)

```json
{
  "success": true,
  "data": {
    "customer": { /* Customer DTO with updated totalDebt */ },
    "transaction": {
      "date": "2025-06-16T14:32:11.000Z",
      "amount": 5000,
      "type": "increase",
      "note": "Achat téléphone",
      "newTotalDebt": 12500
    }
  }
}
```

Errors

HTTP Code When
422 VALIDATION_ERROR Decrease amount > current debt

---

7.5 DELETE /customers/:id

Auth: Bearer | Role: admin
Description: Delete a customer. Fails if customer has any sales.

Success response (204) — no body.

Errors

HTTP Code When
409 INVALID_STATE Customer has existing sales

---

8. Suppliers

Admin only. Same structure as Customers, with full debt tracking (increase / decrease debt, total debt auto-calculated).

8.1 POST /suppliers

Auth: Bearer | Role: admin
Description: Create a new supplier.

Request body

```json
{
  "name": "string (required, min 2, max 100)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "initialDebt": "integer (optional, default 0)"
}
```

Success response (201) — Supplier DTO.

---

8.2 GET /suppliers

Auth: Bearer | Role: admin
Description: List suppliers.

Query params — page, limit, search, hasDebt.

Success response (200) — list of Supplier DTO.

---

8.3 GET /suppliers/:id

Auth: Bearer | Role: admin
Description: Get supplier details with full transaction history.

Success response (200)

```json
{
  "success": true,
  "data": {
    "supplier": { /* Supplier DTO */ },
    "recentPurchases": [ /* Sale DTO[], last 10 */ ]
  },
  "error": null,
  "meta": null
}
```

---

8.4 PUT /suppliers/:id

Auth: Bearer | Role: admin
Description: Update supplier info.

Request body (all fields optional)

```json
{
  "name": "string",
  "phone": "string",
  "address": "string"
}
```

Success response (200) — updated Supplier DTO.

---

8.5 PUT /suppliers/:id/debt

Auth: Bearer | Role: admin
Description: Increase or decrease a supplier's debt.

Path params — id: ObjectId.

Request body

```json
{
  "amount": 5000,
  "type": "increase | decrease",
  "note": "string (optional, max 200)"
}
```

Success response (200)

```json
{
  "success": true,
  "data": {
    "supplier": { /* Supplier DTO with updated totalDebt */ },
    "transaction": {
      "date": "2025-06-16T14:32:11.000Z",
      "amount": 5000,
      "type": "increase",
      "note": "Achat marchandise",
      "newTotalDebt": 12500
    }
  }
}
```

Errors

HTTP Code When
422 VALIDATION_ERROR Decrease amount > current debt

---

8.6 DELETE /suppliers/:id

Auth: Bearer | Role: admin
Description: Delete a supplier. Fails if supplier has outstanding debt.

Success response (204) — no body.

Errors

HTTP Code When
409 INVALID_STATE Supplier has outstanding debt or linked purchases

---

9. Employees

Admin only. Employees cannot access these endpoints.

9.1 POST /employees

Auth: Bearer | Role: admin
Description: Create a new employee account.

Request body

```json
{
  "name": "string (required, min 2, max 100)",
  "phone": "string (required, unique)",
  "password": "string (required, min 6)",
  "salary": "integer (optional, default 0)",
  "role": "employee"
}
```

role is always employee for this endpoint. Admin accounts cannot be created via API — the first admin is seeded during installation.

Success response (201) — User DTO (employee view, no password hash).

Errors

HTTP Code When
409 DUPLICATE Phone already registered

---

9.2 GET /employees

Auth: Bearer | Role: admin
Description: List all employees.

Query params

Name Type Required Default Description
page int no 1 
limit int no 20 
search string no — Search by name or phone

Success response (200) — list of User DTO (employee view).

---

9.3 GET /employees/:id

Auth: Bearer | Role: admin
Description: Get employee details.

Path params — id: ObjectId.

Success response (200) — User DTO with full attendance and salary info.

---

9.4 PUT /employees/:id

Auth: Bearer | Role: admin
Description: Update employee (name, phone, salary, password).

Request body (all fields optional)

```json
{
  "name": "string",
  "phone": "string",
  "salary": "integer",
  "password": "string (min 6)"
}
```

Success response (200) — updated User DTO.

---

9.5 PUT /employees/:id/attendance

Auth: Bearer | Role: admin
Description: Mark employee present or absent for a specific date.

Request body

```json
{
  "date": "2025-06-16T00:00:00.000Z",
  "status": "present | absent"
}
```

Success response (200)

```json
{
  "success": true,
  "data": {
    "userId": "...",
    "date": "2025-06-16T00:00:00.000Z",
    "status": "present",
    "allAttendance": [ /* full attendance array */ ]
  }
}
```

---

10. Activity Logs

10.1 GET /activity-logs

Auth: Bearer | Role: admin (all logs), employee (own logs only)
Description: List activity logs with filters.

Query params

Name Type Required Default Description
page int no 1 
limit int no 20 
from timestamp no — 
to timestamp no — 
action string no — sale | delete_invoice | login | logout
userId ObjectId no — Admin only

Success response (200) — list of ActivityLog DTO.

---

11. Notifications

11.1 GET /notifications

Auth: Bearer | Role: both
Description: List user's notifications.

Query params

Name Type Required Default Description
page int no 1 
limit int no 20 
unreadOnly boolean no false 
type string no — low_stock | daily_summary | debt_updated | invoice_deleted

Success response (200)

```json
{
  "success": true,
  "data": [ /* Notification DTO[] */ ],
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "unreadCount": 3
  }
}
```

---

11.2 PATCH /notifications/:id/read

Auth: Bearer | Role: owner
Description: Mark a single notification as read.

Path params — id: ObjectId.

Success response (200)

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "isRead": true,
    "readAt": "2025-06-16T14:32:11.000Z"
  }
}
```

---

11.3 PATCH /notifications/read-all

Auth: Bearer | Role: both
Description: Mark all unread notifications as read.

Success response (200)

```json
{
  "success": true,
  "data": {
    "updatedCount": 12
  }
}
```

---

12. Store Settings

12.1 GET /settings

Auth: Bearer | Role: admin (full), employee (read-only)
Description: Get store configuration.

Success response (200) — StoreSettings DTO.

---

12.2 PUT /settings

Auth: Bearer | Role: admin
Description: Update store settings.

Request body (all fields optional)

```json
{
  "storeName": "string",
  "storeAddress": "string",
  "storePhone": "string",
  "logoUrl": "string",
  "currency": "MRU",
  "invoiceFooter": "string",
  "theme": "light | dark",
  "language": "ar | fr"
}
```

Success response (200) — updated StoreSettings DTO.

---

13. Dashboard

13.1 GET /dashboard/admin

Auth: Bearer | Role: admin
Description: Aggregated dashboard data for admin.

Success response (200)

```json
{
  "success": true,
  "data": {
    "stats": {
      "todaySales": 12800,
      "todayOrders": 14,
      "monthlySales": 342000,
      "monthlyOrders": 312,
      "totalProducts": 148,
      "lowStockCount": 8,
      "totalCustomers": 67,
      "outstandingDebt": 24500,
      "totalEmployees": 4
    },
    "recentSales": [ /* Sale DTO[], last 10 */ ],
    "lowStockProducts": [ /* Product DTO[], first 10 */ ],
    "recentActivity": [ /* ActivityLog DTO[], last 10 */ ]
  },
  "error": null,
  "meta": null
}
```

---

13.2 GET /dashboard/employee

Auth: Bearer | Role: employee
Description: Aggregated dashboard data for employee.

Success response (200)

```json
{
  "success": true,
  "data": {
    "stats": {
      "todaySales": 4200,
      "todayOrders": 5,
      "monthlySales": 87500,
      "monthlyOrders": 82,
      "averageTicket": 1067
    },
    "recentSales": [ /* Sale DTO[], last 10 (own only) */ ],
    "unreadNotifications": 3
  },
  "error": null,
  "meta": null
}
```

---

14. Appendix A — Shared DTOs

14.1 User

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "name": "Ahmed Sidi",
  "phone": "+22236123456",
  "role": "admin",
  "salary": 15000,
  "attendance": [
    { "date": "2025-06-16T00:00:00.000Z", "status": "present" },
    { "date": "2025-06-15T00:00:00.000Z", "status": "absent" }
  ],
  "createdAt": "2025-05-01T00:00:00.000Z",
  "lastActiveAt": "2025-06-16T14:30:00.000Z"
}
```

For employee responses, salary is included. For admin responses to non-admin requests, salary and attendance are omitted.

---

14.2 Product

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "name": "Café Torréfaction Maison 250g",
  "category": "Épicerie",
  "price": 450,
  "quantity": 23,
  "alertThreshold": 5,
  "createdAt": "2025-05-16T14:32:11.000Z",
  "updatedAt": "2025-06-15T09:12:00.000Z"
}
```

---

14.3 Sale (Invoice)

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "invoiceNumber": 1042,
  "employeeId": "65f...",
  "employeeName": "Mohamed Salem",
  "customerId": "65f...",
  "customerName": "Mariam Ould",
  "items": [
    {
      "productId": "65f...",
      "name": "Café Torréfaction Maison 250g",
      "quantity": 2,
      "unitPrice": 450,
      "total": 900
    },
    {
      "productId": "65f...",
      "name": "Sucre 1kg",
      "quantity": 1,
      "unitPrice": 80,
      "total": 80
    }
  ],
  "totalAmount": 980,
  "paymentMethod": "cash",
  "createdAt": "2025-06-16T14:32:11.000Z"
}
```

---

14.4 Customer

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "name": "Mariam Ould",
  "phone": "+22246543210",
  "totalDebt": 12500,
  "transactions": [
    {
      "date": "2025-06-10T00:00:00.000Z",
      "amount": 5000,
      "type": "increase",
      "note": "Achat téléphone",
      "newTotalDebt": 5000
    },
    {
      "date": "2025-06-15T00:00:00.000Z",
      "amount": 7500,
      "type": "increase",
      "note": "Achat tablette",
      "newTotalDebt": 12500
    }
  ],
  "createdAt": "2025-06-01T00:00:00.000Z"
}
```

---

14.5 Supplier

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "name": "Distributions Sahéliennes",
  "phone": "+22247654321",
  "address": "Nouakchott, Tevragh Zeina",
  "totalDebt": 12500,
  "transactions": [
    {
      "date": "2025-06-10T00:00:00.000Z",
      "amount": 5000,
      "type": "increase",
      "note": "Achat marchandise",
      "newTotalDebt": 5000
    }
  ],
  "createdAt": "2025-05-20T00:00:00.000Z"
}
```

---

14.6 ActivityLog

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "userId": "65f...",
  "userName": "Mohamed Salem",
  "action": "sale",
  "details": "Vente #1042 - 980 MRU",
  "amount": 980,
  "timestamp": "2025-06-16T14:32:11.000Z"
}
```

---

14.7 Notification

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "userId": "65f...",
  "type": "low_stock",
  "title": "Stock faible : Café 250g",
  "body": "Il reste 3 unités de Café Torréfaction Maison 250g. Seuil: 5.",
  "isRead": false,
  "readAt": null,
  "data": { "productId": "65f..." },
  "createdAt": "2025-06-16T08:00:00.000Z"
}
```

---

14.8 StoreSettings

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "storeName": "ShopManager Store",
  "storeAddress": "Nouakchott, Mauritanie",
  "storePhone": "+22236123456",
  "logoUrl": "https://res.cloudinary.com/.../logo.png",
  "currency": "MRU",
  "invoiceFooter": "Merci de votre visite !",
  "theme": "light",
  "language": "fr"
}
```

---

15. Appendix B — Error Codes

Code HTTP Description
AUTH_REQUIRED 401 No token provided or invalid credentials
TOKEN_EXPIRED 401 Access token expired
TOKEN_INVALID 401 Token signature invalid
FORBIDDEN 403 Role lacks permission
NOT_FOUND 404 Resource does not exist
VALIDATION_ERROR 400 Input validation failed
DUPLICATE 409 Unique constraint violation
INSUFFICIENT_STOCK 422 Product quantity insufficient
INVALID_STATE 409 Operation not allowed
INTERNAL 500 Server error

---

ShopManager — API Contract — MVP Juin 2025
Source of truth: this file. Sync with architecture.md for the architectural reasoning behind each endpoint.