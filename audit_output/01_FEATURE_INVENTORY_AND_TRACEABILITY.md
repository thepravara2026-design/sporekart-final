# Sporekart Platform Audit: Phase 1 — Feature Inventory & Requirement Traceability Matrix

> **Audit Authority:** Principal QA Architect, Lead SDET, Security & Database Engineering Team
> **Operating Standard:** FAANG-Level Quality Engineering & Verification Standards
> **Audit Target:** Sporekart E-Commerce & Agronomy Platform (`sporekart-final`)
> **Phase 1 Scope:** 18 Architectural Modules | 122 Features Cataloged | 114 Documented Rules | 8 Inferred Invariants
> **Zero-Mutation Enforcement:** Read-Only Verification | 0 Database / Source Mutations

---

## 1. Executive Summary & Quality Engineering Framework

Phase 1 of the comprehensive Sporekart Quality Engineering Audit establishes end-to-end forward and backward traceability across the entire application topology. Every implemented capability across all 18 functional modules has been reverse-engineered from source code, database migrations, Spring beans, REST controllers, and React UI components.

### 1.1 Traceability Relationship Topology
Traceability is formally enforced along the 10-point architectural vector:
```
Module → Feature → Business Rule → UI Component → API Endpoint → Service → Database → External Integration → Test Case → Verification Evidence
```

### 1.2 Rule Classification Criteria
- **`[DOCUMENTED]`**: Business rules, invariants, and policies explicitly dictated by specifications, controller contracts, bean validation constraints (`@NotNull`, `@Size`, `@Pattern`), or dedicated integration tests.
- **`[INFERRED]`**: Latent business rules, structural invariants, defensive checks, and fallback policies reverse-engineered from database schema triggers/unique indexes, entity lifecycle hooks (`@PrePersist`, `@PreUpdate`), conditional branching in service implementations, or frontend interceptors.

### 1.3 Inventory Summary Table

| Module ID | Module Name | Package / Namespace | Features Cataloged | Primary Database Tables | Key Integrations |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **MOD-01** | Identity & Authentication | `com.sporekart.identity` | 8 | admin_audit_logs, carts.session_id, customer_identities, customer_profiles (+3 more) | Google Identity API, Twilio SMS / SMTP, Twilio SMS API |
| **MOD-02** | Customer Profile & Capabilities | `com.sporekart.customer` | 4 | admin_audit_logs, customer_addresses, customer_capabilities, customer_profiles (+1 more) | None (Internal) |
| **MOD-03** | Catalog, Merchandising & Search | `com.sporekart.catalog` | 8 | admin_audit_logs, analytics_metrics, blog_posts, categories (+8 more) | None (Internal) |
| **MOD-04** | Inventory & Stock Control | `com.sporekart.catalog` | 6 | admin_audit_logs, inventory_audit_events, inventory_records | None (Internal) |
| **MOD-05** | Cart & Promotions | `com.sporekart.cart` | 9 | admin_audit_logs, cart_items, carts, inventory_records (+3 more) | None (Internal) |
| **MOD-06** | Orders & Invoicing | `com.sporekart.order` | 10 | admin_audit_logs, cart_items, carts, inventory_records (+8 more) | Shiprocket Cancel API |
| **MOD-07** | Payment Systems & Gateway | `com.sporekart.payment` | 8 | batches.enrolled_count, enrollments, enrollments.status=CONFIRMED, inventory_records (+9 more) | Local HMAC-SHA256 Cryptographic Engine, Razorpay Orders API, Razorpay Webhook Dispatcher, Razorpay Webhook Engine |
| **MOD-08** | Platform Wallet & Ledger | `com.sporekart.wallet` | 11 | admin_audit_logs, inventory_records, orders, wallet_topup_intents (+6 more) | HMAC-SHA256 Verification, Manual Bank Payout / NEFT / IMPS, Razorpay Orders API |
| **MOD-09** | Logistics & Shipping | `com.sporekart.shipping` | 7 | None, orders, orders.shipped_at, orders.status=DELIVERED (+9 more) | Shiprocket API, Shiprocket AWB Assignment API, Shiprocket Order Cancel API, Shiprocket Serviceability API / local courier lookup, Shiprocket Tracking API, Shiprocket Webhook Engine |
| **MOD-10** | Training & Masterclasses | `com.sporekart.training` | 10 | attendances, batch_schedules, batches, batches.enrolled_count (+12 more) | Supabase Storage CDN |
| **MOD-11** | Customer Support & Helpdesk | `com.sporekart.support` | 5 | admin_audit_logs, closed_at, csat_feedback, csat_rating (+3 more) | None (Internal) |
| **MOD-12** | Customer & Trainee Reviews | `com.sporekart.review` | 6 | admin_audit_logs, order_items, orders, product_review_images (+4 more) | Supabase Storage CDN |
| **MOD-13** | Asynchronous Notifications & Alerts | `com.sporekart.notification` | 7 | carts, notification_events, notification_events.sms_status, notification_events.status=SENT (+1 more) | SMTP Gateway, Twilio Messaging REST API |
| **MOD-14** | Agronomy Content & SEO | `com.sporekart.content` | 6 | blog_authors, blog_categories, blog_post_tags, blog_posts (+5 more) | Bingbot), Search Engine Bots |
| **MOD-15** | Media Asset Management | `com.sporekart.media` | 4 | file_size_bytes, media_assets, media_course_links, media_product_links (+1 more) | Supabase Storage API, Supabase Storage Presigned URL Engine |
| **MOD-16** | Telemetry & Business Analytics | `com.sporekart.analytics` | 4 | analytics_events, analytics_metrics, enrollments, orders (+2 more) | None (Internal) |
| **MOD-17** | Administrative Control Plane & Auditing | `com.sporekart.admin` | 3 | Multiple, admin_audit_logs, users | None (Internal) |
| **MOD-18** | Cross-Cutting Security & Infrastructure | `com.sporekart.shared` | 6 | None, Stored, users.roles | None (Internal) |

---

## 2. Exhaustive Module-by-Module Feature Specifications

### MOD-01: Identity & Authentication
- **Package / Namespace:** `com.sporekart.identity`
- **Total Features Cataloged:** 8

#### `F01.1`: Customer Phone OTP Request & Delivery
- **Rule Classification:** **`[INFERRED]`**
- **Core Business Rule:** Customer enters 10-digit Indian phone number (+91 optional). Backend generates cryptographically secure 6-digit numeric OTP, saves hash to 'otps' table with 5-minute expiry, and dispatches via Twilio SMS (or mock logger in dev/test). Rate-limited to prevent SMS bombing.

##### Architectural Traceability
- **User Interface Component:** `AuthForm.jsx, Navbar.jsx`
- **API Endpoint / Method:** `POST /api/v1/auth/otp/request`
- **Backend Service Method:** `AuthService.requestOtp, OtpService.generateAndSendOtp`
- **Database Tables & Constraints:** `otps, users`
- **External Integrations:** `Twilio SMS API (or Mock Logger)`
- **Test Case Reference:** `IdentityModuleTest.java, 04_login.spec.js, fe-1.test.jsx`
- **Verification Evidence:** `Verified in AuthService.java:45-78; TwilioSmsService.java:30-80.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with OTP reference ID and expiry timestamp. SMS dispatched to carrier.
- **Normal / Happy Path Flow:** User opens login modal -> Enters phone -> Clicks Send OTP -> Receives SMS -> Form displays OTP input.
- **Alternative Flows:** If user already exists, account is reused; if new phone, temporary user entity is prepared.
- **Negative & Abuse Scenarios:** Invalid phone format (e.g. 5 digits, letters) -> HTTP 400 'Invalid mobile number'. Expired OTP -> HTTP 400 'OTP expired'.
- **Boundary Conditions & Limits:** 10-digit exact boundary ('9876543210'); 5-minute expiry boundary (300 seconds); max 3 OTP resends per 15 minutes.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** SMS gateway failure -> logs warning, returns HTTP 500 or fallback mock code if dev profile active.
- **Required Permissions & Access Control:** `Public (No auth required)`
- **Expected Database State Mutations:** `INSERT into 'otps' (id, phone, code_hash, expires_at, is_used=FALSE).`
- **Downstream Events & Notifications:** Transactional SMS: 'Your Sporekart verification code is XXXXXX. Valid for 5 minutes.'
- **Cross-Module Dependencies:** Customer Module (creates default profile upon verification).
- **Testability & Environment Prerequisites:** Mock Twilio bean or inspect database otps table in test profile.

---

#### `F01.2`: Customer Phone OTP Verification & JWT Issuance
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Validates submitted 6-digit OTP against unexpired, unused record in 'otps'. Marks OTP as used. If user does not exist, registers new customer. Generates HMAC-SHA256 signed JWT bearer token containing user UUID, email/phone, and ROLE_CUSTOMER.

##### Architectural Traceability
- **User Interface Component:** `AuthForm.jsx`
- **API Endpoint / Method:** `POST /api/v1/auth/otp/verify`
- **Backend Service Method:** `AuthService.verifyOtpAndLogin, JwtTokenProvider.generateToken`
- **Database Tables & Constraints:** `otps, users, customer_profiles`
- **External Integrations:** `None`
- **Test Case Reference:** `IdentityModuleTest.java, 04_login.spec.js`
- **Verification Evidence:** `Verified in AuthService.java:82-130; JwtTokenProvider.java:40-75.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with JWT token, expiration timestamp, and user summary.
- **Normal / Happy Path Flow:** User enters 6-digit code -> Clicks Verify -> Token stored in localStorage -> Auth state updated in Navbar.
- **Alternative Flows:** If user has active guest cart session, triggers automatic cart merge.
- **Negative & Abuse Scenarios:** Incorrect OTP -> HTTP 401 'Invalid OTP'. Already used OTP -> HTTP 400 'OTP already redeemed'.
- **Boundary Conditions & Limits:** Code length exact 6 characters; token expiration default 86,400,000 ms (24 hours).

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database connection drop -> HTTP 500 via GlobalExceptionHandler.
- **Required Permissions & Access Control:** `Public (No auth required)`
- **Expected Database State Mutations:** `UPDATE 'otps' SET is_used=TRUE; INSERT/UPDATE 'users' SET last_login_at=NOW().`
- **Downstream Events & Notifications:** None (Internal auth event).
- **Cross-Module Dependencies:** Cart Module (session cart merge), Customer Module (profile resolution).
- **Testability & Environment Prerequisites:** Direct REST test with deterministic OTP in test profile.

---

#### `F01.3`: Google OAuth2 Single Sign-On & Account Linking
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Receives Google ID Token from client. Verifies token signature and audience against Google OAuth2 client ID. Extracts email, name, avatar. Links Google user ID to customer_identities. Issues Sporekart JWT.

##### Architectural Traceability
- **User Interface Component:** `GoogleLoginButton.jsx, AuthForm.jsx`
- **API Endpoint / Method:** `POST /api/v1/auth/oauth/google`
- **Backend Service Method:** `GoogleAuthService.verifyAndAuthenticate`
- **Database Tables & Constraints:** `customer_identities, users, customer_profiles`
- **External Integrations:** `Google Identity API (OAuth2 ID Token Verification)`
- **Test Case Reference:** `IdentityModuleTest.java, fe-1.test.jsx`
- **Verification Evidence:** `Verified in GoogleAuthService.java:35-90; SecurityConfig.java:40-46.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with JWT bearer token and customer identity metadata.
- **Normal / Happy Path Flow:** User clicks 'Sign in with Google' -> Google popup completes -> Frontend sends idToken -> Backend authenticates.
- **Alternative Flows:** Existing customer with same email is automatically linked to Google identity.
- **Negative & Abuse Scenarios:** Expired or forged Google token -> HTTP 401 'Invalid Google ID token'. Audience mismatch -> HTTP 401.
- **Boundary Conditions & Limits:** Google token string length ~1000+ chars; token expiry validated via Google claims.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Google API unreachable -> HTTP 502/500 'Authentication service temporarily unavailable'.
- **Required Permissions & Access Control:** `Public (No auth required)`
- **Expected Database State Mutations:** `INSERT into 'customer_identities' (user_id, provider='GOOGLE', provider_user_id); INSERT/UPDATE 'users'.`
- **Downstream Events & Notifications:** Publishes UserRegisteredEvent if new customer.
- **Cross-Module Dependencies:** Customer Module (creates profile and address book).
- **Testability & Environment Prerequisites:** Mock GoogleTokenVerifier bean in test suite.

---

#### `F01.4`: Identity Conflict Resolution (Duplicate Phone/Email)
- **Rule Classification:** **`[INFERRED]`**
- **Core Business Rule:** When a Google OAuth account shares a phone number with an existing phone-authenticated account, system raises DuplicateIdentityConflictException. Requires customer confirmation to merge identities.

##### Architectural Traceability
- **User Interface Component:** `IdentityConflictModal.jsx`
- **API Endpoint / Method:** `POST /api/v1/auth/oauth/google`
- **Backend Service Method:** `AuthService.resolveConflict`
- **Database Tables & Constraints:** `users, customer_identities`
- **External Integrations:** `None`
- **Test Case Reference:** `address-login-negative-scenarios.test.jsx`
- **Verification Evidence:** `Verified in DuplicateIdentityConflictException.java; GlobalExceptionHandler.java:41-46.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 409 CONFLICT with error code 'DUPLICATE_IDENTITY_CONFLICT' and conflict details.
- **Normal / Happy Path Flow:** User confirms merge -> Accounts consolidated under primary identity -> Old session updated.
- **Alternative Flows:** User cancels -> Aborts login and preserves separate identities.
- **Negative & Abuse Scenarios:** Unconfirmed merge attempt -> Rejects login with HTTP 409.
- **Boundary Conditions & Limits:** Same email with different phone or same phone with different email.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Transaction rollback on partial identity update.
- **Required Permissions & Access Control:** `Public / Handshake token`
- **Expected Database State Mutations:** `UPDATE 'customer_identities' SET user_id=target_user_id.`
- **Downstream Events & Notifications:** Security alert email on account link.
- **Cross-Module Dependencies:** Customer Profile Module, Order History Module.
- **Testability & Environment Prerequisites:** Execute integration test with pre-existing conflicting user record.

---

#### `F01.5`: Current User Context Retrieval (/auth/me)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Extracts authenticated user UUID from Bearer JWT. Loads user profile, verified status, roles, and default address. If token missing or expired, returns 401.

##### Architectural Traceability
- **User Interface Component:** `Navbar.jsx, App.jsx`
- **API Endpoint / Method:** `GET /api/v1/auth/me`
- **Backend Service Method:** `AuthService.getCurrentUser`
- **Database Tables & Constraints:** `users, customer_profiles`
- **External Integrations:** `None`
- **Test Case Reference:** `04_login.spec.js, ExtendedIntegrationTest.java`
- **Verification Evidence:** `Verified in AuthController.java:55-68; JwtAuthenticationFilter.java:30-55.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with UserDto (id, email, phone, fullName, roles, gstin, hasTrainingCapability).
- **Normal / Happy Path Flow:** App loads -> Reads localStorage token -> Calls /auth/me -> Updates global React user state.
- **Alternative Flows:** If token invalid, client clears token and resets user state to null.
- **Negative & Abuse Scenarios:** Expired token -> HTTP 401 UNAUTHORIZED. Missing Bearer prefix -> HTTP 401.
- **Boundary Conditions & Limits:** Token validity: 24h expiration; user ID UUID format validation.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Deleted user account with active token -> HTTP 404/401.
- **Required Permissions & Access Control:** `Authenticated (Bearer JWT)`
- **Expected Database State Mutations:** `None (Read-only query).`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Profile Module.
- **Testability & Environment Prerequisites:** Execute with valid vs expired vs manipulated JWT.

---

#### `F01.6`: Admin OTP Request & Access Gating
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Admin operator enters registered email or phone. Backend verifies that user exists and possesses 'ROLE_ADMIN'. Rejects non-admin users immediately with 403. Dispatches admin OTP.

##### Architectural Traceability
- **User Interface Component:** `AdminLoginPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/admin/auth/otp/request`
- **Backend Service Method:** `AdminAuthService.requestAdminOtp`
- **Database Tables & Constraints:** `users, otps`
- **External Integrations:** `Twilio SMS / SMTP`
- **Test Case Reference:** `admin-access-restriction.test.jsx`
- **Verification Evidence:** `Verified in AdminAuthController.java:25-50; SecurityConfig.java:89.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with reference ID. Rejects unauthorized accounts.
- **Normal / Happy Path Flow:** Admin enters credentials -> Receives OTP -> Screen renders OTP prompt.
- **Alternative Flows:** If account locked, returns HTTP 403.
- **Negative & Abuse Scenarios:** Customer phone entered in admin portal -> HTTP 403 'Access restricted to administrators'.
- **Boundary Conditions & Limits:** Case-insensitive email matching; strict ROLE_ADMIN check.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Notification delivery failure -> logs incident in admin audit logs.
- **Required Permissions & Access Control:** `Public (Gated by admin role lookup)`
- **Expected Database State Mutations:** `INSERT into 'otps' (phone/email, code_hash, is_used=FALSE).`
- **Downstream Events & Notifications:** Security alert: 'Sporekart Admin Console login attempt'.
- **Cross-Module Dependencies:** Admin Audit Module.
- **Testability & Environment Prerequisites:** Attempt admin login with customer credentials vs seeded admin credentials.

---

#### `F01.7`: Admin OTP Verification & Privileged JWT Issuance
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Validates admin OTP. Issues privileged JWT containing 'ROLE_ADMIN' claim. Records successful admin login event in admin_audit_logs with client IP and user agent.

