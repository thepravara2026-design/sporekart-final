# Sporekart — Google-Only Authentication Migration Assessment

**Document ID:** `docs/security/google-only-auth-migration-assessment.md`  
**Date:** October 10, 2026  
**Author:** Principal Software Architect & Security Engineering Lead  
**Status:** PROPOSED — AWAITING EXPLICIT APPROVAL

---

## 1. Executive Summary & Objective

Sporekart's authentication architecture is being simplified to support **Google OAuth 2.0 / OpenID Connect as the single interactive authentication mechanism**. All alternative authentication methods—including Email OTP, Phone/SMS OTP, email/password entry, and administrative OTP shortcuts—will be completely removed.

This change is an architectural simplification, NOT a system rewrite. All existing customer accounts, administrator privileges, commerce features (catalog, cart, checkout, orders, Razorpay payments), training features (courses, enrollments), wallet balances/ledger, Shiprocket logistics, and **SMTP business transactional email notifications** will remain 100% intact and preserved.

---

## 2. Baseline Audit & Current Authentication State

### 2.1 Existing Authentication Endpoints & Entry Points

| Endpoint | Method | Current Purpose | Proposed Status |
| :--- | :--- | :--- | :--- |
| `/auth/otp/request` | `POST` | Generates & dispatches Email/SMS OTP for customer auth | **RETIRED** (Returns 410 Gone / 400 Bad Request) |
| `/auth/otp/verify` | `POST` | Verifies customer OTP & returns JWT | **RETIRED** (Returns 410 Gone / 400 Bad Request) |
| `/auth/oauth/google` | `POST` | Verifies Google OAuth token, resolves/creates user, returns JWT | **RETAINED & ENHANCED** (Primary auth endpoint) |
| `/auth/me` | `GET` | Restores session profile using JWT Bearer token / Cookie | **RETAINED** |
| `/admin/auth/otp/request` | `POST` | Generates & dispatches Email/SMS OTP for admin auth | **RETIRED** (Returns 410 Gone / 400 Bad Request) |
| `/admin/auth/otp/verify` | `POST` | Verifies admin OTP & returns JWT | **RETIRED** (Returns 410 Gone / 400 Bad Request) |

### 2.2 Domain & Persistence Model (`com.sporekart.identity.domain`)

* **`User.java`** (`users` table): Contains account profile data (`id`, `email`, `phone`, `fullName`, `firstName`, `lastName`, `role`, `isVerified`, `isEmailVerified`, `isPhoneVerified`, `createdAt`, `updatedAt`).
  * *Preservation:* Email and Phone columns are retained as business fields (order contacts, shipping details, notifications). No schema dropping.
* **`CustomerIdentity.java`** (`customer_identities` table): Maps `userId` to `provider` (`GOOGLE`, `PHONE_OTP`, `EMAIL_OTP`) and `provider_subject` (e.g. Google `sub`).
  * *Preservation:* Table retained. Future identity links will use `provider = GOOGLE`.
* **`Otp.java` / `OtpType.java` / `OtpRepository.java`** (`otps` table): Stores ephemeral OTP codes.
  * *Action:* Retained in historical schema for audit integrity, but OTP generation, verification, and active repository logic will be removed from authentication services.

### 2.3 SMTP Business Email Notification Subsystem

* **`NotificationEventService.java` & `NotificationWorker.java`**: Handles event-driven business transactional emails (`ORDER_CREATED`, `ORDER_DELIVERED`, `PAYMENT_CAPTURED`, `ENROLLMENT_CONFIRMED`, `SHIPMENT_CREATED`, `WALLET_TOPUP`, `REFUND_PROCESSED`).
* **`SmtpNotificationService.java`**: Implements `JavaMailSender` transportation.
* **Preservation Guarantee:** Business email notification infrastructure is entirely independent of authentication OTP and will remain 100% operational. Only `sendOtpEmail` / `sendOtpSms` methods on the authentication `NotificationService` interface will be retired.

---

## 3. Proposed Google-Only Authentication Architecture

```
[ Frontend: React / Google GSI ]
               │
               │ Google OAuth ID Token (sub, email, name)
               ▼
[ POST /api/v1/auth/oauth/google ]
               │
               ├─ 1. Backend Verification of Google Identity (Token / Sub / Email)
               ├─ 2. Resolve User by CustomerIdentity (provider=GOOGLE, subject=googleSub)
               ├─ 3. Fallback: Resolve User by Email (link new CustomerIdentity)
               ├─ 4. If New User: Create User with default ROLE_CUSTOMER (isEmailVerified=true)
               ├─ 5. If Existing User: Retain stored UserRole (ROLE_ADMIN, ROLE_TRAINEE, ROLE_CUSTOMER)
               └─ 6. Issue Signed JWT + HTTP-Only Cookie
```

### 3.1 Security & Role Assignment Rules

