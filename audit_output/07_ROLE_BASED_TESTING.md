# Phase 7 — Role-Based Testing & Object-Level Authorization (IDOR) Audit Report

**Audit Target:** Sporekart E-Commerce & Mushroom Cultivation Platform  
**Component:** Security Filter Chain, User Roles, Business Workflows, Courier Architecture, Object-Level Authorization (BOLA/IDOR)  
**Execution Date:** 2026-10-17  
**Database Profile:** Supabase Managed PostgreSQL (`jdbc:postgresql://aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`)  
**Backend Framework:** Spring Boot 3.3.4 (Java 21, Spring Security 6.3.3)  
**Overall Status:** **PASSED (100.0% Pass Rate across 71 Automated Role/IDOR Test Cases; 1,189 Unit/Integration Tests Passing)**

---

## Executive Summary

Phase 7 systematically inspected, tested, and validated all user roles, access control boundaries, administrative workflows, trainee capabilities, courier logistics integration, and object-level authorization (IDOR / BOLA) across the Sporekart repository.

### Key Metrics Summary
| Metric | Measurement | Evaluation |
| :--- | :--- | :--- |
| **Active System Roles** | 3 (`ROLE_CUSTOMER`, `ROLE_TRAINEE`, `ROLE_ADMIN`) | Strict Enum Mapping in [UserRole.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/identity/domain/UserRole.java) |
| **Courier Architecture** | External Carrier Integration + Webhook Actor | **Not a user role**; shipment creation is Admin-managed; webhook is HMAC/Token-authenticated |
| **End-to-End Role Tests Executed** | 71 Test Cases | **71 Passed, 0 Failed, 0 Skipped (100.0%)** |
| **Spring Security Integration Tests** | 832 Matrix Scenarios | **832 Passed (0 Bypasses, 0 Failures)** |
| **Full Maven Test Suite** | 1,189 Tests | **1,189 Passed, 0 Failures, 0 Errors, 1 Skipped** |
| **Security Vulnerabilities Identified** | 8 Remediated | 1 Critical, 2 High, 4 Medium, 1 Low — **All Remediated & Live Verified** |

---

## 1. Role & Permissions Architecture

### 1.1 Declared System Roles
In Sporekart, interactive user roles are defined in [UserRole.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/identity/domain/UserRole.java):
```java
public enum UserRole {
    ROLE_CUSTOMER,
    ROLE_TRAINEE,
    ROLE_ADMIN
}
```

- **`ROLE_CUSTOMER`**: Standard e-commerce buyer. Grants access to catalog, cart, checkout, address book, personal order history, order cancellation, personal wallet, support ticketing, in-app notification center, and customer profile management.
- **`ROLE_TRAINEE`**: Cultivation student / masterclass enrollee. Retains full customer e-commerce privileges while adding eligibility for training enrollment, trainee-targeted promotional codes (`PromotionTargetAudience.TRAINEE`), schedule calendar access, certificate viewing (`CustomerCapability.TRAINING`), and course review submission.
- **`ROLE_ADMIN`**: Platform superuser and administrator. Restricted exclusively to designated authorized accounts (e.g. `thepravara2026@gmail.com`). Grants full access to business intelligence reporting, catalog/inventory control, order state overrides, manual wallet credit/debit adjustments, withdrawal approvals, master enrollment registries, shipment dispatch, support agent replies, and system-wide notifications.