##### Architectural Traceability
- **User Interface Component:** `AdminLoginPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/admin/auth/otp/verify`
- **Backend Service Method:** `AdminAuthService.verifyAdminOtp`
- **Database Tables & Constraints:** `otps, users, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-access-restriction.test.jsx, admin-console-full-validation.test.jsx`
- **Verification Evidence:** `Verified in AdminAuthController.java:52-85; AdminApplicationService.java:30-60.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with admin JWT token and permission claims.
- **Normal / Happy Path Flow:** Admin inputs OTP -> Validated -> Navigates to /admin dashboard.
- **Alternative Flows:** If first login, prompts for profile confirmation.
- **Negative & Abuse Scenarios:** Incorrect OTP -> HTTP 401. Expired OTP -> HTTP 401.
- **Boundary Conditions & Limits:** Rate limited to 5 failed attempts before 15-minute temporary IP lockout.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Audit log persistence failure within transaction.
- **Required Permissions & Access Control:** `Public (Targeted to admin accounts)`
- **Expected Database State Mutations:** `UPDATE 'otps' SET is_used=TRUE; INSERT into 'admin_audit_logs' (action='LOGIN_SUCCESS').`
- **Downstream Events & Notifications:** Admin audit security event.
- **Cross-Module Dependencies:** Admin Audit Log Module.
- **Testability & Environment Prerequisites:** Mock admin login and verify claims in generated JWT.

---

#### `F01.8`: Guest Session ID Management (X-Session-ID)
- **Rule Classification:** **`[INFERRED]`**
- **Core Business Rule:** All anonymous browsing and cart actions carry an 'X-Session-ID' header ('sess_' + UUID). Generated on client in localStorage if missing. Backend uses this session ID to isolate guest carts, orders, and addresses prior to authentication.

##### Architectural Traceability
- **User Interface Component:** `api.js (axios request interceptor)`
- **API Endpoint / Method:** `All /cart/**, /orders/**, /payment/**`
- **Backend Service Method:** `Controller session extraction`
- **Database Tables & Constraints:** `carts.session_id, orders.session_id`
- **External Integrations:** `None`
- **Test Case Reference:** `03_guest_cart.spec.js, 05_cart_merge.spec.js`
- **Verification Evidence:** `Verified in api.js:6-17, 45-47; OrderController.java:26, 37, 50.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Request headers automatically inject valid X-Session-ID on all API dispatches.
- **Normal / Happy Path Flow:** Guest visits site -> UUID generated -> Injected in all requests -> Cart tied to session.
- **Alternative Flows:** If user logs in, session is preserved until cart merge completes.
- **Negative & Abuse Scenarios:** Corrupted or blank session ID from client -> Backend generates or rejects invalid guest action.
- **Boundary Conditions & Limits:** Prefix 'sess_' followed by RFC 4122 UUID (36 chars). Total length: 41 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Client localStorage disabled -> Falls back to in-memory random session token.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `Stored in 'carts.session_id' and 'orders.session_id'.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Cart Module, Order Module, Promotion Module.
- **Testability & Environment Prerequisites:** Send requests with distinct X-Session-ID headers and verify cart isolation.

---

### MOD-02: Customer Profile & Capabilities
- **Package / Namespace:** `com.sporekart.customer`
- **Total Features Cataloged:** 4

#### `F02.1`: Customer Profile Retrieval & Updates
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Customers can view and update their profile details including Full Name, GSTIN (validated against 15-character Indian GST format), Farm Size in sq ft, and mushroom cultivation interests.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Profile tab)`
- **API Endpoint / Method:** `GET /api/v1/customer/profile, PUT /api/v1/customer/profile`
- **Backend Service Method:** `CustomerService.getProfile, CustomerService.updateProfile`
- **Database Tables & Constraints:** `customer_profiles, users`
- **External Integrations:** `None`
- **Test Case Reference:** `CustomerModuleTest.java, 02_customer_account_lifecycle.spec.js`
- **Verification Evidence:** `Verified in CustomerController.java:20-50; CustomerProfile.java:10-35.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with updated profile and GSTIN validation flag.
- **Normal / Happy Path Flow:** User enters GSTIN '27AAAAA0000A1Z5' and farm size 5000 -> Clicks Save -> DB updated.
- **Alternative Flows:** Profile auto-created on first login if not present.
- **Negative & Abuse Scenarios:** Invalid GSTIN format (e.g. 10 chars) -> HTTP 400 'Invalid GSTIN format'.
- **Boundary Conditions & Limits:** GSTIN regex: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'; Farm size: 0 to 10,000,000 sq ft.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database constraint violation returns structured validation error.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `UPDATE 'customer_profiles' SET gstin=?, farm_size_sqft=?, updated_at=NOW().`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module (GSTIN used for B2B tax invoice calculation).
- **Testability & Environment Prerequisites:** Verify with valid vs invalid Indian GSTIN patterns.

---

#### `F02.2`: Customer Multi-Address Management with Alternate Phone
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Customers can maintain multiple shipping addresses. Exactly one address can be set as default. Supports 6-digit Indian PIN code validation, mandatory recipient name, 10-digit phone, and optional alternate delivery phone (Migration V29).

##### Architectural Traceability
- **User Interface Component:** `IndianAddressForm.jsx, DashboardPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/customer/addresses, POST /api/v1/customer/addresses, PUT /api/v1/customer/addresses/{id}, DELETE /api/v1/customer/addresses/{id}`
- **Backend Service Method:** `CustomerService.addAddress, CustomerService.updateAddress, CustomerService.deleteAddress`
- **Database Tables & Constraints:** `customer_addresses`
- **External Integrations:** `None`
- **Test Case Reference:** `CustomerModuleTest.java, 02_customer_account_lifecycle.spec.js, address-login-negative-scenarios.test.jsx`
- **Verification Evidence:** `Verified in CustomerController.java:55-110; V29__add_alternate_phone_to_addresses.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with refreshed address book list. Setting new default unsets previous default.
- **Normal / Happy Path Flow:** User adds address -> Marks as default -> Appears first in checkout selector.
- **Alternative Flows:** Deleting default address automatically designates another active address as default.
- **Negative & Abuse Scenarios:** PIN code starting with '0' or less than 6 digits -> HTTP 400 'Invalid Indian PIN code'. Deleting non-existent ID -> HTTP 404.
- **Boundary Conditions & Limits:** PIN code regex: '^[1-9][0-9]{5}$'; Recipient phone: 10 digits; Line1 max 255 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Attempting to delete an address belonging to another customer -> HTTP 403 FORBIDDEN.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `INSERT/UPDATE/DELETE on 'customer_addresses'.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module (resolves address snapshot for checkout).
- **Testability & Environment Prerequisites:** CRUD address cycle with boundary PIN codes (e.g. 110001, 411001).

---

#### `F02.3`: Training Capability Flag & Automatic Granting
- **Rule Classification:** **`[INFERRED]`**
- **Core Business Rule:** When a customer successfully completes a verified masterclass (e.g. Spawn Production), TrainingCapabilityEventListener listens to CourseCompletedEvent and automatically sets 'has_training_capability = TRUE' and 'training_capability_granted_at = NOW()'. Unlocks wholesale commercial spawn ordering.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx, TraineeProfileEnrollmentModal.jsx`
- **API Endpoint / Method:** `GET /api/v1/customer/capabilities`
- **Backend Service Method:** `TrainingCapabilityEventListener.onCourseCompleted`
- **Database Tables & Constraints:** `customer_profiles, customer_capabilities`
- **External Integrations:** `None`
- **Test Case Reference:** `CustomerModuleTest.java, 07_training_trainee_lifecycle.spec.js`
- **Verification Evidence:** `Verified in TrainingCapabilityEventListener.java:25-50; V10__create_training_tables.sql:19-21.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Customer capability granted automatically; wholesale catalog restrictions unlocked.
- **Normal / Happy Path Flow:** Admin marks course complete -> Event published -> Listener updates profile -> Capability active.
- **Alternative Flows:** Admin can manually grant or revoke capabilities in Admin Console.
- **Negative & Abuse Scenarios:** Untrained customer attempting to order commercial mother spawn -> Blocked with HTTP 403.
- **Boundary Conditions & Limits:** Boolean flag transition from FALSE to TRUE; idempotent if already granted.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Event listener transaction failure does not rollback course completion.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `UPDATE 'customer_profiles' SET has_training_capability=TRUE, training_capability_granted_at=NOW(); INSERT into 'customer_capabilities'.`
- **Downstream Events & Notifications:** Email notification: 'Congratulations! Your Commercial Cultivation Capability is now active.'
- **Cross-Module Dependencies:** Training Module, Catalog Module (commercial product gate).
- **Testability & Environment Prerequisites:** Publish CourseCompletedEvent and assert customer profile capability state.

---

#### `F02.4`: Admin Customer Directory & Capability Grant
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Administrators can search customer directory by name, email, phone, or GSTIN, inspect customer order/training history, and manually grant commercial capabilities.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Customers tab)`
- **API Endpoint / Method:** `GET /api/v1/admin/customers, POST /api/v1/admin/customers/{userId}/capability`
- **Backend Service Method:** `AdminCustomerService.getAllCustomers, AdminCustomerService.grantCapability`
- **Database Tables & Constraints:** `users, customer_profiles, customer_capabilities, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `Verified in AdminCustomerController.java:25-60; AdminApplicationService.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with paginated customer list and audit record created.
- **Normal / Happy Path Flow:** Admin searches 'grower' -> Finds user -> Clicks Grant Capability -> Enters reason -> Capability active.
- **Alternative Flows:** Admin filters customers by capability status (Trained vs General).
- **Negative & Abuse Scenarios:** Non-admin accessing endpoint -> HTTP 403. Invalid userId -> HTTP 404.
- **Boundary Conditions & Limits:** Pagination: page 0..N, size capped at 100.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Concurrent capability update handled gracefully.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT into 'customer_capabilities'; INSERT into 'admin_audit_logs'.`
- **Downstream Events & Notifications:** In-app and email alert sent to target customer.
- **Cross-Module Dependencies:** Admin Audit Log Module, Identity Module.
- **Testability & Environment Prerequisites:** Invoke admin customer API with admin JWT and verify audit log entry.

---

### MOD-03: Catalog, Merchandising & Search
- **Package / Namespace:** `com.sporekart.catalog`
- **Total Features Cataloged:** 8

#### `F03.1`: Category Taxonomy & Navigation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Maintains hierarchical categories (e.g. Oyster Spawn, Button Spawn, Substrates, Lab Equipment, Sterilization Tools). Categories have unique URL-friendly slugs and display order.

##### Architectural Traceability
- **User Interface Component:** `CategoryCarousel.jsx, Navbar.jsx, CatalogPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/catalog/categories`
- **Backend Service Method:** `CatalogApplicationService.getAllCategories`
- **Database Tables & Constraints:** `categories`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java, 01_guest_browsing.spec.js`
- **Verification Evidence:** `Verified in CatalogController.java:25-38; CategoryRepository.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with active categories sorted by display sequence.
- **Normal / Happy Path Flow:** User opens site -> Categories populate carousel and dropdown menu.
- **Alternative Flows:** Selecting category navigates to /products/:categorySlug.
- **Negative & Abuse Scenarios:** Querying deactivated category -> Excluded from public response.
- **Boundary Conditions & Limits:** Slug length max 100 characters; alphanumeric + hyphens only.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database read error returns empty list fallback with cached categories.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None (Read-only query).`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Frontend Router.
- **Testability & Environment Prerequisites:** Assert API response matches seeded category taxonomy.

---

#### `F03.2`: Product Listing & Multi-Param Filtering
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Provides paginated catalog of active products. Supports filtering by product type (SPAWN, KIT, EQUIPMENT, CHEMICAL), category slug, price range, and sort order (price asc/desc, popularity, newest).

##### Architectural Traceability
- **User Interface Component:** `CatalogPage.jsx, ProductGrid.jsx`
- **API Endpoint / Method:** `GET /api/v1/catalog/products`
- **Backend Service Method:** `CatalogApplicationService.getAllActiveProducts`
- **Database Tables & Constraints:** `products, product_variants, categories`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java, 01_guest_browsing.spec.js, fe-discovery.test.jsx`
- **Verification Evidence:** `Verified in CatalogController.java:40-65; ProductRepository.java:30-80.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with Page<ProductDto> containing variant price intervals.
- **Normal / Happy Path Flow:** User visits /products -> Filters by 'Oyster' -> Grid updates with matching spawn products.
- **Alternative Flows:** Empty filter matches returns empty page with EmptyState.jsx component.
- **Negative & Abuse Scenarios:** Negative page index (e.g. page=-1) -> Defaults to page 0. Page size > 100 capped at 100.
- **Boundary Conditions & Limits:** Page size minimum 1, maximum 100, default 24.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database timeout returns HTTP 500.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None (Read-only query).`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Analytics Module (funnel tracking).
- **Testability & Environment Prerequisites:** Execute pagination queries verifying boundary offsets.

---

#### `F03.3`: Product Detail View & Variant Resolution
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Resolves product by slug. Includes high-res gallery images, all packaging variants (e.g. 500g, 1kg, 5kg commercial sack), SKU, GST tax percentage, stock status badge, and agronomy specs.

##### Architectural Traceability
- **User Interface Component:** `ProductDetailPage.jsx, ProductCard.jsx`
- **API Endpoint / Method:** `GET /api/v1/catalog/products/{slug}`
- **Backend Service Method:** `CatalogApplicationService.getProductBySlug`
- **Database Tables & Constraints:** `products, product_variants, product_information, product_media, inventory_records`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java, 02_product_details.spec.js`
- **Verification Evidence:** `Verified in CatalogController.java:70-85; ProductDetailPage.jsx:35-150.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with ProductDetailDto; HTTP 404 if product inactive or slug invalid.
- **Normal / Happy Path Flow:** User clicks product -> Page loads details -> User switches variant -> Price and SKU update.
- **Alternative Flows:** Out of stock variant shows 'Temporarily Out of Stock' badge and disables Add to Cart.
- **Negative & Abuse Scenarios:** Non-existent slug -> HTTP 404 'Product not found'.
- **Boundary Conditions & Limits:** Slug max 255 chars; variants array non-empty for purchasable products.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Missing variant record logs warning and returns base product information.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None (Triggers asynchronous telemetry view event).`
- **Downstream Events & Notifications:** Asynchronous ProductViewEvent published to analytics.
- **Cross-Module Dependencies:** Inventory Module, Media Module, Reviews Module.
- **Testability & Environment Prerequisites:** Request active vs inactive product slug.

---

#### `F03.4`: Popular & Best-Selling Merchandising
- **Rule Classification:** **`[INFERRED]`**
- **Core Business Rule:** Aggregates products based on recent sales volume and customer review ratings to populate 'Grower Favorites' and 'Best Sellers' carousels on Homepage.

##### Architectural Traceability
- **User Interface Component:** `HomePage.jsx, ProductCarousel.jsx`
- **API Endpoint / Method:** `GET /api/v1/products/popular, GET /api/v1/products/bestsellers`
- **Backend Service Method:** `CatalogApplicationService.getPopularProducts`
- **Database Tables & Constraints:** `products, product_variants, analytics_metrics`
- **External Integrations:** `None`
- **Test Case Reference:** `01_guest_browsing.spec.js, HomePage.test.jsx`
- **Verification Evidence:** `Verified in CatalogController.java:90-110.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with List<ProductDto> capped at requested limit (default 6).
- **Normal / Happy Path Flow:** Homepage renders -> Popular products query completes -> Renders interactive carousel.
- **Alternative Flows:** If sales telemetry sparse, falls back to newly created featured products.
- **Negative & Abuse Scenarios:** Invalid limit param (e.g. limit=-5) -> Defaults to 6.
- **Boundary Conditions & Limits:** Limit 1 to 20.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Fallback to static featured products on database timeout.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Analytics Module.
- **Testability & Environment Prerequisites:** Verify returned product count equals requested limit.

---

#### `F03.5`: Global Multi-Entity Full-Text Search
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Accepts query string 'q'. Performs case-insensitive matching across Products (title, description), Training Courses (title, syllabus), Blog Posts (title, tags), and Agronomy Guides.

##### Architectural Traceability
- **User Interface Component:** `GlobalSearch.jsx, Navbar.jsx`
- **API Endpoint / Method:** `GET /api/v1/search`
- **Backend Service Method:** `GlobalSearchService.searchAll`
- **Database Tables & Constraints:** `products, courses, blog_posts, content_articles`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java, 01_guest_browsing.spec.js`
- **Verification Evidence:** `Verified in GlobalSearchController.java:25-50; GlobalSearch.jsx:20-80.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with grouped results: products[], courses[], articles[].
- **Normal / Happy Path Flow:** User types 'milky' -> Dropdown displays Milky Mushroom Spawn + Cultivation Masterclass.
- **Alternative Flows:** Blank query returns empty lists.
- **Negative & Abuse Scenarios:** Special SQL characters (%, _, ') sanitized against injection attacks.
- **Boundary Conditions & Limits:** Query length 2 to 100 characters; whitespace trimmed.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Search timeout returns partial results.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Content Module, Training Module, Catalog Module.
- **Testability & Environment Prerequisites:** Search with alphanumeric, punctuation, and Unicode strings.

---

#### `F03.6`: Agronomy Specifications Management
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Allows administrators to attach technical mycology specifications to products: optimal temperature range (e.g. 24-28C), humidity requirement (85-90%), incubation period (18-21 days), substrate compatibility (Paddy straw, wheat straw, sawdust), and biological efficiency yield (80-120%).

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Catalog tab), ProductDetailPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/admin/catalog/products/{id}/information`
- **Backend Service Method:** `ProductInformationService.saveOrUpdate`
- **Database Tables & Constraints:** `product_information`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java, 10_admin_product_creation.spec.js`
- **Verification Evidence:** `Verified in AdminCatalogController.java:95-120; V16__create_product_information.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with saved ProductInformationDto; displayed on product specs tab.
- **Normal / Happy Path Flow:** Admin fills agronomy attributes -> Saves -> Displayed in technical specs accordion.
- **Alternative Flows:** Product without agronomy info hides technical specs tab cleanly.
- **Negative & Abuse Scenarios:** Negative temperature or invalid range -> HTTP 400 validation error.
- **Boundary Conditions & Limits:** Temperature string max 50 chars; humidity percentage 0 to 100%.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Constraint failure rolled back.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT or UPDATE on 'product_information'.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Admin Audit Module.
- **Testability & Environment Prerequisites:** Update agronomy specs and verify detail page rendering.

---

#### `F03.7`: Product Offers & Promotional Badges
- **Rule Classification:** **`[INFERRED]`**
- **Core Business Rule:** Administrators can attach limited-time offer badges (e.g. 'Introductory 15% Off', 'Buy 5 Get 1 Free') to specific products with start and end dates.

##### Architectural Traceability
- **User Interface Component:** `ProductCard.jsx, ProductDetailPage.jsx, HomePage.jsx`
- **API Endpoint / Method:** `POST /api/v1/admin/catalog/offers`
- **Backend Service Method:** `CatalogApplicationService.createOffer`
- **Database Tables & Constraints:** `product_offers`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java`
- **Verification Evidence:** `Verified in AdminCatalogController.java:130-155; V3__create_catalog_enhancements.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; offer badge rendered on product card during active date window.
- **Normal / Happy Path Flow:** Admin creates offer -> Badge appears on card -> Expired offer auto-hidden.
- **Alternative Flows:** Overlapping offers prioritize highest discount badge.
- **Negative & Abuse Scenarios:** End date before start date -> HTTP 400 'End date must be after start date'.
- **Boundary Conditions & Limits:** Date range ISO-8601 timestamps; badge text max 100 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database constraint violation handled.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT into 'product_offers'.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Promotion Module.
- **Testability & Environment Prerequisites:** Create offer with past vs future date window.

---

#### `F03.8`: Admin Catalog Control Plane (CRUD Operations)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Full administrative lifecycle for catalog: Create product, edit pricing, toggle active status, add SKU variants, reorder media images, and publish drafts.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (~444 KB)`
- **API Endpoint / Method:** `POST /api/v1/admin/catalog/products, PUT /api/v1/admin/catalog/products/{id}, PATCH /api/v1/admin/catalog/products/{id}/status, POST /api/v1/admin/catalog/products/{id}/variants`
- **Backend Service Method:** `CatalogApplicationService`
- **Database Tables & Constraints:** `products, product_variants, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java, 10_admin_product_creation.spec.js, admin-console-full-validation.test.jsx`
- **Verification Evidence:** `Verified in AdminCatalogController.java:30-90.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200/201 with created entity; logs action to admin_audit_logs.
- **Normal / Happy Path Flow:** Admin fills product form -> Adds 2 variants -> Uploads image -> Clicks Publish -> Live in store.
- **Alternative Flows:** Draft product saved without variants; cannot be activated until at least 1 variant exists.
- **Negative & Abuse Scenarios:** Duplicate SKU -> HTTP 400 'SKU already exists'. Duplicate slug -> HTTP 400 'Slug already in use'.
- **Boundary Conditions & Limits:** Base price >= 0.00; Title 3 to 255 chars; SKU alphanumeric uppercase.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Rollback on partial variant insert failure.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT/UPDATE on 'products', 'product_variants'; INSERT into 'admin_audit_logs'.`
- **Downstream Events & Notifications:** Admin audit log recorded.
- **Cross-Module Dependencies:** Inventory Module (creates default 0-stock record), Media Module.
- **Testability & Environment Prerequisites:** Create full product hierarchy via Admin API and verify database state.

---

### MOD-04: Inventory & Stock Control
- **Package / Namespace:** `com.sporekart.catalog`
- **Total Features Cataloged:** 6

#### `F04.1`: Real-Time Stock Query
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Fetches available_quantity and reserved_quantity from inventory_records. Product variant card displays 'In Stock', 'Only X Left', or 'Out of Stock'.

##### Architectural Traceability
- **User Interface Component:** `ProductCard.jsx, AvailabilityBadge.jsx, ProductDetailPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/catalog/products/{slug}`
- **Backend Service Method:** `InventoryService.getInventoryRecord`
- **Database Tables & Constraints:** `inventory_records`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java, 02_product_details.spec.js`
- **Verification Evidence:** `InventoryRecord.java:10-35; InventoryService.java:30-65.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns accurate available inventory count.
- **Normal / Happy Path Flow:** Product loads -> Variant resolved -> Badge shows real-time availability.
- **Alternative Flows:** When available <= 5, displays urgency badge.
- **Negative & Abuse Scenarios:** Missing inventory record defaults available count to 0.
- **Boundary Conditions & Limits:** Stock >= 0; Integer range 0 to 1,000,000.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Default to Out of Stock on query error.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module.
- **Testability & Environment Prerequisites:** Seed inventory_record with 0, 3, and 50 units.

---

#### `F04.2`: Pessimistic Stock Reservation at Checkout
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Locks inventory_records row using PESSIMISTIC_WRITE (SELECT FOR UPDATE). Decrements available_quantity and increments reserved_quantity atomically. Throws IllegalStateException if insufficient stock.

##### Architectural Traceability
- **User Interface Component:** `CheckoutPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/orders`
- **Backend Service Method:** `InventoryService.reserveStock`
- **Database Tables & Constraints:** `inventory_records, inventory_audit_events`
- **External Integrations:** `None`
- **Test Case Reference:** `PaymentModuleTest.java, ExtendedIntegrationTest.java`
- **Verification Evidence:** `InventoryRecordRepository.java:18 ('findByVariantIdForUpdate'); InventoryService.java:70-110.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Stock reserved atomically; prevents overselling across parallel checkout requests.
- **Normal / Happy Path Flow:** Order created -> Available stock drops -> Reserved stock increases -> Audit log created.
- **Alternative Flows:** Concurrent request waits on row lock until transaction commits or rolls back.
- **Negative & Abuse Scenarios:** Requested quantity > available stock -> HTTP 409 'Insufficient stock for variant'.
- **Boundary Conditions & Limits:** Exact stock checkout (quantity == available_quantity).

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Deadlock detection rollback with HTTP 500.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `UPDATE inventory_records SET available_quantity = available_quantity - ?, reserved_quantity = reserved_quantity + ?; INSERT into inventory_audit_events.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Spawn concurrent order threads on 1 unit inventory.

---

#### `F04.3`: Stock Purchase Confirmation upon Payment
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When order transitions to PAID via Razorpay verification or webhook, reserved_quantity is permanently decremented. Confirms permanent sale.

##### Architectural Traceability
- **User Interface Component:** `PaymentPage.jsx, Webhook`
- **API Endpoint / Method:** `POST /api/v1/payment/verify or webhook`
- **Backend Service Method:** `InventoryService.confirmPurchase`
- **Database Tables & Constraints:** `inventory_records, inventory_audit_events`
- **External Integrations:** `None`
- **Test Case Reference:** `PaymentModuleTest.java, 07_payment.spec.js`
- **Verification Evidence:** `OrderService.java:370-378; InventoryService.java:115-145.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Reserved quantity decremented without altering available quantity.
- **Normal / Happy Path Flow:** Payment captured -> Order marked PAID -> confirmPurchase decrements reserved stock.
- **Alternative Flows:** Webhook duplicates idempotently ignored.
- **Negative & Abuse Scenarios:** Confirming unreserved stock logs warning.
- **Boundary Conditions & Limits:** reserved_quantity >= quantity.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Audit event captures anomaly.
- **Required Permissions & Access Control:** `System / Webhook`
- **Expected Database State Mutations:** `UPDATE inventory_records SET reserved_quantity = reserved_quantity - ?; INSERT into inventory_audit_events (action='PURCHASE_CONFIRMED').`
- **Downstream Events & Notifications:** Publishes OrderDeliveredEvent / Paid notification.
- **Cross-Module Dependencies:** Payment Module, Order Module.
- **Testability & Environment Prerequisites:** Verify inventory record numbers before and after payment verification.

---

#### `F04.4`: Stock Release on Order Cancellation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When an unpaid or paid order is cancelled before shipping, inventoryService.releaseCancelledOrder restores available_quantity and decrements reserved (or total) stock. Emits RESTOCK audit event.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx, AdminDashboardPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/orders/{id}/cancel`
- **Backend Service Method:** `InventoryService.releaseCancelledOrder`
- **Database Tables & Constraints:** `inventory_records, inventory_audit_events`
- **External Integrations:** `None`
- **Test Case Reference:** `04_order_cancellation_lifecycle.spec.js`
- **Verification Evidence:** `OrderService.java:566-571; InventoryService.java:150-185.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Available stock immediately restored in store catalog.
- **Normal / Happy Path Flow:** User cancels order -> Stock replenished -> Restock event logged.
- **Alternative Flows:** Admin cancellation releases stock with 'ADMIN_CANCEL' reason.
- **Negative & Abuse Scenarios:** Cancelling shipped order rejected.
- **Boundary Conditions & Limits:** Cancelled quantity equal to order item quantity.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Transaction rollback on lock timeout.
- **Required Permissions & Access Control:** `Authenticated / Session Owner / Admin`
- **Expected Database State Mutations:** `UPDATE inventory_records SET available_quantity = available_quantity + ?; INSERT into inventory_audit_events.`
- **Downstream Events & Notifications:** In-app and email order cancellation notice.
- **Cross-Module Dependencies:** Order Module, Wallet Module.
- **Testability & Environment Prerequisites:** Cancel pending order and assert available_quantity increment.

---

#### `F04.5`: Immutable Inventory Audit Event Log
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Every change to stock (RESERVE, CONFIRM, CANCEL_RELEASE, REPLENISH, DAMAGE_ADJUSTMENT) writes an immutable record to inventory_audit_events with timestamp, delta, and actor.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Inventory tab)`
- **API Endpoint / Method:** `Internal audit`
- **Backend Service Method:** `InventoryService.recordAuditEvent`
- **Database Tables & Constraints:** `inventory_audit_events`
- **External Integrations:** `None`
- **Test Case Reference:** `CatalogModuleTest.java`
- **Verification Evidence:** `InventoryAuditEvent.java:10-35; V5__create_inventory_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Accurate audit trail for stock reconciliations.
- **Normal / Happy Path Flow:** Stock modified -> Record inserted.
- **Alternative Flows:** System automated vs Admin manual adjustments distinguished.
- **Negative & Abuse Scenarios:** Null reason defaults to 'SYSTEM_ADJUSTMENT'.
- **Boundary Conditions & Limits:** Delta can be positive or negative integer.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Fail-safe: audit failure fails the parent transaction.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT into inventory_audit_events.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Admin Audit Module.
- **Testability & Environment Prerequisites:** Query inventory_audit_events after multiple stock operations.

---

#### `F04.6`: Admin Stock Replenishment
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Warehouse operators can replenish stock for a variant by submitting positive quantity and restock reason. Adds to available_quantity atomically.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/admin/catalog/inventory/{variantId}/replenish`
- **Backend Service Method:** `InventoryService.replenishStock`
- **Database Tables & Constraints:** `inventory_records, inventory_audit_events, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `10_admin_product_creation.spec.js`
- **Verification Evidence:** `AdminCatalogController.java:125-145; InventoryService.java:190-220.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with updated inventory record; store reflects new stock immediately.
- **Normal / Happy Path Flow:** Admin enters 100 units -> Reason 'Supplier Batch #441' -> Stock updated.
- **Alternative Flows:** If no prior record, creates new inventory_records row.
- **Negative & Abuse Scenarios:** Quantity <= 0 -> HTTP 400 'Replenish quantity must be greater than zero'.
- **Boundary Conditions & Limits:** Max replenishment 100,000 units per request.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Optimistic/Pessimistic lock failure retry.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `UPDATE inventory_records SET available_quantity = available_quantity + ?; INSERT into admin_audit_logs.`
- **Downstream Events & Notifications:** Admin audit event.
- **Cross-Module Dependencies:** Catalog Module, Admin Module.
- **Testability & Environment Prerequisites:** Replenish 50 units and verify inventory count.

---

### MOD-05: Cart & Promotions
- **Package / Namespace:** `com.sporekart.cart`
- **Total Features Cataloged:** 9

#### `F05.1`: Guest Cart Creation & Session Tracking
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Creates or retrieves active cart for anonymous guest via X-Session-ID header. Persists items across page refreshes.

##### Architectural Traceability
- **User Interface Component:** `CartDrawer.jsx, ProductAddedPopupDrawer.jsx`
- **API Endpoint / Method:** `GET /api/v1/cart`
- **Backend Service Method:** `CartService.getOrCreateCart`
- **Database Tables & Constraints:** `carts, cart_items`
- **External Integrations:** `None`
- **Test Case Reference:** `03_guest_cart.spec.js, fe-popup-drawer.test.jsx`
- **Verification Evidence:** `CartController.java:25-45; CartService.java:35-70.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with CartResponse (items, subtotal, discount, total).
- **Normal / Happy Path Flow:** Guest adds item -> Cart auto-provisioned -> Drawer opens with item.
- **Alternative Flows:** Returning guest with existing session ID resumes existing cart.
- **Negative & Abuse Scenarios:** Corrupt session ID handled by generating new session cart.
- **Boundary Conditions & Limits:** Session ID length 41 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database timeout returns fallback empty cart.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `INSERT into carts (session_id, status='ACTIVE').`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module.
- **Testability & Environment Prerequisites:** Fetch cart with novel X-Session-ID and verify created status.

---

#### `F05.2`: Cart Item Mutations (Add, Update, Remove, Clear)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Supports adding variants, updating quantity, removing items, and clearing cart. Verifies available stock before adding or incrementing.

##### Architectural Traceability
- **User Interface Component:** `CartDrawer.jsx, CartPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/cart/items, PUT /api/v1/cart/items/{variantId}, DELETE /api/v1/cart/items/{variantId}, DELETE /api/v1/cart`
- **Backend Service Method:** `CartService.addItem, updateItemQuantity, removeItem, clearCart`
- **Database Tables & Constraints:** `carts, cart_items`
- **External Integrations:** `None`
- **Test Case Reference:** `03_guest_cart.spec.js, fe-3.test.jsx`
- **Verification Evidence:** `CartController.java:48-95; CartService.java:75-160.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns updated CartResponse with calculated totals and line items.
- **Normal / Happy Path Flow:** User clicks Add -> Quantity set to 1 -> Total recalculated.
- **Alternative Flows:** Adding existing variant increments existing line item quantity.
- **Negative & Abuse Scenarios:** Requested qty > available stock -> HTTP 400 'Requested quantity exceeds available stock'.
- **Boundary Conditions & Limits:** Quantity 1 to 50 units per line item.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Invalid variant ID -> HTTP 404.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `INSERT/UPDATE/DELETE on cart_items; UPDATE carts SET updated_at=NOW().`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Inventory Module.
- **Testability & Environment Prerequisites:** Execute full CRUD cycle on cart items.

---

#### `F05.3`: Anonymous Guest-to-User Cart Merging
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When guest logs in, POST /cart/merge transfers all guest cart items into customer's persistent user cart, combining quantities for identical variants up to available stock. Marks guest cart CONVERTED.

##### Architectural Traceability
- **User Interface Component:** `AuthForm.jsx, CartDrawer.jsx`
- **API Endpoint / Method:** `POST /api/v1/cart/merge`
- **Backend Service Method:** `CartService.mergeGuestCart`
- **Database Tables & Constraints:** `carts, cart_items`
- **External Integrations:** `None`
- **Test Case Reference:** `05_cart_merge.spec.js, CartModuleTest.java`
- **Verification Evidence:** `CartController.java:98-110; CartService.java:165-215.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns merged user cart; guest session items preserved.
- **Normal / Happy Path Flow:** Guest has 2 items -> Logs in -> Merged into user cart with 0 lost items.
- **Alternative Flows:** If user already had items, quantities sum together.
- **Negative & Abuse Scenarios:** Combined quantity > stock -> Clamped to maximum available stock.
- **Boundary Conditions & Limits:** No-op if guest cart is empty.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database constraint violation rolls back merge.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `UPDATE carts SET status='CONVERTED' WHERE session_id=?; UPDATE/INSERT cart_items in user cart.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Identity Module.
- **Testability & Environment Prerequisites:** Seed guest cart and verify items appear under user cart after merge.

---

#### `F05.4`: Single Active Cart Partial Unique Constraint
- **Rule Classification:** **`[INFERRED]`**
- **Core Business Rule:** Enforces that a user can have at most one cart with status='ACTIVE' at any time via Flyway V37 partial index 'uq_carts_user_active'. Prevents duplicate cart race conditions.

##### Architectural Traceability
- **User Interface Component:** `Backend enforcement`
- **API Endpoint / Method:** `CartService.getOrCreateCart`
- **Backend Service Method:** `CartRepository.findActiveByUserId`
- **Database Tables & Constraints:** `carts (uq_carts_user_active)`
- **External Integrations:** `None`
- **Test Case Reference:** `CartModuleTest.java`
- **Verification Evidence:** `V37__deduplicate_and_unique_active_user_cart.sql; CartRepository.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Guarantees database consistency; prevents concurrent active cart creation.
- **Normal / Happy Path Flow:** User opens multiple tabs -> All tabs point to the exact same active cart record.
- **Alternative Flows:** Old active carts converted to CONVERTED on duplicate detection.
- **Negative & Abuse Scenarios:** Concurrent thread inserting second active cart throws DataIntegrityViolationException.
- **Boundary Conditions & Limits:** One active cart per user ID; session-based carts can coexist until login.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Constraint catch automatically recovers by querying the winner cart.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `Enforced by PostgreSQL unique index.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Database Schema.
- **Testability & Environment Prerequisites:** Attempt inserting two active carts for same user_id in integration test.

---

#### `F05.5`: Pre-Checkout Cart Stock & Price Validation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Validates all cart items before proceeding to checkout: checks if variants are still active, prices have changed, or items are out of stock. Flags discrepancies.

##### Architectural Traceability
- **User Interface Component:** `CheckoutPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/cart/validate`
- **Backend Service Method:** `CartService.validateCart`
- **Database Tables & Constraints:** `carts, cart_items, product_variants, inventory_records`
- **External Integrations:** `None`
- **Test Case Reference:** `fe-3.test.jsx, 03_catalog_cart_checkout.spec.js`
- **Verification Evidence:** `CartController.java:115-130; CartService.java:220-255.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with CartValidationDto (isValid, outOfStockItems[], priceChangedItems[]).
- **Normal / Happy Path Flow:** All items valid -> Checkout proceeds seamlessly.
- **Alternative Flows:** If price changed, cart updates to new price and warns customer.
- **Negative & Abuse Scenarios:** Item out of stock -> Returns isValid=false; checkout button disabled.
- **Boundary Conditions & Limits:** Zero item cart returns isValid=false 'Cart is empty'.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database read error returns HTTP 500.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `Updates cart item prices if modified in catalog.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module, Inventory Module.
- **Testability & Environment Prerequisites:** Modify product variant price and assert validateCart response.

---

#### `F05.6`: Coupon & Promo Code Validation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Validates promo code against promotions table: verifies active status, start/end dates, audience (CUSTOMER vs TRAINEE), min order value, max usage limits, and user single-use constraints.

##### Architectural Traceability
- **User Interface Component:** `PromoCodeSection.jsx, CheckoutPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/cart/apply-promotion`
- **Backend Service Method:** `PromotionService.validateAndCalculate`
- **Database Tables & Constraints:** `promotions, promotion_usages, carts`
- **External Integrations:** `None`
- **Test Case Reference:** `fe-promocode.test.jsx, fe-5.test.jsx`
- **Verification Evidence:** `PromotionService.java:40-110; V20__create_promotions.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with updated cart discount and promotional savings banner.
- **Normal / Happy Path Flow:** User applies 'MUSHROOM10' -> Verified -> 10% discount subtracted from subtotal.
- **Alternative Flows:** Free shipping promo sets shipping fee to 0.
- **Negative & Abuse Scenarios:** Expired code -> HTTP 400 'Promo code has expired'. Min order not met -> HTTP 400 'Minimum order value of ₹500 required'.
- **Boundary Conditions & Limits:** Percentage discount 1% to 100%; Fixed discount <= subtotal; Min order >= 0.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Invalid code format trimmed and validated case-insensitively.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `UPDATE carts SET applied_promo_code=?, promo_discount_inr=?;`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Test with expired, audience-mismatched, and below-minimum order promos.

---

#### `F05.7`: Discount & Free Shipping Computation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Computes exact discount amount. If percentage, caps at max_discount_inr if specified. Adds GST calculation on discounted taxable value. Sets shipping_fee_inr.

##### Architectural Traceability
- **User Interface Component:** `CartDrawer.jsx, CartPage.jsx, CheckoutPage.jsx`
- **API Endpoint / Method:** `Subsumed in /cart/apply-promotion and /orders`
- **Backend Service Method:** `PromotionService.calculateDiscount`
- **Database Tables & Constraints:** `promotions`
- **External Integrations:** `None`
- **Test Case Reference:** `fe-promocode.test.jsx, PaymentModuleTest.java`
- **Verification Evidence:** `PromotionService.java:115-160.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Accurate rupee calculations formatted to 2 decimal places with HALF_UP rounding.
- **Normal / Happy Path Flow:** ₹1,000 order with 20% capped at ₹150 discount computes exactly ₹150 discount.
- **Alternative Flows:** Flat rupee discount applied directly.
- **Negative & Abuse Scenarios:** Discount exceeding subtotal is capped so total does not drop below zero.
- **Boundary Conditions & Limits:** Rounding scale 2; RoundingMode.HALF_UP.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Arithmetic overflow protected by BigDecimal.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `Stored in cart and order entities.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Unit test discount calculation across boundary rupee amounts.

---

#### `F05.8`: Promo Code Usage Tracking & Redemption
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Upon successful order placement or training booking, records promo code usage in promotion_usages and increments current_usage_count in promotions atomically.

##### Architectural Traceability
- **User Interface Component:** `Backend enforcement`
- **API Endpoint / Method:** `Triggered via POST /orders`
- **Backend Service Method:** `PromotionService.recordUsage`
- **Database Tables & Constraints:** `promotion_usages, promotions`
- **External Integrations:** `None`
- **Test Case Reference:** `PaymentModuleTest.java`
- **Verification Evidence:** `OrderService.java:240-245; PromotionService.java:165-195.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Usage logged with orderId, userId, sessionId, and discount applied.
- **Normal / Happy Path Flow:** Order placed -> promotion_usages row inserted -> usage count incremented.
- **Alternative Flows:** Single-use promo prevents subsequent application by same customer.
- **Negative & Abuse Scenarios:** Concurrent checkout at usage limit: last winner claims, subsequent rejected.
- **Boundary Conditions & Limits:** current_usage_count <= max_usage_count.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Transaction rollback on failure.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `INSERT into promotion_usages; UPDATE promotions SET current_usage_count=current_usage_count+1.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module, Training Module.
- **Testability & Environment Prerequisites:** Assert promotion_usages table record after checkout.

---

#### `F05.9`: Admin Promotion Control Plane
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Administrators can create coupons, configure target audiences (CUSTOMER, TRAINEE, BATCH_SPECIFIC), set start/end dates, toggle active status, and view redemption counts.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Promotions tab)`
- **API Endpoint / Method:** `GET /api/v1/admin/promotions, POST /api/v1/admin/promotions, PUT /api/v1/admin/promotions/{id}, PATCH /api/v1/admin/promotions/{id}/status, DELETE /api/v1/admin/promotions/{id}`
- **Backend Service Method:** `PromotionService`
- **Database Tables & Constraints:** `promotions, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminPromotionController.java:25-90; V22__add_batch_and_course_promotion_targets.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200/201 with created promotion; immediately valid in checkout.
- **Normal / Happy Path Flow:** Admin fills promo code 'DIWALI2026' -> Sets 20% -> Saves -> Active in system.
- **Alternative Flows:** Admin deactivates promo -> Instantly rejected in checkout.
- **Negative & Abuse Scenarios:** Duplicate promo code -> HTTP 400 'Promotion code already exists'.
- **Boundary Conditions & Limits:** Code alphanumeric uppercase; discount 0.01 to 100,000.00.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Cannot delete promo with existing redemption history (soft deactivate only).
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT/UPDATE/DELETE on promotions; INSERT into admin_audit_logs.`
- **Downstream Events & Notifications:** Admin audit log.
- **Cross-Module Dependencies:** Admin Module.
- **Testability & Environment Prerequisites:** Create promo via Admin API and verify client application.

---

### MOD-06: Orders & Invoicing
- **Package / Namespace:** `com.sporekart.order`
- **Total Features Cataloged:** 10

#### `F06.1`: Order Creation from Cart with Idempotency
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Converts active cart to order in PENDING_PAYMENT status. Locks and reserves inventory. Deduplicates concurrent requests using 'Idempotency-Key' header. Clears cart upon order creation.

##### Architectural Traceability
- **User Interface Component:** `CheckoutPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/orders`
- **Backend Service Method:** `OrderService.createOrderFromCart`
- **Database Tables & Constraints:** `orders, order_items, order_events, carts, cart_items, inventory_records`
- **External Integrations:** `None`
- **Test Case Reference:** `PaymentModuleTest.java, 07_payment.spec.js`
- **Verification Evidence:** `OrderService.java:65-260; OrderController.java:23-32.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with OrderResponse; order status set to PENDING_PAYMENT; stock reserved.
- **Normal / Happy Path Flow:** User clicks Place Order -> Cart converted -> Returns Order with unique order number.
- **Alternative Flows:** Replaying identical Idempotency-Key returns already-created order without double reservation.
- **Negative & Abuse Scenarios:** Empty cart -> HTTP 400 'Cart is empty'. Insufficient stock -> HTTP 409.
- **Boundary Conditions & Limits:** Order total >= 0.00; Item quantity 1 to 1000.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Stock reservation failure aborts transaction; cart preserved.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `INSERT into orders, order_items, order_events; DELETE from cart_items; UPDATE inventory_records.`
- **Downstream Events & Notifications:** Publishes OrderCreatedEvent to analytics and notification outbox.
- **Cross-Module Dependencies:** Cart Module, Inventory Module, Analytics Module.
- **Testability & Environment Prerequisites:** Place order with valid idempotency key and verify DB state.

---

#### `F06.2`: Immutable Shipping Address Snapshotting
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Freezes complete shipping address details (recipient name, phone, alternate phone, line1, line2, city, state, pincode) as an immutable JSON string in orders.shipping_address_json at order placement time.

##### Architectural Traceability
- **User Interface Component:** `CheckoutPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/orders`
- **Backend Service Method:** `OrderService.resolveAddressSnapshot`
- **Database Tables & Constraints:** `orders.shipping_address_json`
- **External Integrations:** `None`
- **Test Case Reference:** `PaymentModuleTest.java`
- **Verification Evidence:** `OrderService.java:587-622; OrderAddressSnapshot.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Address snapshot in order remains unaltered even if user edits address book later.
- **Normal / Happy Path Flow:** Address selected -> Serialized to JSON -> Saved in order record.
- **Alternative Flows:** Guest address entered manually on checkout page validated and snapshotted.
- **Negative & Abuse Scenarios:** Missing mandatory field (e.g. city or pincode) -> HTTP 400 validation error.
- **Boundary Conditions & Limits:** Indian PIN code exact 6 digits matching '^[1-9][0-9]{5}$'.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** JSON serialization exception rolls back order.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `Stored in orders.shipping_address_json.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Module, Shipping Module.
- **Testability & Environment Prerequisites:** Modify customer address and verify past order snapshot unchanged.

---

#### `F06.3`: Unique Order Number Generation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Generates human-readable, non-sequential order number matching format 'SK-YYYYMMDD-XXXXXX' using SecureRandom. Validates uniqueness against database with up to 10 retry attempts.

##### Architectural Traceability
- **User Interface Component:** `OrderConfirmationPage.jsx, DashboardPage.jsx`
- **API Endpoint / Method:** `Subsumed in POST /orders`
- **Backend Service Method:** `OrderService.generateOrderNumber`
- **Database Tables & Constraints:** `orders.order_number (UNIQUE)`
- **External Integrations:** `None`
- **Test Case Reference:** `OrderModuleTest.java`
- **Verification Evidence:** `OrderService.java:626-635.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Guaranteed collision-free unique order identifier.
- **Normal / Happy Path Flow:** Order created -> Receives number e.g. 'SK-20261017-849102'.
- **Alternative Flows:** Fallback to UUID suffix if 10 consecutive random collisions occur.
- **Negative & Abuse Scenarios:** Duplicate key violation prevented by pre-check and DB constraint.
- **Boundary Conditions & Limits:** Prefix 12 chars + 6 digits; exact 18-20 character length.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database unique constraint catch.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `Saved in orders.order_number.`
- **Downstream Events & Notifications:** Included in customer SMS and email confirmation.
- **Cross-Module Dependencies:** Shipping Module (used as carrier order reference).
- **Testability & Environment Prerequisites:** Generate 100 consecutive order numbers asserting uniqueness.

---

#### `F06.4`: Customer Order History Query
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Fetches chronological list of past orders for authenticated user (or guest session). Excludes internal draft states.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Orders tab)`
- **API Endpoint / Method:** `GET /api/v1/orders`
- **Backend Service Method:** `OrderService.getUserOrders`
- **Database Tables & Constraints:** `orders, order_items`
- **External Integrations:** `None`
- **Test Case Reference:** `02_customer_account_lifecycle.spec.js`
- **Verification Evidence:** `OrderController.java:34-44; OrderRepository.java:25-45.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with List<OrderResponse> sorted by created_at DESC.
- **Normal / Happy Path Flow:** User opens Dashboard -> Orders tab renders past orders with statuses and tracking links.
- **Alternative Flows:** Guest orders retrieved via X-Session-ID header.
- **Negative & Abuse Scenarios:** Unauthenticated request without session ID returns HTTP 401.
- **Boundary Conditions & Limits:** Returns up to 50 recent orders.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database timeout returns HTTP 500.
- **Required Permissions & Access Control:** `Authenticated / Session Owner`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Module.
- **Testability & Environment Prerequisites:** Verify user A cannot see orders belonging to user B.

---

#### `F06.5`: Direct Order Detail Access Control
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Validates that requested order belongs to authenticated userId or active guest sessionId. Unauthorized callers receive HTTP 403 Forbidden.

##### Architectural Traceability
- **User Interface Component:** `OrderConfirmationPage.jsx, DashboardPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/orders/{id}`
- **Backend Service Method:** `OrderService.getOrderDetails`
- **Database Tables & Constraints:** `orders, order_items, order_events`
- **External Integrations:** `None`
- **Test Case Reference:** `03_catalog_cart_checkout.spec.js`
- **Verification Evidence:** `OrderController.java:47-55; OrderService.java:268-288.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with complete OrderResponse for authorized caller; HTTP 403 for unauthorized caller.
- **Normal / Happy Path Flow:** Order completed -> Redirected to /order-confirmation/:id -> Displays receipt.
- **Alternative Flows:** Guest accesses receipt in same session.
- **Negative & Abuse Scenarios:** User B accessing User A order UUID -> HTTP 403 FORBIDDEN.
- **Boundary Conditions & Limits:** UUID format validation on path variable.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Non-existent UUID -> HTTP 404.
- **Required Permissions & Access Control:** `Session Owner / User Owner`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Security Infrastructure.
- **Testability & Environment Prerequisites:** Test IDOR boundary by requesting alien order ID.

---

#### `F06.6`: Dynamic GST-Compliant PDF Invoice Download
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Generates dynamic binary PDF document containing Sporekart agritech branding, buyer GSTIN, SAC/HSN codes (0602 for mushroom spawn), taxable value, CGST (2.5%), SGST (2.5%) or IGST (5%), total amount in INR, and digital seal.

##### Architectural Traceability
- **User Interface Component:** `OrderConfirmationPage.jsx, DashboardPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/orders/{id}/invoice`
- **Backend Service Method:** `OrderService.generateInvoicePdf`
- **Database Tables & Constraints:** `orders, order_items`
- **External Integrations:** `None`
- **Test Case Reference:** `03_catalog_cart_checkout.spec.js`
- **Verification Evidence:** `OrderController.java:57-72; OrderService.java:296-340.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with Content-Type: application/pdf and Content-Disposition attachment.
- **Normal / Happy Path Flow:** Customer clicks 'Download Tax Invoice' -> Browser downloads 'Sporekart_Invoice_SK-XXXXXX.pdf'.
- **Alternative Flows:** B2B customer invoice includes customer GSTIN and business legal name.
- **Negative & Abuse Scenarios:** Unauthorized user -> HTTP 403. Unpaid order -> Generates pro-forma invoice.
- **Boundary Conditions & Limits:** PDF size ~50-150 KB; standard A4 page layout.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** PDF generation exception returns HTTP 500.
- **Required Permissions & Access Control:** `Session Owner / User Owner`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Download PDF and assert byte length > 1000 and PDF magic header '%PDF-'.

---

#### `F06.7`: Pre-Shipment Customer Order Cancellation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Customers can cancel orders prior to SHIPPED or DELIVERED status. Automatically releases reserved stock back to available inventory. Cancels logistics pickup if scheduled. Transitions order to CANCELLED (if unpaid) or REFUNDED (if paid).

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Orders tab)`
- **API Endpoint / Method:** `POST /api/v1/orders/{id}/cancel`
- **Backend Service Method:** `OrderService.cancelOrder`
- **Database Tables & Constraints:** `orders, order_events, inventory_records, shipments`
- **External Integrations:** `Shiprocket Cancel API`
- **Test Case Reference:** `04_order_cancellation_lifecycle.spec.js`
- **Verification Evidence:** `OrderService.java:541-585.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with updated order; stock restored; cancellation event logged.
- **Normal / Happy Path Flow:** Customer clicks Cancel -> Enters reason 'Ordered wrong variety' -> Cancelled.
- **Alternative Flows:** If order was paid, triggers automatic refund credit to wallet.
- **Negative & Abuse Scenarios:** Cancelling order already SHIPPED -> HTTP 409 'Order cannot be cancelled once SHIPPED'.
- **Boundary Conditions & Limits:** Reason string max 500 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Carrier cancellation failure does not block order cancellation.
- **Required Permissions & Access Control:** `Order Owner / Session Owner`
- **Expected Database State Mutations:** `UPDATE orders SET status=?, cancellation_reason=?; INSERT into order_events.`
- **Downstream Events & Notifications:** Order cancelled email and SMS dispatched to customer; Admin notified.
- **Cross-Module Dependencies:** Inventory Module, Wallet Module, Shipping Module.
- **Testability & Environment Prerequisites:** Cancel unpaid vs paid order and assert subsequent status and inventory counts.

---

#### `F06.8`: Automated Refund-to-Wallet on Cancellation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When a paid order is cancelled, system calculates total paid amount (subtotal + tax + shipping - discount) and executes immediate credit to customer's Sporekart Wallet. Emits double-entry ledger record.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Wallet & Orders tabs)`
- **API Endpoint / Method:** `Triggered via POST /orders/{id}/cancel`
- **Backend Service Method:** `WalletService.processRefundToWallet`
- **Database Tables & Constraints:** `wallets, wallet_transactions, orders`
- **External Integrations:** `None`
- **Test Case Reference:** `05_payment_refund_lifecycle.spec.js, 06_customer_wallet_lifecycle.spec.js`
- **Verification Evidence:** `OrderService.java:404-425; WalletService.java:310-345.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Wallet balance credited instantly; customer can immediately reuse funds for checkout.
- **Normal / Happy Path Flow:** Paid order cancelled -> ₹1,200 credited to wallet -> Balance reflects ₹1,200.
- **Alternative Flows:** If payment was refunded via gateway webhook, wallet refund is skipped to prevent double refund.
- **Negative & Abuse Scenarios:** Order total zero or negative skipped cleanly.
- **Boundary Conditions & Limits:** Exact order total amount refunded.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Wallet credit failure logs error and leaves order in REFUND_PENDING for admin review.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `UPDATE wallets SET available_balance=available_balance+?; INSERT into wallet_transactions.`
- **Downstream Events & Notifications:** SMS and Email: '₹XXXX credited to your Sporekart Wallet for Order cancellation'.
- **Cross-Module Dependencies:** Wallet Module.
- **Testability & Environment Prerequisites:** Cancel paid order and verify wallet balance increased by exact totalAmountInr.

---

#### `F06.9`: Admin Order Control Plane & Terminal Enforcement
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Administrators can view all orders, filter by status, update status (CONFIRMED, PROCESSING, SHIPPED, DELIVERED). Rejects modifying terminal states (CANCELLED, REFUNDED). Prohibits manual admin jump from SHIPPED to DELIVERED (must be courier webhook driven).

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Orders tab)`
- **API Endpoint / Method:** `PUT /api/v1/admin/orders/{id}/status`
- **Backend Service Method:** `OrderService.updateOrderStatus`
- **Database Tables & Constraints:** `orders, order_events, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-order-payment-confirmation.test.jsx, 10_admin_dashboard_interactive_audit.spec.js`
- **Verification Evidence:** `OrderService.java:380-450; AdminOrderController.java:58-85.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with updated order; enforces business state transitions.
- **Normal / Happy Path Flow:** Admin confirms order -> Status becomes CONFIRMED -> Processing begins.
- **Alternative Flows:** Updating to SHIPPED triggers courier tracking notification.
- **Negative & Abuse Scenarios:** Admin updating CANCELLED order -> HTTP 409 'Order is already CANCELLED and cannot be modified'.
- **Boundary Conditions & Limits:** SHIPPED to DELIVERED restricted to carrier webhook.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database rollback on concurrent modification.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `UPDATE orders SET status=?; INSERT into order_events; INSERT into admin_audit_logs.`
- **Downstream Events & Notifications:** Order status update email/SMS sent to customer.
- **Cross-Module Dependencies:** Shipping Module, Notification Module.
- **Testability & Environment Prerequisites:** Attempt forbidden transitions (CANCELLED -> CONFIRMED, SHIPPED -> DELIVERED by Admin).

---

#### `F06.10`: Admin Packing Slip Generation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Generates PDF warehouse packing slip containing order number, picker checklist, item SKU, variant description, quantity, warehouse bin location, and shipping address for warehouse dispatch staff.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Orders tab)`
- **API Endpoint / Method:** `GET /api/v1/admin/orders/{id}/packing-slip`
- **Backend Service Method:** `OrderService.generatePackingSlipPdf`
- **Database Tables & Constraints:** `orders, order_items`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminOrderController.java:88-115; V19__add_tracking_url_and_packing_slip.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with PDF packing slip stream.
- **Normal / Happy Path Flow:** Admin clicks 'Print Packing Slip' -> PDF opens in print preview.
- **Alternative Flows:** Batch packing slip printing for multiple orders.
- **Negative & Abuse Scenarios:** Packing slip for cancelled order includes large CANCELLED watermark.
- **Boundary Conditions & Limits:** Standard A4 warehouse slip.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** PDF generation exception returns HTTP 500.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Shipping Module.
- **Testability & Environment Prerequisites:** Download packing slip for order and verify PDF content.

---

### MOD-07: Payment Systems & Gateway
- **Package / Namespace:** `com.sporekart.payment`
- **Total Features Cataloged:** 8

#### `F07.1`: Razorpay Payment Initiation for E-Commerce Orders
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Generates Razorpay order via RazorpayClient.orders.create with exact order total in paise (INR * 100). Records payment entity in INITIATED status with razorpay_order_id. Supports mock fallback mode in dev.

##### Architectural Traceability
- **User Interface Component:** `PaymentPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/payment/initiate`
- **Backend Service Method:** `PaymentService.initiatePayment, RazorpayPaymentGateway.createPaymentOrder`
- **Database Tables & Constraints:** `payments, payment_events, orders.razorpay_order_id`
- **External Integrations:** `Razorpay Orders API`
- **Test Case Reference:** `PaymentModuleTest.java, 07_payment.spec.js`
- **Verification Evidence:** `PaymentService.java:42-76; RazorpayPaymentGateway.java:35-70.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with InitiatePaymentResponse (razorpayOrderId, amountInr, currency='INR', razorpayKeyId).
- **Normal / Happy Path Flow:** User reaches payment page -> API called -> Razorpay order created -> Checkout ready.
- **Alternative Flows:** If RAZORPAY_MOCK_MODE=true, generates synthetic 'order_mock_XXXX' token without calling remote API.
- **Negative & Abuse Scenarios:** Order not found -> HTTP 404. Order already paid -> HTTP 409 'Order already paid'.
- **Boundary Conditions & Limits:** Amount converted to integer paise (e.g. ₹499.50 = 49950 paise).

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Gateway timeout returns HTTP 502 with retry advisory.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `INSERT into payments (order_id, razorpay_order_id, amount_inr, status='INITIATED'); UPDATE orders.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Initiate payment and assert razorpay_order_id format.

---

#### `F07.2`: Razorpay Payment Initiation for Training Enrollments
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Generates Razorpay payment intent specifically for classroom masterclass seat enrollment fees.

##### Architectural Traceability
- **User Interface Component:** `PaymentPage.jsx (type=enrollment)`
- **API Endpoint / Method:** `POST /api/v1/payment/initiate-enrollment`
- **Backend Service Method:** `PaymentService.initiateEnrollmentPayment`
- **Database Tables & Constraints:** `payments, payment_events, enrollments`
- **External Integrations:** `Razorpay Orders API`
- **Test Case Reference:** `PaymentModuleTest.java, 09_training_enrollment.spec.js`
- **Verification Evidence:** `PaymentController.java:45-60; PaymentService.java:85-115.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with enrollment payment intent parameters.
- **Normal / Happy Path Flow:** Trainee books slot -> Redirected to payment -> Order created.
- **Alternative Flows:** Mock mode generates mock tokens in test environment.
- **Negative & Abuse Scenarios:** Enrollment cancelled or expired -> HTTP 409.
- **Boundary Conditions & Limits:** Training fee in INR converted to paise.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Gateway error handled.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `INSERT into payments (enrollment_id, status='INITIATED').`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Training Module.
- **Testability & Environment Prerequisites:** Initiate enrollment payment and verify payment record linkage.

---

#### `F07.3`: Client Payment Signature Verification (HMAC-SHA256)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Validates cryptographic HMAC-SHA256 signature calculated over (razorpay_order_id + '|' + razorpay_payment_id) using razorpay_key_secret. If valid, marks payment CAPTURED, transitions order to PAID, and confirms reserved inventory.

##### Architectural Traceability
- **User Interface Component:** `PaymentPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/payment/verify`
- **Backend Service Method:** `PaymentService.verifyPayment, RazorpayPaymentGateway.verifyPaymentSignature`
- **Database Tables & Constraints:** `payments.status=CAPTURED, orders.status=PAID, inventory_records`
- **External Integrations:** `Local HMAC-SHA256 Cryptographic Engine`
- **Test Case Reference:** `PaymentModuleTest.java, 07_payment.spec.js`
- **Verification Evidence:** `PaymentService.java:120-190; com.razorpay.Utils.verifyPaymentSignature.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with VerifyPaymentResponse; order status set to PAID; inventory permanently deducted.
- **Normal / Happy Path Flow:** Razorpay modal succeeds -> Client sends payment ID + signature -> Verified -> Success page.
- **Alternative Flows:** In mock mode, accepts mock signature bypassing cryptographic validation.
- **Negative & Abuse Scenarios:** Signature mismatch / tampering -> HTTP 400 'Invalid payment signature'.
- **Boundary Conditions & Limits:** HMAC-SHA256 hex string exact 64 characters.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Verification failure leaves order in PENDING_PAYMENT; stock remains reserved until timeout.
- **Required Permissions & Access Control:** `Public (Session/JWT)`
- **Expected Database State Mutations:** `UPDATE payments SET status='CAPTURED', razorpay_payment_id=?; UPDATE orders SET status='PAID'.`
- **Downstream Events & Notifications:** Transactional Order Confirmation SMS and Email dispatched.
- **Cross-Module Dependencies:** Order Module, Inventory Module, Notification Module.
- **Testability & Environment Prerequisites:** Verify with valid HMAC signature vs forged signature.

---

#### `F07.4`: Razorpay Webhook Ingestion (payment.captured, order.paid)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Asynchronously receives server-to-server webhook callbacks from Razorpay. Validates X-Razorpay-Signature header against raw request body using razorpay_webhook_secret. Updates payment and order status independently of client browser.

##### Architectural Traceability
- **User Interface Component:** `Server-to-server webhook`
- **API Endpoint / Method:** `POST /api/v1/payment/webhook`
- **Backend Service Method:** `PaymentService.processWebhook`
- **Database Tables & Constraints:** `payments, payment_events, orders, enrollments`
- **External Integrations:** `Razorpay Webhook Dispatcher`
- **Test Case Reference:** `PaymentModuleTest.java, 05_payment_refund_lifecycle.spec.js`
- **Verification Evidence:** `PaymentWebhookController.java:25-50; PaymentService.java:230-310.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 acknowledgment; synchronizes order status to PAID even if customer closed browser.
- **Normal / Happy Path Flow:** Webhook delivered -> Signature verified -> Order updated to PAID -> Inventory confirmed.
- **Alternative Flows:** If order already PAID via client verify, webhook acknowledges idempotently.
- **Negative & Abuse Scenarios:** Forged webhook signature -> HTTP 400 'Invalid webhook signature'.
- **Boundary Conditions & Limits:** Raw JSON payload parsed for payload.payment.entity and payload.order.entity.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Internal error logs alert but acknowledges webhook if duplicate.
- **Required Permissions & Access Control:** `Public (Webhook secret verified)`
- **Expected Database State Mutations:** `INSERT into payment_events; UPDATE payments; UPDATE orders.`
- **Downstream Events & Notifications:** Order confirmation notice dispatched.
- **Cross-Module Dependencies:** Order Module, Training Module.
- **Testability & Environment Prerequisites:** Send simulated webhook with calculated HMAC header and assert DB sync.

---

#### `F07.5`: Webhook Idempotency & Deduplication
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Prevents double-processing of duplicate webhook dispatches by storing event_id in payment_events table with unique constraint. Catches DataIntegrityViolationException and returns HTTP 200 idempotent ignore.

##### Architectural Traceability
- **User Interface Component:** `Server-to-server webhook`
- **API Endpoint / Method:** `POST /api/v1/payment/webhook`
- **Backend Service Method:** `PaymentService.processWebhook`
- **Database Tables & Constraints:** `payment_events.event_id (UNIQUE)`
- **External Integrations:** `None`
- **Test Case Reference:** `PaymentModuleTest.java`
- **Verification Evidence:** `PaymentService.java:276-279; PaymentEvent.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Duplicate webhook received -> Acknowledged HTTP 200 without duplicate state transition or double debit.
- **Normal / Happy Path Flow:** First delivery processes -> Second delivery detected as duplicate -> Logged and skipped.
- **Alternative Flows:** Out-of-order webhook delivery handled by state sequence guards.
- **Negative & Abuse Scenarios:** Repeated failed webhook payloads deduplicated cleanly.
- **Boundary Conditions & Limits:** Razorpay event_id format 'event_XXXX'.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Graceful return without transaction rollback.
- **Required Permissions & Access Control:** `Public (Signature verified)`
- **Expected Database State Mutations:** `None on duplicate.`
- **Downstream Events & Notifications:** None on duplicate.
- **Cross-Module Dependencies:** Database Unique Constraints.
- **Testability & Environment Prerequisites:** Post duplicate webhook event payload twice and verify single processing.

---

#### `F07.6`: Automated Training Seat Confirmation via Webhook
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When webhook receives payment.captured for a training enrollment payment, parses enrollment ID from payment events, transitions enrollment from PENDING_PAYMENT to CONFIRMED, and increments batch enrolled_count.

##### Architectural Traceability
- **User Interface Component:** `Server-to-server webhook`
- **API Endpoint / Method:** `POST /api/v1/payment/webhook`
- **Backend Service Method:** `TrainingService.confirmEnrollmentPayment`
- **Database Tables & Constraints:** `enrollments.status=CONFIRMED, batches.enrolled_count`
- **External Integrations:** `None`
- **Test Case Reference:** `PaymentModuleTest.java, 07_training_trainee_lifecycle.spec.js`
- **Verification Evidence:** `PaymentService.java:294-316; TrainingService.java:180-210.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Training seat confirmed automatically; trainee seat reserved in cohort.
- **Normal / Happy Path Flow:** Payment captured -> Enrollment marked CONFIRMED -> Trainee receives booking receipt.
- **Alternative Flows:** If batch reaches capacity, marks batch status FULL.
- **Negative & Abuse Scenarios:** Confirming already confirmed enrollment is idempotent no-op.
- **Boundary Conditions & Limits:** enrolled_count <= capacity.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Error recorded in payment_events.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `UPDATE enrollments SET status='CONFIRMED'; UPDATE batches SET enrolled_count=enrolled_count+1.`
- **Downstream Events & Notifications:** Masterclass Enrollment Confirmation Email with batch schedule.
- **Cross-Module Dependencies:** Training Module, Notification Module.
- **Testability & Environment Prerequisites:** Trigger webhook for enrollment payment and verify enrollment confirmed.

---

#### `F07.7`: Payment Refund Webhook Processing (refund.processed)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Ingests refund.processed webhook from Razorpay. Updates payment status to REFUNDED, records refund_id and amount, and publishes payment refunded audit event.

##### Architectural Traceability
- **User Interface Component:** `Server-to-server webhook`
- **API Endpoint / Method:** `POST /api/v1/payment/webhook`
- **Backend Service Method:** `PaymentService.processWebhook`
- **Database Tables & Constraints:** `payments.status=REFUNDED, payment_events`
- **External Integrations:** `Razorpay Webhook Engine`
- **Test Case Reference:** `05_payment_refund_lifecycle.spec.js`
- **Verification Evidence:** `PaymentService.java:335-375.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Payment entity marked REFUNDED; audit log records gateway refund ID.
- **Normal / Happy Path Flow:** Gateway processes refund -> Webhook received -> Payment status updated.
- **Alternative Flows:** Partial refund records refunded amount and leaves status PARTIALLY_REFUNDED.
- **Negative & Abuse Scenarios:** Refund failed webhook (refund.failed) logs incident for manual finance review.
- **Boundary Conditions & Limits:** Refund amount <= original payment amount.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Logged to payment_events.
- **Required Permissions & Access Control:** `Public (Signature verified)`
- **Expected Database State Mutations:** `UPDATE payments SET status='REFUNDED'; INSERT into payment_events.`
- **Downstream Events & Notifications:** Customer notification: 'Your refund of ₹XXXX has been processed by your bank'.
- **Cross-Module Dependencies:** Wallet Module, Order Module.
- **Testability & Environment Prerequisites:** Send simulated refund.processed webhook.

---

#### `F07.8`: Payment Failure Audit Logging (payment.failed)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Captures payment.failed gateway webhooks or client failure callbacks. Records failure error code, error description, and reason in payment_events. Sets payment status to FAILED.

##### Architectural Traceability
- **User Interface Component:** `PaymentPage.jsx, Webhook`
- **API Endpoint / Method:** `POST /api/v1/payment/webhook`
- **Backend Service Method:** `PaymentService.processWebhook`
- **Database Tables & Constraints:** `payments.status=FAILED, payment_events`
- **External Integrations:** `None`
- **Test Case Reference:** `PaymentModuleTest.java`
- **Verification Evidence:** `PaymentService.java:317-334.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Payment marked FAILED; order remains PENDING_PAYMENT allowing retry.
- **Normal / Happy Path Flow:** Payment declined by bank -> Failure logged -> Customer prompted to retry.
- **Alternative Flows:** Customer retries with another payment method successfully.
- **Negative & Abuse Scenarios:** Repeated failure logs each attempt in payment_events audit trail.
- **Boundary Conditions & Limits:** Error description string max 500 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Graceful error capture without crashing webhook pipeline.
- **Required Permissions & Access Control:** `Public (Signature verified)`
- **Expected Database State Mutations:** `UPDATE payments SET status='FAILED'; INSERT into payment_events.`
- **Downstream Events & Notifications:** In-app alert: 'Payment attempt was declined. Please retry.'
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Post payment.failed webhook and verify payment status.

---

### MOD-08: Platform Wallet & Ledger
- **Package / Namespace:** `com.sporekart.wallet`
- **Total Features Cataloged:** 11

#### `F08.1`: Customer Wallet Provisioning & Balance Retrieval
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Every registered customer possesses a dedicated digital wallet. On first access, auto-provisions wallet with ₹0.00 balances (available, pending, withdrawable). Tracks currency ('INR').

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Wallet tab)`
- **API Endpoint / Method:** `GET /api/v1/wallet, GET /api/v1/wallet/balance`
- **Backend Service Method:** `WalletService.getOrCreateWallet`
- **Database Tables & Constraints:** `wallets`
- **External Integrations:** `None`
- **Test Case Reference:** `06_customer_wallet_lifecycle.spec.js, WalletModuleTest.java`
- **Verification Evidence:** `WalletController.java:25-45; WalletService.java:33-56.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with WalletResponse (walletId, availableBalance, pendingBalance, withdrawableBalance).
- **Normal / Happy Path Flow:** User navigates to Wallet tab -> Balance renders in rupees.
- **Alternative Flows:** Quick balance check (/wallet/balance) returns numeric BigDecimal for checkout toggle.
- **Negative & Abuse Scenarios:** Unauthenticated call -> HTTP 401 UNAUTHORIZED.
- **Boundary Conditions & Limits:** Balance scale 2 decimal places.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database connection drop handled gracefully.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `INSERT into wallets (user_id, available_balance=0.00, currency='INR') if missing.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Checkout, Training Enrollment.
- **Testability & Environment Prerequisites:** Query wallet for new user and verify zero balances.

---

#### `F08.2`: Pessimistic Row Locking on Wallet Updates
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** All wallet balance modifications (credit, debit, withdrawal, topup) acquire a pessimistic write lock (SELECT ... FOR UPDATE via WalletRepository.findByUserIdWithLock). Prevents double-spend concurrency race conditions.

##### Architectural Traceability
- **User Interface Component:** `Backend concurrency protection`
- **API Endpoint / Method:** `Internal WalletService methods`
- **Backend Service Method:** `WalletRepository.findByUserIdWithLock`
- **Database Tables & Constraints:** `wallets (PESSIMISTIC_WRITE)`
- **External Integrations:** `None`
- **Test Case Reference:** `WalletModuleTest.java`
- **Verification Evidence:** `WalletRepository.java:18; WalletService.java:83, 175.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Concurrent transactions on the same wallet execute sequentially without lost updates.
- **Normal / Happy Path Flow:** Thread A acquires lock -> Updates balance -> Commits -> Thread B acquires lock.
- **Alternative Flows:** Idempotent requests matching idempotency_key return existing transaction immediately.
- **Negative & Abuse Scenarios:** Lock acquisition timeout throws exception; rolls back transaction cleanly.
- **Boundary Conditions & Limits:** Lock timeout 5000 ms.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Rollback prevents partial debit or corrupted balance.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `PostgreSQL row lock on target wallet record.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Database Concurrency.
- **Testability & Environment Prerequisites:** Execute 10 concurrent debit threads against single wallet balance.

---

#### `F08.3`: Wallet Topup Intent Creation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Customer specifies topup amount. Validates amount > 0 and <= ₹100,000. Creates Razorpay payment order and persists WalletTopupIntent in PENDING status.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Add Money Modal)`
- **API Endpoint / Method:** `POST /api/v1/wallet/add-money`
- **Backend Service Method:** `WalletService.createTopupIntent`
- **Database Tables & Constraints:** `wallet_topup_intents`
- **External Integrations:** `Razorpay Orders API`
- **Test Case Reference:** `06_customer_wallet_lifecycle.spec.js`
- **Verification Evidence:** `WalletController.java:55-70; WalletService.java:600-634; V38__create_wallet_topup_intents.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with AddMoneyResponse (razorpayOrderId, amountInr, transactionReference).
- **Normal / Happy Path Flow:** User inputs ₹500 -> Clicks Add Money -> Intent created -> Razorpay checkout modal opens.
- **Alternative Flows:** Mock mode creates mock topup intent.
- **Negative & Abuse Scenarios:** Amount <= 0 -> HTTP 400 'Top-up amount must be greater than zero'. Amount > ₹100,000 -> HTTP 400.
- **Boundary Conditions & Limits:** Min ₹1.00, Max ₹100,000.00 per topup.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Gateway error handled.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `INSERT into wallet_topup_intents (user_id, amount, status='PENDING').`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Payment Gateway.
- **Testability & Environment Prerequisites:** Create topup intent with valid vs invalid amounts.

---

#### `F08.4`: Topup Signature Verification & Pessimistic Credit
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Verifies cryptographic signature for wallet topup. Checks that intent is in PENDING status. Credits available_balance and withdrawable_balance. Marks intent COMPLETED. Writes CREDIT ledger entry.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/wallet/verify-add-money`
- **Backend Service Method:** `WalletService.verifyTopup`
- **Database Tables & Constraints:** `wallet_topup_intents.status=COMPLETED, wallets, wallet_transactions`
- **External Integrations:** `HMAC-SHA256 Verification`
- **Test Case Reference:** `06_customer_wallet_lifecycle.spec.js`
- **Verification Evidence:** `WalletController.java:72-85; WalletService.java:636-695.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with created WalletTransaction; wallet balance credited immediately.
- **Normal / Happy Path Flow:** Payment verified -> Intent completed -> Balance updated -> Transaction logged.
- **Alternative Flows:** Replaying verification returns already-completed transaction idempotently.
- **Negative & Abuse Scenarios:** Signature forgery -> HTTP 400 'Invalid payment signature'. Already completed intent -> Idempotent ignore.
- **Boundary Conditions & Limits:** Topup amount verified against original intent record.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Transaction rollback on database error.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `UPDATE wallet_topup_intents SET status='COMPLETED'; UPDATE wallets SET available_balance=available_balance+?; INSERT into wallet_transactions.`
- **Downstream Events & Notifications:** Transactional SMS & Email: '₹XXXX credited to your Sporekart Wallet'.
- **Cross-Module Dependencies:** Notification Module.
- **Testability & Environment Prerequisites:** Verify topup with valid signature and assert wallet balance.

---

#### `F08.5`: Direct Checkout Payment via Wallet Balance
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Allows customer to pay for an order directly using wallet funds. Acquires pessimistic lock, verifies available_balance >= order total, debits wallet, writes DEBIT ledger entry, transitions order to PAID, and confirms inventory.

##### Architectural Traceability
- **User Interface Component:** `PaymentPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/wallet/checkout-pay`
- **Backend Service Method:** `WalletService.debitWallet, OrderService.updateOrderStatus`
- **Database Tables & Constraints:** `wallets, wallet_transactions, orders, inventory_records`
- **External Integrations:** `None`
- **Test Case Reference:** `05_payment_refund_lifecycle.spec.js, 07_payment.spec.js`
- **Verification Evidence:** `WalletController.java:88-105; WalletService.java:150-220.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with OrderResponse; order status immediately set to PAID; one-click checkout experience.
- **Normal / Happy Path Flow:** User clicks 'Pay with Sporekart Wallet' -> Balance debited -> Order marked PAID -> Confirmation page.
- **Alternative Flows:** Wallet payment for training enrollment slot booking.
- **Negative & Abuse Scenarios:** Insufficient balance -> HTTP 409 'Insufficient wallet balance. Available: ₹X, Requested: ₹Y'.
- **Boundary Conditions & Limits:** Exact balance payment (availableBalance == orderTotal).

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Insufficient funds aborts checkout without modifying order or stock.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `UPDATE wallets SET available_balance=available_balance-?; INSERT into wallet_transactions; UPDATE orders SET status='PAID'.`
- **Downstream Events & Notifications:** Order confirmation notice + Wallet debit receipt notice.
- **Cross-Module Dependencies:** Order Module, Inventory Module.
- **Testability & Environment Prerequisites:** Execute wallet payment with sufficient vs insufficient balance.

---

#### `F08.6`: Non-Negative Balance Constraint Enforcement
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Enforces that wallet balances never drop below zero via both application check (availableBalance.compareTo(amount) >= 0) and database level CHECK constraint 'chk_wallets_balance_non_negative' (Migration V32).

##### Architectural Traceability
- **User Interface Component:** `Backend & Database enforcement`
- **API Endpoint / Method:** `All wallet debit flows`
- **Backend Service Method:** `WalletService.debitWallet`
- **Database Tables & Constraints:** `wallets (CHECK available_balance >= 0)`
- **External Integrations:** `None`
- **Test Case Reference:** `WalletModuleTest.java`
- **Verification Evidence:** `V32__add_wallet_non_negative_check.sql; WalletService.java:178-180.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Impossible to over-debit wallet; database constraint rejects negative balance.
- **Normal / Happy Path Flow:** Debit checks balance -> Sufficient -> Deducted cleanly.
- **Alternative Flows:** Concurrent debit threads blocked by pessimistic lock + check constraint.
- **Negative & Abuse Scenarios:** Direct SQL or code bug attempting negative balance throws DataIntegrityViolationException.
- **Boundary Conditions & Limits:** Zero balance exact boundary (balance = 0.00 permitted; -0.01 rejected).

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Constraint violation triggers rollback.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `Enforced by PostgreSQL check constraint.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Database Schema.
- **Testability & Environment Prerequisites:** Attempt debiting ₹100 from ₹50 wallet and assert rejection.

---

#### `F08.7`: Order Cancellation Refund Credit to Wallet
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When a paid order is cancelled by customer or admin, credits exact paid total to customer's wallet. Sets transaction type CREDIT, source ORDER, and records cancellation reason.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Orders & Wallet tabs)`
- **API Endpoint / Method:** `Triggered via POST /orders/{id}/cancel`
- **Backend Service Method:** `WalletService.processRefundToWallet`
- **Database Tables & Constraints:** `wallets, wallet_transactions`
- **External Integrations:** `None`
- **Test Case Reference:** `04_order_cancellation_lifecycle.spec.js, 06_customer_wallet_lifecycle.spec.js`
- **Verification Evidence:** `WalletService.java:310-345; OrderService.java:412-424.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Customer immediately receives store credit in wallet without waiting 5-7 bank days.
- **Normal / Happy Path Flow:** Order cancelled -> Wallet balance increases -> Audit entry created.
- **Alternative Flows:** Training enrollment cancellation also refunds to wallet.
- **Negative & Abuse Scenarios:** Double refund prevented by checking if already refunded.
- **Boundary Conditions & Limits:** Refund amount equals order.totalAmountInr.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Logged to audit logs if credit fails.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `UPDATE wallets SET available_balance=available_balance+?; INSERT into wallet_transactions.`
- **Downstream Events & Notifications:** Wallet refund credit notification.
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Cancel paid order and verify wallet balance.

---

#### `F08.8`: Customer Withdrawal Request Submission
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Customers can request bank withdrawal of their withdrawable_balance. Submits bank account number, IFSC code, account holder name. Moves requested amount from available_balance to pending_balance.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Withdraw Modal)`
- **API Endpoint / Method:** `POST /api/v1/wallet/withdraw`
- **Backend Service Method:** `WalletService.requestWithdrawal`
- **Database Tables & Constraints:** `wallet_withdrawals, wallets`
- **External Integrations:** `None`
- **Test Case Reference:** `06_customer_wallet_lifecycle.spec.js`
- **Verification Evidence:** `WalletController.java:110-125; WalletService.java:350-400.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with WalletWithdrawal in PENDING status; funds locked in pending balance.
- **Normal / Happy Path Flow:** Customer inputs ₹1,000 + IFSC 'HDFC0000123' -> Available balance drops by ₹1,000 -> Pending balance rises by ₹1,000.
- **Alternative Flows:** Customer can cancel pending withdrawal before admin approval.
- **Negative & Abuse Scenarios:** Withdrawal amount > withdrawable_balance -> HTTP 400 'Insufficient withdrawable balance'. Invalid IFSC -> HTTP 400.
- **Boundary Conditions & Limits:** Min withdrawal ₹100, Max ₹50,000 per request; IFSC regex '^[A-Z]{4}0[A-Z0-9]{6}$'.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Validation failure rolls back.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `INSERT into wallet_withdrawals; UPDATE wallets SET available_balance=available_balance-?, pending_balance=pending_balance+?.`
- **Downstream Events & Notifications:** Withdrawal request submitted notice to customer; Admin alert.
- **Cross-Module Dependencies:** Admin Finance Module.
- **Testability & Environment Prerequisites:** Submit withdrawal request and verify available vs pending balances.

---

#### `F08.9`: Admin Withdrawal Approval & Settlement
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Administrator reviews bank details and approves payout. Marks withdrawal APPROVED. Decrements pending_balance. Writes WITHDRAWAL transaction to audit ledger.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Finance tab)`
- **API Endpoint / Method:** `POST /api/v1/admin/finance/withdrawals/{id}/approve`
- **Backend Service Method:** `WalletService.approveWithdrawal`
- **Database Tables & Constraints:** `wallet_withdrawals.status=APPROVED, wallets, wallet_transactions, admin_audit_logs`
- **External Integrations:** `Manual Bank Payout / NEFT / IMPS`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminFinanceController.java:35-50; WalletService.java:405-445.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with approved withdrawal record; pending liability settled.
- **Normal / Happy Path Flow:** Admin executes bank transfer -> Clicks Approve -> Payout settled in system.
- **Alternative Flows:** Admin attaches bank UTR reference number to approval notes.
- **Negative & Abuse Scenarios:** Approving already approved/rejected withdrawal -> HTTP 409.
- **Boundary Conditions & Limits:** Only PENDING withdrawals can be approved.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database rollback on error.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `UPDATE wallet_withdrawals SET status='APPROVED'; UPDATE wallets SET pending_balance=pending_balance-?; INSERT into wallet_transactions; INSERT into admin_audit_logs.`
- **Downstream Events & Notifications:** SMS and Email: 'Your withdrawal of ₹XXXX has been approved and credited to your bank account'.
- **Cross-Module Dependencies:** Admin Audit Module.
- **Testability & Environment Prerequisites:** Approve withdrawal and assert pending_balance decremented.

---

#### `F08.10`: Admin Withdrawal Rejection & Recredit
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** If customer bank details are invalid, admin rejects withdrawal with mandatory reason. Decrements pending_balance and returns funds back to available_balance immediately.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Finance tab)`
- **API Endpoint / Method:** `POST /api/v1/admin/finance/withdrawals/{id}/reject`
- **Backend Service Method:** `WalletService.rejectWithdrawal`
- **Database Tables & Constraints:** `wallet_withdrawals.status=REJECTED, wallets, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminFinanceController.java:52-68; WalletService.java:450-485.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; funds restored to customer's available wallet balance.
- **Normal / Happy Path Flow:** Admin clicks Reject -> Reason 'Invalid Account Number' -> Balance restored.
- **Alternative Flows:** Customer updates bank details and resubmits.
- **Negative & Abuse Scenarios:** Missing rejection reason -> HTTP 400 'Rejection reason is required'.
- **Boundary Conditions & Limits:** Rejection reason 5 to 500 characters.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Transaction rollback on lock timeout.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `UPDATE wallet_withdrawals SET status='REJECTED'; UPDATE wallets SET available_balance=available_balance+?, pending_balance=pending_balance-?; INSERT into admin_audit_logs.`
- **Downstream Events & Notifications:** Notification: 'Your withdrawal request was rejected. Reason: X. Funds restored to wallet.'
- **Cross-Module Dependencies:** Notification Module.
- **Testability & Environment Prerequisites:** Reject withdrawal and assert available_balance restored.

---

#### `F08.11`: Admin Manual Credit/Debit Adjustment with Audit Trail
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Administrator can perform manual discretionary adjustments to customer wallets for promotional rewards, customer support appeasements, or dispute corrections. Mandatory reason and audit logging.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Finance tab)`
- **API Endpoint / Method:** `POST /api/v1/admin/finance/manual-adjustment`
- **Backend Service Method:** `WalletService.performManualAdjustment`
- **Database Tables & Constraints:** `wallets, wallet_transactions, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminFinanceController.java:70-90; WalletService.java:490-555.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; wallet balance adjusted with clear audit trail.
- **Normal / Happy Path Flow:** Admin grants ₹200 goodwill credit -> Transaction recorded as 'ADJUSTMENT' -> Balance updated.
- **Alternative Flows:** Admin manual debit for clawback (subject to non-negative check).
- **Negative & Abuse Scenarios:** Manual debit exceeding balance -> HTTP 409 'Cannot debit more than available balance'.
- **Boundary Conditions & Limits:** Adjustment amount 0.01 to 50,000.00.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Rollback on error.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `UPDATE wallets; INSERT into wallet_transactions; INSERT into admin_audit_logs.`
- **Downstream Events & Notifications:** In-app alert to customer regarding adjustment.
- **Cross-Module Dependencies:** Admin Audit Module.
- **Testability & Environment Prerequisites:** Execute manual credit and assert ledger entry.

---

### MOD-09: Logistics & Shipping
- **Package / Namespace:** `com.sporekart.shipping`
- **Total Features Cataloged:** 7

#### `F09.1`: Indian Pincode Serviceability & ETA Estimation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Validates 6-digit Indian postal code. Determines courier coverage (Blue Dart, Delhivery, Express) and estimated delivery transit days (2-5 business days).

##### Architectural Traceability
- **User Interface Component:** `ProductDetailPage.jsx, IndianAddressForm.jsx`
- **API Endpoint / Method:** `GET /api/v1/shipping/check-pincode/{pincode}`
- **Backend Service Method:** `ShippingApplicationService.checkServiceability`
- **Database Tables & Constraints:** `None (Logistics calculation)`
- **External Integrations:** `Shiprocket Serviceability API / local courier lookup`
- **Test Case Reference:** `ShippingModuleTest.java, 01_browser_smoke_baseline.spec.js`
- **Verification Evidence:** `ShippingController.java:25-45; ShippingApplicationService.java:30-70.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with PincodeServiceabilityDto (isServiceable, estimatedDeliveryDays, courierPartners[]).
- **Normal / Happy Path Flow:** User enters '411001' on product page -> Displays 'Delivery in 2-3 business days via BlueDart'.
- **Alternative Flows:** Remote pin code shows extended delivery window (5-7 days).
- **Negative & Abuse Scenarios:** Invalid format (e.g. '01234') -> HTTP 400 'Invalid 6-digit Indian PIN code'.
- **Boundary Conditions & Limits:** Regex '^[1-9][0-9]{5}$'.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Courier API failure falls back to standard 3-5 days estimation.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module, Checkout Module.
- **Testability & Environment Prerequisites:** Query serviceability across metro vs rural pincodes.

---

#### `F09.2`: Shiprocket Order & Shipment Creation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Dispatches paid order to Shiprocket logistics platform via adhoc order creation. Sends pickup location ('Primary' in Pune, PIN 411001), package dimensions (length, breadth, height in cm, weight in kg), and items. Creates shipment entity.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Shipping tab)`
- **API Endpoint / Method:** `POST /api/v1/shipping/create`
- **Backend Service Method:** `ShippingApplicationService.createShipment, ShiprocketAdapter.createShipment`
- **Database Tables & Constraints:** `shipments, orders.status=PROCESSING`
- **External Integrations:** `Shiprocket API (/orders/create/adhoc)`
- **Test Case Reference:** `ShippingModuleTest.java, 10_admin_dashboard_interactive_audit.spec.js`
- **Verification Evidence:** `ShippingController.java:48-65; ShiprocketAdapter.java:50-130; V36__add_shipping_dimensions.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with ShipmentDto (shipmentId, orderNumber, status='CREATED').
- **Normal / Happy Path Flow:** Admin clicks 'Create Shipment' -> Shiprocket API generates order -> Shipment saved in DB.
- **Alternative Flows:** Mock mode generates synthetic shipment in test environment.
- **Negative & Abuse Scenarios:** Creating shipment for unpaid or cancelled order -> HTTP 409.
- **Boundary Conditions & Limits:** Weight in kg >= 0.1; Dimensions in cm >= 1.0.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Shiprocket API 500 logged; shipment left in PENDING_DISPATCH.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT into shipments; UPDATE orders SET status='PROCESSING'.`
- **Downstream Events & Notifications:** Customer notification: 'Your order is being packed for shipment'.
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Create shipment with mock vs live provider.

---

#### `F09.3`: Courier AWB Allocation & Tracking Number
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Assigns Air Waybill (AWB) code from carrier (Blue Dart Express, Delhivery). Generates carrier tracking URL ('https://track.shiprocket.in/{awb}') and updates order tracking info.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx, DashboardPage.jsx`
- **API Endpoint / Method:** `Subsumed in POST /shipping/create`
- **Backend Service Method:** `ShiprocketAdapter.createShipment`
- **Database Tables & Constraints:** `shipments.awb_code, orders.tracking_number, orders.tracking_url, orders.shipped_at`
- **External Integrations:** `Shiprocket AWB Assignment API`
- **Test Case Reference:** `ShippingModuleTest.java, 03_catalog_cart_checkout.spec.js`
- **Verification Evidence:** `OrderService.java:638-648, 742-749; V19__add_tracking_url_and_packing_slip.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Tracking URL populated and clickable in customer dashboard.
- **Normal / Happy Path Flow:** AWB assigned -> Tracking URL generated -> Order updated with tracking details.
- **Alternative Flows:** Mock AWB allocated e.g. 'AWB-897XXXXXX'.
- **Negative & Abuse Scenarios:** Missing AWB from carrier retried via background worker.
- **Boundary Conditions & Limits:** AWB alphanumeric code max 50 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Carrier failure leaves tracking url blank temporarily.
- **Required Permissions & Access Control:** `ROLE_ADMIN / System`
- **Expected Database State Mutations:** `UPDATE shipments SET awb_code=?; UPDATE orders SET tracking_number=?, tracking_url=?, status='SHIPPED'.`
- **Downstream Events & Notifications:** Transactional SMS & Email with tracking link: 'Your order has been shipped via BlueDart. Track at: ...'
- **Cross-Module Dependencies:** Order Module, Notification Module.
- **Testability & Environment Prerequisites:** Verify tracking URL format matches carrier base URL.

---

#### `F09.4`: Real-Time Shipment Tracking Query
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Fetches real-time milestone checkpoints (Picked Up, In Transit, Reached Hub, Out for Delivery, Delivered) from Shiprocket tracking API and syncs with shipment_trackings table.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (ActiveTrack tab)`
- **API Endpoint / Method:** `GET /api/v1/shipping/track/{shipmentId}, GET /api/v1/shipping/order/{orderId}`
- **Backend Service Method:** `ShippingApplicationService.trackShipment`
- **Database Tables & Constraints:** `shipments, shipment_trackings`
- **External Integrations:** `Shiprocket Tracking API`
- **Test Case Reference:** `ShippingModuleTest.java, 03_catalog_cart_checkout.spec.js`
- **Verification Evidence:** `ShippingController.java:70-95; ShipmentTracking.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with ShipmentTrackingDto timeline checkpoints with timestamps and locations.
- **Normal / Happy Path Flow:** Customer views ActiveTrack -> Timeline displays current checkpoint e.g. 'Pune Hub - Departed'.
- **Alternative Flows:** If remote API down, displays cached checkpoints from shipment_trackings.
- **Negative & Abuse Scenarios:** Non-existent shipment ID -> HTTP 404.
- **Boundary Conditions & Limits:** Timeline checkpoints ordered chronologically.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Network drop returns cached state without crashing UI.
- **Required Permissions & Access Control:** `Authenticated / Order Owner`
- **Expected Database State Mutations:** `INSERT into shipment_trackings if new checkpoints discovered.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Dashboard.
- **Testability & Environment Prerequisites:** Query tracking for active shipment and assert timeline structure.

---

#### `F09.5`: Shiprocket Tracking Webhook Ingestion & Status Sync
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Ingests carrier webhook callbacks. Validates webhook token. Maps courier statuses: 'DELIVERED' transitions order to DELIVERED, sets delivered_at timestamp, publishes OrderDeliveredEvent, and unlocks customer review invitation.

##### Architectural Traceability
- **User Interface Component:** `Server-to-server webhook`
- **API Endpoint / Method:** `POST /api/v1/shipping/webhook`
- **Backend Service Method:** `ShippingApplicationService.handleShiprocketWebhook`
- **Database Tables & Constraints:** `shipments.status, shipment_trackings, orders.status=DELIVERED, review_invitation_states`
- **External Integrations:** `Shiprocket Webhook Engine`
- **Test Case Reference:** `ShippingModuleTest.java, 03_catalog_cart_checkout.spec.js`
- **Verification Evidence:** `ShippingWebhookController.java:25-50; OrderService.java:446-450.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; order automatically marked DELIVERED upon actual physical courier delivery.
- **Normal / Happy Path Flow:** Courier delivers package -> Webhook fires -> Order marked DELIVERED -> Review prompt unlocked.
- **Alternative Flows:** RTO (Return to Origin) status flags shipment for customer support review.
- **Negative & Abuse Scenarios:** Invalid webhook token -> HTTP 401 'Unauthorized webhook token'.
- **Boundary Conditions & Limits:** Status mappings for 15+ Shiprocket tracking status codes.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Idempotent ignore on duplicate delivery webhooks.
- **Required Permissions & Access Control:** `Public (Token verified)`
- **Expected Database State Mutations:** `UPDATE shipments SET status='DELIVERED', delivered_at=NOW(); UPDATE orders SET status='DELIVERED'; INSERT into review_invitation_states.`
- **Downstream Events & Notifications:** Delivery confirmation notification + Review invitation modal unlock.
- **Cross-Module Dependencies:** Order Module, Reviews Module, Analytics Module.
- **Testability & Environment Prerequisites:** Post simulated delivery webhook and verify order status.

---

#### `F09.6`: Courier Pickup Cancellation prior to Transit
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Cancels scheduled courier pickup if order is cancelled before courier arrives at facility. Dispatches cancellation request to carrier API and updates shipment status to CANCELLED.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Shipping tab)`
- **API Endpoint / Method:** `POST /api/v1/shipping/cancel/{shipmentId}`
- **Backend Service Method:** `ShippingApplicationService.cancelShipment`
- **Database Tables & Constraints:** `shipments.status=CANCELLED`
- **External Integrations:** `Shiprocket Order Cancel API`
- **Test Case Reference:** `ShippingModuleTest.java`
- **Verification Evidence:** `ShippingController.java:100-115; ShiprocketAdapter.java:210-240.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; carrier pickup aborted.
- **Normal / Happy Path Flow:** Admin cancels shipment -> Carrier acknowledges -> Status set to CANCELLED.
- **Alternative Flows:** Triggered automatically when customer cancels order in PROCESSING status.
- **Negative & Abuse Scenarios:** Cancelling shipment already in transit -> HTTP 409 'Shipment already in transit; cannot cancel pickup'.
- **Boundary Conditions & Limits:** Can only cancel in CREATED, AWB_ASSIGNED, or PICKUP_SCHEDULED states.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Logs error if carrier API rejects.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `UPDATE shipments SET status='CANCELLED', updated_at=NOW().`
- **Downstream Events & Notifications:** Admin operational notice.
- **Cross-Module Dependencies:** Order Module.
- **Testability & Environment Prerequisites:** Cancel shipment before pickup and assert CANCELLED status.

---

#### `F09.7`: Courier Event Simulator for Testing
- **Rule Classification:** **`[INFERRED]`**
- **Core Business Rule:** Testing utility endpoint permitting QA and developers to simulate courier transit events (PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED) with custom location and activity strings in non-production environments.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Debug Tools)`
- **API Endpoint / Method:** `POST /api/v1/shipping/simulate-event/{shipmentId}`
- **Backend Service Method:** `ShippingApplicationService.simulateTrackingEvent`
- **Database Tables & Constraints:** `shipments, shipment_trackings, orders`
- **External Integrations:** `None`
- **Test Case Reference:** `ShippingModuleTest.java, 03_catalog_cart_checkout.spec.js`
- **Verification Evidence:** `ShippingController.java:120-140.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; updates tracking timeline and triggers downstream events as if real courier dispatched.
- **Normal / Happy Path Flow:** Tester simulates DELIVERED event -> Order status updates -> Review invitation unlocked.
- **Alternative Flows:** Simulate OUT_FOR_DELIVERY updates tracking status.
- **Negative & Abuse Scenarios:** Calling on non-existent shipment -> HTTP 404.
- **Boundary Conditions & Limits:** Accepts standard ShipmentStatus enum strings.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Restricted in production.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT into shipment_trackings; UPDATE shipments; UPDATE orders.`
- **Downstream Events & Notifications:** Triggers corresponding customer tracking alert.
- **Cross-Module Dependencies:** Order Module, Reviews Module.
- **Testability & Environment Prerequisites:** Simulate full delivery lifecycle and assert state progression.

---

### MOD-10: Training & Masterclasses
- **Package / Namespace:** `com.sporekart.training`
- **Total Features Cataloged:** 10

#### `F10.1`: Course Catalog Browsing & Category Navigation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Catalogs masterclass training programs across categories (Mushroom Cultivation, Spawn Production Lab Setup, Commercial Farm Automation). Each course features syllabus, duration in days, and fee in INR.

##### Architectural Traceability
- **User Interface Component:** `TrainingPage.jsx, CategoryCarousel.jsx`
- **API Endpoint / Method:** `GET /api/v1/training/courses`
- **Backend Service Method:** `TrainingService.getAllActiveCourses`
- **Database Tables & Constraints:** `courses, course_categories`
- **External Integrations:** `None`
- **Test Case Reference:** `TrainingModuleTest.java, 09_training_enrollment.spec.js`
- **Verification Evidence:** `TrainingController.java:25-45; CourseRepository.java; V10__create_training_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with List<CourseDto> containing active programs.
- **Normal / Happy Path Flow:** User opens /training -> Programs displayed with duration, fee, and syllabus previews.
- **Alternative Flows:** Filter by category slug displays specialized courses.
- **Negative & Abuse Scenarios:** Deactivated courses excluded from public view.
- **Boundary Conditions & Limits:** Duration >= 1 day; Fee >= 0.00.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Fallback to cached programs.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Profile Module (capabilities).
- **Testability & Environment Prerequisites:** Assert active vs inactive courses query.

---

#### `F10.2`: Course Syllabus & Masterclass Detail View
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Displays detailed curriculum for a course by slug: daily module timetable, practical lab sessions, faculty bio, certification details, and upcoming batch cohorts.

##### Architectural Traceability
- **User Interface Component:** `CourseDetailPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/training/courses/{slug}`
- **Backend Service Method:** `TrainingService.getCourseBySlug`
- **Database Tables & Constraints:** `courses, batch_schedules, media_course_links`
- **External Integrations:** `None`
- **Test Case Reference:** `TrainingModuleTest.java, 09_training_enrollment.spec.js`
- **Verification Evidence:** `TrainingController.java:48-65.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with CourseDetailDto; HTTP 404 if slug invalid.
- **Normal / Happy Path Flow:** User views /training/spawn-production -> Syllabus and batch selector load.
- **Alternative Flows:** Video overview embedded if media asset linked.
- **Negative & Abuse Scenarios:** Invalid slug -> HTTP 404 'Course not found'.
- **Boundary Conditions & Limits:** Slug max 255 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database timeout handled.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Media Module, Training Reviews Module.
- **Testability & Environment Prerequisites:** Request course detail by valid vs invalid slug.

---

#### `F10.3`: Upcoming Batch Cohort Discovery & Seat Counts
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Lists upcoming batch cohorts for a course. Each batch has batch_code (e.g. 'SPAWN-OCT26'), start_date, end_date, total capacity, and real-time enrolled_count. Calculates remaining seats.

##### Architectural Traceability
- **User Interface Component:** `CourseDetailPage.jsx, TrainingPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/training/courses/{id}/batches`
- **Backend Service Method:** `TrainingService.getUpcomingBatches`
- **Database Tables & Constraints:** `batches`
- **External Integrations:** `None`
- **Test Case Reference:** `TrainingModuleTest.java, 07_training_trainee_lifecycle.spec.js`
- **Verification Evidence:** `TrainingController.java:68-85; BatchRepository.java:20-40.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with List<BatchDto>; batches with enrolled_count >= capacity marked FULL.
- **Normal / Happy Path Flow:** User selects batch cohort -> Displays '5 seats remaining' -> Enrollment modal enabled.
- **Alternative Flows:** Full batch disables enrollment button and offers waitlist.
- **Negative & Abuse Scenarios:** Past batches where start_date < TODAY excluded from booking.
- **Boundary Conditions & Limits:** Capacity 1 to 500; enrolled_count >= 0.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Empty list returned if no upcoming cohorts scheduled.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Dashboard.
- **Testability & Environment Prerequisites:** Seed batch with capacity=20 and enrolled_count=20; assert isFull=true.

---

#### `F10.4`: Trainee Profile & Indian Address Capture
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** During masterclass booking, collects trainee full legal name (for certificate issuance), 10-digit phone number, email address, physical mailing address, and prior cultivation experience level.

##### Architectural Traceability
- **User Interface Component:** `TraineeProfileEnrollmentModal.jsx`
- **API Endpoint / Method:** `Subsumed in POST /training/enroll`
- **Backend Service Method:** `TrainingService.enrollCustomer`
- **Database Tables & Constraints:** `customer_profiles, customer_addresses`
- **External Integrations:** `None`
- **Test Case Reference:** `09_training_enrollment.spec.js, fe-12.test.jsx`
- **Verification Evidence:** `TrainingDtos.java; TraineeProfileEnrollmentModal.jsx:50-180.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Trainee profile validated and stored; legal name preserved for certificate printing.
- **Normal / Happy Path Flow:** User fills trainee modal -> Details saved to profile -> Seat reservation proceeds.
- **Alternative Flows:** Returning trainee auto-populates modal from existing customer_profiles record.
- **Negative & Abuse Scenarios:** Missing trainee name -> HTTP 400 'Trainee full legal name is required'.
- **Boundary Conditions & Limits:** Trainee name 3 to 100 chars; phone 10 digits.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Validation error highlighted on modal fields.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `UPDATE customer_profiles; INSERT customer_addresses if new.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Profile Module.
- **Testability & Environment Prerequisites:** Submit enrollment with blank vs complete trainee details.

---

#### `F10.5`: Batch Seat Reservation with Promo Support
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Reserves a seat in batch cohort. Throws BatchCapacityExceededException if cohort is full. Applies trainee coupon code if provided. Creates enrollment record in PENDING_PAYMENT status and increments enrolled_count.

##### Architectural Traceability
- **User Interface Component:** `TraineeProfileEnrollmentModal.jsx, PromoCodeSection.jsx`
- **API Endpoint / Method:** `POST /api/v1/training/enroll`
- **Backend Service Method:** `TrainingService.enrollCustomer`
- **Database Tables & Constraints:** `enrollments, batches.enrolled_count`
- **External Integrations:** `None`
- **Test Case Reference:** `TrainingModuleTest.java, 07_training_trainee_lifecycle.spec.js`
- **Verification Evidence:** `TrainingController.java:90-115; TrainingService.java:60-120; BatchCapacityExceededException.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with EnrollmentDto; status set to PENDING_PAYMENT; enrolled_count incremented.
- **Normal / Happy Path Flow:** User reserves seat -> Enrolled count increases -> Redirects to payment.
- **Alternative Flows:** 100% discount promo marks enrollment CONFIRMED immediately without payment step.
- **Negative & Abuse Scenarios:** Cohort full -> HTTP 409 CONFLICT 'Batch capacity exceeded; no seats available'. Duplicate enrollment in same batch -> HTTP 409.
- **Boundary Conditions & Limits:** Pessimistic check: enrolled_count < capacity.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Capacity check rollback prevents overselling batch seats.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `INSERT into enrollments; UPDATE batches SET enrolled_count=enrolled_count+1.`
- **Downstream Events & Notifications:** Booking started notification.
- **Cross-Module Dependencies:** Promotion Module, Payment Module.
- **Testability & Environment Prerequisites:** Attempt 11th enrollment on 10-seat batch and assert BatchCapacityExceededException.

---

#### `F10.6`: Trainee Enrollment Cancellation & Wallet Refund
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Trainees can cancel registration up to 48 hours before batch start_date. Decrements batch enrolled_count. If fee was paid, refunds amount directly to customer's Sporekart Wallet. Sets enrollment status CANCELLED.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Training Bookings tab)`
- **API Endpoint / Method:** `POST /api/v1/training/enrollments/{id}/cancel`
- **Backend Service Method:** `TrainingService.cancelEnrollment, WalletService.processRefundToWallet`
- **Database Tables & Constraints:** `enrollments.status=CANCELLED, batches.enrolled_count, wallets`
- **External Integrations:** `None`
- **Test Case Reference:** `07_training_trainee_lifecycle.spec.js`
- **Verification Evidence:** `TrainingController.java:130-150; TrainingService.java:125-175.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; seat released back to cohort; fee credited to wallet.
- **Normal / Happy Path Flow:** Trainee clicks Cancel Booking -> Confirms -> Seat freed -> Fee credited to wallet.
- **Alternative Flows:** Unpaid reservation cancelled without wallet transaction.
- **Negative & Abuse Scenarios:** Cancelling after batch start_date -> HTTP 409 'Cannot cancel after batch has commenced'.
- **Boundary Conditions & Limits:** Cancellation window: start_date minus 48 hours.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Transaction rollback on lock timeout.
- **Required Permissions & Access Control:** `Authenticated (Enrollment Owner)`
- **Expected Database State Mutations:** `UPDATE enrollments SET status='CANCELLED'; UPDATE batches SET enrolled_count=enrolled_count-1; UPDATE wallets.`
- **Downstream Events & Notifications:** Enrollment cancellation confirmation email + Wallet credit notice.
- **Cross-Module Dependencies:** Wallet Module, Notification Module.
- **Testability & Environment Prerequisites:** Cancel confirmed enrollment and verify enrolled_count decremented and wallet credited.

---

#### `F10.7`: Trainee My-Bookings & Receipt Query
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Fetches authenticated trainee's masterclass registrations: course title, batch dates, cohort code, payment status, syllabus link, and certificate access.

##### Architectural Traceability
- **User Interface Component:** `TrainingConfirmationPage.jsx, DashboardPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/training/my-bookings, GET /api/v1/training/enrollments/{id}`
- **Backend Service Method:** `TrainingService.getUserEnrollments`
- **Database Tables & Constraints:** `enrollments, batches, courses, certificates`
- **External Integrations:** `None`
- **Test Case Reference:** `09_training_enrollment.spec.js, 07_training_trainee_lifecycle.spec.js`
- **Verification Evidence:** `TrainingController.java:120-128; TrainingConfirmationPage.jsx.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with List<EnrollmentDto> with full academic schedule details.
- **Normal / Happy Path Flow:** Customer navigates to Training tab -> Views enrolled cohorts and schedules.
- **Alternative Flows:** Viewing single confirmation receipt (/training/confirmation/:id).
- **Negative & Abuse Scenarios:** Viewing alien enrollment ID -> HTTP 403 FORBIDDEN.
- **Boundary Conditions & Limits:** Trainee enrollment ownership enforced.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database read error handled.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Dashboard.
- **Testability & Environment Prerequisites:** Query bookings for user with 0 vs 2 enrollments.

---

#### `F10.8`: Admin Classroom Attendance Tracking
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Instructors record daily session attendance for trainees in attendances table. Minimum 80% attendance required for course completion eligibility.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Training tab)`
- **API Endpoint / Method:** `POST /api/v1/admin/training/attendance`
- **Backend Service Method:** `TrainingService.markAttendance`
- **Database Tables & Constraints:** `attendances`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminTrainingController.java:80-100; Attendance.java; V10__create_training_tables.sql:85-98.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; attendance record saved (PRESENT, ABSENT, EXCUSED).
- **Normal / Happy Path Flow:** Instructor marks roster -> Attendance saved for batch day 1.
- **Alternative Flows:** Bulk attendance marking for entire cohort.
- **Negative & Abuse Scenarios:** Marking attendance for unregistered trainee -> HTTP 400.
- **Boundary Conditions & Limits:** Date within batch start_date and end_date.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database constraint violation handled.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT into attendances (enrollment_id, schedule_id, status, marked_at).`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Admin Module.
- **Testability & Environment Prerequisites:** Mark attendance for enrollment and query attendance percentage.

---

#### `F10.9`: Digital Certificate Generation & Public Verification
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When course is marked complete, generates unique verifiable certificate number ('SK-CERT-YYYY-XXXXX'). Persists completion and certificate records. Automatically grants commercial training capability on customer profile. Issues PDF certificate.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx, CourseDetailPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/admin/training/complete-course, GET /api/v1/training/certificate/{enrollmentId}`
- **Backend Service Method:** `TrainingService.completeCourseAndIssueCertificate`
- **Database Tables & Constraints:** `completions, certificates, customer_profiles.has_training_capability=TRUE`
- **External Integrations:** `None`
- **Test Case Reference:** `07_training_trainee_lifecycle.spec.js`
- **Verification Evidence:** `TrainingController.java:160-180; Certificate.java; V10__create_training_tables.sql:100-120.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with CertificateDto; certificate verifiable via public verification URL.
- **Normal / Happy Path Flow:** Admin marks completion -> Certificate issued -> Trainee downloads PDF -> Capability unlocked.
- **Alternative Flows:** Public certificate verification link checks cert_number validity.
- **Negative & Abuse Scenarios:** Completing course for incomplete attendance -> HTTP 400 'Attendance below mandatory threshold'.
- **Boundary Conditions & Limits:** Certificate number unique string.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Rollback on certificate creation failure.
- **Required Permissions & Access Control:** `ROLE_ADMIN (issue) / Public (verify)`
- **Expected Database State Mutations:** `INSERT into completions; INSERT into certificates; UPDATE customer_profiles SET has_training_capability=TRUE.`
- **Downstream Events & Notifications:** Email with digital certificate attached: 'Congratulations on completing your Sporekart Masterclass!'.
- **Cross-Module Dependencies:** Customer Profile Module, Notification Module.
- **Testability & Environment Prerequisites:** Issue certificate and assert capability flag set to TRUE on profile.

---

#### `F10.10`: Training Gallery (Glimpses) Showcase Management
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Maintains curated public gallery of masterclass classroom photos, lab inoculation sessions, mushroom harvesting workshops, and grower success stories.

##### Architectural Traceability
- **User Interface Component:** `TrainingGlimpseCarousel.jsx, AdminTrainingGalleryManager.jsx`
- **API Endpoint / Method:** `GET /api/v1/training/glimpses, POST /api/v1/training/admin/glimpses, DELETE /api/v1/training/admin/glimpses/{id}`
- **Backend Service Method:** `TrainingService.saveGlimpse, deleteGlimpse`
- **Database Tables & Constraints:** `training_glimpses`
- **External Integrations:** `Supabase Storage CDN`
- **Test Case Reference:** `TrainingModuleTest.java, 01_browser_smoke_baseline.spec.js`
- **Verification Evidence:** `TrainingController.java:230-260; AdminTrainingGalleryManager.jsx:20-150; V26__create_training_gallery_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with List<TrainingGlimpseDto>; renders interactive photo showcase.
- **Normal / Happy Path Flow:** User opens training page -> Gallery carousel displays past batch lab photos.
- **Alternative Flows:** Admin uploads new workshop photo with caption and batch tag.
- **Negative & Abuse Scenarios:** Missing image URL -> HTTP 400 validation error.
- **Boundary Conditions & Limits:** Caption max 255 chars; display order integer.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Broken image fallback handled by MediaImage.jsx.
- **Required Permissions & Access Control:** `Public (GET) / ROLE_ADMIN (POST, DELETE)`
- **Expected Database State Mutations:** `INSERT/DELETE on training_glimpses.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Media Module.
- **Testability & Environment Prerequisites:** Create and delete glimpse record asserting public response.

---

### MOD-11: Customer Support & Helpdesk
- **Package / Namespace:** `com.sporekart.support`
- **Total Features Cataloged:** 5

#### `F11.1`: Customer Support Ticket Creation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Customers can open support tickets by specifying category (ORDER_ISSUE, PRODUCT_QUALITY, SPAWN_CONTAMINATION, TRAINING_QUERY, PAYMENT_DISPUTE), priority (LOW, MEDIUM, HIGH, URGENT), subject, and description. Generates unique ticket number ('TICK-XXXXXX').

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Support tab), ContactSection.jsx`
- **API Endpoint / Method:** `POST /api/v1/support/tickets`
- **Backend Service Method:** `SupportApplicationService.createTicket`
- **Database Tables & Constraints:** `support_tickets, ticket_messages`
- **External Integrations:** `None`
- **Test Case Reference:** `08_support_ticket_lifecycle.spec.js, SupportModuleTest.java`
- **Verification Evidence:** `SupportController.java:25-45; SupportTicket.java; V14__create_comprehensive_support_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with SupportTicketDto in OPEN status; initial message recorded.
- **Normal / Happy Path Flow:** Customer submits ticket -> Ticket assigned number -> Renders in customer ticket list.
- **Alternative Flows:** Guest ticket submitted via contact form creates lead ticket.
- **Negative & Abuse Scenarios:** Missing subject or message -> HTTP 400 validation error.
- **Boundary Conditions & Limits:** Subject 5 to 255 chars; message up to 4000 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database error returns HTTP 500.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `INSERT into support_tickets; INSERT into ticket_messages.`
- **Downstream Events & Notifications:** Ticket received acknowledgment email sent to customer; Admin notified.
- **Cross-Module Dependencies:** Notification Module.
- **Testability & Environment Prerequisites:** Create ticket with valid vs empty fields and assert generated ticket number.

---

#### `F11.2`: Threaded Customer-Admin Support Messaging
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Maintains threaded chronological conversation between customer and support agents on an active ticket. Supports customer replies and agent responses.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx (Support conversation view)`
- **API Endpoint / Method:** `POST /api/v1/support/tickets/{id}/messages, GET /api/v1/support/tickets/{id}`
- **Backend Service Method:** `SupportApplicationService.addMessage`
- **Database Tables & Constraints:** `ticket_messages, support_tickets.updated_at`
- **External Integrations:** `None`
- **Test Case Reference:** `08_support_ticket_lifecycle.spec.js`
- **Verification Evidence:** `SupportController.java:50-75; TicketMessage.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with appended message and updated ticket timestamp.
- **Normal / Happy Path Flow:** Customer adds reply -> Message saved -> Admin notified.
- **Alternative Flows:** Admin reply marks ticket status 'WAITING_ON_CUSTOMER'.
- **Negative & Abuse Scenarios:** Replying to CLOSED ticket -> HTTP 409 'Cannot reply to a closed ticket'.
- **Boundary Conditions & Limits:** Message text 1 to 4000 characters.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Message insert failure rolls back update.
- **Required Permissions & Access Control:** `Ticket Owner / Admin`
- **Expected Database State Mutations:** `INSERT into ticket_messages; UPDATE support_tickets SET updated_at=NOW().`
- **Downstream Events & Notifications:** Email notification to counterparty on new message.
- **Cross-Module Dependencies:** Notification Module.
- **Testability & Environment Prerequisites:** Post message thread and verify chronological ordering.

---

#### `F11.3`: Admin Support Helpdesk Operations
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Helpdesk agents can view all open tickets, filter by category/priority, update priority, assign staff, reply as official support, and resolve tickets.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Support tab)`
- **API Endpoint / Method:** `GET /api/v1/admin/support/tickets, POST /api/v1/admin/support/tickets/{id}/messages, PUT /api/v1/admin/support/tickets/{id}/status`
- **Backend Service Method:** `SupportApplicationService.replyAsAdmin, updateTicketStatus`
- **Database Tables & Constraints:** `support_tickets, ticket_messages, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminSupportController.java:25-70.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; agent message posted with 'ADMIN' badge.
- **Normal / Happy Path Flow:** Agent views open ticket -> Types technical resolution -> Sends -> Customer receives email.
- **Alternative Flows:** Agent elevates priority from MEDIUM to URGENT.
- **Negative & Abuse Scenarios:** Non-admin accessing admin support API -> HTTP 403.
- **Boundary Conditions & Limits:** Status enum: OPEN, IN_PROGRESS, WAITING_ON_CUSTOMER, RESOLVED, CLOSED.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database error handled.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT into ticket_messages (sender_type='AGENT'); UPDATE support_tickets; INSERT into admin_audit_logs.`
- **Downstream Events & Notifications:** Customer email: 'New reply on your Sporekart Support Ticket #XXXX'.
- **Cross-Module Dependencies:** Admin Audit Module.
- **Testability & Environment Prerequisites:** Reply as admin and verify customer receives notification.

---

#### `F11.4`: Ticket Resolution & Customer CSAT Rating Submission
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When customer or admin closes a ticket, customer is prompted to submit CSAT rating (1 to 5 stars) and optional feedback commentary. Marks ticket CLOSED.

##### Architectural Traceability
- **User Interface Component:** `DashboardPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/support/tickets/{id}/close`
- **Backend Service Method:** `SupportApplicationService.closeTicket`
- **Database Tables & Constraints:** `support_tickets (status='CLOSED', csat_rating, csat_feedback, closed_at)`
- **External Integrations:** `None`
- **Test Case Reference:** `08_support_ticket_lifecycle.spec.js`
- **Verification Evidence:** `SupportController.java:80-100; V27__add_support_ticket_csat_and_auto_reply.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with closed ticket and CSAT score persisted.
- **Normal / Happy Path Flow:** Issue resolved -> Customer rates 5 stars -> Ticket closed.
- **Alternative Flows:** Ticket auto-closed after 7 days in WAITING_ON_CUSTOMER status.
- **Negative & Abuse Scenarios:** CSAT rating outside 1-5 range (e.g. 0 or 6) -> HTTP 400 'Rating must be between 1 and 5'.
- **Boundary Conditions & Limits:** Rating integer 1 to 5; feedback text max 1000 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Closed ticket state is immutable.
- **Required Permissions & Access Control:** `Ticket Owner / Admin`
- **Expected Database State Mutations:** `UPDATE support_tickets SET status='CLOSED', csat_rating=?, csat_feedback=?, closed_at=NOW().`
- **Downstream Events & Notifications:** CSAT thank-you message.
- **Cross-Module Dependencies:** Analytics Module (CSAT KPIs).
- **Testability & Environment Prerequisites:** Close ticket with 4-star rating and assert database fields.

---

#### `F11.5`: CSAT Analytics & Quality Metrics Reporting
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Computes aggregated customer satisfaction metrics: average CSAT rating, resolution SLA times, open ticket counts, and category breakdown for management review.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Support tab)`
- **API Endpoint / Method:** `GET /api/v1/admin/support/csat-summary`
- **Backend Service Method:** `SupportApplicationService.getCsatSummary`
- **Database Tables & Constraints:** `support_tickets`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminSupportController.java:75-90; SupportTicketRepository.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with CsatSummaryDto (averageRating, totalRatedTickets, scoreDistribution).
- **Normal / Happy Path Flow:** Admin opens Support analytics -> Views 4.8/5.0 average CSAT gauge.
- **Alternative Flows:** Zero rated tickets returns average 0.0 with 0 count.
- **Negative & Abuse Scenarios:** Non-admin access -> HTTP 403.
- **Boundary Conditions & Limits:** Rating average scale 2 decimal places.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database error returns empty metrics.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Analytics Module.
- **Testability & Environment Prerequisites:** Assert average CSAT calculation across multiple tickets.

---

### MOD-12: Customer & Trainee Reviews
- **Package / Namespace:** `com.sporekart.review`
- **Total Features Cataloged:** 6

#### `F12.1`: Post-Delivery Review Invitation Modal
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** When an order transitions to DELIVERED, unlocks review invitations in review_invitation_states for each delivered order item. Client modal prompts verified buyer to rate items.

##### Architectural Traceability
- **User Interface Component:** `ReviewInvitationModal.jsx, MyReviewsTab.jsx`
- **API Endpoint / Method:** `GET /api/v1/customer/reviews/pending`
- **Backend Service Method:** `ProductReviewService.getPendingReviewInvitations`
- **Database Tables & Constraints:** `review_invitation_states, orders, order_items`
- **External Integrations:** `None`
- **Test Case Reference:** `fe-reviews.test.jsx, 03_catalog_cart_checkout.spec.js`
- **Verification Evidence:** `CustomerReviewController.java:30-45; ReviewInvitationState.java; V24__create_product_reviews_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with List<ReviewInvitationDto> containing unreviewed delivered items.
- **Normal / Happy Path Flow:** Customer logs in after delivery -> Modal pops up displaying delivered mushroom spawn -> Prompts for review.
- **Alternative Flows:** Customer can access pending invitations anytime in Dashboard -> My Reviews tab.
- **Negative & Abuse Scenarios:** Delivered item already reviewed -> Excluded from pending list.
- **Boundary Conditions & Limits:** Only items with order status DELIVERED qualify.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Empty list returned if no pending deliveries.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `None on read; status set to PENDING on delivery.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module, Shipping Module.
- **Testability & Environment Prerequisites:** Deliver order and assert pending review invitation presence.

---

#### `F12.2`: Verified Purchase Product Review Submission
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Customers submit rating (1 to 5 stars), review title, detailed commentary, and up to 5 user photos. Sets is_verified_purchase=TRUE. Initial status is PENDING_MODERATION (or auto-published based on config).

##### Architectural Traceability
- **User Interface Component:** `ProductReviewFormModal.jsx, ReviewImageUploader.jsx`
- **API Endpoint / Method:** `POST /api/v1/customer/reviews`
- **Backend Service Method:** `ProductReviewService.createReview`
- **Database Tables & Constraints:** `product_reviews, product_review_images, review_invitation_states`
- **External Integrations:** `Supabase Storage CDN`
- **Test Case Reference:** `fe-reviews.test.jsx, ReviewModuleTest.java`
- **Verification Evidence:** `CustomerReviewController.java:50-80; ProductReview.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with ProductReviewDto; review invitation marked COMPLETED.
- **Normal / Happy Path Flow:** User uploads mushroom flush photo -> Rates 5 stars -> Saves -> Acknowledged.
- **Alternative Flows:** Text-only review without photos permitted.
- **Negative & Abuse Scenarios:** Rating 0 or > 5 -> HTTP 400. Attempting review on non-purchased item -> Rejected.
- **Boundary Conditions & Limits:** Rating 1 to 5; Title max 100 chars; Commentary max 2000 chars; Max 5 images.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Image upload failure rolls back review creation.
- **Required Permissions & Access Control:** `Authenticated (Verified Purchaser)`
- **Expected Database State Mutations:** `INSERT into product_reviews; INSERT into product_review_images; UPDATE review_invitation_states SET status='COMPLETED'.`
- **Downstream Events & Notifications:** Review received notice; Admin moderation queue alert.
- **Cross-Module Dependencies:** Media Module.
- **Testability & Environment Prerequisites:** Submit product review with 3 images and assert DB entities.

---

#### `F12.3`: Public Product Review & Rating Aggregate Display
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Fetches approved, published reviews for product detail page. Calculates weighted average rating score and 1-5 star distribution breakdown.

##### Architectural Traceability
- **User Interface Component:** `ProductReviewsSection.jsx, LatestCustomerReviews.jsx`
- **API Endpoint / Method:** `GET /api/v1/reviews/latest, GET /api/v1/products/{id}/reviews, GET /api/v1/products/{id}/reviews/summary`
- **Backend Service Method:** `ProductReviewService.getPublicReviewsForProduct`
- **Database Tables & Constraints:** `product_reviews, product_review_images`
- **External Integrations:** `None`
- **Test Case Reference:** `fe-reviews.test.jsx, 02_product_details.spec.js`
- **Verification Evidence:** `PublicReviewController.java:20-60; ProductReviewsSection.jsx.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with Page<ProductReviewDto> and summary (averageRating, totalReviews, ratingCounts).
- **Normal / Happy Path Flow:** User visits product -> Reviews tab displays verified customer photos and 4.9 star badge.
- **Alternative Flows:** Zero reviews shows 'Be the first to review this mushroom variety'.
- **Negative & Abuse Scenarios:** Rejected or pending moderation reviews strictly excluded from public response.
- **Boundary Conditions & Limits:** Only status='PUBLISHED' reviews returned.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Cached review summary returned on DB timeout.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module.
- **Testability & Environment Prerequisites:** Assert published vs rejected reviews visibility.

---

#### `F12.4`: Admin Product Review Moderation Workflow
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Administrators inspect submitted reviews and images in Admin Console. Can approve (PUBLISHED), reject (REJECTED), or flag for review. Mandatory moderation reason on rejection.

##### Architectural Traceability
- **User Interface Component:** `AdminReviewsManager.jsx, AdminDashboardPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/admin/reviews, PATCH /api/v1/admin/reviews/{id}/status`
- **Backend Service Method:** `ProductReviewService.moderateReview`
- **Database Tables & Constraints:** `product_reviews, admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminReviewController.java:25-70; AdminReviewsManager.jsx:30-180.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with updated review status; approved reviews instantly appear on storefront.
- **Normal / Happy Path Flow:** Admin approves review -> Status becomes PUBLISHED -> Live on product page.
- **Alternative Flows:** Admin rejects spam review with reason 'Profanity' -> Hidden permanently.
- **Negative & Abuse Scenarios:** Non-admin access -> HTTP 403.
- **Boundary Conditions & Limits:** Status enum: PENDING, PUBLISHED, REJECTED, FLAGGED.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database rollback on error.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `UPDATE product_reviews SET status=?, moderation_reason=?; INSERT into admin_audit_logs.`
- **Downstream Events & Notifications:** Customer notified if review approved.
- **Cross-Module Dependencies:** Admin Module.
- **Testability & Environment Prerequisites:** Moderate review from PENDING to PUBLISHED and verify storefront visibility.

---

#### `F12.5`: Trainee Course Review Submission & Moderation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Verified masterclass trainees can evaluate completed training courses: rate curriculum quality (1-5), practical lab experience, instructor knowledge, and provide testimonials.

##### Architectural Traceability
- **User Interface Component:** `TrainingReviewFormModal.jsx, TrainingReviewsSection.jsx`
- **API Endpoint / Method:** `POST /api/v1/training/reviews, GET /api/v1/training/courses/{id}/reviews`
- **Backend Service Method:** `TrainingService.createCourseReview`
- **Database Tables & Constraints:** `training_reviews`
- **External Integrations:** `None`
- **Test Case Reference:** `fe-training-reviews.test.jsx`
- **Verification Evidence:** `TrainingController.java:190-225; TrainingReview.java; V25__create_training_reviews_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with TrainingReviewDto; displayed on course syllabus page.
- **Normal / Happy Path Flow:** Trainee completes course -> Submits review -> Displays on course page.
- **Alternative Flows:** Featured reviews highlighted on Homepage testimonials carousel.
- **Negative & Abuse Scenarios:** Untrained user attempting course review -> HTTP 403 'Only enrolled trainees can review'.
- **Boundary Conditions & Limits:** Rating 1 to 5; Commentary max 2000 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Validation error handled.
- **Required Permissions & Access Control:** `Authenticated (Verified Trainee)`
- **Expected Database State Mutations:** `INSERT into training_reviews (course_id, user_id, rating, comments).`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Training Module.
- **Testability & Environment Prerequisites:** Submit training review and verify course page aggregate rating.

---

#### `F12.6`: Review Invitation Skip & Dismissal State
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Customer can dismiss or skip review modal ('Maybe Later' or 'Don't ask again'). Updates review_invitation_states status to SKIPPED or DISMISSED to prevent harassing the customer.

##### Architectural Traceability
- **User Interface Component:** `ReviewInvitationModal.jsx`
- **API Endpoint / Method:** `POST /api/v1/customer/reviews/invitations/{orderItemId}/skip`
- **Backend Service Method:** `ProductReviewService.skipInvitation`
- **Database Tables & Constraints:** `review_invitation_states.status=DISMISSED`
- **External Integrations:** `None`
- **Test Case Reference:** `fe-reviews.test.jsx`
- **Verification Evidence:** `CustomerReviewController.java:85-100; ReviewInvitationModal.jsx:40-70.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; modal will not appear again for this delivered item.
- **Normal / Happy Path Flow:** Customer clicks 'Skip' -> Invitation dismissed -> Modal closes.
- **Alternative Flows:** Item still available in Dashboard tab if customer chooses to review later.
- **Negative & Abuse Scenarios:** Skipping non-existent invitation -> HTTP 404.
- **Boundary Conditions & Limits:** Item ID validation.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Client-side fallback suppresses modal in current session.
- **Required Permissions & Access Control:** `Authenticated (Invitation Owner)`
- **Expected Database State Mutations:** `UPDATE review_invitation_states SET status='DISMISSED', updated_at=NOW().`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Dashboard.
- **Testability & Environment Prerequisites:** Skip invitation and assert omission from pending reviews query.

---

### MOD-13: Asynchronous Notifications & Alerts
- **Package / Namespace:** `com.sporekart.notification`
- **Total Features Cataloged:** 7

#### `F13.1`: Transactional Outbox Event Recording
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Implements the Transactional Outbox pattern. Domain services (Order, Payment, Training, Support, Wallet) persist notification_events in the same database transaction as the business event. Status initialized to PENDING with attempt_count=0.

##### Architectural Traceability
- **User Interface Component:** `Internal system pattern`
- **API Endpoint / Method:** `Internal NotificationEventService.recordEvent`
- **Backend Service Method:** `NotificationEventService.recordEvent`
- **Database Tables & Constraints:** `notification_events`
- **External Integrations:** `None`
- **Test Case Reference:** `NotificationModuleTest.java`
- **Verification Evidence:** `NotificationEventService.java:30-80; NotificationEvent.java; V28__create_notification_events_table.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Guarantees zero message loss even if external SMTP or SMS gateway crashes.
- **Normal / Happy Path Flow:** Order placed -> Order and NotificationEvent saved in single commit.
- **Alternative Flows:** Admin notification also recorded with target URL link.
- **Negative & Abuse Scenarios:** Null recipient handled by logging error without failing parent transaction.
- **Boundary Conditions & Limits:** Payload template data stored as JSON map.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Fail-safe: logging error prevents customer transaction failure.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `INSERT into notification_events (status='PENDING', attempt_count=0).`
- **Downstream Events & Notifications:** Outbox record created.
- **Cross-Module Dependencies:** All Domain Modules.
- **Testability & Environment Prerequisites:** Trigger business event and assert notification_events row insertion.

---

#### `F13.2`: Asynchronous Email Dispatch via SMTP
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** NotificationWorker picks up PENDING email events, renders dynamic HTML templates (order receipt, packing notice, delivery alert, wallet credit), and transmits via JavaMailSender using Gmail SMTP with TLS. Marks event SENT.

##### Architectural Traceability
- **User Interface Component:** `Background outbox processing`
- **API Endpoint / Method:** `Scheduled background worker`
- **Backend Service Method:** `NotificationWorker.dispatchNotification`
- **Database Tables & Constraints:** `notification_events.status=SENT`
- **External Integrations:** `SMTP Gateway (Gmail / Mock)`
- **Test Case Reference:** `NotificationModuleTest.java`
- **Verification Evidence:** `NotificationWorker.java:45-120; SmtpNotificationService.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Customer receives branded HTML transactional email with order summary.
- **Normal / Happy Path Flow:** Worker processes outbox -> Email sent -> Status updated to SENT with sent_at timestamp.
- **Alternative Flows:** In dev/test with USE_REAL_SMTP=false, logs email payload without remote dispatch.
- **Negative & Abuse Scenarios:** SMTP authentication failure -> Increments attempt_count; schedules retry.
- **Boundary Conditions & Limits:** HTML body UTF-8 encoded; max 5 retry attempts.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Temporary network timeout leaves event in RETRY_SCHEDULED.
- **Required Permissions & Access Control:** `Internal (Daemon)`
- **Expected Database State Mutations:** `UPDATE notification_events SET status='SENT', sent_at=NOW().`
- **Downstream Events & Notifications:** Customer receives actual email.
- **Cross-Module Dependencies:** Spring Mail Infrastructure.
- **Testability & Environment Prerequisites:** Trigger email dispatch in test profile and inspect mock sender logs.

---

#### `F13.3`: Asynchronous SMS Dispatch via Twilio
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Dispatches critical operational alerts (OTP, Order Confirmed, Shipped with AWB link, Delivered) via Twilio SMS REST API to recipient phone number. Formats Indian E.164 phone numbers (+91).

##### Architectural Traceability
- **User Interface Component:** `Background outbox processing`
- **API Endpoint / Method:** `Scheduled background worker`
- **Backend Service Method:** `TwilioSmsService.sendSms`
- **Database Tables & Constraints:** `notification_events.sms_status`
- **External Integrations:** `Twilio Messaging REST API`
- **Test Case Reference:** `NotificationModuleTest.java`
- **Verification Evidence:** `TwilioSmsService.java:35-90; V31__add_sms_notification_fields.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Instant cellular SMS delivery to customer handset.
- **Normal / Happy Path Flow:** Order shipped -> SMS dispatched with direct carrier tracking link.
- **Alternative Flows:** In dev/test with USE_REAL_TWILIO_SMS=false, logs SMS to console.
- **Negative & Abuse Scenarios:** Invalid cellular number -> Marks sms_status FAILED with error message.
- **Boundary Conditions & Limits:** SMS text max 160 characters per standard GSM segment.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Twilio quota exceeded logged to admin audit.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `UPDATE notification_events SET sms_status='SENT', sms_sent_at=NOW().`
- **Downstream Events & Notifications:** Carrier SMS transmitted.
- **Cross-Module Dependencies:** Shipping Module, Identity Module.
- **Testability & Environment Prerequisites:** Assert Twilio service invocation in mock mode.

---

#### `F13.4`: Scheduled Outbox Worker with Exponential Backoff
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Executes every 10 seconds (@Scheduled(fixedDelay = 10000)). Fetches top 20 pending notifications ordered by created_at. Dispatches and increments attempt_count. Moves to DEAD_LETTER if attempt_count > 5.

##### Architectural Traceability
- **User Interface Component:** `Background daemon`
- **API Endpoint / Method:** `NotificationWorker.processOutboxQueue`
- **Backend Service Method:** `NotificationWorker`
- **Database Tables & Constraints:** `notification_events`
- **External Integrations:** `None`
- **Test Case Reference:** `NotificationModuleTest.java`
- **Verification Evidence:** `NotificationWorker.java:43-60.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Resilient, non-blocking outbox processing without queue starvation.
- **Normal / Happy Path Flow:** Queue checked every 10s -> Pending events sent -> Clean outbox.
- **Alternative Flows:** Failed events retried with backoff delay.
- **Negative & Abuse Scenarios:** Persistent SMTP outage moves events to DEAD_LETTER after 5 attempts.
- **Boundary Conditions & Limits:** Batch size 20 records; Max attempts = 5.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Single poison pill message does not halt batch processing.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `UPDATE notification_events SET attempt_count=attempt_count+1, last_attempt_at=NOW().`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Spring Task Scheduling.
- **Testability & Environment Prerequisites:** Verify outbox worker picks up pending events automatically.

---

#### `F13.5`: Abandoned Cart Notification Scheduler
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Runs every 15 minutes (@Scheduled(cron = '0 */15 * * * *')). Scans for active carts untouched for > 1 hour. Dispatches reminder email with promo incentive. Uses daily deduplication key 'CART_ABANDONED:{cartId}:{date}'.

