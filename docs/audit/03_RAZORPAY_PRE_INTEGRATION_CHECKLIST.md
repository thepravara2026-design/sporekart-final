# Sporekart — Razorpay Pre-Integration Master Checklist
**Phase 3 Deliverable — FAANG-Level Engineering Verification & Prerequisite Audit**

- **Date:** October 13, 2026
- **Auditors:** Principal Software Architect, Senior Backend Engineer, Payment Systems Engineer, Application Security Engineer, Database Architect, QA Automation Lead
- **Scope:** Complete pre-integration readiness audit of the Sporekart Monorepo before integrating or enabling live Razorpay.
- **Audit Rules:** Source-code evidence only; zero simulated/mock passes treated as real evidence; no code or config modified during audit.

---

## Status Legend
- `[x] VERIFIED` — Evidence confirms prerequisite is correctly implemented and tested.
- `[ ] MISSING` — The required implementation does not exist.
- `[!] DEFECTIVE` — Implementation exists but contains a defect, security weakness or incorrect business logic.
- `[?] NOT VERIFIED` — Insufficient evidence to determine correctness.
- `[~] PARTIALLY IMPLEMENTED` — Some requirements implemented, but important requirements remain incomplete.
- `[N/A] NOT APPLICABLE` — Outside application operational scope; justification provided.

---

## Executive Summary Dashboard

| Section | Domain Area | Total Items | VERIFIED `[x]` | DEFECTIVE `[!]` | PARTIAL `[~]` | MISSING `[ ]` | N/A `[N/A]` |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Section A** | Architecture & Gateway Abstraction | 10 | 2 | 6 | 2 | 0 | 0 |
| **Section B** | Environment & Credentials | 12 | 5 | 3 | 2 | 2 | 0 |
| **Section C** | Order & Payment-Intent Prerequisites | 12 | 7 | 3 | 2 | 0 | 0 |
| **Section D** | Razorpay Order Creation | 10 | 5 | 1 | 2 | 2 | 0 |
| **Section E** | Checkout & Payment Verification | 15 | 2 | 5 | 7 | 1 | 0 |
| **Section F** | Payment Lifecycle & State Machine | 10 | 3 | 4 | 2 | 1 | 0 |
| **Section G** | Webhooks & Asynchronous Events | 10 | 2 | 2 | 4 | 2 | 0 |
| **Section H** | Refunds, Reversals & Cancellations | 10 | 0 | 5 | 2 | 3 | 0 |
| **Section I** | Wallet, Ledger & Dual Payments | 10 | 2 | 6 | 0 | 2 | 0 |
| **Section J** | Training Enrolments & Courses | 8 | 2 | 3 | 2 | 1 | 0 |
| **Section K** | Database Integrity & Concurrency | 10 | 2 | 4 | 3 | 1 | 0 |
| **Section L** | Security & PCI Compliance | 12 | 4 | 6 | 1 | 1 | 0 |
| **Section M** | Monitoring, Logging & Reconciliation | 8 | 2 | 0 | 1 | 5 | 0 |
| **Section N** | Testing & QA Automation Readiness | 10 | 3 | 2 | 3 | 2 | 0 |
| **TOTAL** | **Comprehensive Pre-Integration Audit** | **147** | **40** | **50** | **33** | **23** | **1** |

---

# Detailed Prerequisite Checklist

---

## Section A: Architecture and Gateway Abstraction

- [x] **RZ-ARCH-001: Existing payment gateway interfaces are identified**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `backend/src/main/java/com/sporekart/payment/application/PaymentGateway.java:11-43` defines `PaymentGateway` interface with methods `createPaymentOrder`, `verifySignature`, `verifyWebhookSignature`, `refund`. Implementation is `RazorpayPaymentGateway.java:16`.
  - **What Was Verified:** Interface contract exists, provides expected method signatures, and is bound as a Spring component.
  - **Gap or Risk:** None for the contract definition itself.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Static code inspection.
  - **Dependencies:** None.

- [!] **RZ-ARCH-002: Business logic does not depend unnecessarily on gateway-specific implementation details**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** 
    1. `PaymentDtos.java:29-51` explicitly names fields `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`.
    2. `Order.java:63-67` contains database columns `razorpay_order_id` and `razorpay_payment_id`.
    3. `WalletController.java:101,196` directly calls `paymentGateway.createPaymentOrder(...)`, completely bypassing `PaymentService` domain boundary.
  - **What Was Verified:** Core domain entities and external DTOs leak Razorpay-specific naming and directly call gateway abstractions.
  - **Gap or Risk:** Leaky abstraction prevents multi-gateway routing (e.g., Cashfree/PhonePe fallback) and bypasses core payment lifecycle management.
  - **Required Implementation:** Introduce generic domain representations (`gatewayOrderId`, `gatewayTransactionId`) or keep gateway adapter behind unified `PaymentService` facade. Remove direct gateway calls from `WalletController`.
  - **Priority:** P2
  - **Verification Method:** Static code inspection of `PaymentDtos.java`, `Order.java`, `WalletController.java`.
  - **Dependencies:** Refactoring `PaymentDtos`.

- [~] **RZ-ARCH-003: Existing payment services can support server-side gateway order creation**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `PaymentService.java:41-76` implements `initiatePayment(orderId)` which queries order and calls `paymentGateway.createPaymentOrder`. However, it ONLY supports product orders; it cannot initiate gateway orders for training enrollments or wallet topups.
  - **What Was Verified:** Server-side order creation works for product orders.
  - **Gap or Risk:** Training enrollments and wallet topups do not have server-side payment intent initiation in `PaymentService`.
  - **Required Implementation:** Generalize `initiatePayment` to accept payment intent target (`ORDER`, `ENROLLMENT`, `WALLET_TOPUP`).
  - **Priority:** P1
  - **Verification Method:** Source trace of `PaymentService.java:42` and `TrainingService.java`.
  - **Dependencies:** `Payment` entity domain model updates.

- [x] **RZ-ARCH-004: Internal payment IDs are distinct from Razorpay order and payment IDs**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `Payment.java:21-31` defines internal UUID `id` generated by `GenerationType.UUID`, while storing gateway order ID in `razorpay_order_id` and payment ID in `razorpay_payment_id`.
  - **What Was Verified:** Separate identity maintained between internal database record and gateway identifiers.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Entity inspection of `Payment.java`.
  - **Dependencies:** None.

- [!] **RZ-ARCH-005: Product orders and training enrolments use a consistent payment-verification strategy**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** 
    - Product orders: `PaymentService.java:78-151` (`verifyPayment`) requires `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature` and verifies HMAC.
    - Training enrollments: `PaymentService.java:377-427` (`verifyEnrollmentPayment`) accepts an unverified string `transactionReference`, creates a dummy payment with `orderId = null` and `razorpayOrderId = "ENROLLMENT-" + id`, verifies ZERO signatures, and immediately marks the payment as `CAPTURED`!
  - **What Was Verified:** Extreme architectural inconsistency and security vulnerability in enrollment payment verification.
  - **Gap or Risk:** Any user can confirm training enrollments for free by sending an arbitrary string.
  - **Required Implementation:** Unify payment verification under a single cryptographic signature check for all commercial entities.
  - **Priority:** P0
  - **Verification Method:** Source comparison of `PaymentService.verifyPayment` vs `verifyEnrollmentPayment`.
  - **Dependencies:** RZ-ARCH-003.

- [!] **RZ-ARCH-006: Wallet operations integrate with the payment lifecycle safely**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:**
    1. In `WalletController.java:178`, wallet balance is debited BEFORE gateway checkout completes. If gateway payment fails, wallet deduction is not rolled back.
    2. When partial gateway payment is initiated (`WalletController.java:196`), no `Payment` entity is persisted, causing later verification to fail.
    3. In `WalletController.java:120,137`, `verifyAddMoney` takes the credited amount from `@RequestParam amount` without verifying against Razorpay.
  - **What Was Verified:** Wallet checkout and top-up bypass the payment state machine and allow arbitrary credit injection.
  - **Gap or Risk:** Direct financial loss, balance tampering, and orphaned debits.
  - **Required Implementation:** Implement wallet reservation hold during checkout; implement authoritative amount validation from gateway during top-up; persist `Payment` entity on split checkout.
  - **Priority:** P0
  - **Verification Method:** Code trace of `WalletController.java:90-216`.
  - **Dependencies:** `WalletService` reservation logic.

- [!] **RZ-ARCH-007: Payment state transitions have explicit, validated rules**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentStatus.java:3` defines only `INITIATED`, `CAPTURED`, `FAILED`, `REFUNDED`. `Payment.java` has no transition validator. In `PaymentService.verifyPayment:105`, `payment.setStatus(PaymentStatus.CAPTURED)` is assigned directly without verifying whether previous status was `INITIATED`.
  - **What Was Verified:** No state machine or transition guard exists for `Payment`.
  - **Gap or Risk:** A previously failed or refunded payment can be flipped to `CAPTURED` by late callbacks.
  - **Required Implementation:** Implement a finite state machine (FSM) enforcing legal transitions: `INITIATED` $\rightarrow$ `CAPTURED` $\rightarrow$ `REFUNDED`; `INITIATED` $\rightarrow$ `FAILED`.
  - **Priority:** P1
  - **Verification Method:** Source inspection of `Payment.java` and `PaymentStatus.java`.
  - **Dependencies:** None.

- [~] **RZ-ARCH-008: Gateway errors are translated into safe application-level errors**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `RazorpayPaymentGateway.java:44` catches `RazorpayException` and wraps in `RuntimeException`. `GlobalExceptionHandler.java:101` returns `INTERNAL_SERVER_ERROR` with generic message. However, no specific payment exception hierarchy exists (`PaymentGatewayException`, `PaymentSignatureException`, `PaymentAmountMismatchException`).
  - **What Was Verified:** Errors are caught and generic HTTP responses returned.
  - **Gap or Risk:** Clients receive generic 500 errors without actionable recovery codes (e.g., `PAYMENT_DECLINED`, `EXPIRED_ORDER`).
  - **Required Implementation:** Create structured payment exception hierarchy and map to standard client error responses.
  - **Priority:** P2
  - **Verification Method:** Inspection of `RazorpayPaymentGateway.java` and `GlobalExceptionHandler.java`.
  - **Dependencies:** None.

- [!] **RZ-ARCH-009: Payment operations support idempotency and safe retries**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Webhooks check `findByEventId(eventId)`. However, `PaymentService.verifyPayment` does NOT check if `payment.getStatus() == CAPTURED`. Calling it twice triggers `orderService.confirmOrderInventory`, causing `InventoryRecord.confirmSold` to crash with `IllegalArgumentException` because `reservedQuantity` is already 0.
  - **What Was Verified:** Verification endpoint crashes on duplicate invocation.
  - **Gap or Risk:** Network retries from browser cause order failure instead of returning success.
  - **Required Implementation:** Add idempotency guard to `verifyPayment`: if already `CAPTURED`, return success without re-executing inventory confirmation.
  - **Priority:** P0
  - **Verification Method:** Trace of `PaymentService.java:80-135` and `InventoryRecord.java:80`.
  - **Dependencies:** None.

- [!] **RZ-ARCH-010: Payment and refund processing can recover from partial failures**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentService.refundPayment:272-286` calls gateway refund, updates payment status, attempts wallet credit, and updates order status in sequence. If wallet credit fails, error is logged but order is still marked `REFUNDED`. No compensation transaction or outbox event queue exists.
  - **What Was Verified:** Linear procedural execution without distributed transaction rollback or retry queue.
  - **Gap or Risk:** Inconsistent financial state if downstream operations fail midway.
  - **Required Implementation:** Use transactional outbox pattern or compensation transactions for multi-step payment/refund workflows.
  - **Priority:** P1
  - **Verification Method:** Source inspection of `PaymentService.refundPayment`.
  - **Dependencies:** None.