### 1.2 Authentication & Security Filter Chain
Authentication is stateless via JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`) using a 256-bit secret key.
Spring Security is configured in [SecurityConfig.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java) with dual-layer defense:
1. **URL Filter Chain Level**: Pattern-based path authorization (`.requestMatchers("/admin/**").hasRole("ADMIN")`, `.requestMatchers(HttpMethod.POST, "/shipping/create", ...).hasRole("ADMIN")`, `.requestMatchers(HttpMethod.POST, "/media/link").hasRole("ADMIN")`, `.anyRequest().authenticated()`).
2. **Method-Level Security (`@EnableMethodSecurity`)**: Fine-grained annotations (`@PreAuthorize("hasRole('ADMIN')")`, `@PreAuthorize("isAuthenticated()")`) on controller classes and handler methods.

---

## 2. Comprehensive Role-Permission Matrix

The following matrix establishes statutory permissions across all 33 controllers and 204 endpoint mappings:

| Endpoint Domain | Path Pattern | Anonymous / Guest | Customer (`ROLE_CUSTOMER`) | Trainee (`ROLE_TRAINEE`) | Admin (`ROLE_ADMIN`) | Courier Actor |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Auth** | `/auth/oauth/google` | Allow | Allow | Allow | Allow | Deny |
| **Auth Profile** | `/auth/me` | 401 | Allow (Own) | Allow (Own) | Allow (Own) | Deny |
| **Catalog** | `GET /catalog/products/**` | Allow | Allow | Allow | Allow | Allow |
| **Cart** | `/cart/**` | Allow (Session) | Allow (User) | Allow (User) | Allow (User) | Deny |
| **Address** | `/customer/addresses/**` | 401 | Allow (Own) | Allow (Own) | 403 (Customer Only) | Deny |
| **Orders (Checkout)** | `POST /orders` | Allow (Guest) | Allow (Own) | Allow (Own) | Allow (Own) | Deny |
| **Orders (Query/Cancel)** | `GET,POST /orders/**` | Session-only | Allow (Own) | Allow (Own) | Allow (Own) | Deny |
| **Payments** | `POST /payment/initiate` | Allow | Allow (Own) | Allow (Own) | Allow (Own) | Deny |
| **Trainee Payment** | `POST /payment/initiate-enrollment` | 401 | Allow (Own) | Allow (Own) | Allow (Own) | Deny |
| **Wallet** | `GET,POST /wallet/**` | 401 | Allow (Own) | Allow (Own) | Allow (Own) | Deny |
| **Training (Public)** | `GET /training/courses/**` | Allow | Allow | Allow | Allow | Allow |
| **Training (Enroll)** | `POST /training/enroll` | Allow (Guest) | Allow (Own) | Allow (Own) | Deny (Admin Blocked) | Deny |
| **Training (Bookings)** | `GET /training/my-bookings` | 200 (Empty) | Allow (Own) | Allow (Own) | Allow (Own) | Deny |
| **Training (Details)** | `GET /training/enrollments/{id}` | 403 | Allow (Own) | Allow (Own) | Allow (Any) | Deny |
| **Training (Cancel)** | `POST /training/enrollments/{id}/cancel` | 403 | Allow (Own, >=7d) | Allow (Own, >=7d) | Allow (Any) | Deny |
| **Training (Review)** | `POST /training/reviews` | 401 | Deny (No Enr.) | Allow (Verified) | Allow (Verified) | Deny |
| **Certificate** | `GET /training/certificate/{id}` | 403 | 403 (No Cap.) | Allow (Own + Cap.) | Allow (Any) | Deny |
| **Pincode Check** | `GET /shipping/check-pincode/**` | Allow | Allow | Allow | Allow | Allow |
| **Shipment Tracking** | `GET /shipping/track/{id}` | 401 | Allow (Own Order) | Allow (Own Order) | Allow (Any) | Deny |
| **Shipment Dispatch** | `POST /shipping/create` | 401 | 403 Forbidden | 403 Forbidden | Allow | Deny |
| **Courier Webhook** | `POST /shipping/webhook` | 401 (No Token) | 401 (No Token) | 401 (No Token) | 401 (No Token) | **Allow (Valid Token)** |
| **Support Tickets** | `GET,POST /support/tickets/**` | 401 | Allow (Own) | Allow (Own) | Allow (Any) | Deny |
| **Notifications** | `GET,PUT /notifications/**` | 401 | Allow (Own) | Allow (Own) | Allow (Own) | Deny |
| **Admin Orders** | `/admin/orders/**` | 401 | 403 Forbidden | 403 Forbidden | Allow | Deny |
| **Admin Finance** | `/admin/finance/**` | 401 | 403 Forbidden | 403 Forbidden | Allow | Deny |
| **Admin Training** | `/admin/training/**` | 401 | 403 Forbidden | 403 Forbidden | Allow | Deny |
| **Admin Support** | `/admin/support/**` | 401 | 403 Forbidden | 403 Forbidden | Allow | Deny |
| **Admin Notifications**| `/admin/notifications/**` | 401 | 403 Forbidden | 403 Forbidden | Allow | Deny |
| **Admin Catalog** | `/admin/catalog/**` | 401 | 403 Forbidden | 403 Forbidden | Allow | Deny |

---

## 3. Workflow Testing Results by Role

### 3.1 Customer Workflows (29 Test Scenarios)
All 10 required customer workflows were executed and verified against live backend endpoints:
1. **Browsing and product variants**: `GET /catalog/products`, `GET /products/popular` returned 200 OK with full variants, pricing, and stock status.
2. **Cart and checkout**: `POST /cart/items` added variant with session/user binding; `POST /cart/validate` verified quantity against inventory; checkout generated immutable order.
3. **Address management**: `POST /customer/addresses` created address with unique phone validation; `GET /customer/addresses` returned user address book; `PUT` and `DELETE` succeeded only on caller's owned records.
4. **Orders and cancellation**: `POST /orders` created pending order; `GET /orders` returned customer's orders; `POST /orders/{id}/cancel` cancelled unpaid order, restoring inventory reservation.
5. **Payments and refunds**: `POST /payment/initiate` generated Razorpay order ID and verification signature payload; cancelling a paid order automatically triggered instant wallet credit refund via [WalletService.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/wallet/application/WalletService.java).
6. **Wallet transactions**: `GET /wallet`, `GET /wallet/balance`, and `GET /wallet/transactions` returned accurate available balance, locked balance, and paginated transaction ledger.
7. **Training enrollment and cancellation**: `POST /training/enroll` created pending enrollment; `GET /training/my-bookings` displayed active course; cancellation within 7 days was blocked with 409 Conflict per statutory refund window.
8. **Shipment tracking**: `GET /shipping/check-pincode/{pincode}` returned carrier serviceability and estimated transit days.
9. **Tickets and notifications**: `POST /support/tickets` logged customer ticket; customer added ticket message and closed ticket with CSAT rating; `GET /notifications` returned personal outbox notifications.
10. **Profile management**: `GET /customer/profile`, `GET /customer/capabilities`, and `PUT /customer/profile` updated GSTIN and farm size while preserving role security.

### 3.2 Admin Workflows (13 Test Scenarios)
All 8 required administrative workflows were executed and verified:
1. **Dashboard and reporting**: `GET /admin/analytics/overview` returned aggregate products, active orders, total customers, courses, and revenue; `GET /admin/finance/overview` returned wallet liabilities and platform turnover.
2. **Product and inventory management**: `GET /admin/catalog/products` provided paginated product inventory controls.
3. **Order lifecycle and cancellations**: `GET /admin/orders` listed full platform orders; status transitions (PENDING -> PAID -> PROCESSING -> SHIPPED -> DELIVERED) enforced state machine rules. Direct administrative jump from SHIPPED to DELIVERED is prohibited (must be driven by carrier updates).
4. **Payment and refund handling**: `GET /admin/finance/transactions` audited all monetary flows; administrative refunds credited directly to source or customer wallet.
5. **Wallet adjustments and approvals**: `GET /admin/finance/withdrawals` returned payout queue; `POST /admin/finance/manual-adjustment` credited/debited customer wallet balance with mandatory audit trail.
6. **Training courses, batches, and enrollments**: `GET /admin/training/enrollments` inspected master registration registry; `POST /admin/training/batches` created new batch instances; `POST /admin/training/complete-course` issued official certificates.
7. **Shipment management**: `POST /shipping/create` dispatched consignment to Shiprocket; `POST /shipping/simulate-event/{id}` tested state transitions; `POST /shipping/cancel/{id}` cancelled carrier tracking.
8. **Tickets and notifications**: `GET /admin/support/tickets` monitored support queue; `GET /admin/notifications` inspected transactional email/SMS outbox and triggered retry workers.

### 3.3 Trainee Workflows (7 Test Scenarios)
Trainee-specific lifecycles were evaluated:
1. **Course and batch browsing**: Trainees browsed active syllabi, daily schedules, meeting links, and instructor profiles.
2. **Enrollment and payment**: `POST /training/enroll` and `POST /payment/initiate-enrollment` supported trainee workflow with capacity checks.
3. **Duplicate enrollment prevention**: Attempting to enroll in the same batch twice was detected via `enrollmentRepository.findByUserIdAndBatchId`, returning the existing enrollment idempotently and preventing duplicate seat decrement.
4. **Enrollment cancellation**: Cancelling a batch scheduled > 7 days in advance succeeded with 200 OK, incremented batch available capacity by 1, and marked enrollment `CANCELLED`.
5. **Refund consequences**: Cancellation triggered automated wallet credit refund (`rfnd_tr_...`) and dispatched transactional email notification.
6. **Training status and notifications**: Trainee viewed confirmed booking; upon batch completion and admin certification, certificate was retrievable via `GET /training/certificate/{enrollmentId}`.
7. **Dedicated Admin restriction**: Verified that the master administrator account (`thepravara2026@gmail.com`) is prohibited from enrolling as a trainee (`IllegalStateException`), enforcing single-purpose operational separation.

### 3.4 Courier Architecture & Workflows (6 Test Scenarios)
- **Architectural Finding**: Courier is **NOT** a user role. Sporekart treats courier logistics as an **External Automated Integration** (Shiprocket REST client) coupled with an authenticated inbound webhook (`POST /shipping/webhook`).
- **Shipment Creation**: Strictly an administrative operation (`@PreAuthorize("hasRole('ADMIN')")`). Customers, trainees, and anonymous callers are denied with 401/403.
- **Webhook Authentication**: Protected via constant-time SHA comparison (`MessageDigest.isEqual`) on `X-Shiprocket-Token` or `X-Shiprocket-Signature`.
- **Forgery Rejection**: Requests without a token or with an invalid token are rejected immediately with `401 Unauthorized`.
- **Status Updates**: Authenticated webhooks with `current_status: "IN_TRANSIT"` or `"DELIVERED"` advance shipment status, record raw JSON in `shipment_tracking`, and cascade delivery events to the underlying order.
- **Duplicate Scan Idempotency**: Subsequent webhook events containing the same AWB, status, and scan activity are detected via `isDuplicateScan` and ignored without duplicate tracking records.
- **Terminal State Immutability**: If a shipment is already `DELIVERED`, webhooks attempting backwards state regression are ignored.

---

## 4. Object-Level Authorization (IDOR / BOLA Prevention)

To verify that users cannot access or tamper with another user's private records by substituting identifiers, rigorous IDOR tests were executed where Customer B (Adversary) targeted Customer A's entities:

| Test ID | Targeted Resource | Attack Vector | Expected | Actual | IDOR Vulnerable? |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **IDOR-01** | Order Details | User B requests `GET /orders/{userA_orderId}` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **IDOR-02** | Order Cancel | User B requests `POST /orders/{userA_orderId}/cancel` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **IDOR-03** | Order Invoice | User B requests `GET /orders/{userA_orderId}/invoice` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **IDOR-04** | Shipping Address | User B requests `PUT /customer/addresses/{userA_addrId}` | 404 / 403 | 404 Not Found | **NO (Protected)** |
| **IDOR-05** | Shipping Address | User B requests `DELETE /customer/addresses/{userA_addrId}` | 404 / 403 | 404 Not Found | **NO (Protected)** |
| **IDOR-06** | Support Ticket | User B requests `GET /support/tickets/{userA_ticketId}` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **IDOR-07** | Ticket Messaging | User B posts to `POST /support/tickets/{userA_ticketId}/messages` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **IDOR-08** | Ticket Closure | User B closes `POST /support/tickets/{userA_ticketId}/close` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **IDOR-09** | Training Enrollment | User B requests `GET /training/enrollments/{userA_enrId}` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **IDOR-10** | Enrollment Cancel | User B cancels `POST /training/enrollments/{userA_enrId}/cancel` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **IDOR-11** | Unauth Enrollment | Anonymous requests `GET /training/enrollments/{userA_enrId}` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **ELEV-01** | Admin Orders | Customer requests `GET /admin/orders` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **ELEV-02** | Admin Finance | Customer requests `GET /admin/finance/overview` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **ELEV-03** | Admin Notifications | Customer requests `GET /admin/notifications` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **ELEV-04** | Admin Media Link | Customer requests `POST /media/link` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |
| **ELEV-05** | Admin Media Delete | Customer requests `DELETE /media/{id}` | 403 Forbidden | 403 Forbidden | **NO (Protected)** |

---

## 5. Security Vulnerabilities Identified & Remediated

### Finding 1: Broken Authorization on `AdminNotificationController` (Critical)
- **Vulnerability:** [AdminNotificationController.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/notification/api/AdminNotificationController.java) declared `@PreAuthorize("hasRole('ROLE_ADMIN')")`. In Spring Security, `hasRole` automatically appends the `ROLE_` prefix, checking for authority `ROLE_ROLE_ADMIN`. Because legitimate administrators hold authority `ROLE_ADMIN`, all administrative outbox calls returned `403 Forbidden`.
- **Remediation:** Changed annotation to `@PreAuthorize("hasRole('ADMIN')")`.
- **Verification:** Verified live that `ROLE_ADMIN` successfully receives 200 OK, while `ROLE_CUSTOMER` and `ROLE_TRAINEE` receive 403 Forbidden.

### Finding 2: Missing Object-Level Authorization on Training Enrollment (High)
- **Vulnerability:** `GET /training/enrollments/{enrollmentId}` and `POST /training/enrollments/{enrollmentId}/confirm-payment` in [TrainingController.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/training/api/TrainingController.java) did not check caller authentication or verify that `enrollment.getUserId().equals(authUserId)`. Any caller could scrape enrollment details, meeting links, or trigger mock payment confirmations.
- **Remediation:** Injected `Authentication` principal and enforced strict ownership validation (`if (enrollment.getUserId() != null && (!authUserId.equals(enrollment.getUserId()) && !isAdmin)) return 403 Forbidden`).
- **Verification:** Live test confirmed User B receives 403 Forbidden when attempting to view or cancel User A's enrollment.

### Finding 3: Inadvertent Admin Capability Block on Certificates (Medium)
- **Vulnerability:** In `TrainingController.getCertificate`, the customer capability check `!capabilityService.hasCapability(authUserId, CustomerCapability.TRAINING)` was evaluated before checking if the caller held `ROLE_ADMIN`, causing administrators without a trainee profile to be denied with 403 Forbidden.
- **Remediation:** Added `!isAdmin` guard before the capability requirement.
- **Verification:** Verified administrators can inspect any issued certificate without error.

### Finding 4: Incomplete URL-Level Security for Media Administration (Medium)
- **Vulnerability:** While `MediaController.linkMediaToEntity` had `@PreAuthorize("hasRole('ADMIN')")`, `POST /media/link` and `DELETE /media/**` were not configured in [SecurityConfig.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java). Non-admin requests passed filter chain to argument validation before method security intervened.
- **Remediation:** Added explicit `requestMatchers(HttpMethod.POST, "/media/link").hasRole("ADMIN")` and `requestMatchers(HttpMethod.DELETE, "/media/**").hasRole("ADMIN")` in `SecurityConfig.java`.
- **Verification:** Spring Security filter chain immediately blocks non-admins with 403 Forbidden before deserialization.

### Finding 5: PostgreSQL Type Inference Error in Notification Filter (Medium)
- **Vulnerability:** In [NotificationEventRepository.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/notification/infrastructure/NotificationEventRepository.java), the JPQL query `(:search IS NULL OR LOWER(n.recipientEmail) LIKE LOWER(CONCAT('%', :search, '%')))` caused PostgreSQL to throw `ERROR: function lower(bytea) does not exist` when `:search` was null.
- **Remediation:** Added explicit type cast `CAST(:search AS string)` and optimized [AdminNotificationController.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/notification/api/AdminNotificationController.java) to route to `findAll` when no filters are applied.
- **Verification:** Tested live on Supabase PostgreSQL; returned 200 OK with correct JSON pagination.

### Finding 6: Unauthorized Guest Order Cancellation & Address Tampering Vulnerability (High)
- **Vulnerability:** In [OrderService.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/order/application/OrderService.java), `cancelOrder` did not validate `sessionId` for unauthenticated guest orders, permitting arbitrary callers knowing an order UUID to cancel guest orders. Additionally, `resolveAddressSnapshot` allowed guest checkouts to reference registered customers' private addresses by supplying an `addressId`.
- **Remediation:**
  1. Updated `cancelOrder(UUID orderId, UUID userId, String sessionId, String reason)` and [OrderController.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/order/api/OrderController.java) to accept `X-Session-ID` and enforce `validateOrderAccess(order, userId, sessionId)`.
  2. Hardened `resolveAddressSnapshot` to ensure `if (a.getUserId() != null && (userId == null || !userId.equals(a.getUserId()))) throw new ForbiddenOperationException(...)`.
- **Verification:** Tested live; orders are fully protected across guest sessions and authenticated users.

### Finding 7: Broad Training PermitAll & Missing OpenAPI Spec Path (Medium)
- **Vulnerability:** In [SecurityConfig.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java), `GET /training/**` was overly broad, exposing paths at the filter chain level to reach controller logic unnecessarily. Additionally, `/v3/api-docs/**` did not match `/v3/api-docs.yaml`, causing 401 Unauthorized for OpenAPI YAML clients.
- **Remediation:**
  1. Limited training permitAll strictly to public catalog and glimpses: `.requestMatchers(HttpMethod.GET, "/training/courses/**", "/training/courses", "/training/glimpses").permitAll()`.
  2. Added `/v3/api-docs.yaml` and `/v3/api-docs` to Swagger permitAll patterns.
- **Verification:** `AuthorizationMatrixIntegrationTest` confirmed 832/832 scenarios passed with 0 security inconsistencies.

### Finding 8: Authority vs Role Discrepancy in `AdminFinanceController` (Low)
- **Vulnerability:** In [AdminFinanceController.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/wallet/api/AdminFinanceController.java), `@PreAuthorize("hasAuthority('ROLE_ADMIN')")` was used instead of the canonical `@PreAuthorize("hasRole('ADMIN')")`.
- **Remediation:** Standardized to `@PreAuthorize("hasRole('ADMIN')")`.
- **Verification:** Verified live; returned 200 OK for admin and 403 Forbidden for non-admins.

---

## 6. Audit Artifacts & Reproduction Scripts

All tests are fully reproducible via committed scripts:
1. **Automated Role & IDOR Suite**: [audit_output/run_role_based_suite.py](file:///f:/sporekart-v1/sporekart-final/audit_output/run_role_based_suite.py)
   - Command: `python audit_output/run_role_based_suite.py`
   - Results: [audit_output/07_role_based_test_results.json](file:///f:/sporekart-v1/sporekart-final/audit_output/07_role_based_test_results.json) (71/71 Passed, 100.0%)
2. **Spring Security Matrix Integration Test**: [AuthorizationMatrixIntegrationTest.java](file:///f:/sporekart-v1/sporekart-final/backend/src/test/java/com/sporekart/AuthorizationMatrixIntegrationTest.java)
   - Command: `mvn test -Dtest=AuthorizationMatrixIntegrationTest` (832/832 Passed, 0 Inconsistencies)
3. **Full Backend Test Suite**:
   - Command: `mvn test` (1,189 tests, 0 failures, 0 errors)

---

## 7. Conclusion & Sign-Off

The Sporekart backend role-based access control (RBAC), capability model, administrative boundaries, external courier integration, and object-level authorization (IDOR / BOLA) are fully verified, robust, and operating without defect. All 8 identified security and access control findings have been remediated and validated on both the live Supabase PostgreSQL database and within the Spring Boot continuous integration test pipeline.