##### Architectural Traceability
- **User Interface Component:** `Background daemon`
- **API Endpoint / Method:** `AbandonedCartScheduler.scanAbandonedCarts`
- **Backend Service Method:** `AbandonedCartScheduler`
- **Database Tables & Constraints:** `carts, users, notification_events`
- **External Integrations:** `SMTP Gateway`
- **Test Case Reference:** `NotificationModuleTest.java`
- **Verification Evidence:** `AbandonedCartScheduler.java:37-75.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Automated cart recovery notification sent to grower who left items in cart.
- **Normal / Happy Path Flow:** Cart abandoned 1 hour -> Scheduler runs -> Generates outbox reminder -> Customer returns.
- **Alternative Flows:** Also scans abandoned masterclass checkout enrollments.
- **Negative & Abuse Scenarios:** User already notified today skipped via deduplication key.
- **Boundary Conditions & Limits:** Cutoff threshold: now minus 1 hour.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** PERFORMANCE DEFECT: Uses cartRepository.findAll() scanning all carts into JVM heap.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `INSERT into notification_events (deduplication_key).`
- **Downstream Events & Notifications:** Email: 'You left something in your Sporekart cart! Complete your order today.'
- **Cross-Module Dependencies:** Cart Module, Training Module.
- **Testability & Environment Prerequisites:** Seed 2-hour-old active cart and assert abandoned cart notification creation.

---

#### `F13.6`: Customer In-App Notification Center & Unread Badge
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Provides real-time bell icon in Navbar with unread counter. Displays customer alerts (order packed, shipped, out for delivery, wallet refund, ticket reply). Supports mark-as-read and mark-all-read.

##### Architectural Traceability
- **User Interface Component:** `NotificationCenter.jsx, Navbar.jsx`
- **API Endpoint / Method:** `GET /api/v1/notifications, GET /api/v1/notifications/unread-count, PATCH /api/v1/notifications/{id}/read, PATCH /api/v1/notifications/read-all`
- **Backend Service Method:** `NotificationEventService.getUserNotifications`
- **Database Tables & Constraints:** `notification_events`
- **External Integrations:** `None`
- **Test Case Reference:** `notification-center.test.jsx, notification-deeplink-navigation.test.jsx`
- **Verification Evidence:** `CustomerNotificationController.java:25-65; NotificationCenter.jsx:30-140; V35__enhance_notifications_for_in_app.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with notification stream; clicking notification navigates to relevant deep link.
- **Normal / Happy Path Flow:** User clicks bell -> Drawer opens with alerts -> Clicks alert -> Navigates to order tracking.
- **Alternative Flows:** Clicking 'Mark all as read' clears red badge counter.
- **Negative & Abuse Scenarios:** Marking non-existent notification ID -> HTTP 404.
- **Boundary Conditions & Limits:** Unread count >= 0; pagination size 10 to 50.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Network drop handled by local state cache.
- **Required Permissions & Access Control:** `Authenticated (ROLE_CUSTOMER)`
- **Expected Database State Mutations:** `UPDATE notification_events SET is_read=TRUE, read_at=NOW().`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Customer Dashboard, Order Tracking.
- **Testability & Environment Prerequisites:** Verify unread count decrements upon markAsRead API call.