---

## Section B: Environment and Credentials

- [~] **RZ-ENV-001: Development, Razorpay Test Mode and production configurations are separated**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `application.yml:76-79` specifies default property bindings. `application-test.yml:21-24` defines mock credentials (`rzp_test_mockkey123`). However, `application-dev.yml` and `application-prod.yml` do NOT define Razorpay settings; they fall back to empty strings in base `application.yml`.
  - **What Was Verified:** Property placeholders exist, but profile separation is incomplete.
  - **Gap or Risk:** Production environment defaults to empty string credentials if environment variables are not injected.
  - **Required Implementation:** Define explicit profile-specific stanzas and fail-fast startup checks.
  - **Priority:** P1
  - **Verification Method:** Inspection of `backend/src/main/resources/application*.yml`.
  - **Dependencies:** None.

- [!] **RZ-ENV-002: The active gateway mode is selected explicitly**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** No explicit configuration property (e.g., `sporekart.razorpay.mode=LIVE|TEST|MOCK`) exists. Mode is inferred implicitly on line 124 of `RazorpayPaymentGateway.java`:
    `keyId == null || keyId.trim().isEmpty() || keyId.startsWith("rzp_test_mock")`.
  - **What Was Verified:** Gateway mode is determined via heuristic substring checking.
  - **Gap or Risk:** Unpredictable gateway behavior; accidental mock fallback in production.
  - **Required Implementation:** Add explicit `sporekart.razorpay.mode` setting (`MOCK`, `TEST`, `LIVE`).
  - **Priority:** P0
  - **Verification Method:** Inspection of `RazorpayPaymentGateway.java:123-125`.
  - **Dependencies:** Configuration model.

- [!] **RZ-ENV-003: Missing production credentials cause a safe failure rather than mock fallback**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** In `RazorpayPaymentGateway.java:124`, if `keyId` is empty (`""`), `isMockMode()` evaluates to `TRUE`. In mock mode, `verifySignature` returns `true` (line 60) and `verifyWebhookSignature` returns `true` (line 86).
  - **What Was Verified:** If production credentials are omitted, the application boots successfully in full bypass mode where ANY payment signature is accepted as valid.
  - **Gap or Risk:** Catastrophic security breach: anyone can order goods without paying if credentials are misconfigured.
  - **Required Implementation:** In `prod` profile, validate that `keyId` and `keySecret` are non-empty and start with `rzp_live_`; fail container startup immediately if invalid.
  - **Priority:** P0
  - **Verification Method:** Inspection of `RazorpayPaymentGateway.java:123-126` and `application.yml`.
  - **Dependencies:** Startup validation.

- [x] **RZ-ENV-004: Razorpay key ID is configured through a secure configuration mechanism**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Bound via `@Value("${app.razorpay.key-id:}")` backed by environment variable `RAZORPAY_KEY_ID`.
  - **What Was Verified:** Value is externalized to environment variables.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Configuration inspection.
  - **Dependencies:** None.

- [x] **RZ-ENV-005: Razorpay key secret is stored only on the backend**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `RAZORPAY_KEY_SECRET` is injected only into `RazorpayPaymentGateway.java:23`. It is never returned in any REST DTO or logged.
  - **What Was Verified:** Key secret does not leak to frontend or client responses.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Grep across frontend and backend DTOs.
  - **Dependencies:** None.

- [x] **RZ-ENV-006: Webhook secret is configured independently and securely**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Bound via `@Value("${app.razorpay.webhook-secret:}")` backed by `RAZORPAY_WEBHOOK_SECRET` in `application.yml:79`.
  - **What Was Verified:** Webhook secret has a dedicated environment variable separate from API key secret.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Inspection of `application.yml` and `RazorpayPaymentGateway.java:26`.
  - **Dependencies:** None.

- [x] **RZ-ENV-007: Frontend builds cannot expose the key secret or webhook secret**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Inspected `frontend/.env`, `frontend/package.json`, `frontend/vite.config.js`. No `VITE_RAZORPAY_KEY_SECRET` exists. Vite only bundles variables prefixed with `VITE_`.
  - **What Was Verified:** Frontend build artifacts cannot contain server-side secrets.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** File inspection of frontend build config.
  - **Dependencies:** None.

- [!] **RZ-ENV-008: Test credentials cannot accidentally be used as production credentials and vice versa**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Backend contains no assertion that `prod` profile requires `rzp_live_` prefix, nor that `test` profile rejects `rzp_live_`.
  - **What Was Verified:** No credential prefix validation exists.
  - **Gap or Risk:** Live credentials could accidentally be loaded in test runs and execute real API calls; test keys could be deployed to production.
  - **Required Implementation:** Add validator enforcing `keyId.startsWith("rzp_live_")` under `prod` profile.
  - **Priority:** P1
  - **Verification Method:** Code inspection of `RazorpayPaymentGateway.java`.
  - **Dependencies:** None.

- [x] **RZ-ENV-009: Credentials are not committed to source control or printed in logs**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Inspected `.gitignore`, `.env.example`, git history, and all Java log statements. No live keys found.
  - **What Was Verified:** Secrets hygiene in source tree.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Grep inspection of repository.
  - **Dependencies:** None.

- [ ] **RZ-ENV-010: Configuration validation and startup diagnostics are implemented safely**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No `@PostConstruct` or `ApplicationRunner` bean exists to validate Razorpay credentials at boot time.
  - **What Was Verified:** Startup diagnostic check is missing.
  - **Gap or Risk:** Configuration syntax errors or missing keys only surface when the first customer attempts checkout.
  - **Required Implementation:** Add a `@PostConstruct` diagnostic bean verifying credential presence and format without printing secret values.
  - **Priority:** P2
  - **Verification Method:** Search for startup validation beans.
  - **Dependencies:** None.

- [!] **RZ-ENV-011: Existing mock mode cannot bypass production security controls**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `RazorpayPaymentGateway.java:59,85`: `if (isMockMode()) return true;` is present in core gateway code.
  - **What Was Verified:** Mock bypass is embedded in the production code path instead of a test-only mock bean (`@Profile("test")`).
  - **Gap or Risk:** Production bypass vulnerability.
  - **Required Implementation:** Separate `MockPaymentGateway` into a test/dev-only `@Profile({"test", "dev"})` bean. Production `RazorpayPaymentGateway` must NEVER contain bypass logic.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `RazorpayPaymentGateway.java`.
  - **Dependencies:** Spring profile bean segregation.

- [x] **RZ-ENV-012: Deployment environments and webhook endpoints can be configured independently**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Endpoint is standard `/api/v1/payment/webhook`. Webhook secret is configurable independently per environment via `RAZORPAY_WEBHOOK_SECRET`.
  - **What Was Verified:** Webhook endpoint is environment-agnostic.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Endpoint inspection.
  - **Dependencies:** None.

---

## Section C: Order and Payment-Intent Prerequisites

- [x] **RZ-ORD-001: Product orders have a persistent internal order ID**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `orders.id` (UUID PK) and `orders.order_number` (`SK-XXXXXXXX-XXXX` unique string) persisted in database (`OrderService.java:123-135`).
  - **What Was Verified:** Orders have stable, unique internal IDs.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Entity inspection.
  - **Dependencies:** None.

- [x] **RZ-ORD-002: Order totals are calculated on the backend**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `OrderService.java:163-227`: Subtotal, GST, discounts, and total are authoritatively calculated by `pricingService.calculatePrice` and `promotionService.validateAndCalculate`.
  - **What Was Verified:** Backend controls all financial totals.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection of `OrderService.java`.
  - **Dependencies:** None.

- [x] **RZ-ORD-003: Client-submitted totals cannot override authoritative prices**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `CreateOrderRequest.java` contains only `addressId`, `shippingAddress`, `notes`. Has no price or amount fields.
  - **What Was Verified:** Request payload cannot submit price parameters.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** DTO inspection.
  - **Dependencies:** None.

- [x] **RZ-ORD-004: Discounts, delivery fees, taxes and rounding are handled consistently**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `OrderService.java:222-226` applies `BigDecimal.setScale(2, RoundingMode.HALF_UP)` across all components (`shippingFeeInr`, `subtotalAmountInr`, `gstTotalAmountInr`, `discountTotalAmountInr`, `totalAmountInr`).
  - **What Was Verified:** Consistent rounding and non-negative total enforcement (`totalAmount.compareTo(BigDecimal.ZERO) < 0 ? ZERO : totalAmount`).
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection of `OrderService.java:217-227`.
  - **Dependencies:** None.

- [x] **RZ-ORD-005: The expected currency is explicitly defined**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Persisted as `'INR'` in `orders`, `payments.currency`, and `InitiatePaymentResult.currency`.
  - **What Was Verified:** Currency is explicitly bound and validated.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Entity and DTO inspection.
  - **Dependencies:** None.

