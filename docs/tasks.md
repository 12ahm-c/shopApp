# Phase 4 — Activity Logs & Notifications — Tasks

## A. Activity Log Module

### A1. ActivityLog Model
- **File:** `backend/src/modules/activityLog/activityLog.model.ts`
- **Fields:** `userId` (ObjectId ref User), `userName` (string), `action` (enum: `sale | delete_invoice | login | logout`), `details` (string), `amount` (number, optional), `timestamp` (Date, default `Date.now`)
- **Indexes:** `userId`, `timestamp`

### A2. ActivityLog Validation
- **File:** `backend/src/modules/activityLog/activityLog.validation.ts`
- Schemas: `activityLogListQuerySchema` — `page`, `limit`, `from`, `to`, `action` (optional enum filter), `userId` (optional ObjectId, admin only)
- Export types: `ActivityLogListQuery`

### A3. ActivityLog Service
- **File:** `backend/src/modules/activityLog/activityLog.service.ts`
- `listLogs(query, user)` — Admin sees all, employee sees own only. Apply `from`/`to` date filters, `action` filter, `userId` filter (admin only). Return `{ data, meta }` with pagination.

### A4. ActivityLog Controller
- **File:** `backend/src/modules/activityLog/activityLog.controller.ts`
- `list` handler — extracts query from `req.validated.query`, calls service, returns result.

### A5. ActivityLog Routes
- **File:** `backend/src/modules/activityLog/activityLog.routes.ts`
- `GET /` — `requireAuth`, `validate(querySchema, "query")`, controller list
- Auth: both admin and employee, but service differentiates access

### A6. ActivityLog Serializer
- **Add to:** `backend/src/utils/serializer.ts`
- `serializeActivityLog(log)` — return DTO matching API Contract §14.6

---

## B. Notification Module

### B1. Notification Model
- **File:** `backend/src/modules/notification/notification.model.ts`
- **Fields:** `userId` (ObjectId ref User), `type` (enum: `low_stock | daily_summary | debt_updated | invoice_deleted`), `title` (string), `body` (string), `isRead` (boolean, default false), `readAt` (Date, nullable), `data` (Mixed/object), `createdAt` (Date)
- **Indexes:** `userId`, `createdAt`, `isRead`

### B2. Notification Validation
- **File:** `backend/src/modules/notification/notification.validation.ts`
- Schemas: `notificationListQuerySchema` — `page`, `limit`, `unreadOnly` (boolean), `type` (optional enum)
- Export types: `NotificationListQuery`

### B3. Notification Service
- **File:** `backend/src/modules/notification/notification.service.ts`
- `listNotifications(query, userId)` — list user's notifications with filters. Meta includes `unreadCount`.
- `markAsRead(notificationId, userId)` — set `isRead: true`, `readAt: now`. Return `{ _id, isRead, readAt }`.
- `markAllAsRead(userId)` — update all unread for user. Return `{ updatedCount }`.
- `createNotification(userId, type, title, body, data)` — insert and emit via socket.

### B4. Notification Controller
- **File:** `backend/src/modules/notification/notification.controller.ts`
- `list`, `markRead`, `markAllRead` handlers

### B5. Notification Routes
- **File:** `backend/src/modules/notification/notification.routes.ts`
- `GET /` — `requireAuth`, `validate(querySchema, "query")`, controller list
- `PATCH /:id/read` — `requireAuth`, controller markRead
- `PATCH /read-all` — `requireAuth`, controller markAllRead

### B6. Notification Serializer
- **Add to:** `backend/src/utils/serializer.ts`
- `serializeNotification(notif)` — return DTO matching API Contract §14.7

---

## C. Socket.IO Integration

### C1. Socket Server
- **File:** `backend/src/socket/socket.server.ts`
- Initialize Socket.IO server with CORS config
- Authenticate connections via JWT token in handshake (`socket.auth.token` or `handshake.query.token`)
- Join rooms: `user:{userId}`, and `admin` if user role is admin
- Export `io` instance and `setupSocket` function

### C2. Notification Socket
- **File:** `backend/src/socket/notification.socket.ts`
- Export helper `emitNotification(userId, notification)` that emits `notification:new` to room `user:{userId}`
- Export helper `emitStockAlert(notification)` that emits `stock:alert` to room `admin`

### C3. Server Bootstrap
- **In:** `backend/src/server.ts`
- Instantiate Socket.IO on the same HTTP server
- Call `setupSocket(server)` after database connection

---

## D. Notification Triggers

### D1. Low Stock After Sale
- **Modify:** `backend/src/modules/sale/sale.service.ts`
- After successful sale creation, check each sold product's updated quantity. If `quantity <= alertThreshold`, create a low_stock notification for all admin users and emit `stock:alert`.

### D2. Debt Update Notification
- **Modify:** `backend/src/modules/customer/customer.service.ts`
- After successful debt update, create a `debt_updated` notification for admin(s) with customer details. Emit `notification:new`.

### D3. Invoice Deletion Notification
- **Modify:** `backend/src/modules/sale/sale.service.ts`
- After successful sale cancellation, create a `invoice_deleted` notification for admin(s). Emit `notification:new`.

### D4. Login/Logout Activity via Auth
- **Verify:** `backend/src/modules/auth/auth.service.ts`
- Ensure login and logout actions write activity logs (confirm existing pattern is complete).

---

## E. App Wiring

### E1. Register ActivityLog Routes
- **In:** `backend/src/app.ts`
- Add `app.use("/v1/activity-logs", activityLogRoutes);`

### E2. Register Notification Routes
- **In:** `backend/src/app.ts`
- Add `app.use("/v1/notifications", notificationRoutes);`

### E3. Install socket.io Package
- Run: `npm install socket.io`
- Run: `npm install -D @types/socket.io` (if types not included)

---

## F. Tests

### F1. Activity Log Integration Tests
- **File:** `backend/tests/phase4-activity.integration.test.ts`
- Admin can list all activity logs with pagination
- Employee sees only own activity logs
- Filtering by action, date range works
- Filtering by userId works for admin only

### F2. Notification Integration Tests
- **File:** `backend/tests/phase4-notification.integration.test.ts`
- User can list own notifications
- Unread filter works
- Mark single notification as read
- Mark all notifications as read
- Meta includes unreadCount

### F3. Socket.IO Tests
- **File:** `backend/tests/phase4-socket.test.ts` (optional, can be manual)
- Verify rooms are joined on authentication
- Verify `notification:new` event is emitted when notification created

---

## G. Critical Compliance Checklist

- [ ] ActivityLog DTO matches API Contract §14.6 exactly
- [ ] Notification DTO matches API Contract §14.7 exactly
- [ ] GET /activity-logs query params match API Contract §10.1
- [ ] GET /notifications query params match API Contract §11.1
- [ ] GET /notifications meta includes `unreadCount`
- [ ] PATCH /notifications/:id/read returns `{ _id, isRead, readAt }` shape
- [ ] PATCH /notifications/read-all returns `{ updatedCount }` shape
- [ ] Admin sees all activity logs, employee sees own only
- [ ] Notifications belong to specific user, never cross-user
- [ ] FCM push notifications are NOT implemented (MVP exclusion)
- [ ] Socket.IO rooms: `user:{userId}`, `admin`
- [ ] Socket.IO events: `notification:new`, `stock:alert`
- [ ] Low stock check is idempotent (cron checks every hour, not duplicate per sale — but the after-sale trigger fires once)
- [ ] All responses use `{ success, data, error, meta }` envelope
- [ ] `npm run test`, `npm run typecheck`, `npm run build` pass