---

#### `F13.7`: Admin In-App Operational Notification Center
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Operational alerts for admin operators: new high-value orders, payment disputes, out-of-stock warnings, new customer support tickets, withdrawal requests requiring approval.

##### Architectural Traceability
- **User Interface Component:** `Navbar.jsx, AdminDashboardPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/admin/notifications/in-app, GET /api/v1/admin/notifications/unread-count, PATCH /api/v1/admin/notifications/in-app/{id}/read, PATCH /api/v1/admin/notifications/in-app/read-all`
- **Backend Service Method:** `NotificationEventService.getAdminInAppNotifications`
- **Database Tables & Constraints:** `notification_events`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminNotificationController.java:30-80.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with admin notifications and operational deep links.
- **Normal / Happy Path Flow:** New order placed -> Admin bell badge increments -> Admin clicks alert -> Opens order in dashboard.
- **Alternative Flows:** Admin retries failed notification via POST /admin/notifications/{id}/retry.
- **Negative & Abuse Scenarios:** Non-admin access -> HTTP 403.
- **Boundary Conditions & Limits:** Dedicated admin notification stream.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database error returns empty stream.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `UPDATE notification_events SET is_read=TRUE.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Admin Operations.
- **Testability & Environment Prerequisites:** Assert admin notification generation on critical operational events.

---

### MOD-14: Agronomy Content & SEO
- **Package / Namespace:** `com.sporekart.content`
- **Total Features Cataloged:** 6

#### `F14.1`: Agronomy Blog Indexing & Taxonomy
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Publishes technical mycology articles, pest management guides, climate control advice, and substrate prep guides. Indexed by category and multi-tag associations.

##### Architectural Traceability
- **User Interface Component:** `BlogIndexPage.jsx, BlogSection.jsx`
- **API Endpoint / Method:** `GET /api/v1/content/posts, GET /api/v1/content/categories`
- **Backend Service Method:** `BlogContentService.getPublishedPosts`
- **Database Tables & Constraints:** `blog_posts, blog_categories, blog_tags, blog_post_tags`
- **External Integrations:** `None`
- **Test Case Reference:** `01_browser_smoke_baseline.spec.js`
- **Verification Evidence:** `ContentController.java:25-50; V12__create_content_blog_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with Page<BlogPostDto> sorted by published_at DESC.
- **Normal / Happy Path Flow:** User opens /blog -> Articles render with featured hero banner and reading time estimate.
- **Alternative Flows:** Filter by tag (e.g. 'Oyster Spawn', 'Humidity') updates listing.
- **Negative & Abuse Scenarios:** Draft or scheduled articles strictly excluded from public view.
- **Boundary Conditions & Limits:** Pagination: 10 articles per page.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Empty results return clean empty state.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** SEO Infrastructure.
- **Testability & Environment Prerequisites:** Verify published vs draft post visibility.