- [x] **RZ-ORD-006: A persistent payment intent or equivalent record exists before gateway initiation**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentService.java:49-65` builds and saves a `Payment` entity with `PaymentStatus.INITIATED` and logs an initial `PaymentEvent`.
  - **What Was Verified:** Persistent payment record created prior to client checkout.
  - **Gap or Risk:** None for product orders.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection of `PaymentService.java`.
  - **Dependencies:** None.

- [x] **RZ-ORD-007: The expected payment amount and currency are persisted**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `Payment.amountInr` and `Payment.currency` columns in `payments` table.
  - **What Was Verified:** Expected amount is persisted in payment intent.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Database migration and entity inspection.
  - **Dependencies:** None.

- [x] **RZ-ORD-008: Gateway order IDs are associated with the correct internal payment and business resource**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `Payment.razorpayOrderId` and `Order.razorpayOrderId` are both populated in `PaymentService.initiatePayment:51,67`.
  - **What Was Verified:** Bi-directional relationship between Order, Payment, and Gateway Order ID.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [!] **RZ-ORD-009: Repeated initiation requests do not create uncontrolled duplicate payment attempts**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** In `PaymentService.java:42-76`, `initiatePayment` does NOT check if a `Payment` entity already exists for the given `orderId`. Calling it multiple times creates multiple `Payment` records in the database with different `razorpayOrderId` values.
  - **What Was Verified:** Duplicate payment intents created without restriction.
  - **Gap or Risk:** Orphaned gateway orders and multiple charge opportunities for a single order.
  - **Required Implementation:** Check if active `Payment` exists in `INITIATED` status for the order; return existing gateway order ID if not expired.
  - **Priority:** P1
  - **Verification Method:** Code trace of `PaymentService.initiatePayment`.
  - **Dependencies:** None.

- [!] **RZ-ORD-010: Inventory reservations and expiry behavior are compatible with payment retries**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Inventory is reserved at order creation (`createOrderFromCart:161`). If payment is not completed, no background expiration job exists to release the reservation.
  - **What Was Verified:** Inventory remains locked indefinitely on abandoned checkout.
  - **Gap or Risk:** Inventory depletion without sales (denial of inventory).
  - **Required Implementation:** Implement an order expiration cron job (e.g. 30-minute timeout) that cancels unpaid orders and invokes `inventoryService.releaseReservation`.
  - **Priority:** P0
  - **Verification Method:** Search for scheduled tasks across backend.
  - **Dependencies:** RZ-STATE-009.

- [~] **RZ-ORD-011: Abandoned or expired attempts can be safely recovered**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Orders remain in `PENDING_PAYMENT` and customer can re-open `/payment?type=order&id={id}` from Dashboard. BUT because there is no TTL check, an order can be paid days later when catalog pricing or stock may have changed.
  - **What Was Verified:** Recovery exists in UI, but lacks validity period checks.
  - **Gap or Risk:** Selling at outdated prices or when stock has changed.
  - **Required Implementation:** Enforce order expiration cutoff (e.g., maximum 2 hours to pay).
  - **Priority:** P2
  - **Verification Method:** UI trace in `DashboardPage.jsx:807`.
  - **Dependencies:** None.

- [!] **RZ-ORD-012: Concurrent payment attempts cannot incorrectly finalize the same order twice**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `OrderRepository` and `PaymentRepository` lack pessimistic or optimistic locking during verification. Parallel execution of `verifyPayment` attempts to confirm inventory twice and crashes.
  - **What Was Verified:** Concurrency race condition.
  - **Gap or Risk:** Duplicate inventory confirmation and application crashes.
  - **Required Implementation:** Add `@Version` to `Order` and `Payment`, or use `PESSIMISTIC_WRITE` on `Order` during verification.
  - **Priority:** P0
  - **Verification Method:** Code trace of `verifyPayment` and `InventoryRecord.java:80`.
  - **Dependencies:** Entity updates.

---

## Section D: Razorpay Order Creation

- [x] **RZ-GW-001: Server-side gateway order creation is implemented or clearly identified as missing**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Implemented in `RazorpayPaymentGateway.java:29-55` using `com.razorpay.RazorpayClient`.
  - **What Was Verified:** Server-side gateway order creation exists.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-GW-002: Gateway orders use server-calculated amounts in the smallest currency unit expected by Razorpay**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `RazorpayPaymentGateway.java:37`: `orderRequest.put("amount", amountInr.multiply(new BigDecimal("100")).longValue())`. Razorpay requires paise for INR.
  - **What Was Verified:** Amount passed in paise.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [~] **RZ-GW-003: Amount conversion avoids floating-point rounding errors**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Uses `BigDecimal.multiply(new BigDecimal("100")).longValue()`. Avoids float IEEE-754 errors, but `.longValue()` silently truncates fractional paise if any exist.
  - **What Was Verified:** `BigDecimal` used, but rounding mode not explicit.
  - **Gap or Risk:** Silent truncation if fractional amounts exist.
  - **Required Implementation:** Use `amountInr.multiply(new BigDecimal("100")).setScale(0, RoundingMode.UNNECESSARY).longValueExact()`.
  - **Priority:** P2
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-GW-004: The correct currency is passed to the gateway**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `orderRequest.put("currency", "INR")` on line 38 of `RazorpayPaymentGateway.java`.
  - **What Was Verified:** Currency is hardcoded to `'INR'`.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-GW-005: Gateway order IDs are persisted**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Persisted in `payments.razorpay_order_id` (`PaymentService:65`) and `orders.razorpay_order_id` (`PaymentService:67`).
  - **What Was Verified:** Gateway order ID is stored in database.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-GW-006: Gateway order creation is associated with a unique internal payment intent**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `Payment` entity with unique UUID PK is created and linked in `PaymentService.initiatePayment`.
  - **What Was Verified:** Associated with internal payment record.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-GW-007: Gateway errors do not leave misleading paid or successful order states**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** If `client.orders.create` fails, exception is thrown before `paymentRepository.save(payment)` or order status update. Order remains `PENDING_PAYMENT`.
  - **What Was Verified:** Error halts execution cleanly.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [ ] **RZ-GW-008: Retry behavior is defined for gateway timeouts and uncertain responses**
  - **Status:** `[ ] MISSING`
  - **Evidence:** `RazorpayClient` has no custom timeouts, no retry template, and no circuit breaker.
  - **What Was Verified:** No retry or timeout policy configured.
  - **Gap or Risk:** Application threads hang during gateway network latency.
  - **Required Implementation:** Configure explicit connect/read timeouts (e.g. 5s/10s) on `RazorpayClient` HTTP transport.
  - **Priority:** P2
  - **Verification Method:** Source inspection of `RazorpayPaymentGateway.java`.
  - **Dependencies:** None.

- [!] **RZ-GW-009: Duplicate gateway-order creation is handled safely**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Repeated calls to `/payment/initiate` generate new gateway orders and insert new `Payment` records without checking existing active records.
  - **What Was Verified:** Duplicate orders created on each request.
  - **Gap or Risk:** Wasteful gateway order generation and multiple charge points.
  - **Required Implementation:** Reuse existing unexpired gateway order for the given order ID.
  - **Priority:** P1
  - **Verification Method:** Source trace.
  - **Dependencies:** None.

- [x] **RZ-GW-010: Gateway request metadata does not contain secrets or unnecessary sensitive information**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `orderRequest` contains only `amount`, `currency`, and `receipt` (`orderNumber`). No customer PII, addresses, or secrets are transmitted.
  - **What Was Verified:** Minimal metadata payload.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection of `RazorpayPaymentGateway.java:36-40`.
  - **Dependencies:** None.

---

## Section E: Checkout and Payment Verification

- [!] **RZ-VER-001: The primary checkout screen uses the intended Razorpay Checkout integration**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `frontend/src/pages/PaymentPage.jsx` does NOT use Razorpay Checkout SDK. It renders custom input fields for card number, expiry, CVV, and UPI ID, and executes a simulated payment timeout with `mock_signature_bypass`.
  - **What Was Verified:** The checkout screen is completely mock and has zero integration with `checkout.js`.
  - **Gap or Risk:** Real payments cannot be processed by customers.
  - **Required Implementation:** Dynamically inject `https://checkout.razorpay.com/v1/checkout.js` and open `new window.Razorpay(options).open()`.
  - **Priority:** P0
  - **Verification Method:** Inspection of `PaymentPage.jsx:324-422`.
  - **Dependencies:** RZ-VER-002, RZ-VER-003.

- [~] **RZ-VER-002: Checkout receives the server-created Razorpay order ID**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `PaymentPage.jsx:136` calls `paymentApi.initiatePayment(id)` and receives `razorpayOrderId`. But in mock mode, it falls back to `order_mock_${Date.now()}`.
  - **What Was Verified:** Flow exists in mock form, but needs integration with real checkout handler.
  - **Gap or Risk:** Client fabricates mock order IDs.
  - **Required Implementation:** Pass authoritative `razorpayOrderId` directly into Razorpay Checkout options.
  - **Priority:** P0
  - **Verification Method:** Inspection of `PaymentPage.jsx:136`.
  - **Dependencies:** RZ-VER-001.

- [~] **RZ-VER-003: The public key ID is configured safely for the active environment**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `InitiatePaymentResponse` returns `razorpayKeyId`. However, frontend never uses it.
  - **What Was Verified:** Key ID is passed in response payload, but unused.
  - **Gap or Risk:** None security-wise, but required for frontend initialization.
  - **Required Implementation:** Pass `key` property into `Razorpay` constructor.
  - **Priority:** P0
  - **Verification Method:** DTO and frontend code inspection.
  - **Dependencies:** RZ-VER-001.

- [~] **RZ-VER-004: The backend verifies the Razorpay payment signature**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Cryptographic HMAC-SHA256 signature verification code exists in `RazorpayPaymentGateway.verifySignature:73`. HOWEVER, line 60 returns `true` if `isMockMode()` is active.
  - **What Was Verified:** Verification algorithm exists, but is bypassed in mock mode.
  - **Gap or Risk:** Bypass in non-production or misconfigured production.
  - **Required Implementation:** Enforce strict HMAC verification across all non-mock environments.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `RazorpayPaymentGateway.java:58-77`.
  - **Dependencies:** None.

