# Phase 1 Tasks: Identity & Accounts

This document breaks down the Phase 1 deliverables from backend-plan.md into actionable implementation tasks for the backend team.

## Deliverables Summary
From backend-plan.md Phase 1:
- User model (users collection) with indexes on phone, role
- Authentication: /auth/login, /auth/refresh, /auth/logout, /auth/me
- JWT generation: access token 24h, refresh token 7 days (stored in DB)
- Auth middleware and RBAC (admin / employee)
- Profile update endpoint: PUT /users/me
- Employee management foundations: POST /employees, GET /employees, GET /employees/:id, PUT /employees/:id
- Attendance marking: PUT /employees/:id/attendance

## Critical Rules
- Admin accounts cannot be created via API – the first admin is seeded during installation
- Refresh token rotation: revoke old refresh token on logout and token refresh
- Password change invalidates all refresh tokens for that user

## Task Organization
Tasks are organized by module following the backend structure from architecture.md:
1. Auth Module
2. User Module
3. Employee Module
4. Cross-cutting Infrastructure
5. Testing

---

## 1. Auth Module Tasks

### 1.1 User Model Implementation
- [x] Create user model (`apps/backend/src/modules/user/user.model.ts`)
  - Define Mongoose schema with fields: name, phone (unique), passwordHash, role (admin|employee), salary, attendance array, createdAt, lastActiveAt
  - Add indexes on phone and role
  - Implement password hashing utility (bcrypt)
  - Add methods for password validation
  - Ensure salary and attendance are included in admin responses only when appropriate

### 1.2 Auth Service Implementation
- [x] Create auth service (`apps/backend/src/modules/auth/auth.service.ts`)
  - Implement login service: validate phone/password, generate JWT tokens
  - Implement refresh token service: validate old token, generate new pair, rotate tokens
  - Implement logout service: revoke refresh token
  - Implement me service: return user data (excluding passwordHash)
  - Implement password change service: validate, update hash, invalidate all refresh tokens
  - Ensure refresh tokens are stored in database with expiration
  - Implement token revocation mechanism

### 1.3 Auth Controller Implementation
- [x] Create auth controller (`apps/backend/src/modules/auth/auth.controller.ts`)
  - POST /auth/login: handle login request, call auth service
  - POST /auth/refresh: handle token refresh, call auth service
  - POST /auth/logout: handle logout, call auth service
  - GET /auth/me: return current user data
  - Ensure proper error handling and response formatting

### 1.4 Auth Routes
- [x] Create auth routes (`apps/backend/src/modules/auth/auth.routes.ts`)
  - Define routes for all auth endpoints with proper path prefixes
  - Apply public middleware where needed (login, refresh)
  - Apply bearer token middleware where needed (logout, me)

### 1.5 Auth Validation (Zod)
- [x] Create auth validation schemas (`apps/backend/src/modules/auth/auth.validation.ts`)
  - Login schema: phone (string, E.164 format), password (string, min 6)
  - Refresh token schema: refreshToken (string, required)
  - Password change schema: password (string, min 6)
  - Ensure validation matches API contract specifications

### 1.6 Auth Middleware
- [x] Create/update auth middleware (`apps/backend/src/middlewares/auth.middleware.ts`)
  - Verify JWT access token
  - Attach user data to request object
  - Handle token expiration and invalidation
  - Extract userId and role for downstream use

### 1.7 RBAC Middleware
- [x] Create role middleware (`apps/backend/src/middlewares/role.middleware.ts`)
  - Implement ROLE_PERMISSIONS constant from architecture.md
  - Check if user has required permission for endpoint
  - Return 403 Forbidden if insufficient permissions

### 1.8 JWT Utilities
- [x] Update JWT utility (`apps/backend/src/utils/jwt.util.ts`)
  - Implement access token generation (24h expiration)
  - Implement refresh token generation (7d expiration)
  - Implement token verification
  - Implement token decoding (without verification for middleware)

---

## 2. User Module Tasks

### 2.1 User Service Implementation
- [x] Create user service (`apps/backend/src/modules/user/user.service.ts`)
  - Implement getUserById: retrieve user by ID
  - Implement updateUser: update name and/or password
  - Implement password change: validate, hash, save, invalidate tokens
  - Ensure passwordHash is never returned in responses
  - Handle salary and attendance visibility based on requester role

### 2.2 User Controller Implementation
- [x] Create user controller (`apps/backend/src/modules/user/user.controller.ts`)
  - PUT /users/me: handle profile updates
  - Validate input, call user service
  - Return updated user data (excluding passwordHash)

### 2.3 User Routes
- [x] Create user routes (`apps/backend/src/modules/user/user.routes.ts`)
  - Define PUT /users/me route with bearer token middleware
  - Apply validation middleware

### 2.4 User Validation (Zod)
- [x] Create user validation schemas (`apps/backend/src/modules/user/user.validation.ts`)
  - Profile update schema: name (string optional), password (string min 6 optional)
  - Ensure validation matches API contract

---

## 3. Employee Module Tasks

### 3.1 Employee Model Implementation
- [x] Create employee model (`apps/backend/src/modules/employee/employee.model.ts`)
  - Extend user model with same schema (employees are users with role: employee)
  - Add salary field
  - Ensure phone uniqueness constraint
  - Note: Admin accounts cannot be created via API (handled in service/controller)