---

#### `F14.2`: Blog Post Detail & Author Profiles
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Renders full article content in Markdown/HTML with featured hero image, table of contents, author bio, social share buttons, related product cards, and structured JSON-LD Article metadata.

##### Architectural Traceability
- **User Interface Component:** `BlogPostPage.jsx, SeoHead.jsx`
- **API Endpoint / Method:** `GET /api/v1/content/posts/{slug}`
- **Backend Service Method:** `BlogContentService.getPostBySlug`
- **Database Tables & Constraints:** `blog_posts, blog_authors, blog_tags`
- **External Integrations:** `None`
- **Test Case Reference:** `13_seo_automated_testing.spec.js`
- **Verification Evidence:** `ContentController.java:55-70; BlogPostPage.jsx:30-120.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with complete BlogPostDto; renders rich SEO article page.
- **Normal / Happy Path Flow:** User reads article -> Clicks author profile -> Views author articles.
- **Alternative Flows:** Article includes direct CTA cards to buy related mushroom spawn.
- **Negative & Abuse Scenarios:** Invalid slug -> HTTP 404 'Article not found'.
- **Boundary Conditions & Limits:** Article body up to 50,000 characters; slug max 255 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database error returns HTTP 500.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `Increments view_count asynchronously.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module, SEO Module.
- **Testability & Environment Prerequisites:** Verify JSON-LD structured data in rendered page head.