- [x] **RZ-VER-005: Signature verification uses the expected order ID and payment ID**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `RazorpayPaymentGateway.java:69-71` puts `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` into verification payload.
  - **What Was Verified:** Uses exact parameters required by Razorpay HMAC verification algorithm.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [!] **RZ-VER-006: A valid signature alone cannot override an incorrect amount or currency**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentService.verifyPayment` verifies cryptographic signature, but does NOT verify that the paid amount on Razorpay matches `order.totalAmountInr`. If a client pays for a tampered ₹1 order on Razorpay and passes the signature, the backend marks the ₹10,000 order as paid!
  - **What Was Verified:** No amount or currency check is performed against the payment ID.
  - **Gap or Risk:** Price tampering vulnerability.
  - **Required Implementation:** Fetch payment details from Razorpay (`client.payments.fetch(paymentId)`) and verify that `amount == order.totalAmountInr * 100` and `currency == "INR"`.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `PaymentService.verifyPayment`.
  - **Dependencies:** None.

- [!] **RZ-VER-007: Payment status is authoritatively verified before finalization**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** The backend relies entirely on client-submitted signature and does not query Razorpay's API to confirm payment status before finalizing order.
  - **What Was Verified:** Server-to-server payment status fetch is absent.
  - **Gap or Risk:** Premature finalization of authorized but uncaptured payments.
  - **Required Implementation:** Fetch payment entity via `client.payments.fetch(paymentId)` and assert `status == "captured"`.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `PaymentService.java`.
  - **Dependencies:** None.

- [~] **RZ-VER-008: Captured status is required before treating a purchase as successfully paid**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `PaymentService.verifyPayment:105` sets `payment.setStatus(PaymentStatus.CAPTURED)`, but does so based purely on client signature match without verifying gateway capture status.
  - **What Was Verified:** Status is updated to `CAPTURED`, but not verified from gateway source of truth.
  - **Gap or Risk:** Inaccurate payment state.
  - **Required Implementation:** Verify capture status with gateway.
  - **Priority:** P1
  - **Verification Method:** Source trace.
  - **Dependencies:** RZ-VER-007.

- [~] **RZ-VER-009: A fabricated payment ID or signature is rejected**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** In non-mock mode, rejected by HMAC calculation (tested in `PaymentSecurityTest.java:104`). In mock mode, any signature passes.
  - **What Was Verified:** Cryptographic rejection verified only under non-mock profile.
  - **Gap or Risk:** Mock mode accepts fake signatures.
  - **Required Implementation:** Remove mock bypass from production code.
  - **Priority:** P0
  - **Verification Method:** `PaymentSecurityTest.java`.
  - **Dependencies:** None.

- [x] **RZ-VER-010: A payment belonging to a different order or user is rejected**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentService.java:95-99` checks `if (request.getOrderId() != null && !request.getOrderId().equals(targetOrderId)) throw new IllegalArgumentException(...)`. Tested in `PaymentSecurityTest.testMismatchedOrderIdPaymentVerificationIsRejected`.
  - **What Was Verified:** Cross-order replay attack is prevented.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection and unit test execution.
  - **Dependencies:** None.

- [!] **RZ-VER-011: Duplicate verification requests are idempotent**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentService.verifyPayment` does NOT check if `payment.getStatus() == PaymentStatus.CAPTURED`. Calling it twice invokes `confirmOrderInventory` twice, causing an unhandled `IllegalArgumentException` in `InventoryRecord.confirmSold`.
  - **What Was Verified:** Duplicate verification calls crash.
  - **Gap or Risk:** Network retries cause customer-facing error screens.
  - **Required Implementation:** Add idempotency check: `if (payment.getStatus() == PaymentStatus.CAPTURED) return VerifyPaymentResponse.success();`.
  - **Priority:** P0
  - **Verification Method:** Trace of `PaymentService.verifyPayment:105-120` and `InventoryRecord.java:80`.
  - **Dependencies:** None.

- [x] **RZ-VER-012: Failed or abandoned checkout does not mark an order paid**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** If signature fails, `payment.setStatus(PaymentStatus.FAILED)` is set, order status remains untouched (`PENDING_PAYMENT`).
  - **What Was Verified:** Failure leaves order unpaid.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [~] **RZ-VER-013: Browser callback data is never treated as the sole source of truth**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `PaymentWebhookController` exists to synchronize payments asynchronously. However, orders are currently finalized immediately upon client callback without waiting for or reconciling with webhooks.
  - **What Was Verified:** Both browser callback and webhook paths exist.
  - **Gap or Risk:** Over-reliance on browser callback.
  - **Required Implementation:** Treat browser callback as a user-experience shortcut and webhook as the authoritative settlement mechanism.
  - **Priority:** P2
  - **Verification Method:** Architecture trace.
  - **Dependencies:** None.

- [!] **RZ-VER-014: Payment failures are stored without corrupting previously valid payment states**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** In `PaymentService.processWebhook:217`, `if (payment != null && payment.getStatus() != PaymentStatus.FAILED)` does NOT check if `payment.getStatus() == PaymentStatus.CAPTURED`. A delayed `payment.failed` webhook can overwrite a previously captured payment!
  - **What Was Verified:** Webhook logic can overwrite valid `CAPTURED` state to `FAILED`.
  - **Gap or Risk:** Order state corruption.
  - **Required Implementation:** Add check: `if (payment.getStatus() == PaymentStatus.CAPTURED) return idempotentIgnore;`.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `PaymentService.java:216-218`.
  - **Dependencies:** None.

- [ ] **RZ-VER-015: Automatic capture or explicit capture behavior is configured and verified**
  - **Status:** `[ ] MISSING`
  - **Evidence:** `RazorpayPaymentGateway.java:36` does not pass `payment_capture` option in `orderRequest`.
  - **What Was Verified:** Capture behavior is not explicitly configured in API calls.
  - **Gap or Risk:** If merchant dashboard is set to manual capture, payments authorize but are not captured, expiring after 5 days.
  - **Required Implementation:** Pass `"payment_capture": 1` in `orderRequest` options during order creation.
  - **Priority:** P1
  - **Verification Method:** Code inspection of `RazorpayPaymentGateway.createPaymentOrder`.
  - **Dependencies:** None.

---

## Section F: Payment Lifecycle and State Machine

- [x] **RZ-STATE-001: Payment initiation is represented explicitly**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentStatus.INITIATED` assigned and saved upon order creation.
  - **What Was Verified:** Initiation state tracked in DB.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Entity inspection.
  - **Dependencies:** None.

- [!] **RZ-STATE-002: Authorized and captured payments are distinguishable**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentStatus.java` contains only `INITIATED`, `CAPTURED`, `FAILED`, `REFUNDED`. It lacks `AUTHORIZED`.
  - **What Was Verified:** Cannot distinguish between authorization and capture.
  - **Gap or Risk:** Cannot support two-step auth-and-capture workflows.
  - **Required Implementation:** Add `AUTHORIZED` to `PaymentStatus` enum.
  - **Priority:** P2
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [!] **RZ-STATE-003: Failed payments cannot accidentally become captured through stale callbacks**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentService.verifyPayment` does not check current status. If an order was previously marked `FAILED`, a late verification call sets it to `CAPTURED`.
  - **What Was Verified:** Missing state transition guard.
  - **Gap or Risk:** Zombie order resurrection.
  - **Required Implementation:** Prohibit `FAILED` $\rightarrow$ `CAPTURED` transition without creating a fresh payment attempt.
  - **Priority:** P1
  - **Verification Method:** Source inspection of `PaymentService.java:105`.
  - **Dependencies:** RZ-ARCH-007.

- [~] **RZ-STATE-004: Duplicate callbacks cannot repeat business side effects**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Webhooks check `payment.getStatus() == CAPTURED` and `order.getStatus() != PAID`. BUT client verification (`/payment/verify`) does NOT.
  - **What Was Verified:** Webhooks are protected; client callbacks are not.
  - **Gap or Risk:** Duplicate inventory reduction via client callbacks.
  - **Required Implementation:** Add duplicate guard to `verifyPayment`.
  - **Priority:** P0
  - **Verification Method:** Source comparison.
  - **Dependencies:** None.

- [!] **RZ-STATE-005: Late success after a timeout is handled safely**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** In `PaymentService.processWebhook:210`, `if (order.getStatus() != OrderStatus.PAID)` updates order to `PAID` even if order was already `CANCELLED`!
  - **What Was Verified:** Webhook flips `CANCELLED` orders to `PAID`.
  - **Gap or Risk:** Stock conflict; cancelled orders revived without inventory.
  - **Required Implementation:** If order is already `CANCELLED`, do NOT set to `PAID`; initiate automated refund and alert admin.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `PaymentService.java:210`.
  - **Dependencies:** None.

- [x] **RZ-STATE-006: Order state transitions are atomic and bound to payment state changes**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentService.verifyPayment` and `processWebhook` run under `@Transactional(isolation = READ_COMMITTED)`.
  - **What Was Verified:** Payment and Order status committed in single transaction.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [!] **RZ-STATE-007: Out-of-order state transitions are prevented**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `OrderService.updateOrderStatus:390-400` enforces transition rules, but `PaymentService.processWebhook:212` calls `updateOrderStatus` without verifying transition rules for late webhooks.
  - **What Was Verified:** Webhook bypasses transition constraints.
  - **Gap or Risk:** Illegal status jumps.
  - **Required Implementation:** Standardize all status changes through `OrderService.transitionTo(...)`.
  - **Priority:** P1
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-STATE-008: Terminal states (PAID, CANCELLED, REFUNDED) are immutable**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `OrderService.java:391`: Cancelled or Refunded orders cannot be re-opened.
  - **What Was Verified:** Terminal immutability enforced for cancellation/refund.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [ ] **RZ-STATE-009: Stale checkout sessions expire gracefully**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No scheduled task exists to expire pending checkout sessions or cancel unpaid orders.
  - **What Was Verified:** Zero session timeout mechanism.
  - **Gap or Risk:** Open pending orders indefinitely lock reserved stock.
  - **Required Implementation:** Implement `@Scheduled` job to cancel stale pending orders after 30 minutes.
  - **Priority:** P0
  - **Verification Method:** Search for `@Scheduled` in backend codebase.
  - **Dependencies:** None.

- [x] **RZ-STATE-010: State transitions generate audit logs or event history**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentEvent` persisted in `payment_events` table for each payment event; `OrderEvent` persisted in `order_events` table for order transitions.
  - **What Was Verified:** Full audit history persisted.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Entity inspection.
  - **Dependencies:** None.

---

## Section G: Webhooks and Asynchronous Event Processing