1. **Non-Privileged Self-Registration:** All new accounts provisioned via Google OAuth automatically receive `ROLE_CUSTOMER`.
2. **Privilege Escalation Prevention:** Frontend claims, email domain checks, or user inputs can NEVER grant `ROLE_ADMIN` or `ROLE_TRAINEE`.
3. **Admin Authentication:** Administrators sign in using Google OAuth with their registered admin email address. The backend resolves their existing `User` record from the database, retaining their stored `ROLE_ADMIN` authority.
4. **Backend-Enforced Authorization:** Spring Security (`SecurityConfig.java`) retains strict RBAC enforcement on `/admin/**` endpoints.

---

## 4. Detailed Component Modification Plan

### 4.1 Backend Changes

| File Path | Action / Modification | Justification |
| :--- | :--- | :--- |
| `com/sporekart/identity/api/AuthController.java` | Modify | Remove `/otp/request` and `/otp/verify` endpoints. Keep `/oauth/google` and `/me`. Return HTTP 410 Gone / 400 for retired endpoints. |
| `com/sporekart/identity/api/AdminAuthController.java` | Modify | Retire `/admin/auth/otp/request` and `/admin/auth/otp/verify`. Direct admin login through `/auth/oauth/google`. |
| `com/sporekart/identity/application/AuthService.java` | Modify | Remove `requestOtp` and `verifyOtp`. Enhance `loginWithGoogle` identity linking & validation. Remove `123456` dev mock OTP. |
| `com/sporekart/identity/application/AdminAuthService.java` | Modify / Retire | Deprecate OTP logic. Admin login handled cleanly via Google OAuth. |
| `com/sporekart/identity/application/NotificationService.java` | Modify | Remove `sendOtpEmail` and `sendOtpSms` methods from auth interface. |
| `com/sporekart/shared/infrastructure/SmtpNotificationService.java` | Modify | Remove `sendOtpEmail` and `sendOtpSms` implementations; retain JavaMailSender for business emails. |
| `com/sporekart/shared/infrastructure/SecurityConfig.java` | Modify | Update permitted endpoints to allow `/auth/oauth/google` and `/auth/me`. Keep strict RBAC for `/admin/**`. |

### 4.2 Frontend Changes

| File Path | Action / Modification | Justification |
| :--- | :--- | :--- |
| `src/components/GoogleLoginButton.jsx` | Retain / Refine | Clean Google Identity Services button rendering. |
| `src/components/AuthForm.jsx` | Modify | Remove email/phone input fields, 6-digit OTP boxes, resend timers, and alternative login forms. Render Google Login as the sole interactive authentication control for both customer and admin modes. |
| `src/pages/AdminLoginPage.jsx` | Modify | Update layout to use Google Sign-In as the single login control for administrators. |
| `src/api.js` | Modify | Update `authApi` to remove `requestOtp` and `verifyOtp`. Retain `loginWithGoogle` and `getCurrentUser`. |

---

## 5. Database & Data Migration Strategy

* **Zero Destructive Schema Changes:** No tables (`users`, `customer_identities`, `otps`) will be dropped.
* **No Field Removals:** `email`, `phone`, `password_hash` columns remain intact on the `users` table so existing profile and shipping data is completely preserved.
* **Account Linking:** When an existing user (who previously signed up via email/phone OTP) signs in with Google using the same email address, `AuthService` will automatically associate their account with a new `CustomerIdentity` (`provider = 'GOOGLE'`).

---

## 6. Business Features Explicitly Excluded From Modification

The following subsystems are **100% OUT OF SCOPE** and will not be altered:

1. **Product Catalog & Inventory:** Categories, products, variants, pricing, stock levels.
2. **Cart & Checkout:** Session cart, cart items, checkout address resolution, idempotency.
3. **Orders & Payments:** Order creation, status transitions, Razorpay payment verification, webhooks.
4. **Wallet Subsystem:** Wallet balances, transactions, top-ups, withdrawals, refunds, ledger.
5. **Training Subsystem:** Courses, batches, enrollments, certificate generation.
6. **Logistics & Shipping:** Shiprocket integration, shipment creation, tracking updates.
7. **Business SMTP Email Notifications:** Order confirmation, payment receipt, training enrollment, shipment updates, wallet notifications.

---

## 7. Testing & Verification Strategy

1. **Authentication Tests:** Verify successful Google OAuth sign-in, account creation, existing user identity linking, and role preservation.
2. **Alternative Auth Rejection Tests:** Verify that requests to retired OTP endpoints fail safely without authenticating users.
3. **RBAC & Authorization Matrix Tests:** Run Spring Security integration tests (`AuthorizationMatrixIntegrationTest`, `IdentitySecurityTest`) to verify non-admin users cannot access `/admin/**`.
4. **SMTP Business Event Tests:** Run tests verifying `NotificationEventListener` and `NotificationEventService` dispatch transactional emails upon business events (`OrderCreatedEvent`, etc.).
5. **Full Maven & Frontend Builds:** Run `mvn compile`, `mvn test`, and `npm run build` to verify zero regressions.

---

## 8. Explicit Approval Request

**Architectural Assessment Completed.**  
We are stopping here as instructed. Please review this assessment and provide your explicit approval to proceed with Phase 3 (Controlled Implementation).