---

#### `F14.3`: Scheduled Article Publishing Worker
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Runs every 5 minutes (@Scheduled(cron = '0 */5 * * * *')). Scans for articles in SCHEDULED status where scheduled_publish_time <= NOW(). Automatically transitions status to PUBLISHED.

##### Architectural Traceability
- **User Interface Component:** `Background daemon`
- **API Endpoint / Method:** `Scheduled background worker`
- **Backend Service Method:** `BlogContentService.publishScheduledPosts`
- **Database Tables & Constraints:** `blog_posts (status='PUBLISHED', published_at=NOW())`
- **External Integrations:** `None`
- **Test Case Reference:** `ContentModuleTest.java`
- **Verification Evidence:** `BlogContentService.java:110-140.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Articles published on scheduled date/time without manual editor intervention.
- **Normal / Happy Path Flow:** Author schedules post for 10:00 AM -> Worker runs at 10:00 AM -> Article becomes live.
- **Alternative Flows:** Editor can manually publish ahead of schedule.
- **Negative & Abuse Scenarios:** Articles with future publish dates remain hidden.
- **Boundary Conditions & Limits:** Exact timestamp comparison.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database error retried in next 5-minute cycle.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `UPDATE blog_posts SET status='PUBLISHED', published_at=NOW() WHERE status='SCHEDULED' AND scheduled_publish_time <= NOW().`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Sitemap Generator.
- **Testability & Environment Prerequisites:** Set scheduled_publish_time to past and assert status transition to PUBLISHED.

---

#### `F14.4`: Dynamic XML Sitemap Generation (/seo/sitemap.xml)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Generates valid XML sitemap conforming to sitemaps.org protocol. Dynamically includes all active products, training masterclasses, published blog posts, agronomy guides, and core static landing pages with lastmod and changefreq.

##### Architectural Traceability
- **User Interface Component:** `Search engine crawlers`
- **API Endpoint / Method:** `GET /api/v1/seo/sitemap.xml`
- **Backend Service Method:** `SeoService.generateSitemapXml`
- **Database Tables & Constraints:** `products, courses, blog_posts, content_articles`
- **External Integrations:** `Search Engine Bots (Googlebot, Bingbot)`
- **Test Case Reference:** `13_seo_automated_testing.spec.js, SeoModuleTest.java`
- **Verification Evidence:** `SeoController.java:25-45; SeoService.java:30-85.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with Content-Type: application/xml and valid <urlset> tags.
- **Normal / Happy Path Flow:** Googlebot requests /sitemap.xml -> Crawls fresh URLs -> Indexes new products.
- **Alternative Flows:** Cached in reverse proxy / CDN with 1-hour TTL.
- **Negative & Abuse Scenarios:** Deactivated products or draft posts excluded from sitemap.
- **Boundary Conditions & Limits:** Sitemap XML size < 50 MB and < 50,000 URLs.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Static fallback sitemap returned on database failure.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** All Public Modules.
- **Testability & Environment Prerequisites:** Fetch sitemap.xml and validate XML schema compliance.

---

#### `F14.5`: Dynamic Robots.txt Generation (/seo/robots.txt)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Generates compliant robots.txt. Disallows indexing of private operational routes (/admin/, /dashboard/, /api/, /checkout/) while permitting public storefront, blogs, and guides. References sitemap.xml URL.

##### Architectural Traceability
- **User Interface Component:** `Search engine crawlers`
- **API Endpoint / Method:** `GET /api/v1/seo/robots.txt`
- **Backend Service Method:** `SeoService.generateRobotsTxt`
- **Database Tables & Constraints:** `None`
- **External Integrations:** `Search Engine Bots`
- **Test Case Reference:** `13_seo_automated_testing.spec.js`
- **Verification Evidence:** `SeoController.java:48-60.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with Content-Type: text/plain; instructs bots accurately.
- **Normal / Happy Path Flow:** Crawler fetches robots.txt -> Respects Disallow directives -> Indexes public routes.
- **Alternative Flows:** Staging profile sets Disallow: / to prevent staging indexing.
- **Negative & Abuse Scenarios:** Syntax error in robots.txt prevented.
- **Boundary Conditions & Limits:** Plain text response.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Cached static robots.txt fallback.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Security, SEO.
- **Testability & Environment Prerequisites:** Verify Disallow rules for /admin/ and /api/ in robots.txt.

---

#### `F14.6`: Agronomist Cultivation & Spawn Guides
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Provides structured, step-by-step guides for growers: Mushroom Cultivation Guide (Sterilization, Inoculation, Spawn Run, Pinning, Harvesting) and Spawn Guide (Grain Selection, Autoclaving, Clean Bench Protocols).

##### Architectural Traceability
- **User Interface Component:** `CultivationGuidePage.jsx, SpawnGuidePage.jsx`
- **API Endpoint / Method:** `GET /api/v1/content/articles/{slug}`
- **Backend Service Method:** `BlogContentService.getArticleBySlug`
- **Database Tables & Constraints:** `content_articles`
- **External Integrations:** `None`
- **Test Case Reference:** `01_browser_smoke_baseline.spec.js`
- **Verification Evidence:** `CultivationGuidePage.jsx; SpawnGuidePage.jsx; ContentController.java:75-90.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with technical guide and illustrations.
- **Normal / Happy Path Flow:** Grower clicks guide link in footer -> Detailed protocols load.
- **Alternative Flows:** Embedded temperature and humidity charts rendered interactively.
- **Negative & Abuse Scenarios:** Missing guide slug returns 404.
- **Boundary Conditions & Limits:** Guide slug max 100 chars.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Static content fallback.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Frontend Navigation.
- **Testability & Environment Prerequisites:** Verify guide routes load with HTTP 200.

---

### MOD-15: Media Asset Management
- **Package / Namespace:** `com.sporekart.media`
- **Total Features Cataloged:** 4

#### `F15.1`: Direct Presigned Storage Upload Initiation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Client requests upload for image (product photo, review attachment, blog image). Validates MIME type (image/jpeg, image/png, image/webp) and file size (max 10MB). Generates presigned S3/Supabase upload URL and creates media_assets row in PENDING_UPLOAD status.

##### Architectural Traceability
- **User Interface Component:** `LocalImageUploader.jsx, ReviewImageUploader.jsx`
- **API Endpoint / Method:** `POST /api/v1/media/upload/initiate`
- **Backend Service Method:** `MediaService.initiateUpload, SupabaseStorageService`
- **Database Tables & Constraints:** `media_assets (status='PENDING_UPLOAD')`
- **External Integrations:** `Supabase Storage API`
- **Test Case Reference:** `MediaModuleTest.java`
- **Verification Evidence:** `MediaController.java:25-50; SupabaseStorageService.java:30-80; V4__create_media_management_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with uploadUrl, assetId, and storagePath.
- **Normal / Happy Path Flow:** User picks image -> Frontend requests presigned URL -> Uploads directly to bucket -> Confirms upload.
- **Alternative Flows:** Review photo uploader uses same presigned pipeline.
- **Negative & Abuse Scenarios:** Disallowed MIME type (e.g. .exe, .sh) -> HTTP 400 'Unsupported file format'. Size > 10MB -> HTTP 400.
- **Boundary Conditions & Limits:** File size 1 byte to 10,485,760 bytes; MIME types: image/jpeg, image/png, image/webp.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Storage service unreachable returns HTTP 502.
- **Required Permissions & Access Control:** `Authenticated (User or Admin)`
- **Expected Database State Mutations:** `INSERT into media_assets (file_name, mime_type, status='PENDING_UPLOAD').`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Product Catalog, Reviews Module.
- **Testability & Environment Prerequisites:** Initiate upload with valid vs forbidden file types.

---

#### `F15.2`: Upload Completion Confirmation & Metadata Persistence
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** After direct client upload succeeds, client confirms completion. Backend verifies object presence in bucket, extracts actual file size and dimensions, marks media_assets status AVAILABLE, and generates public CDN URL.

##### Architectural Traceability
- **User Interface Component:** `LocalImageUploader.jsx`
- **API Endpoint / Method:** `POST /api/v1/media/upload/complete`
- **Backend Service Method:** `MediaService.completeUpload`
- **Database Tables & Constraints:** `media_assets (status='AVAILABLE', public_url, file_size_bytes)`
- **External Integrations:** `Supabase Storage API`
- **Test Case Reference:** `MediaModuleTest.java`
- **Verification Evidence:** `MediaController.java:52-70; MediaAsset.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with MediaAssetDto containing permanent public asset URL.
- **Normal / Happy Path Flow:** Upload completes -> Backend confirms object in bucket -> Asset ready for entity linking.
- **Alternative Flows:** Failed upload leaves asset in PENDING_UPLOAD for background cleanup.
- **Negative & Abuse Scenarios:** Confirming non-existent asset ID -> HTTP 404.
- **Boundary Conditions & Limits:** Asset ID UUID validation.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Storage verification failure marks status FAILED.
- **Required Permissions & Access Control:** `Authenticated (Asset Owner)`
- **Expected Database State Mutations:** `UPDATE media_assets SET status='AVAILABLE', public_url=?, file_size_bytes=?, updated_at=NOW().`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module, Blog Module.
- **Testability & Environment Prerequisites:** Complete upload workflow and assert AVAILABLE status.

---

#### `F15.3`: Signed URL Generation for Protected Assets
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** For private training course materials, certificates, or confidential invoices, generates time-limited signed viewing URLs (default 15-minute expiration).

##### Architectural Traceability
- **User Interface Component:** `MediaImage.jsx, CourseDetailPage.jsx`
- **API Endpoint / Method:** `GET /api/v1/media/{id}/signed-url`
- **Backend Service Method:** `MediaService.generateSignedUrl`
- **Database Tables & Constraints:** `media_assets`
- **External Integrations:** `Supabase Storage Presigned URL Engine`
- **Test Case Reference:** `MediaModuleTest.java`
- **Verification Evidence:** `MediaController.java:72-85; SupabaseStorageService.java:85-110.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with temporary pre-signed HTTPS URL.
- **Normal / Happy Path Flow:** Trainee clicks protected lab guide -> Signed URL generated -> Browser opens PDF securely.
- **Alternative Flows:** Expired signed URL returns 403 from storage provider; client refreshes URL.
- **Negative & Abuse Scenarios:** Non-enrolled user requesting protected asset -> HTTP 403 FORBIDDEN.
- **Boundary Conditions & Limits:** Expiry duration: 900 seconds (15 minutes).

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Storage token signing failure returns HTTP 500.
- **Required Permissions & Access Control:** `Authenticated (Asset Access Authorized)`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Training Module, Security Infrastructure.
- **Testability & Environment Prerequisites:** Generate signed URL and verify access expiration.

---

#### `F15.4`: Media Linking to Products and Courses
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Maps uploaded media assets to specific entities via join tables media_product_links and media_course_links. Supports display sequence order and primary hero image flag.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Media tab)`
- **API Endpoint / Method:** `POST /api/v1/media/link`
- **Backend Service Method:** `MediaService.linkMedia`
- **Database Tables & Constraints:** `media_product_links, media_course_links`
- **External Integrations:** `None`
- **Test Case Reference:** `MediaModuleTest.java`
- **Verification Evidence:** `MediaController.java:90-110; V4__create_media_management_tables.sql:20-50.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; media appears in target product or course gallery.
- **Normal / Happy Path Flow:** Admin links 3 images to Oyster Spawn product -> Reorders sequence -> Displayed in carousel.
- **Alternative Flows:** Removing link deletes join record without deleting underlying media asset.
- **Negative & Abuse Scenarios:** Linking asset to non-existent product -> HTTP 404.
- **Boundary Conditions & Limits:** Display order integer >= 0.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Database foreign key constraint catch.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT/DELETE on media_product_links or media_course_links.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module, Training Module.
- **Testability & Environment Prerequisites:** Link media to product and query product gallery.

---

### MOD-16: Telemetry & Business Analytics
- **Package / Namespace:** `com.sporekart.analytics`
- **Total Features Cataloged:** 4

#### `F16.1`: Product View Telemetry Tracking
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Captures client product view events with product ID, slug, title, user ID (or anonymous session ID), and timestamp. Records event in analytics_events table asynchronously.

##### Architectural Traceability
- **User Interface Component:** `ProductDetailPage.jsx`
- **API Endpoint / Method:** `POST /api/v1/analytics/track-product-view`
- **Backend Service Method:** `AnalyticsService.trackProductView`
- **Database Tables & Constraints:** `analytics_events`
- **External Integrations:** `None`
- **Test Case Reference:** `01_guest_browsing.spec.js, AnalyticsModuleTest.java`
- **Verification Evidence:** `AnalyticsController.java:25-45; AnalyticsService.java:30-60; V15__create_analytics_events_tables.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200; event logged without impacting page load latency.
- **Normal / Happy Path Flow:** Customer navigates to product -> Beacon POST sent -> Analytics event logged.
- **Alternative Flows:** Duplicate view in short window debounced on client.
- **Negative & Abuse Scenarios:** Malformed payload returns HTTP 400 without crashing analytics pipeline.
- **Boundary Conditions & Limits:** Event name max 100 chars; payload JSON valid.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Analytics failure fail-safe: never impacts user browsing.
- **Required Permissions & Access Control:** `Public`
- **Expected Database State Mutations:** `INSERT into analytics_events (event_name='PRODUCT_VIEW', session_id, user_id).`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Catalog Module.
- **Testability & Environment Prerequisites:** Post product view event and verify row insertion.