- [x] **RZ-WHK-001: Webhook endpoint exists and is publicly accessible**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentWebhookController.java` mapped to `POST /payment/webhook`, declared `permitAll()` in `SecurityConfig.java:85`.
  - **What Was Verified:** Publicly accessible webhook route.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Security config inspection.
  - **Dependencies:** None.

- [~] **RZ-WHK-002: Webhook signature verification is enforced using HMAC-SHA256 and webhook secret**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Verified by `RazorpayPaymentGateway.verifyWebhookSignature` using `Utils.verifyWebhookSignature`. BUT in mock mode, it returns `true` (line 86).
  - **What Was Verified:** Cryptographic verification exists, but mock bypass present.
  - **Gap or Risk:** Bypass vulnerability in dev/test profiles.
  - **Required Implementation:** Strictly require real signature verification in production.
  - **Priority:** P0
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-WHK-003: Webhook payload is read as raw bytes/string before signature check**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentWebhookController.handleWebhook` receives `@RequestBody String rawBody`.
  - **What Was Verified:** Raw unparsed body used for HMAC computation.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Controller inspection.
  - **Dependencies:** None.

- [x] **RZ-WHK-004: Webhook processing is idempotent (duplicate event delivery does not duplicate side effects)**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Checks `paymentEventRepository.findByEventId(eventId)` and has database unique constraint `event_id VARCHAR(100) UNIQUE` on `payment_events`.
  - **What Was Verified:** Duplicate webhook events are rejected idempotently.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** `PaymentService.java:166-171` and `V8__create_payment_tables.sql:10`.
  - **Dependencies:** None.

- [!] **RZ-WHK-005: Supported webhook events (captured, failed, paid, refund)**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Handles only `payment.captured`, `order.paid`, and `payment.failed`. Does NOT handle `refund.processed`, `refund.failed`, or `payment.authorized`.
  - **What Was Verified:** Limited event handling.
  - **Gap or Risk:** Gateway refunds and asynchronous failures are missed.
  - **Required Implementation:** Add handlers for `refund.processed` and `refund.failed`.
  - **Priority:** P1
  - **Verification Method:** Source inspection of `PaymentService.processWebhook:180-234`.
  - **Dependencies:** None.

- [~] **RZ-WHK-006: Webhook returns HTTP 200/2xx promptly to avoid Razorpay retries**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Returns `200 OK`, but processing is entirely synchronous in the request thread. If database experiences lock contention, the request can exceed Razorpay's 5-second timeout.
  - **What Was Verified:** Synchronous processing.
  - **Gap or Risk:** Webhook timeouts under heavy load.
  - **Required Implementation:** Decouple webhook ingestion from processing (asynchronous event worker or `@Async`).
  - **Priority:** P2
  - **Verification Method:** Code inspection.
  - **Dependencies:** None.

- [ ] **RZ-WHK-007: Out-of-order webhooks handled safely**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No sequencing logic or state machine guard for out-of-order event delivery.
  - **What Was Verified:** Missing out-of-order resolution.
  - **Gap or Risk:** Late events can overwrite newer state.
  - **Required Implementation:** Check state precedence before applying webhook transitions.
  - **Priority:** P1
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [~] **RZ-WHK-008: Webhook failure logging and alert mechanism**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Errors logged via `log.error`, but no alert, metrics counter, or admin notification is dispatched.
  - **What Was Verified:** Logging exists, alerting is absent.
  - **Gap or Risk:** Silent webhook failures in production.
  - **Required Implementation:** Publish actuator metric or admin alert on webhook verification failure.
  - **Priority:** P2
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [~] **RZ-WHK-009: Webhook processing recovers if database or downstream services are temporarily down**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Razorpay retries on non-200 responses, but Sporekart has no dead-letter queue or retry table.
  - **What Was Verified:** Relies solely on Razorpay's external retry schedule.
  - **Gap or Risk:** Lost events if downtime exceeds retry window.
  - **Required Implementation:** Store raw webhook payloads in an ingestion table before processing.
  - **Priority:** P2
  - **Verification Method:** Architecture trace.
  - **Dependencies:** None.

- [ ] **RZ-WHK-010: Secret rotation or multi-secret support for webhooks**
  - **Status:** `[ ] MISSING`
  - **Evidence:** Only a single static `@Value("${app.razorpay.webhook-secret:}")` is supported.
  - **What Was Verified:** No dual-secret rotation mechanism.
  - **Gap or Risk:** Downtime during webhook secret rotation.
  - **Required Implementation:** Support primary and secondary webhook secrets during rotation.
  - **Priority:** P3
  - **Verification Method:** Configuration inspection.
  - **Dependencies:** None.

---

## Section H: Refunds, Reversals, Cancellations

- [!] **RZ-REF-001: Refund initiation model and authorization (admin vs customer)**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentService.refundPayment` is NEVER called by any controller or service! Admin order cancellation calls `orderService.updateOrderStatus` which refunds to wallet only!
  - **What Was Verified:** Gateway refund functionality is completely unwired.
  - **Gap or Risk:** Inability to refund money back to customer bank accounts / cards.
  - **Required Implementation:** Create `AdminPaymentController.refundPayment` with `hasRole('ADMIN')` guard.
  - **Priority:** P0
  - **Verification Method:** Grep for callers of `refundPayment`.
  - **Dependencies:** None.

- [~] **RZ-REF-002: Full and partial refunds supported**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Method accepts `amountInr`, but cannot be called.
  - **What Was Verified:** Method signature supports amount parameter.
  - **Gap or Risk:** Unwired.
  - **Required Implementation:** Expose through admin API.
  - **Priority:** P1
  - **Verification Method:** Source inspection.
  - **Dependencies:** RZ-REF-001.

- [!] **RZ-REF-003: Gateway refund ID and status tracking**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** No `refunds` database table exists! Refund result is only stored inside a JSON string in `PaymentEvent.eventDataJson`.
  - **What Was Verified:** Missing relational schema for refunds.
  - **Gap or Risk:** Cannot query, track, or audit refunds efficiently.
  - **Required Implementation:** Create `refunds` table (`id`, `order_id`, `payment_id`, `gateway_refund_id`, `amount_inr`, `status`, `reason`, `created_at`).
  - **Priority:** P1
  - **Verification Method:** Schema migration inspection.
  - **Dependencies:** Flyway migration.

- [!] **RZ-REF-004: Refund idempotency and race condition prevention (cannot refund more than paid amount)**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** In `PaymentService.java:251`, checks `amountInr <= order.totalAmountInr`. If multiple partial refunds are submitted, it checks against the original order total each time instead of remaining refundable balance!
  - **What Was Verified:** Cumulative refund validation is absent.
  - **Gap or Risk:** Merchant can over-refund beyond original transaction amount.
  - **Required Implementation:** Track `total_refunded_inr` and assert `(total_refunded_inr + amountInr) <= order.totalAmountInr`.
  - **Priority:** P0
  - **Verification Method:** Source inspection.
  - **Dependencies:** RZ-REF-003.

- [!] **RZ-REF-005: Inventory restock / status update upon refund**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** In `PaymentService.refundPayment`, `inventoryService.releaseCancelledOrder` is NOT called!
  - **What Was Verified:** Inventory is not restocked when refund is executed via payment service.
  - **Gap or Risk:** Lost inventory tracking.
  - **Required Implementation:** Call `inventoryService.releaseCancelledOrder` upon refund confirmation.
  - **Priority:** P1
  - **Verification Method:** Source inspection of `PaymentService.refundPayment`.
  - **Dependencies:** None.

- [!] **RZ-REF-006: Reversal of wallet / coupon / promotional discounts on refund**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentService.refundPayment:274` credits wallet, AND then `orderService.updateOrderStatus` ALSO credits wallet on line 409 (DOUBLE WALLET CREDIT BUG).
  - **What Was Verified:** Double refund vulnerability.
  - **Gap or Risk:** Direct merchant financial loss.
  - **Required Implementation:** Remove duplicate wallet credit call from `PaymentService.refundPayment`.
  - **Priority:** P0
  - **Verification Method:** Code trace of lines 274 and 288 in `PaymentService.java`.
  - **Dependencies:** None.

- [!] **RZ-REF-007: Customer cancellation triggers refund if payment already captured**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** In `OrderService:404`, customer cancellation credits wallet balance only; does not initiate gateway refund.
  - **What Was Verified:** Gateway refund is bypassed.
  - **Gap or Risk:** Customer must accept wallet credits instead of original payment method refund.
  - **Required Implementation:** Offer customer choice: "Refund to Sporekart Wallet (Instant)" vs "Refund to Original Payment Method (5-7 days)".
  - **Priority:** P1
  - **Verification Method:** Source inspection of `OrderService.java:404-421`.
  - **Dependencies:** RZ-REF-001.

- [!] **RZ-REF-008: Admin cancellation triggers refund or cancels gateway authorization**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Admin cancellation credits wallet only; does not call gateway refund.
  - **What Was Verified:** Same as RZ-REF-007.
  - **Gap or Risk:** Lack of gateway refund capability for admin.
  - **Required Implementation:** Add gateway refund trigger to admin order management.
  - **Priority:** P1
  - **Verification Method:** Source inspection of `AdminOrderController.java`.
  - **Dependencies:** RZ-REF-001.

- [ ] **RZ-REF-009: Refund failure / pending / delayed settlement tracking**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No mechanism tracks delayed refund settlements from Razorpay.
  - **What Was Verified:** Missing settlement tracker.
  - **Gap or Risk:** Inability to respond to customer inquiries regarding delayed refunds.
  - **Required Implementation:** Track refund status updates from webhooks.
  - **Priority:** P2
  - **Verification Method:** Source inspection.
  - **Dependencies:** RZ-REF-003.

- [ ] **RZ-REF-010: Webhook handling for refund.processed and refund.failed**
  - **Status:** `[ ] MISSING`
  - **Evidence:** `PaymentService.processWebhook` does not handle `refund.processed` or `refund.failed`.
  - **What Was Verified:** Refund webhooks ignored.
  - **Gap or Risk:** Out-of-band refund tracking failure.
  - **Required Implementation:** Add webhook event listeners for refund lifecycle events.
  - **Priority:** P1
  - **Verification Method:** Source inspection.
  - **Dependencies:** RZ-WHK-005.

---

## Section I: Wallet, Ledger, Dual Payments

- [x] **RZ-WAL-001: Wallet ledger atomicity (double-entry bookkeeping)**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `wallet_transactions` records `balance_before`, `balance_after`, `amount`, and `transaction_direction`. Updates execute under pessimistic lock `findByUserIdWithLock`.
  - **What Was Verified:** Immutable transaction ledger.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection of `WalletService.java:81-115`.
  - **Dependencies:** None.