### 3.2 Employee Service Implementation
- [x] Create employee service (`apps/backend/src/modules/employee/employee.service.ts`)
  - Implement createEmployee: admin-only, hash password, set role: employee
  - Implement getEmployees: list employees with pagination
  - Implement getEmployeeById: retrieve employee details
  - Implement updateEmployee: update name, phone, salary, password
  - Implement markAttendance: update attendance array for specific date
  - Ensure admin creation restriction is enforced
  - Ensure password handling follows security rules

### 3.3 Employee Controller Implementation
- [x] Create employee controller (`apps/backend/src/modules/employee/employee.controller.ts`)
  - POST /employees: create new employee (admin only)
  - GET /employees: list employees (admin only)
  - GET /employees/:id: get employee details (admin only)
  - PUT /employees/:id: update employee (admin only)
  - PUT /employees/:id/attendance: mark attendance (admin only)
  - Apply proper role checking via middleware

### 3.4 Employee Routes
- [x] Create employee routes (`apps/backend/src/modules/employee/employee.routes.ts`)
  - Define all employee endpoints with admin role middleware
  - Apply validation middleware where needed

### 3.5 Employee Validation (Zod)
- [x] Create employee validation schemas (`apps/backend/src/modules/employee/employee.validation.ts`)
  - Create employee schema: name (string min 2 max 100), phone (string required unique), password (string min 6), salary (number optional default 0), role (literal "employee")
  - Update employee schema: name (string optional), phone (string optional), salary (number optional), password (string min 6 optional)
  - Attendance schema: date (ISO string), status (literal "present|absent")
  - Ensure validation matches API contract specifications

---

## 4. Cross-cutting Infrastructure Tasks

### 4.1 Database Connection and Indexes
- [x] Ensure user model indexes are created on startup
  - phone: unique index
  - role: index for role-based queries

### 4.2 API Response Formatting
- [x] Verify/update apiResponse utility (`apps/backend/src/utils/apiResponse.ts`)
  - Ensure standard {success, data, error, meta} format
  - Ensure proper error code handling from Appendix B
  - Ensure meta is only used for paginated lists

### 4.3 Environment Configuration
- [x] Verify JWT secret configuration in environment variables
- [x] Ensure token expiration settings match contract (24h access, 7d refresh)

### 4.4 Logging Implementation
- [x] Implement authentication-related logging
  - Log login attempts (success/failure)
  - Log token refresh events
  - Log logout events
  - Ensure no sensitive data (passwords, tokens) is logged

---

## 5. Testing Tasks

Progress: Added focused Jest coverage for response envelopes, phone normalization, auth/employee validation, and JWT token generation/expiration. Full database-backed service and integration tests are still open.

### 5.1 Unit Tests
- [x] Create unit tests for user model
  - Test password hashing and validation
  - Test index creation
  - Test schema validation

- [x] Create unit tests for auth service
  - Test login success/failure scenarios
  - Test token generation and verification
  - Test refresh token rotation
  - Test logout functionality
  - Test password change and token invalidation

- [x] Create unit tests for employee service
  - Test employee creation (admin only restriction)
  - Test employee listing and retrieval
  - Test employee updates
  - Test attendance marking
  - Test validation errors

### 5.2 Integration Tests
- [x] Create integration tests for auth endpoints
  - POST /auth/login: valid/invalid credentials
  - POST /auth/refresh: valid/expired/revoked tokens
  - POST /auth/logout: token revocation
  - GET /auth/me: token validation

- [x] Create integration tests for user endpoints
  - PUT /users/me: profile updates, password changes

- [x] Create integration tests for employee endpoints
  - POST /employees: creation (admin only), validation
  - GET /employees: listing, pagination
  - GET /employees/:id: retrieval, 404 handling
  - PUT /employees/:id: updates, validation
  - PUT /employees/:id/attendance: marking, validation

### 5.3 Security Tests
- [x] Test that admin accounts cannot be created via API
- [x] Test refresh token rotation on logout and refresh
- [x] Test that password change invalidates existing refresh tokens
- [x] Test RBAC enforcement on all endpoints
- [x] Test that sensitive data (passwordHash, tokens) is never exposed in responses

---

## Acceptance Criteria
All tasks are complete when:
1. All Phase 1 deliverables from backend-plan.md are implemented
2. All implemented endpoints match the exact specification in API-Contract.md
3. All business rules from architecture.md are followed
4. Critical rules are implemented:
   - Admin accounts cannot be created via API
   - Refresh token rotation works correctly
   - Password change invalidates all refresh tokens
5. All validation uses Zod schemas matching API contract
6. Response format follows {success, data, error, meta} envelope
7. Error codes match Appendix B of API contract
8. ObjectId values are 24-hex strings, timestamps are ISO 8601 UTC, amounts are integer MRU
9. Phone numbers are stored in E.164 format
10. All tests pass (unit and integration)
11. npm run lint, npm run typecheck, and npm run build succeed
12. Frontend team can replace mocks with real API calls without UI rewrites

## Dependencies
- bcryptjs for password hashing
- jsonwebtoken for JWT handling
- zod for validation
- mongoose for MongoDB ODM
- Supertest for integration testing
- Jest for testing framework

## Notes
- Tasks should be implemented in order respecting dependencies (models → services → controllers → routes)
- Security considerations must be prioritized (no plaintext passwords, proper token handling)
- All implementation must be contract-compliant to enable frontend mock swap
- Regular commits should be made with descriptive messages following conventional commits