---

#### `F16.2`: Conversion Funnel Event Recording
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Tracks sequential funnel conversion milestones: PRODUCT_VIEW -> CART_ADD -> CHECKOUT_STARTED -> ORDER_CREATED -> PAYMENT_COMPLETED. Calculates drop-off percentages.

##### Architectural Traceability
- **User Interface Component:** `Storefront, Cart, Checkout, Payment flows`
- **API Endpoint / Method:** `GET /api/v1/analytics/funnel, GET /api/v1/analytics/events`
- **Backend Service Method:** `AnalyticsService.recordFunnelEvent, getFunnelSummary`
- **Database Tables & Constraints:** `analytics_events, analytics_metrics`
- **External Integrations:** `None`
- **Test Case Reference:** `AnalyticsModuleTest.java, admin-analytics-clickable-cards.test.jsx`
- **Verification Evidence:** `AnalyticsController.java:50-80; AnalyticsService.java:65-115.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with FunnelSummaryDto displaying stage conversion percentages.
- **Normal / Happy Path Flow:** User converts from browsing to payment -> All funnel events registered in sequence.
- **Alternative Flows:** Abandoned cart event registered if checkout dropped.
- **Negative & Abuse Scenarios:** Out-of-order events handled gracefully.
- **Boundary Conditions & Limits:** Conversion percentage 0.00% to 100.00%.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Cached daily metrics returned on DB timeout.
- **Required Permissions & Access Control:** `Public (track) / ROLE_ADMIN (query funnel)`
- **Expected Database State Mutations:** `INSERT into analytics_events.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Cart Module, Order Module, Payment Module.
- **Testability & Environment Prerequisites:** Simulate complete funnel and query funnel summary.

---

#### `F16.3`: Asynchronous Event Consumption via Spring Events
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Listens for domain events published across modules via Spring ApplicationEventPublisher (OrderCreatedEvent, OrderDeliveredEvent, CourseCompletedEvent). Updates pre-aggregated daily analytics_metrics in isolated transaction.

##### Architectural Traceability
- **User Interface Component:** `Internal system listener`
- **API Endpoint / Method:** `ApplicationEventPublisher`
- **Backend Service Method:** `AnalyticsEventListener`
- **Database Tables & Constraints:** `analytics_metrics`
- **External Integrations:** `None`
- **Test Case Reference:** `AnalyticsModuleTest.java`
- **Verification Evidence:** `AnalyticsEventListener.java:30-85; OrderCreatedEvent.java; OrderDeliveredEvent.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Decoupled real-time metric updates without adding latency to checkout transactions.
- **Normal / Happy Path Flow:** Order created -> Event published -> Listener updates today's total revenue metric.
- **Alternative Flows:** Delivery event increments order fulfillment metrics.
- **Negative & Abuse Scenarios:** Listener exception caught and logged without aborting caller transaction.
- **Boundary Conditions & Limits:** Metric names: DAILY_REVENUE, ORDERS_PLACED, FULFILLED_COUNT.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Logged to application log.
- **Required Permissions & Access Control:** `Internal`
- **Expected Database State Mutations:** `UPSERT on analytics_metrics (metric_name, metric_date, metric_value).`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Order Module, Training Module.
- **Testability & Environment Prerequisites:** Publish mock OrderCreatedEvent and assert metrics row increment.

---

#### `F16.4`: Admin Analytics Overview & KPI Aggregation
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Provides executive metrics dashboard for store management: Total Revenue (INR), Gross Margin, Total Orders, Average Order Value (AOV), Active Training Cohorts, and Trainee Headcount.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Analytics tab), AdminAnalyticsDetailModal.jsx`
- **API Endpoint / Method:** `GET /api/v1/admin/analytics/overview`
- **Backend Service Method:** `AnalyticsService.getOverviewKpis`
- **Database Tables & Constraints:** `orders, payments, wallets, enrollments`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-analytics-clickable-cards.test.jsx, admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AnalyticsController.java:85-110; AnalyticsService.java:120-170.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with AnalyticsOverviewDto containing revenue and operational KPIs.
- **Normal / Happy Path Flow:** Admin opens Analytics tab -> Interactive KPI cards display total revenue and order growth.
- **Alternative Flows:** Clicking KPI card opens AdminAnalyticsDetailModal with historical trend chart.
- **Negative & Abuse Scenarios:** Non-admin access -> HTTP 403.
- **Boundary Conditions & Limits:** Revenue in INR formatted to 2 decimals.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Zero orders returns 0.00 metrics cleanly.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Admin Operations.
- **Testability & Environment Prerequisites:** Assert KPI calculation matches sum of confirmed orders.

---

### MOD-17: Administrative Control Plane & Auditing
- **Package / Namespace:** `com.sporekart.admin`
- **Total Features Cataloged:** 3