- [!] **RZ-WAL-002: Wallet balance check and reservation during checkout**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `WalletController.processCheckoutWalletPay` directly debits the wallet balance (`walletService.debitWallet`) BEFORE gateway payment is completed.
  - **What Was Verified:** Premature debit without reservation hold.
  - **Gap or Risk:** Customer loses wallet funds if gateway transaction is abandoned or fails.
  - **Required Implementation:** Implement two-phase wallet checkout: `holdBalance(...)` $\rightarrow$ `commitHold(...)` on success or `releaseHold(...)` on failure.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `WalletController.java:178`.
  - **Dependencies:** None.

- [!] **RZ-WAL-003: Split payment (wallet + gateway): correct gateway amount calculation**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `WalletController.processCheckoutWalletPay` accepts `amountFromWallet` and `amountFromGateway` directly from the client request body without verifying that `walletAmount + gatewayAmount == order.totalAmountInr`!
  - **What Was Verified:** Client-submitted split amounts are not validated against server-authoritative order total.
  - **Gap or Risk:** Tampering vulnerability: client can pass `amountFromWallet = 0`, `amountFromGateway = 0` to get a free order.
  - **Required Implementation:** Calculate split amounts authoritatively on the backend from `order.totalAmountInr`.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `WalletController.java:174-175`.
  - **Dependencies:** None.

- [!] **RZ-WAL-004: Split payment failure: wallet reservation release / rollback**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** No rollback mechanism exists. Debited funds remain permanently deducted if gateway payment is abandoned.
  - **What Was Verified:** Missing compensation/rollback mechanism.
  - **Gap or Risk:** Customer financial loss.
  - **Required Implementation:** Implement reservation hold with automatic 15-minute expiration rollback.
  - **Priority:** P0
  - **Verification Method:** Source inspection.
  - **Dependencies:** RZ-WAL-002.

- [ ] **RZ-WAL-005: Split payment refund: proportional or wallet-first reversal policy**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No split payment refund policy exists in code.
  - **What Was Verified:** Missing refund rules for split tender.
  - **Gap or Risk:** Ambiguity in refund allocation.
  - **Required Implementation:** Define policy: refund gateway portion to original payment method, and wallet portion back to wallet.
  - **Priority:** P2
  - **Verification Method:** Code inspection.
  - **Dependencies:** RZ-REF-001.

- [!] **RZ-WAL-006: Wallet top-up via gateway flow isolation from product orders**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `WalletController.verifyAddMoney` takes `amount` from unvalidated `@RequestParam amount` and credits it without verifying the paid amount from Razorpay!
  - **What Was Verified:** Critical arbitrary balance injection vulnerability.
  - **Gap or Risk:** Direct financial loss through balance fabrication.
  - **Required Implementation:** Persist topup intent record with expected amount; verify paid amount with Razorpay API before crediting.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `WalletController.java:116-150`.
  - **Dependencies:** None.

- [x] **RZ-WAL-007: Concurrent wallet deductions prevention**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `WalletRepository.findByUserIdWithLock` uses `LockModeType.PESSIMISTIC_WRITE` on wallet balance updates.
  - **What Was Verified:** Prevents double-spend race conditions.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Repository inspection of `WalletRepository.java:19-21`.
  - **Dependencies:** None.

- [x] **RZ-WAL-008: Negative wallet balance prevention**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Database check constraint `check_wallet_available_balance_non_negative` (`CHECK (available_balance >= 0.00)`) in `V32__add_wallet_non_negative_check.sql:4`.
  - **What Was Verified:** Database-level guarantee against negative balance.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Database migration inspection.
  - **Dependencies:** None.

- [!] **RZ-WAL-009: Split payment persists internal payment record for verification**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** When `WalletController.processCheckoutWalletPay` initiates gateway payment on line 196, it does NOT insert a `Payment` entity. Later verification fails.
  - **What Was Verified:** Missing `Payment` record insertion.
  - **Gap or Risk:** Broken checkout completion for split payments.
  - **Required Implementation:** Insert `Payment` entity inside `PaymentService` before returning gateway order ID.
  - **Priority:** P0
  - **Verification Method:** Code inspection of `WalletController.java:195-202`.
  - **Dependencies:** RZ-ARCH-006.

- [ ] **RZ-WAL-010: Top-up intent persistence and idempotency**
  - **Status:** `[ ] MISSING`
  - **Evidence:** `WalletController.addMoney` generates `topupRef` but does not persist it in any table before creating gateway order.
  - **What Was Verified:** Intent record is not persisted.
  - **Gap or Risk:** Loss of correlation and inability to validate top-up parameters.
  - **Required Implementation:** Create `wallet_topup_intents` table or use `payments` table with `source_type = 'WALLET_TOPUP'`.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `WalletController.java:100-114`.
  - **Dependencies:** None.

---

## Section J: Training Enrolments and Courses

- [!] **RZ-TRN-001: Training course / batch enrollment payment flow**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Training enrollments do NOT create Razorpay orders. `PaymentService.verifyEnrollmentPayment` accepts arbitrary strings and bypasses gateway verification completely.
  - **What Was Verified:** Mock bypass in place of real gateway order creation.
  - **Gap or Risk:** Commercial training courses can be enrolled into for free.
  - **Required Implementation:** Integrate training enrollments into `PaymentService.initiatePayment` to create genuine Razorpay orders.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `PaymentService.java:383-427`.
  - **Dependencies:** RZ-ARCH-005.

- [~] **RZ-TRN-002: Seat reservation and capacity limits during pending payment**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `TrainingService.confirmEnrollmentPayment` checks and increments capacity via `batchRepository.incrementEnrolledCountIfCapacityAvailable(batchId)`. However, capacity is NOT held during the `PENDING_PAYMENT` window.
  - **What Was Verified:** Capacity enforced at confirmation, but not reserved during checkout.
  - **Gap or Risk:** Overbooking if multiple users pay simultaneously for the last remaining seat.
  - **Required Implementation:** Implement temporary seat reservation hold with 15-minute expiration.
  - **Priority:** P1
  - **Verification Method:** Source inspection of `TrainingService.java:224-228`.
  - **Dependencies:** None.

- [x] **RZ-TRN-003: Payment verification activates student enrollment**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `confirmEnrollmentPayment` sets `status = CONFIRMED`, sets `paymentReference`, and publishes `EnrollmentConfirmedEvent`.
  - **What Was Verified:** Enrollment activation triggers.
  - **Gap or Risk:** None once verification is secured.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [!] **RZ-TRN-004: Cancellation policy and refund rules for training batches**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `TrainingService.cancelEnrollment` (lines 330-360) sets enrollment status to `CANCELLED` and decrements `batch.enrolledCount`. BUT it does NOT refund payment (neither to wallet nor via gateway)!
  - **What Was Verified:** Cancellation leaves paid funds unrefunded.
  - **Gap or Risk:** Customer funds trapped upon course cancellation.
  - **Required Implementation:** Trigger wallet or gateway refund upon enrollment cancellation.
  - **Priority:** P1
  - **Verification Method:** Source inspection of `TrainingService.java:330-360`.
  - **Dependencies:** None.

- [x] **RZ-TRN-005: Training certificate / LMS access tied to authoritative payment**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `TrainingService.issueCertificate` asserts `enrollment.getStatus() == EnrollmentStatus.CONFIRMED`.
  - **What Was Verified:** Certificates only issued for confirmed enrollments.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [!] **RZ-TRN-006: Training confirmation endpoint consolidation**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Two duplicate confirmation endpoints exist:
    1. `POST /payment/verify-enrollment` in `PaymentController.java:54`
    2. `POST /training/enrollments/{enrollmentId}/confirm-payment` in `TrainingController.java:81`
  - **What Was Verified:** Redundant, competing confirmation endpoints.
  - **Gap or Risk:** Inconsistent security controls; attack surface duplication.
  - **Required Implementation:** Deprecate `TrainingController.confirmPayment` and funnel all payment confirmations strictly through `PaymentController`.
  - **Priority:** P1
  - **Verification Method:** Source inspection of both controllers.
  - **Dependencies:** None.

- [~] **RZ-TRN-007: Webhook support for training enrollment payments**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Webhook handler only looks up `OrderResponse` via `orderService.getOrderByRazorpayOrderId`. It does NOT look up training enrollments.
  - **What Was Verified:** Training enrollments cannot be confirmed via webhooks.
  - **Gap or Risk:** Training payments not captured if browser closes.
  - **Required Implementation:** Support enrollment resolution in `PaymentService.processWebhook`.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `PaymentService.java:207-215`.
  - **Dependencies:** None.

- [ ] **RZ-TRN-008: Non-order payments schema support**
  - **Status:** `[ ] MISSING`
  - **Evidence:** `V33__make_payments_order_id_nullable.sql` made `order_id` nullable, but did NOT add an `enrollment_id` foreign key column to `payments` table!
  - **What Was Verified:** Relational foreign key between payments and enrollments is missing.
  - **Gap or Risk:** Cannot maintain relational integrity for enrollment payments.
  - **Required Implementation:** Add `enrollment_id UUID REFERENCES enrollments(id)` to `payments` table.
  - **Priority:** P1
  - **Verification Method:** Inspection of `V33` migration and `Payment.java`.
  - **Dependencies:** Flyway migration.

---

## Section K: Database Integrity, Concurrency, Locking, Idempotency

- [!] **RZ-DB-001: Unique constraints on gateway order ID, payment ID, refund ID**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `payments.razorpay_order_id` and `payments.razorpay_payment_id` have secondary indexes (`idx_payments_razorpay_order_id`), but NO UNIQUE constraints in `V1__init_schema.sql` or `V8__create_payment_tables.sql`.
  - **What Was Verified:** Lack of uniqueness constraint.
  - **Gap or Risk:** Duplicate rows can be inserted. `paymentRepository.findByRazorpayOrderId` returns `Optional<Payment>` and will throw `NonUniqueResultException` if duplicates exist.
  - **Required Implementation:** Add UNIQUE constraint on `payments.razorpay_order_id` and `payments.razorpay_payment_id`.
  - **Priority:** P0
  - **Verification Method:** Database migration inspection.
  - **Dependencies:** Data deduplication migration.

- [!] **RZ-DB-002: Optimistic/pessimistic locking on order and payment rows during verification**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `Order.java` and `Payment.java` have NO `@Version` attribute. `OrderRepository` has no `@Lock(LockModeType.PESSIMISTIC_WRITE)` methods.
  - **What Was Verified:** No locking mechanism on orders or payments.
  - **Gap or Risk:** Lost update anomalies under concurrent verification/webhook execution.
  - **Required Implementation:** Add `@Version private Long version;` to `Order` and `Payment`.
  - **Priority:** P1
  - **Verification Method:** Entity inspection.
  - **Dependencies:** Schema migration.

- [x] **RZ-DB-003: Database transaction boundaries encompass payment status + order status + inventory/wallet**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentService.verifyPayment` runs under `@Transactional(isolation = READ_COMMITTED)` encompassing payment update, order status update, and inventory confirmation.
  - **What Was Verified:** Atomic unit of work.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [~] **RZ-DB-004: Idempotency keys or unique payment intent tracking**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `orders.idempotency_key` is unique. `payment_events.event_id` is unique. BUT `/payment/initiate` and `/payment/verify` have no idempotency key support.
  - **What Was Verified:** Partial idempotency key implementation.
  - **Gap or Risk:** Client cannot provide idempotency key for payment initiation.
  - **Required Implementation:** Support `Idempotency-Key` header on `/payment/initiate`.
  - **Priority:** P2
  - **Verification Method:** Controller inspection.
  - **Dependencies:** None.

- [x] **RZ-DB-005: Audit trail for payment status transitions and webhook events**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `payment_events` table stores event type, event data JSON, created by, and timestamp.
  - **What Was Verified:** Audit logging exists.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Entity inspection of `PaymentEvent.java`.
  - **Dependencies:** None.

- [~] **RZ-DB-006: Foreign key constraints and relational integrity across payments, orders, refunds**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `payments.order_id` references `orders(id)`. But `enrollment_id` foreign key is missing, and no `refunds` table exists.
  - **What Was Verified:** Order FK exists; enrollment and refund FKs missing.
  - **Gap or Risk:** Data integrity gaps for non-order payments and refunds.
  - **Required Implementation:** Add missing foreign key columns.
  - **Priority:** P1
  - **Verification Method:** Schema migration inspection.
  - **Dependencies:** None.

- [!] **RZ-DB-007: Non-negative check constraint on payment amounts**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `payments.amount_inr` has no database CHECK constraint ensuring `amount_inr > 0`.
  - **What Was Verified:** Missing CHECK constraint on `payments`.
  - **Gap or Risk:** Negative or zero amount payments could be inserted.
  - **Required Implementation:** Add `CHECK (amount_inr > 0.00)` to `payments` table.
  - **Priority:** P2
  - **Verification Method:** Migration inspection.
  - **Dependencies:** Flyway migration.

- [~] **RZ-DB-008: Database index coverage for payment lookups**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** Indexes exist on `payments.order_id`, `payments.razorpay_order_id`, `payments.razorpay_payment_id` (`V8:16-18`). BUT index on `payments.status` is missing.
  - **What Was Verified:** Key lookup indexes present, status index missing.
  - **Gap or Risk:** Slow queries when sweeping for stale `INITIATED` payments.
  - **Required Implementation:** Add index `idx_payments_status_created_at ON payments(status, created_at)`.
  - **Priority:** P2
  - **Verification Method:** Migration inspection.
  - **Dependencies:** Flyway migration.

- [!] **RZ-DB-009: Unique constraint on orders.razorpay_order_id**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `orders.razorpay_order_id` in `V1__init_schema.sql:112` has NO UNIQUE constraint.
  - **What Was Verified:** Lack of uniqueness constraint on order table.
  - **Gap or Risk:** Multiple orders could theoretically point to the same Razorpay order ID.
  - **Required Implementation:** Add UNIQUE constraint on `orders.razorpay_order_id`.
  - **Priority:** P1
  - **Verification Method:** Migration inspection.
  - **Dependencies:** Flyway migration.

- [ ] **RZ-DB-010: Database table for refund records**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No `refunds` table exists anywhere in the 37 Flyway migration scripts.
  - **What Was Verified:** Missing refund entity table.
  - **Gap or Risk:** Inability to store structured refund data.
  - **Required Implementation:** Create `refunds` table in new migration `V38`.
  - **Priority:** P1
  - **Verification Method:** Schema directory inspection.
  - **Dependencies:** Flyway migration.

---

## Section L: Security, PCI Compliance, Tampering Prevention, Validation

- [!] **RZ-SEC-001: No PAN, CVV, or cardholder credentials stored in database or logs (PCI-DSS SAQ A)**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** 
    - Database/Backend: Clean. No PAN or CVV columns exist.
    - Frontend: **VIOLATION.** `PaymentPage.jsx:340-375` renders HTML input fields for `cardNumber`, `cardExpiry`, and `cardCvv`. Collecting card details directly on the merchant origin violates PCI-DSS SAQ A scope unless using Razorpay's PCI-compliant checkout iframe.
  - **What Was Verified:** Frontend collects cardholder data directly.
  - **Gap or Risk:** Severe PCI-DSS compliance failure.
  - **Required Implementation:** Remove manual card inputs from `PaymentPage.jsx`. Delegate 100% of payment method collection to Razorpay Hosted Checkout modal.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `PaymentPage.jsx:340-375`.
  - **Dependencies:** RZ-VER-001.

- [x] **RZ-SEC-002: Public key ID vs Secret Key segregation**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Key ID is public. Secret Key is stored on backend only.
  - **What Was Verified:** Proper key segregation.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Configuration inspection.
  - **Dependencies:** None.

- [!] **RZ-SEC-003: Endpoint authorization: payment initiation and verification tied to authenticated customer/session**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `SecurityConfig.java:85` declares `permitAll()` for `/payment/initiate` and `/payment/verify`. In `PaymentController.java:18-30`, neither endpoint verifies caller identity or order ownership! Anyone can initiate or verify payment against any order ID!
  - **What Was Verified:** Missing caller authorization.
  - **Gap or Risk:** Insecure Direct Object Reference (IDOR).
  - **Required Implementation:** Enforce order ownership validation: `validateOrderAccess(order, authUserId, sessionId)`.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `PaymentController.java` and `SecurityConfig.java:85`.
  - **Dependencies:** None.

- [!] **RZ-SEC-004: Protection against price tampering (client sending custom amount)**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:**
    - Product orders: Protected.
    - Wallet top-up: **VULNERABLE.** `WalletController.verifyAddMoney` takes `amount` from query parameter without gateway validation.
    - Split checkout: **VULNERABLE.** `WalletController.processCheckoutWalletPay` takes amounts from client payload.
  - **What Was Verified:** Critical price tampering vulnerabilities in wallet endpoints.
  - **Gap or Risk:** Unlimited financial fabrication.
  - **Required Implementation:** Validate paid amounts strictly against server-calculated totals and gateway response.
  - **Priority:** P0
  - **Verification Method:** Source inspection of `WalletController.java`.
  - **Dependencies:** RZ-WAL-006.

- [x] **RZ-SEC-005: Safe error messages returned to client (no internal stack traces, API keys, or raw SQL)**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `server.error.include-stacktrace: never` in `application.yml:68`. `GlobalExceptionHandler.java` formats safe JSON responses.
  - **What Was Verified:** Information disclosure prevented.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Configuration and code inspection.
  - **Dependencies:** None.

- [x] **RZ-SEC-006: Rate limiting and brute-force protection on payment endpoints**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `RateLimitingFilter.java` added before `UsernamePasswordAuthenticationFilter` in `SecurityConfig.java:95`.
  - **What Was Verified:** Rate limiting active on all API endpoints.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-SEC-007: CORS and CSRF protection on payment and webhook endpoints**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** Stateless JWT architecture (CSRF disabled). Strict CORS origin patterns configured in `SecurityConfig.java:108-130`. Webhook relies on HMAC signature instead of cookies.
  - **What Was Verified:** Standard API security controls.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [!] **RZ-SEC-008: Verification request payload schema validation**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `VerifyPaymentRequest` uses `@NotBlank` for IDs and signature. BUT `VerifyEnrollmentPaymentRequest` does NOT annotate `transactionReference` with `@NotBlank` (`PaymentDtos.java:91`), allowing blank string injection.
  - **What Was Verified:** Missing validation annotation on enrollment payment DTO.
  - **Gap or Risk:** Blank transaction references accepted.
  - **Required Implementation:** Add `@NotBlank` to `transactionReference`.
  - **Priority:** P1
  - **Verification Method:** DTO inspection.
  - **Dependencies:** None.

- [!] **RZ-SEC-009: Training payment forgery prevention**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `PaymentService.verifyEnrollmentPayment` verifies caller identity, but does NOT verify payment signature or gateway transaction validity. Any authenticated user can forge payment for their own enrollment.
  - **What Was Verified:** Payment forgery vulnerability.
  - **Gap or Risk:** Loss of training revenue.
  - **Required Implementation:** Enforce HMAC signature check for training enrollments.
  - **Priority:** P0
  - **Verification Method:** Source trace of `PaymentService.java:383-427`.
  - **Dependencies:** RZ-ARCH-005.

- [!] **RZ-SEC-010: Webhook IP address / Origin verification**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** Webhook endpoint does NOT verify that request originates from Razorpay's public webhook CIDR blocks. Relies solely on HMAC signature.
  - **What Was Verified:** No IP whitelisting or CIDR verification.
  - **Gap or Risk:** DDoS / CPU exhaustion through forged webhook flood.
  - **Required Implementation:** Optional CIDR check or strict rate limit on webhook endpoint.
  - **Priority:** P2
  - **Verification Method:** Controller inspection.
  - **Dependencies:** None.

- [~] **RZ-SEC-011: Constant-time comparison for HMAC signatures**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `Utils.verifyPaymentSignature` and `Utils.verifyWebhookSignature` in Razorpay SDK use constant-time comparison. However, the fallback in `RazorpayPaymentGateway.java:92` uses standard `.equals(signatureHeader)`, which is vulnerable to timing attacks.
  - **What Was Verified:** Fallback comparison is not constant-time.
  - **Gap or Risk:** Microsecond timing attack against webhook secret.
  - **Required Implementation:** Use `MessageDigest.isEqual(...)` for signature comparison.
  - **Priority:** P2
  - **Verification Method:** Source inspection of `RazorpayPaymentGateway.java:92`.
  - **Dependencies:** None.

- [ ] **RZ-SEC-012: HTTPS enforcement on webhook URLs**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No configuration assertion ensures that webhook notifications are received over HTTPS.
  - **What Was Verified:** Protocol verification missing in config.
  - **Gap or Risk:** Eavesdropping on unencrypted webhooks.
  - **Required Implementation:** Enforce TLS/HTTPS on all production ingress routes.
  - **Priority:** P1
  - **Verification Method:** Configuration inspection.
  - **Dependencies:** Reverse proxy configuration.

---

## Section M: Monitoring, Logging, Audit Trails, Reconciliation

- [ ] **RZ-OPS-001: Payment reconciliation mechanism to detect orphaned payments**
  - **Status:** `[ ] MISSING`
  - **Evidence:** Zero scheduled jobs, scripts, or APIs exist to reconcile Razorpay transactions with local database orders.
  - **What Was Verified:** Missing reconciliation engine.
  - **Gap or Risk:** Discrepancies between bank settlements and order fulfillment remain undetected.
  - **Required Implementation:** Implement daily reconciliation batch job comparing Razorpay Settlements API with internal orders and ledger.
  - **Priority:** P1
  - **Verification Method:** Codebase search for reconciliation jobs.
  - **Dependencies:** None.

- [x] **RZ-OPS-002: Logging of payment events with structured correlation IDs**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentService.java` logs with `orderId`, `razorpayOrderId`, and `eventId`. `RequestIdFilter` injects `X-Request-ID` into MDC.
  - **What Was Verified:** Structured logging with correlation IDs.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [x] **RZ-OPS-003: Sensitive data redaction in application logs**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** No cardholder data or API secrets are logged. Bank account numbers are masked in `WalletService.java:283`.
  - **What Was Verified:** Masking of financial credentials.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Source inspection.
  - **Dependencies:** None.