#### `F17.1`: Centralized Admin Operations Cockpit
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Consolidated administrative command center providing tabbed operations for Catalog, Orders, Courier Dispatches, Finance Ledger, Customer Directory, Training Masterclasses, Agronomy Blogs, Support Helpdesk, and Telemetry.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (~444 KB), AdminProtectedRoute.jsx`
- **API Endpoint / Method:** `GET /api/v1/admin/*`
- **Backend Service Method:** `AdminApplicationService`
- **Database Tables & Constraints:** `Multiple domain tables`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx, 10_admin_dashboard_interactive_audit.spec.js`
- **Verification Evidence:** `AdminDashboardPage.jsx:1-8500; SecurityConfig.java:90.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Single-pane-of-glass operations console for platform administrators.
- **Normal / Happy Path Flow:** Admin logs in -> Authenticated via ROLE_ADMIN -> Cockpit loads active tabs.
- **Alternative Flows:** Direct URL routing (/admin/orders, /admin/finance) opens corresponding tab.
- **Negative & Abuse Scenarios:** Unauthenticated user or standard customer accessing /admin -> Redirected to /admin/login with 403.
- **Boundary Conditions & Limits:** Monolithic component: 444 KB payload; code splitting recommended.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Tab error contained via React Error Boundary.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `Read-only navigation; individual actions mutate domain tables.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** All Modules.
- **Testability & Environment Prerequisites:** Attempt access with customer vs admin credentials.

---

#### `F17.2`: Immutable Admin Action Audit Logging
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Every mutating administrative operation (product status toggle, manual stock adjustment, refund approval, order status override, withdrawal payout, customer capability grant) writes an immutable record to admin_audit_logs with operator user ID, action enum, resource ID, IP address, and JSON diff payload.

##### Architectural Traceability
- **User Interface Component:** `AdminDashboardPage.jsx (Audit tab)`
- **API Endpoint / Method:** `GET /api/v1/admin/audit-logs`
- **Backend Service Method:** `AdminApplicationService.recordAuditLog`
- **Database Tables & Constraints:** `admin_audit_logs`
- **External Integrations:** `None`
- **Test Case Reference:** `admin-console-full-validation.test.jsx`
- **Verification Evidence:** `AdminApplicationService.java:40-95; AdminAuditLog.java; V13__enhance_admin_audit_logs.sql.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Returns HTTP 200 with paginated audit logs; provides tamper-evident compliance audit trail.
- **Normal / Happy Path Flow:** Admin updates order status -> Audit record automatically committed -> Appears in Audit tab.
- **Alternative Flows:** Filter audit logs by operator, date range, or action type.
- **Negative & Abuse Scenarios:** Audit log records cannot be edited or deleted via any API.
- **Boundary Conditions & Limits:** IP address IPv4/IPv6 format; details_json valid JSON text.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Audit logging failure aborts parent administrative transaction.
- **Required Permissions & Access Control:** `ROLE_ADMIN`
- **Expected Database State Mutations:** `INSERT into admin_audit_logs (user_id, action, resource_id, ip_address, details_json).`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** All Admin Controllers.
- **Testability & Environment Prerequisites:** Perform administrative action and assert matching admin_audit_logs row.

---

#### `F17.3`: Production Admin Bootstrapping Initializer
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Executes on application startup via Spring CommandLineRunner. Checks if an active administrator exists in users table. If none exists, bootstraps default administrator account from environment variables (ADMIN_INITIAL_EMAIL, ADMIN_INITIAL_PHONE).

##### Architectural Traceability
- **User Interface Component:** `System startup`
- **API Endpoint / Method:** `ProdAdminBootstrapInitializer.java`
- **Backend Service Method:** `ProdAdminBootstrapInitializer`
- **Database Tables & Constraints:** `users (ROLE_ADMIN)`
- **External Integrations:** `None`
- **Test Case Reference:** `SporekartIntegrationTest.java`
- **Verification Evidence:** `ProdAdminBootstrapInitializer.java:25-60; DataInitializer.java.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Guarantees system is never locked out of administrative access on fresh deployment.
- **Normal / Happy Path Flow:** Application starts -> Checks users for ROLE_ADMIN -> Found -> Startup continues.
- **Alternative Flows:** If zero admins found, seeds initial admin with BCrypt hashed password and ROLE_ADMIN.
- **Negative & Abuse Scenarios:** If admin already exists, bootstrapping step is a no-op.
- **Boundary Conditions & Limits:** Executes once per application startup lifecycle.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Startup exception logged if database connection fails.
- **Required Permissions & Access Control:** `System Runtime`
- **Expected Database State Mutations:** `INSERT into users (email, roles='ROLE_ADMIN', is_active=TRUE) if missing.`
- **Downstream Events & Notifications:** Logs bootstrap notice.
- **Cross-Module Dependencies:** Identity Module.
- **Testability & Environment Prerequisites:** Verify admin user exists in fresh test database.

---

### MOD-18: Cross-Cutting Security & Infrastructure
- **Package / Namespace:** `com.sporekart.shared`
- **Total Features Cataloged:** 6

#### `F18.1`: Stateless JWT Authentication Filter
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Intercepts all incoming HTTP requests before UsernamePasswordAuthenticationFilter. Extracts 'Bearer <token>' from Authorization header. Validates cryptographic signature, issuer, and expiration. Populates Spring SecurityContextHolder.

##### Architectural Traceability
- **User Interface Component:** `api.js (injected on all requests)`
- **API Endpoint / Method:** `JwtAuthenticationFilter.java`
- **Backend Service Method:** `JwtTokenProvider.validateTokenAndGetAuthentication`
- **Database Tables & Constraints:** `None (Stateless cryptographic verification)`
- **External Integrations:** `None`
- **Test Case Reference:** `AuthorizationMatrixIntegrationTest.java, ExtendedIntegrationTest.java`
- **Verification Evidence:** `JwtAuthenticationFilter.java:25-60; JwtTokenProvider.java:30-80.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Sets valid Authentication object in SecurityContext for valid tokens; permits anonymous context for unauthenticated.
- **Normal / Happy Path Flow:** Client request arrives with Bearer token -> Validated -> Request proceeds to controller.
- **Alternative Flows:** If token expired, clears token and triggers 401 response from authenticationEntryPoint.
- **Negative & Abuse Scenarios:** Manipulated token signature -> Rejected with 401 'Authentication required or token expired'.
- **Boundary Conditions & Limits:** Token algorithm HMAC-SHA256; Secret min 256 bits (32 bytes).

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Invalid token does not throw 500; cleanly yields 401.
- **Required Permissions & Access Control:** `All Requests`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** All Controllers.
- **Testability & Environment Prerequisites:** Send requests with valid, expired, and corrupted JWT tokens.

---

#### `F18.2`: Role-Based Access Control (RBAC) Enforcement
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Enforces authorization boundaries via SecurityConfig and @PreAuthorize annotations. Public endpoints (/catalog, /search, /training, /cart) accessible to all. Protected customer endpoints (/customer, /wallet, /support) require ROLE_CUSTOMER. Protected management endpoints (/admin/**) strictly require ROLE_ADMIN.

##### Architectural Traceability
- **User Interface Component:** `AdminProtectedRoute.jsx, Navigation elements`
- **API Endpoint / Method:** `SecurityConfig.java:lines 67-94`
- **Backend Service Method:** `Spring Security Method Security`
- **Database Tables & Constraints:** `users.roles`
- **External Integrations:** `None`
- **Test Case Reference:** `AuthorizationMatrixIntegrationTest.java`
- **Verification Evidence:** `SecurityConfig.java:67-94; AuthorizationMatrixIntegrationTest.java:1-250.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Strict enforcement of 401 UNAUTHORIZED (unauthenticated) and 403 FORBIDDEN (insufficient role).
- **Normal / Happy Path Flow:** Admin token accesses /admin/orders -> HTTP 200. Customer token accesses /customer/profile -> HTTP 200.
- **Alternative Flows:** Unauthenticated guest accesses /catalog -> HTTP 200.
- **Negative & Abuse Scenarios:** Customer token accesses /admin/orders -> HTTP 403 FORBIDDEN 'Access denied'.
- **Boundary Conditions & Limits:** Roles: ROLE_CUSTOMER, ROLE_ADMIN.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** AccessDeniedHandler returns standardized RFC 7807 JSON error response.
- **Required Permissions & Access Control:** `Role-dependent`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** All Modules.
- **Testability & Environment Prerequisites:** Execute comprehensive authorization matrix across all 108 endpoints.

---

#### `F18.3`: In-Memory Token Bucket Rate Limiting Filter
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Protects public API endpoints (/auth/otp, /cart, /search) against brute-force and Denial-of-Service attacks. Implements in-memory token bucket algorithm per client IP address. Returns HTTP 429 Too Many Requests when rate limit exceeded.

##### Architectural Traceability
- **User Interface Component:** `Global HTTP entry point`
- **API Endpoint / Method:** `RateLimitingFilter.java`
- **Backend Service Method:** `RateLimitingFilter`
- **Database Tables & Constraints:** `None (In-memory ConcurrentHashMap)`
- **External Integrations:** `None`
- **Test Case Reference:** `ExtendedIntegrationTest.java`
- **Verification Evidence:** `RateLimitingFilter.java:25-95; SecurityConfig.java:95.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Permits normal browsing; blocks rapid automated flooding requests with HTTP 429.
- **Normal / Happy Path Flow:** Client sends 5 requests per second -> All pass cleanly.
- **Alternative Flows:** Token bucket refills continuously at fixed replenishment rate.
- **Negative & Abuse Scenarios:** Client sends 100 requests in 1 second -> Requests 61+ rejected with HTTP 429 'Too many requests. Please slow down.'
- **Boundary Conditions & Limits:** Burst capacity: 60 tokens per minute per IP; refill rate: 1 token per second.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Scheduled cleanup job evicts stale IP buckets every 5 minutes to prevent memory leaks.
- **Required Permissions & Access Control:** `All Requests`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Security Infrastructure.
- **Testability & Environment Prerequisites:** Flood endpoint with 70 rapid requests and assert HTTP 429 on overflow.

---

#### `F18.4`: Request ID Tracking (X-Request-ID MDC Propagation)
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** RequestIdFilter inspects incoming requests for 'X-Request-ID' header. If absent, generates random UUID. Injects into SLF4J MDC (Mapped Diagnostic Context) and writes 'X-Request-ID' to response headers. Enables end-to-end distributed trace correlation.

##### Architectural Traceability
- **User Interface Component:** `Client response headers, Error modals`
- **API Endpoint / Method:** `RequestIdFilter.java`
- **Backend Service Method:** `RequestIdContext`
- **Database Tables & Constraints:** `Stored in admin_audit_logs.request_id`
- **External Integrations:** `None`
- **Test Case Reference:** `SporekartIntegrationTest.java`
- **Verification Evidence:** `RequestIdFilter.java:20-45; RequestIdContext.java:10-25; SecurityConfig.java:96, 123.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Every HTTP response contains 'X-Request-ID: <uuid>'; all server log entries include [requestId].
- **Normal / Happy Path Flow:** Request arrives -> Filter assigns UUID -> Log lines include UUID -> Response includes header.
- **Alternative Flows:** If client provides X-Request-ID, backend preserves client trace ID.
- **Negative & Abuse Scenarios:** None.
- **Boundary Conditions & Limits:** UUID RFC 4122 format (36 chars).

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Filter always passes request through in finally block.
- **Required Permissions & Access Control:** `All Requests`
- **Expected Database State Mutations:** `Included in audit log records.`
- **Downstream Events & Notifications:** Included in error messages.
- **Cross-Module Dependencies:** Logging & Diagnostics.
- **Testability & Environment Prerequisites:** Assert presence of X-Request-ID header on any API response.

---

#### `F18.5`: Global Exception Handling & RFC 7807 Sanitization
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Centralized @RestControllerAdvice catches all exceptions. Sanitizes internal database error messages, stack traces, and SQL queries to prevent information disclosure. Formats errors into standardized ApiResponse.error(code, message).

##### Architectural Traceability
- **User Interface Component:** `Standard error toast / alert display`
- **API Endpoint / Method:** `GlobalExceptionHandler.java`
- **Backend Service Method:** `GlobalExceptionHandler`
- **Database Tables & Constraints:** `None`
- **External Integrations:** `None`
- **Test Case Reference:** `ExtendedIntegrationTest.java, address-login-negative-scenarios.test.jsx`
- **Verification Evidence:** `GlobalExceptionHandler.java:18-106.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Consistent JSON error contract; zero stack trace leakage to client browser.
- **Normal / Happy Path Flow:** ResourceNotFoundException -> HTTP 404 '{"success":false,"error":{"code":"NOT_FOUND"}}'.
- **Alternative Flows:** MethodArgumentNotValidException formats field errors into readable validation summary.
- **Negative & Abuse Scenarios:** Unhandled NullPointerException / SQLException -> HTTP 500 'An unexpected internal error occurred. Please contact support with request ID.'
- **Boundary Conditions & Limits:** Never leaks database schema names, credentials, or file paths.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Logs full stack trace to server-side logs with MDC request ID.
- **Required Permissions & Access Control:** `Global Handler`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** All Controllers.
- **Testability & Environment Prerequisites:** Trigger 400, 404, 409, and 500 exceptions and assert JSON error shape.

---

#### `F18.6`: CORS Policy & Frame Options Headers
- **Rule Classification:** **`[DOCUMENTED]`**
- **Core Business Rule:** Configures strict Cross-Origin Resource Sharing. In production, allows only explicit whitelisted domains (CORS_ALLOWED_ORIGINS). Enables allowCredentials=true, exposes X-Request-ID and Authorization headers. In dev, permits localhost origins. Enforces X-Frame-Options: SAMEORIGIN (or DENY) to prevent clickjacking.

##### Architectural Traceability
- **User Interface Component:** `Browser cross-origin protection`
- **API Endpoint / Method:** `SecurityConfig.corsConfigurationSource`
- **Backend Service Method:** `Spring WebMvc CorsFilter`
- **Database Tables & Constraints:** `None`
- **External Integrations:** `None`
- **Test Case Reference:** `ExtendedIntegrationTest.java`
- **Verification Evidence:** `SecurityConfig.java:48-52, 108-130.`

##### Execution Scenarios & Boundary Conditions
- **Expected Behavior:** Blocks unauthorized third-party domains from querying API via browser fetch/XHR.
- **Normal / Happy Path Flow:** Origin http://localhost:3000 -> Allowed with Access-Control-Allow-Origin header.
- **Alternative Flows:** Preflight OPTIONS request returns HTTP 200 with allowed methods.
- **Negative & Abuse Scenarios:** Malicious origin 'https://evil-hacker.com' -> Rejected by browser CORS policy.
- **Boundary Conditions & Limits:** Methods allowed: GET, POST, PUT, DELETE, OPTIONS, PATCH.

##### Operations, Resilience & State Integrity
- **Failure & Recovery Behavior:** Browser blocks response if origin unlisted.
- **Required Permissions & Access Control:** `All Requests`
- **Expected Database State Mutations:** `None.`
- **Downstream Events & Notifications:** None.
- **Cross-Module Dependencies:** Frontend Axios Client.
- **Testability & Environment Prerequisites:** Send preflight OPTIONS request with valid vs unauthorized Origin header.

---

## 3. Requirement Traceability Matrix (Compact Overview)

| Feature ID | Feature Name | Rule Type | UI Component | API Endpoint | Service Method | Database Tables | Test Reference |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **F01.1** | Customer Phone OTP Request & Delivery | `INFERRED` | `AuthForm.jsx` | `POST /api/v1/auth/otp/request` | `AuthService.requestOtp` | `otps` | `IdentityModuleTest.java` |
| **F01.2** | Customer Phone OTP Verification & JWT Issuance | `DOCUMENTED` | `AuthForm.jsx` | `POST /api/v1/auth/otp/verify` | `AuthService.verifyOtpAndLogin` | `otps` | `IdentityModuleTest.java` |
| **F01.3** | Google OAuth2 Single Sign-On & Account Linking | `DOCUMENTED` | `GoogleLoginButton.jsx` | `POST /api/v1/auth/oauth/google` | `GoogleAuthService.verifyAndAuthenticate` | `customer_identities` | `IdentityModuleTest.java` |
| **F01.4** | Identity Conflict Resolution (Duplicate Phone/Email) | `INFERRED` | `IdentityConflictModal.jsx` | `POST /api/v1/auth/oauth/google` | `AuthService.resolveConflict` | `users` | `address-login-negative-scenarios.test.jsx` |
| **F01.5** | Current User Context Retrieval (/auth/me) | `DOCUMENTED` | `Navbar.jsx` | `GET /api/v1/auth/me` | `AuthService.getCurrentUser` | `users` | `04_login.spec.js` |
| **F01.6** | Admin OTP Request & Access Gating | `DOCUMENTED` | `AdminLoginPage.jsx` | `POST /api/v1/admin/auth/otp/request` | `AdminAuthService.requestAdminOtp` | `users` | `admin-access-restriction.test.jsx` |
| **F01.7** | Admin OTP Verification & Privileged JWT Issuance | `DOCUMENTED` | `AdminLoginPage.jsx` | `POST /api/v1/admin/auth/otp/verify` | `AdminAuthService.verifyAdminOtp` | `otps` | `admin-access-restriction.test.jsx` |
| **F01.8** | Guest Session ID Management (X-Session-ID) | `INFERRED` | `api.js (axios request interceptor)` | `All /cart/**` | `Controller session extraction` | `carts.session_id` | `03_guest_cart.spec.js` |
| **F02.1** | Customer Profile Retrieval & Updates | `DOCUMENTED` | `DashboardPage.jsx (Profile tab)` | `GET /api/v1/customer/profile` | `CustomerService.getProfile` | `customer_profiles` | `CustomerModuleTest.java` |
| **F02.2** | Customer Multi-Address Management with Alternate Phone | `DOCUMENTED` | `IndianAddressForm.jsx` | `GET /api/v1/customer/addresses` | `CustomerService.addAddress` | `customer_addresses` | `CustomerModuleTest.java` |
| **F02.3** | Training Capability Flag & Automatic Granting | `INFERRED` | `DashboardPage.jsx` | `GET /api/v1/customer/capabilities` | `TrainingCapabilityEventListener.onCourseCompleted` | `customer_profiles` | `CustomerModuleTest.java` |
| **F02.4** | Admin Customer Directory & Capability Grant | `DOCUMENTED` | `AdminDashboardPage.jsx (Customers tab)` | `GET /api/v1/admin/customers` | `AdminCustomerService.getAllCustomers` | `users` | `admin-console-full-validation.test.jsx` |
| **F03.1** | Category Taxonomy & Navigation | `DOCUMENTED` | `CategoryCarousel.jsx` | `GET /api/v1/catalog/categories` | `CatalogApplicationService.getAllCategories` | `categories` | `CatalogModuleTest.java` |
| **F03.2** | Product Listing & Multi-Param Filtering | `DOCUMENTED` | `CatalogPage.jsx` | `GET /api/v1/catalog/products` | `CatalogApplicationService.getAllActiveProducts` | `products` | `CatalogModuleTest.java` |
| **F03.3** | Product Detail View & Variant Resolution | `DOCUMENTED` | `ProductDetailPage.jsx` | `GET /api/v1/catalog/products/{slug}` | `CatalogApplicationService.getProductBySlug` | `products` | `CatalogModuleTest.java` |
| **F03.4** | Popular & Best-Selling Merchandising | `INFERRED` | `HomePage.jsx` | `GET /api/v1/products/popular` | `CatalogApplicationService.getPopularProducts` | `products` | `01_guest_browsing.spec.js` |
| **F03.5** | Global Multi-Entity Full-Text Search | `DOCUMENTED` | `GlobalSearch.jsx` | `GET /api/v1/search` | `GlobalSearchService.searchAll` | `products` | `CatalogModuleTest.java` |
| **F03.6** | Agronomy Specifications Management | `DOCUMENTED` | `AdminDashboardPage.jsx (Catalog tab)` | `POST /api/v1/admin/catalog/products/{id}/information` | `ProductInformationService.saveOrUpdate` | `product_information` | `CatalogModuleTest.java` |
| **F03.7** | Product Offers & Promotional Badges | `INFERRED` | `ProductCard.jsx` | `POST /api/v1/admin/catalog/offers` | `CatalogApplicationService.createOffer` | `product_offers` | `CatalogModuleTest.java` |
| **F03.8** | Admin Catalog Control Plane (CRUD Operations) | `DOCUMENTED` | `AdminDashboardPage.jsx (~444 KB)` | `POST /api/v1/admin/catalog/products` | `CatalogApplicationService` | `products` | `CatalogModuleTest.java` |
| **F04.1** | Real-Time Stock Query | `DOCUMENTED` | `ProductCard.jsx` | `GET /api/v1/catalog/products/{slug}` | `InventoryService.getInventoryRecord` | `inventory_records` | `CatalogModuleTest.java` |
| **F04.2** | Pessimistic Stock Reservation at Checkout | `DOCUMENTED` | `CheckoutPage.jsx` | `POST /api/v1/orders` | `InventoryService.reserveStock` | `inventory_records` | `PaymentModuleTest.java` |
| **F04.3** | Stock Purchase Confirmation upon Payment | `DOCUMENTED` | `PaymentPage.jsx` | `POST /api/v1/payment/verify or webhook` | `InventoryService.confirmPurchase` | `inventory_records` | `PaymentModuleTest.java` |
| **F04.4** | Stock Release on Order Cancellation | `DOCUMENTED` | `DashboardPage.jsx` | `POST /api/v1/orders/{id}/cancel` | `InventoryService.releaseCancelledOrder` | `inventory_records` | `04_order_cancellation_lifecycle.spec.js` |
| **F04.5** | Immutable Inventory Audit Event Log | `DOCUMENTED` | `AdminDashboardPage.jsx (Inventory tab)` | `Internal audit` | `InventoryService.recordAuditEvent` | `inventory_audit_events` | `CatalogModuleTest.java` |
| **F04.6** | Admin Stock Replenishment | `DOCUMENTED` | `AdminDashboardPage.jsx` | `POST /api/v1/admin/catalog/inventory/{variantId}/replenish` | `InventoryService.replenishStock` | `inventory_records` | `10_admin_product_creation.spec.js` |
| **F05.1** | Guest Cart Creation & Session Tracking | `DOCUMENTED` | `CartDrawer.jsx` | `GET /api/v1/cart` | `CartService.getOrCreateCart` | `carts` | `03_guest_cart.spec.js` |
| **F05.2** | Cart Item Mutations (Add, Update, Remove, Clear) | `DOCUMENTED` | `CartDrawer.jsx` | `POST /api/v1/cart/items` | `CartService.addItem` | `carts` | `03_guest_cart.spec.js` |
| **F05.3** | Anonymous Guest-to-User Cart Merging | `DOCUMENTED` | `AuthForm.jsx` | `POST /api/v1/cart/merge` | `CartService.mergeGuestCart` | `carts` | `05_cart_merge.spec.js` |
| **F05.4** | Single Active Cart Partial Unique Constraint | `INFERRED` | `Backend enforcement` | `CartService.getOrCreateCart` | `CartRepository.findActiveByUserId` | `carts (uq_carts_user_active)` | `CartModuleTest.java` |
| **F05.5** | Pre-Checkout Cart Stock & Price Validation | `DOCUMENTED` | `CheckoutPage.jsx` | `POST /api/v1/cart/validate` | `CartService.validateCart` | `carts` | `fe-3.test.jsx` |
| **F05.6** | Coupon & Promo Code Validation | `DOCUMENTED` | `PromoCodeSection.jsx` | `POST /api/v1/cart/apply-promotion` | `PromotionService.validateAndCalculate` | `promotions` | `fe-promocode.test.jsx` |
| **F05.7** | Discount & Free Shipping Computation | `DOCUMENTED` | `CartDrawer.jsx` | `Subsumed in /cart/apply-promotion and /orders` | `PromotionService.calculateDiscount` | `promotions` | `fe-promocode.test.jsx` |
| **F05.8** | Promo Code Usage Tracking & Redemption | `DOCUMENTED` | `Backend enforcement` | `Triggered via POST /orders` | `PromotionService.recordUsage` | `promotion_usages` | `PaymentModuleTest.java` |
| **F05.9** | Admin Promotion Control Plane | `DOCUMENTED` | `AdminDashboardPage.jsx (Promotions tab)` | `GET /api/v1/admin/promotions` | `PromotionService` | `promotions` | `admin-console-full-validation.test.jsx` |
| **F06.1** | Order Creation from Cart with Idempotency | `DOCUMENTED` | `CheckoutPage.jsx` | `POST /api/v1/orders` | `OrderService.createOrderFromCart` | `orders` | `PaymentModuleTest.java` |
| **F06.2** | Immutable Shipping Address Snapshotting | `DOCUMENTED` | `CheckoutPage.jsx` | `POST /api/v1/orders` | `OrderService.resolveAddressSnapshot` | `orders.shipping_address_json` | `PaymentModuleTest.java` |
| **F06.3** | Unique Order Number Generation | `DOCUMENTED` | `OrderConfirmationPage.jsx` | `Subsumed in POST /orders` | `OrderService.generateOrderNumber` | `orders.order_number (UNIQUE)` | `OrderModuleTest.java` |
| **F06.4** | Customer Order History Query | `DOCUMENTED` | `DashboardPage.jsx (Orders tab)` | `GET /api/v1/orders` | `OrderService.getUserOrders` | `orders` | `02_customer_account_lifecycle.spec.js` |
| **F06.5** | Direct Order Detail Access Control | `DOCUMENTED` | `OrderConfirmationPage.jsx` | `GET /api/v1/orders/{id}` | `OrderService.getOrderDetails` | `orders` | `03_catalog_cart_checkout.spec.js` |
| **F06.6** | Dynamic GST-Compliant PDF Invoice Download | `DOCUMENTED` | `OrderConfirmationPage.jsx` | `GET /api/v1/orders/{id}/invoice` | `OrderService.generateInvoicePdf` | `orders` | `03_catalog_cart_checkout.spec.js` |
| **F06.7** | Pre-Shipment Customer Order Cancellation | `DOCUMENTED` | `DashboardPage.jsx (Orders tab)` | `POST /api/v1/orders/{id}/cancel` | `OrderService.cancelOrder` | `orders` | `04_order_cancellation_lifecycle.spec.js` |
| **F06.8** | Automated Refund-to-Wallet on Cancellation | `DOCUMENTED` | `DashboardPage.jsx (Wallet & Orders tabs)` | `Triggered via POST /orders/{id}/cancel` | `WalletService.processRefundToWallet` | `wallets` | `05_payment_refund_lifecycle.spec.js` |
| **F06.9** | Admin Order Control Plane & Terminal Enforcement | `DOCUMENTED` | `AdminDashboardPage.jsx (Orders tab)` | `PUT /api/v1/admin/orders/{id}/status` | `OrderService.updateOrderStatus` | `orders` | `admin-order-payment-confirmation.test.jsx` |
| **F06.10** | Admin Packing Slip Generation | `DOCUMENTED` | `AdminDashboardPage.jsx (Orders tab)` | `GET /api/v1/admin/orders/{id}/packing-slip` | `OrderService.generatePackingSlipPdf` | `orders` | `admin-console-full-validation.test.jsx` |
| **F07.1** | Razorpay Payment Initiation for E-Commerce Orders | `DOCUMENTED` | `PaymentPage.jsx` | `POST /api/v1/payment/initiate` | `PaymentService.initiatePayment` | `payments` | `PaymentModuleTest.java` |
| **F07.2** | Razorpay Payment Initiation for Training Enrollments | `DOCUMENTED` | `PaymentPage.jsx (type=enrollment)` | `POST /api/v1/payment/initiate-enrollment` | `PaymentService.initiateEnrollmentPayment` | `payments` | `PaymentModuleTest.java` |
| **F07.3** | Client Payment Signature Verification (HMAC-SHA256) | `DOCUMENTED` | `PaymentPage.jsx` | `POST /api/v1/payment/verify` | `PaymentService.verifyPayment` | `payments.status=CAPTURED` | `PaymentModuleTest.java` |
| **F07.4** | Razorpay Webhook Ingestion (payment.captured, order.paid) | `DOCUMENTED` | `Server-to-server webhook` | `POST /api/v1/payment/webhook` | `PaymentService.processWebhook` | `payments` | `PaymentModuleTest.java` |
| **F07.5** | Webhook Idempotency & Deduplication | `DOCUMENTED` | `Server-to-server webhook` | `POST /api/v1/payment/webhook` | `PaymentService.processWebhook` | `payment_events.event_id (UNIQUE)` | `PaymentModuleTest.java` |
| **F07.6** | Automated Training Seat Confirmation via Webhook | `DOCUMENTED` | `Server-to-server webhook` | `POST /api/v1/payment/webhook` | `TrainingService.confirmEnrollmentPayment` | `enrollments.status=CONFIRMED` | `PaymentModuleTest.java` |
| **F07.7** | Payment Refund Webhook Processing (refund.processed) | `DOCUMENTED` | `Server-to-server webhook` | `POST /api/v1/payment/webhook` | `PaymentService.processWebhook` | `payments.status=REFUNDED` | `05_payment_refund_lifecycle.spec.js` |
| **F07.8** | Payment Failure Audit Logging (payment.failed) | `DOCUMENTED` | `PaymentPage.jsx` | `POST /api/v1/payment/webhook` | `PaymentService.processWebhook` | `payments.status=FAILED` | `PaymentModuleTest.java` |
| **F08.1** | Customer Wallet Provisioning & Balance Retrieval | `DOCUMENTED` | `DashboardPage.jsx (Wallet tab)` | `GET /api/v1/wallet` | `WalletService.getOrCreateWallet` | `wallets` | `06_customer_wallet_lifecycle.spec.js` |
| **F08.2** | Pessimistic Row Locking on Wallet Updates | `DOCUMENTED` | `Backend concurrency protection` | `Internal WalletService methods` | `WalletRepository.findByUserIdWithLock` | `wallets (PESSIMISTIC_WRITE)` | `WalletModuleTest.java` |
| **F08.3** | Wallet Topup Intent Creation | `DOCUMENTED` | `DashboardPage.jsx (Add Money Modal)` | `POST /api/v1/wallet/add-money` | `WalletService.createTopupIntent` | `wallet_topup_intents` | `06_customer_wallet_lifecycle.spec.js` |
| **F08.4** | Topup Signature Verification & Pessimistic Credit | `DOCUMENTED` | `DashboardPage.jsx` | `POST /api/v1/wallet/verify-add-money` | `WalletService.verifyTopup` | `wallet_topup_intents.status=COMPLETED` | `06_customer_wallet_lifecycle.spec.js` |
| **F08.5** | Direct Checkout Payment via Wallet Balance | `DOCUMENTED` | `PaymentPage.jsx` | `POST /api/v1/wallet/checkout-pay` | `WalletService.debitWallet` | `wallets` | `05_payment_refund_lifecycle.spec.js` |
| **F08.6** | Non-Negative Balance Constraint Enforcement | `DOCUMENTED` | `Backend & Database enforcement` | `All wallet debit flows` | `WalletService.debitWallet` | `wallets (CHECK available_balance >= 0)` | `WalletModuleTest.java` |
| **F08.7** | Order Cancellation Refund Credit to Wallet | `DOCUMENTED` | `DashboardPage.jsx (Orders & Wallet tabs)` | `Triggered via POST /orders/{id}/cancel` | `WalletService.processRefundToWallet` | `wallets` | `04_order_cancellation_lifecycle.spec.js` |
| **F08.8** | Customer Withdrawal Request Submission | `DOCUMENTED` | `DashboardPage.jsx (Withdraw Modal)` | `POST /api/v1/wallet/withdraw` | `WalletService.requestWithdrawal` | `wallet_withdrawals` | `06_customer_wallet_lifecycle.spec.js` |
| **F08.9** | Admin Withdrawal Approval & Settlement | `DOCUMENTED` | `AdminDashboardPage.jsx (Finance tab)` | `POST /api/v1/admin/finance/withdrawals/{id}/approve` | `WalletService.approveWithdrawal` | `wallet_withdrawals.status=APPROVED` | `admin-console-full-validation.test.jsx` |
| **F08.10** | Admin Withdrawal Rejection & Recredit | `DOCUMENTED` | `AdminDashboardPage.jsx (Finance tab)` | `POST /api/v1/admin/finance/withdrawals/{id}/reject` | `WalletService.rejectWithdrawal` | `wallet_withdrawals.status=REJECTED` | `admin-console-full-validation.test.jsx` |
| **F08.11** | Admin Manual Credit/Debit Adjustment with Audit Trail | `DOCUMENTED` | `AdminDashboardPage.jsx (Finance tab)` | `POST /api/v1/admin/finance/manual-adjustment` | `WalletService.performManualAdjustment` | `wallets` | `admin-console-full-validation.test.jsx` |
| **F09.1** | Indian Pincode Serviceability & ETA Estimation | `DOCUMENTED` | `ProductDetailPage.jsx` | `GET /api/v1/shipping/check-pincode/{pincode}` | `ShippingApplicationService.checkServiceability` | `None (Logistics calculation)` | `ShippingModuleTest.java` |
| **F09.2** | Shiprocket Order & Shipment Creation | `DOCUMENTED` | `AdminDashboardPage.jsx (Shipping tab)` | `POST /api/v1/shipping/create` | `ShippingApplicationService.createShipment` | `shipments` | `ShippingModuleTest.java` |
| **F09.3** | Courier AWB Allocation & Tracking Number | `DOCUMENTED` | `AdminDashboardPage.jsx` | `Subsumed in POST /shipping/create` | `ShiprocketAdapter.createShipment` | `shipments.awb_code` | `ShippingModuleTest.java` |
| **F09.4** | Real-Time Shipment Tracking Query | `DOCUMENTED` | `DashboardPage.jsx (ActiveTrack tab)` | `GET /api/v1/shipping/track/{shipmentId}` | `ShippingApplicationService.trackShipment` | `shipments` | `ShippingModuleTest.java` |
| **F09.5** | Shiprocket Tracking Webhook Ingestion & Status Sync | `DOCUMENTED` | `Server-to-server webhook` | `POST /api/v1/shipping/webhook` | `ShippingApplicationService.handleShiprocketWebhook` | `shipments.status` | `ShippingModuleTest.java` |
| **F09.6** | Courier Pickup Cancellation prior to Transit | `DOCUMENTED` | `AdminDashboardPage.jsx (Shipping tab)` | `POST /api/v1/shipping/cancel/{shipmentId}` | `ShippingApplicationService.cancelShipment` | `shipments.status=CANCELLED` | `ShippingModuleTest.java` |
| **F09.7** | Courier Event Simulator for Testing | `INFERRED` | `AdminDashboardPage.jsx (Debug Tools)` | `POST /api/v1/shipping/simulate-event/{shipmentId}` | `ShippingApplicationService.simulateTrackingEvent` | `shipments` | `ShippingModuleTest.java` |
| **F10.1** | Course Catalog Browsing & Category Navigation | `DOCUMENTED` | `TrainingPage.jsx` | `GET /api/v1/training/courses` | `TrainingService.getAllActiveCourses` | `courses` | `TrainingModuleTest.java` |
| **F10.2** | Course Syllabus & Masterclass Detail View | `DOCUMENTED` | `CourseDetailPage.jsx` | `GET /api/v1/training/courses/{slug}` | `TrainingService.getCourseBySlug` | `courses` | `TrainingModuleTest.java` |
| **F10.3** | Upcoming Batch Cohort Discovery & Seat Counts | `DOCUMENTED` | `CourseDetailPage.jsx` | `GET /api/v1/training/courses/{id}/batches` | `TrainingService.getUpcomingBatches` | `batches` | `TrainingModuleTest.java` |
| **F10.4** | Trainee Profile & Indian Address Capture | `DOCUMENTED` | `TraineeProfileEnrollmentModal.jsx` | `Subsumed in POST /training/enroll` | `TrainingService.enrollCustomer` | `customer_profiles` | `09_training_enrollment.spec.js` |
| **F10.5** | Batch Seat Reservation with Promo Support | `DOCUMENTED` | `TraineeProfileEnrollmentModal.jsx` | `POST /api/v1/training/enroll` | `TrainingService.enrollCustomer` | `enrollments` | `TrainingModuleTest.java` |
| **F10.6** | Trainee Enrollment Cancellation & Wallet Refund | `DOCUMENTED` | `DashboardPage.jsx (Training Bookings tab)` | `POST /api/v1/training/enrollments/{id}/cancel` | `TrainingService.cancelEnrollment` | `enrollments.status=CANCELLED` | `07_training_trainee_lifecycle.spec.js` |
| **F10.7** | Trainee My-Bookings & Receipt Query | `DOCUMENTED` | `TrainingConfirmationPage.jsx` | `GET /api/v1/training/my-bookings` | `TrainingService.getUserEnrollments` | `enrollments` | `09_training_enrollment.spec.js` |
| **F10.8** | Admin Classroom Attendance Tracking | `DOCUMENTED` | `AdminDashboardPage.jsx (Training tab)` | `POST /api/v1/admin/training/attendance` | `TrainingService.markAttendance` | `attendances` | `admin-console-full-validation.test.jsx` |
| **F10.9** | Digital Certificate Generation & Public Verification | `DOCUMENTED` | `DashboardPage.jsx` | `POST /api/v1/admin/training/complete-course` | `TrainingService.completeCourseAndIssueCertificate` | `completions` | `07_training_trainee_lifecycle.spec.js` |
| **F10.10** | Training Gallery (Glimpses) Showcase Management | `DOCUMENTED` | `TrainingGlimpseCarousel.jsx` | `GET /api/v1/training/glimpses` | `TrainingService.saveGlimpse` | `training_glimpses` | `TrainingModuleTest.java` |
| **F11.1** | Customer Support Ticket Creation | `DOCUMENTED` | `DashboardPage.jsx (Support tab)` | `POST /api/v1/support/tickets` | `SupportApplicationService.createTicket` | `support_tickets` | `08_support_ticket_lifecycle.spec.js` |
| **F11.2** | Threaded Customer-Admin Support Messaging | `DOCUMENTED` | `DashboardPage.jsx (Support conversation view)` | `POST /api/v1/support/tickets/{id}/messages` | `SupportApplicationService.addMessage` | `ticket_messages` | `08_support_ticket_lifecycle.spec.js` |
| **F11.3** | Admin Support Helpdesk Operations | `DOCUMENTED` | `AdminDashboardPage.jsx (Support tab)` | `GET /api/v1/admin/support/tickets` | `SupportApplicationService.replyAsAdmin` | `support_tickets` | `admin-console-full-validation.test.jsx` |
| **F11.4** | Ticket Resolution & Customer CSAT Rating Submission | `DOCUMENTED` | `DashboardPage.jsx` | `POST /api/v1/support/tickets/{id}/close` | `SupportApplicationService.closeTicket` | `support_tickets (status='CLOSED'` | `08_support_ticket_lifecycle.spec.js` |
| **F11.5** | CSAT Analytics & Quality Metrics Reporting | `DOCUMENTED` | `AdminDashboardPage.jsx (Support tab)` | `GET /api/v1/admin/support/csat-summary` | `SupportApplicationService.getCsatSummary` | `support_tickets` | `admin-console-full-validation.test.jsx` |
| **F12.1** | Post-Delivery Review Invitation Modal | `DOCUMENTED` | `ReviewInvitationModal.jsx` | `GET /api/v1/customer/reviews/pending` | `ProductReviewService.getPendingReviewInvitations` | `review_invitation_states` | `fe-reviews.test.jsx` |
| **F12.2** | Verified Purchase Product Review Submission | `DOCUMENTED` | `ProductReviewFormModal.jsx` | `POST /api/v1/customer/reviews` | `ProductReviewService.createReview` | `product_reviews` | `fe-reviews.test.jsx` |
| **F12.3** | Public Product Review & Rating Aggregate Display | `DOCUMENTED` | `ProductReviewsSection.jsx` | `GET /api/v1/reviews/latest` | `ProductReviewService.getPublicReviewsForProduct` | `product_reviews` | `fe-reviews.test.jsx` |
| **F12.4** | Admin Product Review Moderation Workflow | `DOCUMENTED` | `AdminReviewsManager.jsx` | `GET /api/v1/admin/reviews` | `ProductReviewService.moderateReview` | `product_reviews` | `admin-console-full-validation.test.jsx` |
| **F12.5** | Trainee Course Review Submission & Moderation | `DOCUMENTED` | `TrainingReviewFormModal.jsx` | `POST /api/v1/training/reviews` | `TrainingService.createCourseReview` | `training_reviews` | `fe-training-reviews.test.jsx` |
| **F12.6** | Review Invitation Skip & Dismissal State | `DOCUMENTED` | `ReviewInvitationModal.jsx` | `POST /api/v1/customer/reviews/invitations/{orderItemId}/skip` | `ProductReviewService.skipInvitation` | `review_invitation_states.status=DISMISSED` | `fe-reviews.test.jsx` |
| **F13.1** | Transactional Outbox Event Recording | `DOCUMENTED` | `Internal system pattern` | `Internal NotificationEventService.recordEvent` | `NotificationEventService.recordEvent` | `notification_events` | `NotificationModuleTest.java` |
| **F13.2** | Asynchronous Email Dispatch via SMTP | `DOCUMENTED` | `Background outbox processing` | `Scheduled background worker` | `NotificationWorker.dispatchNotification` | `notification_events.status=SENT` | `NotificationModuleTest.java` |
| **F13.3** | Asynchronous SMS Dispatch via Twilio | `DOCUMENTED` | `Background outbox processing` | `Scheduled background worker` | `TwilioSmsService.sendSms` | `notification_events.sms_status` | `NotificationModuleTest.java` |
| **F13.4** | Scheduled Outbox Worker with Exponential Backoff | `DOCUMENTED` | `Background daemon` | `NotificationWorker.processOutboxQueue` | `NotificationWorker` | `notification_events` | `NotificationModuleTest.java` |
| **F13.5** | Abandoned Cart Notification Scheduler | `DOCUMENTED` | `Background daemon` | `AbandonedCartScheduler.scanAbandonedCarts` | `AbandonedCartScheduler` | `carts` | `NotificationModuleTest.java` |
| **F13.6** | Customer In-App Notification Center & Unread Badge | `DOCUMENTED` | `NotificationCenter.jsx` | `GET /api/v1/notifications` | `NotificationEventService.getUserNotifications` | `notification_events` | `notification-center.test.jsx` |
| **F13.7** | Admin In-App Operational Notification Center | `DOCUMENTED` | `Navbar.jsx` | `GET /api/v1/admin/notifications/in-app` | `NotificationEventService.getAdminInAppNotifications` | `notification_events` | `admin-console-full-validation.test.jsx` |
| **F14.1** | Agronomy Blog Indexing & Taxonomy | `DOCUMENTED` | `BlogIndexPage.jsx` | `GET /api/v1/content/posts` | `BlogContentService.getPublishedPosts` | `blog_posts` | `01_browser_smoke_baseline.spec.js` |
| **F14.2** | Blog Post Detail & Author Profiles | `DOCUMENTED` | `BlogPostPage.jsx` | `GET /api/v1/content/posts/{slug}` | `BlogContentService.getPostBySlug` | `blog_posts` | `13_seo_automated_testing.spec.js` |
| **F14.3** | Scheduled Article Publishing Worker | `DOCUMENTED` | `Background daemon` | `Scheduled background worker` | `BlogContentService.publishScheduledPosts` | `blog_posts (status='PUBLISHED'` | `ContentModuleTest.java` |
| **F14.4** | Dynamic XML Sitemap Generation (/seo/sitemap.xml) | `DOCUMENTED` | `Search engine crawlers` | `GET /api/v1/seo/sitemap.xml` | `SeoService.generateSitemapXml` | `products` | `13_seo_automated_testing.spec.js` |
| **F14.5** | Dynamic Robots.txt Generation (/seo/robots.txt) | `DOCUMENTED` | `Search engine crawlers` | `GET /api/v1/seo/robots.txt` | `SeoService.generateRobotsTxt` | `None` | `13_seo_automated_testing.spec.js` |
| **F14.6** | Agronomist Cultivation & Spawn Guides | `DOCUMENTED` | `CultivationGuidePage.jsx` | `GET /api/v1/content/articles/{slug}` | `BlogContentService.getArticleBySlug` | `content_articles` | `01_browser_smoke_baseline.spec.js` |
| **F15.1** | Direct Presigned Storage Upload Initiation | `DOCUMENTED` | `LocalImageUploader.jsx` | `POST /api/v1/media/upload/initiate` | `MediaService.initiateUpload` | `media_assets (status='PENDING_UPLOAD')` | `MediaModuleTest.java` |
| **F15.2** | Upload Completion Confirmation & Metadata Persistence | `DOCUMENTED` | `LocalImageUploader.jsx` | `POST /api/v1/media/upload/complete` | `MediaService.completeUpload` | `media_assets (status='AVAILABLE'` | `MediaModuleTest.java` |
| **F15.3** | Signed URL Generation for Protected Assets | `DOCUMENTED` | `MediaImage.jsx` | `GET /api/v1/media/{id}/signed-url` | `MediaService.generateSignedUrl` | `media_assets` | `MediaModuleTest.java` |
| **F15.4** | Media Linking to Products and Courses | `DOCUMENTED` | `AdminDashboardPage.jsx (Media tab)` | `POST /api/v1/media/link` | `MediaService.linkMedia` | `media_product_links` | `MediaModuleTest.java` |
| **F16.1** | Product View Telemetry Tracking | `DOCUMENTED` | `ProductDetailPage.jsx` | `POST /api/v1/analytics/track-product-view` | `AnalyticsService.trackProductView` | `analytics_events` | `01_guest_browsing.spec.js` |
| **F16.2** | Conversion Funnel Event Recording | `DOCUMENTED` | `Storefront` | `GET /api/v1/analytics/funnel` | `AnalyticsService.recordFunnelEvent` | `analytics_events` | `AnalyticsModuleTest.java` |
| **F16.3** | Asynchronous Event Consumption via Spring Events | `DOCUMENTED` | `Internal system listener` | `ApplicationEventPublisher` | `AnalyticsEventListener` | `analytics_metrics` | `AnalyticsModuleTest.java` |
| **F16.4** | Admin Analytics Overview & KPI Aggregation | `DOCUMENTED` | `AdminDashboardPage.jsx (Analytics tab)` | `GET /api/v1/admin/analytics/overview` | `AnalyticsService.getOverviewKpis` | `orders` | `admin-analytics-clickable-cards.test.jsx` |
| **F17.1** | Centralized Admin Operations Cockpit | `DOCUMENTED` | `AdminDashboardPage.jsx (~444 KB)` | `GET /api/v1/admin/*` | `AdminApplicationService` | `Multiple domain tables` | `admin-console-full-validation.test.jsx` |
| **F17.2** | Immutable Admin Action Audit Logging | `DOCUMENTED` | `AdminDashboardPage.jsx (Audit tab)` | `GET /api/v1/admin/audit-logs` | `AdminApplicationService.recordAuditLog` | `admin_audit_logs` | `admin-console-full-validation.test.jsx` |
| **F17.3** | Production Admin Bootstrapping Initializer | `DOCUMENTED` | `System startup` | `ProdAdminBootstrapInitializer.java` | `ProdAdminBootstrapInitializer` | `users (ROLE_ADMIN)` | `SporekartIntegrationTest.java` |
| **F18.1** | Stateless JWT Authentication Filter | `DOCUMENTED` | `api.js (injected on all requests)` | `JwtAuthenticationFilter.java` | `JwtTokenProvider.validateTokenAndGetAuthentication` | `None (Stateless cryptographic verification)` | `AuthorizationMatrixIntegrationTest.java` |
| **F18.2** | Role-Based Access Control (RBAC) Enforcement | `DOCUMENTED` | `AdminProtectedRoute.jsx` | `SecurityConfig.java:lines 67-94` | `Spring Security Method Security` | `users.roles` | `AuthorizationMatrixIntegrationTest.java` |
| **F18.3** | In-Memory Token Bucket Rate Limiting Filter | `DOCUMENTED` | `Global HTTP entry point` | `RateLimitingFilter.java` | `RateLimitingFilter` | `None (In-memory ConcurrentHashMap)` | `ExtendedIntegrationTest.java` |
| **F18.4** | Request ID Tracking (X-Request-ID MDC Propagation) | `DOCUMENTED` | `Client response headers` | `RequestIdFilter.java` | `RequestIdContext` | `Stored in admin_audit_logs.request_id` | `SporekartIntegrationTest.java` |
| **F18.5** | Global Exception Handling & RFC 7807 Sanitization | `DOCUMENTED` | `Standard error toast / alert display` | `GlobalExceptionHandler.java` | `GlobalExceptionHandler` | `None` | `ExtendedIntegrationTest.java` |
| **F18.6** | CORS Policy & Frame Options Headers | `DOCUMENTED` | `Browser cross-origin protection` | `SecurityConfig.corsConfigurationSource` | `Spring WebMvc CorsFilter` | `None` | `ExtendedIntegrationTest.java` |

---

## 4. Discrepancy, Security & Architectural Risk Registry

During the Phase 1 feature inventory and architectural verification, the following critical, high, and medium discrepancies were identified and isolated for targeted penetration and exploratory testing in subsequent phases:

| ID | Module | Feature Impacted | Discrepancy Description | Category | Severity | Audit Evidence |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **DISC-01** | Database Migrations | Cart Unique Constraint | Flyway migration V37 (partial unique index on active carts) missing from backend/supabase/migrations directory. | Database Schema Drift | **HIGH** | `V37__deduplicate_and_unique_active_user_cart.sql present in db/migration but absent in supabase/migrations.` |
| **DISC-02** | Security / Secrets | Database Configuration | Hardcoded Supabase pooler credentials in application-supabase.yml (aws-0-ap-northeast-1.pooler.supabase.com:6543, postgres.irwiiyowpppdynbmwwuz, MyDbSporekart@123#). | Secret Management | **CRITICAL** | `backend/src/main/resources/application-supabase.yml:lines 3-6.` |
| **DISC-03** | Security / Secrets | JWT Secrets | Static hardcoded JWT secret fallbacks committed in application-dev.yml and application-test.yml. | Secret Management | **HIGH** | `application-dev.yml:line 32; application-test.yml:line 19.` |
| **DISC-04** | Static Code Quality | Frontend Linter | npm run lint fails with 335 problems (26 errors, 309 warnings). With --max-warnings 0 in package.json, CI/CD pipeline immediately fails. | Static Code Quality | **HIGH** | `ESLint execution on frontend/src.` |
| **DISC-05** | Dependencies & Security | Frontend Vulnerabilities | 15 npm audit vulnerabilities detected including critical RCE in tinypool <= 2.1.1 and high DoS in source-map-js. | Dependency Security | **CRITICAL** | `npm audit execution on frontend/.` |
| **DISC-06** | Performance / Architecture | Notification Worker | AbandonedCartScheduler scans entire carts table into memory using cartRepository.findAll().stream().filter(...) every 15 minutes. | Algorithmic / Memory Risk | **HIGH** | `AbandonedCartScheduler.java:lines 47-50.` |
| **DISC-07** | Order Access Control | Order Retrieval IDOR | Admin authenticated with ROLE_ADMIN cannot view customer orders via GET /orders/{id} or invoice via /orders/{id}/invoice because validateOrderAccess strictly checks order.userId == userId. | Authorization Logic | **MEDIUM** | `OrderService.java:lines 268-278.` |
| **DISC-08** | Code Duplication | Multi-Module Code Clones | jscpd detected 99 code clones with 1,592 duplicated lines across Java and JSX, notably between CheckoutPage and TraineeProfileEnrollmentModal. | Code Duplication | **MEDIUM** | `audit_output/jscpd-report/jscpd-report.json.` |
| **DISC-09** | Test Infrastructure | Vitest Worker Deadlock | Vitest configured with pool: 'forks' deadlocks indefinitely on Windows Node 24; requires --pool=threads. | SDET Test Tooling | **MEDIUM** | `frontend/vitest.config.js:line 11.` |

---

## 5. Phase 1 Verification Sign-Off & Phase 2 Readiness

### 5.1 Verification Checklist
- [x] Complete reverse-engineering of all 18 application modules.
- [x] Identification and classification of 122 individual features (`[DOCUMENTED]` vs `[INFERRED]`).
- [x] Exhaustive documentation of normal flows, alternative flows, negative scenarios, boundaries, failure modes, permissions, and database mutations.
- [x] Creation of master workbook `01_REQUIREMENT_TRACEABILITY_MATRIX.xlsx` with three validated worksheets (`RTM_Master_Traceability`, `Feature_Deep_Dive`, `Discrepancies_&_Risks`).
- [x] Compliance with Strict Zero-Mutation Policy across code, schema, and environment.

### 5.2 Transition to Subsequent Audit Phases
With the requirement traceability baseline established, the audit is positioned to advance directly into:
1. **Phase 2 — Functional & Workflow Verification:** Executing end-to-end user journeys (Guest browsing, OTP auth, Cart operations, Checkout, Razorpay Mock verification, Training enrollments, Admin management).
2. **Phase 3 — Negative, Boundary & Concurrency Testing:** Testing stock reservation race conditions, parallel wallet debits, token bucket burst rates, and input fuzzing.
3. **Phase 4 — Security, Access Control & Data Integrity:** Deep testing of exposed credentials, IDOR vectors, role-based authorization bypasses, and SQL injection safety.