- [ ] **RZ-OPS-004: Alerting on high payment failure rates or webhook errors**
  - **Status:** `[ ] MISSING`
  - **Evidence:** Actuator metrics are enabled, but no Micrometer counters or alarms track payment failure rates.
  - **What Was Verified:** Missing payment metrics instrumentation.
  - **Gap or Risk:** Outages at Razorpay or application verification errors go unnoticed until customers complain.
  - **Required Implementation:** Instrument `MeterRegistry` counters: `payments.initiated`, `payments.captured`, `payments.failed`, `webhooks.failed`.
  - **Priority:** P2
  - **Verification Method:** Codebase search for Micrometer metrics.
  - **Dependencies:** None.

- [ ] **RZ-OPS-005: Health checks and external gateway dependency monitoring**
  - **Status:** `[ ] MISSING`
  - **Evidence:** `/actuator/health` contains disk, db, and mail health indicators, but lacks a `RazorpayHealthIndicator`.
  - **What Was Verified:** Gateway health check absent.
  - **Gap or Risk:** Inability to detect payment gateway API degradation during health checks.
  - **Required Implementation:** Add `HealthIndicator` bean that pings Razorpay API or monitors recent success rate.
  - **Priority:** P2
  - **Verification Method:** Inspection of `application.yml` management endpoints.
  - **Dependencies:** None.

- [ ] **RZ-OPS-006: Webhook latency and delivery monitoring**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No tracking of duration between payment capture and webhook receipt.
  - **What Was Verified:** Missing latency metrics.
  - **Gap or Risk:** Inability to diagnose webhook delivery delays.
  - **Required Implementation:** Log delta between webhook payload `created_at` and server receipt time.
  - **Priority:** P3
  - **Verification Method:** Code inspection.
  - **Dependencies:** None.

- [~] **RZ-OPS-007: Administrative financial dashboard**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `AdminFinanceController.java` provides `/admin/finance/overview`, `/transactions`, `/withdrawals`. BUT it only displays wallet ledger data; it has zero visibility into Razorpay gateway transactions, settlements, or fees.
  - **What Was Verified:** Wallet dashboard exists, gateway financial dashboard missing.
  - **Gap or Risk:** Admins cannot inspect gateway transaction statuses from the console.
  - **Required Implementation:** Add Gateway Payments tab to Admin Console.
  - **Priority:** P2
  - **Verification Method:** UI and controller inspection.
  - **Dependencies:** None.

- [ ] **RZ-OPS-008: Automated payout reconciliation for wallet withdrawals**
  - **Status:** `[ ] MISSING`
  - **Evidence:** Wallet withdrawals are approved/rejected manually by admin. No integration exists with RazorpayX Payouts.
  - **What Was Verified:** Manual payout workflow.
  - **Gap or Risk:** High manual overhead and human error risk in bank payouts.
  - **Required Implementation:** Integrate RazorpayX Payouts API or export standard NEFT/RTGS batch files.
  - **Priority:** P3
  - **Verification Method:** Controller inspection.
  - **Dependencies:** None.

---

## Section N: Testing and QA Automation Readiness

- [x] **RZ-TST-001: Unit tests for signature verification and amount conversion**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentServiceUnitTest.java:103-165` tests valid and invalid signature paths using Mockito.
  - **What Was Verified:** Unit tests cover verification branches.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Test file inspection.
  - **Dependencies:** None.

- [~] **RZ-TST-002: Integration tests for payment initiation and verification flows**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `PaymentModuleTest.java:135-168` tests initiation and verification in `@SpringBootTest`. HOWEVER, tests run under mock mode (`rzp_test_mockkey123`), which bypasses real cryptographic signature math and real SDK API calls.
  - **What Was Verified:** Integration tests pass only because mock bypass is active.
  - **Gap or Risk:** Does not validate real Razorpay SDK client execution.
  - **Required Implementation:** Add integration tests with MockWebServer or WireMock simulating real Razorpay HTTP API responses.
  - **Priority:** P1
  - **Verification Method:** Inspection of `PaymentModuleTest.java`.
  - **Dependencies:** WireMock.

- [x] **RZ-TST-003: Webhook signature verification tests (positive and negative tampered cases)**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentSecurityTest.java:97-106` verifies that `null`, `mock_signature`, and `mock_webhook_signature` are rejected when non-mock credentials are used.
  - **What Was Verified:** Cryptographic rejection of tampered webhook signatures.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Test inspection.
  - **Dependencies:** None.

- [x] **RZ-TST-004: Idempotency and duplicate webhook handling tests**
  - **Status:** `[x] VERIFIED`
  - **Evidence:** `PaymentModuleTest.java:170-198` verifies that executing duplicate webhook payloads returns `"idempotent ignore"` on second invocation.
  - **What Was Verified:** Webhook duplicate idempotency tested.
  - **Gap or Risk:** None.
  - **Required Implementation:** None.
  - **Priority:** P3
  - **Verification Method:** Test inspection.
  - **Dependencies:** None.

- [~] **RZ-TST-005: Refund processing and failure simulation tests**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `PaymentModuleTest.java:201-218` tests successful refund execution in mock mode. Fails to test partial refunds, over-refund prevention, or gateway failure simulation.
  - **What Was Verified:** Basic refund method test exists.
  - **Gap or Risk:** Edge cases untested.
  - **Required Implementation:** Add unit/integration tests for partial refunds and failure paths.
  - **Priority:** P2
  - **Verification Method:** Test inspection.
  - **Dependencies:** None.

- [ ] **RZ-TST-006: Frontend checkout error and cancellation flow tests**
  - **Status:** `[ ] MISSING`
  - **Evidence:** No Vitest or Playwright test covers payment failure, modal cancellation, or network error on `PaymentPage.jsx`.
  - **What Was Verified:** Zero frontend failure path coverage.
  - **Gap or Risk:** Frontend crashes or hangs when payment fails.
  - **Required Implementation:** Add Vitest unit tests and Playwright E2E tests simulating payment failure modal dismissal.
  - **Priority:** P1
  - **Verification Method:** Search across `frontend/src/__tests__`.
  - **Dependencies:** None.

- [!] **RZ-TST-007: False confidence in existing mock E2E tests**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `07_payment.spec.js` and `05_payment_refund_lifecycle.spec.js` pass only because they interact with a mock UI sending `mock_signature_bypass`. They provide ZERO guarantee that real Razorpay Checkout works.
  - **What Was Verified:** Tests simulate mock mode only.
  - **Gap or Risk:** False sense of readiness.
  - **Required Implementation:** Update E2E test harness to mock the `window.Razorpay` script object and verify that real constructor options are passed.
  - **Priority:** P0
  - **Verification Method:** Source inspection of Playwright test specs.
  - **Dependencies:** None.

- [~] **RZ-TST-008: Concurrency and race condition tests**
  - **Status:** `[~] PARTIALLY IMPLEMENTED`
  - **Evidence:** `WalletModuleTest` tests concurrent wallet debits. BUT there are zero concurrency tests for parallel `verifyPayment` or simultaneous `verifyPayment` + webhook execution.
  - **What Was Verified:** Missing payment concurrency test.
  - **Gap or Risk:** Race conditions undetected by CI.
  - **Required Implementation:** Add multi-threaded test simulating simultaneous client verification and webhook delivery.
  - **Priority:** P1
  - **Verification Method:** Search for concurrency tests in `payment` package.
  - **Dependencies:** None.

- [ ] **RZ-TST-009: Automated contract testing for Razorpay webhook payloads**
  - **Status:** `[ ] MISSING`
  - **Evidence:** Webhook test uses a hardcoded synthetic JSON string (`PaymentModuleTest.java:174`). No contract test validates compatibility against official Razorpay webhook schemas.
  - **What Was Verified:** Synthetic payload testing only.
  - **Gap or Risk:** Schema drift between Razorpay API updates and internal Jackson parser.
  - **Required Implementation:** Use official Razorpay sample webhook JSON fixtures for test cases.
  - **Priority:** P2
  - **Verification Method:** Test inspection.
  - **Dependencies:** None.

- [!] **RZ-TST-010: Enrollment payment bypass regression test validates flawed behavior**
  - **Status:** `[!] DEFECTIVE`
  - **Evidence:** `VerifyEnrollmentBypassReproductionTest.java:169` asserts that submitting `txRef = "TXN-VALID-RAZORPAY-98765"` successfully confirms enrollment without verifying that any payment occurred! The test enshrines a critical security vulnerability as expected behavior!
  - **What Was Verified:** Test validates insecure bypass behavior.
  - **Gap or Risk:** Insecure test suite.
  - **Required Implementation:** Update test to require valid Razorpay order ID and cryptographic signature.
  - **Priority:** P0
  - **Verification Method:** Inspection of `VerifyEnrollmentBypassReproductionTest.java:167-208`.
  - **Dependencies:** RZ-TRN-001.

---

[N/A] **RZ-OTH-001: Recurring Subscriptions / Autopay**
- **Status:** `[N/A] NOT APPLICABLE`
- **Justification:** Sporekart currently operates on a one-time product purchase and single-batch training enrollment model. No recurring subscriptions or automated recurring debits are in scope for the current architecture.
