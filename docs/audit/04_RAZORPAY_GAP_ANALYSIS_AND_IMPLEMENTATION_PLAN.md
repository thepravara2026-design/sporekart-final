# Sporekart — Razorpay Gap Analysis & Implementation Plan
**Phases 4 & 5 Deliverables — Engineering Gap Matrix, Risk Assessment & Prioritized Roadmap**

- **Date:** October 13, 2026
- **Auditors:** Principal Software Architect, Senior Payment Systems Engineer, Application Security Engineer, Database Architect, QA Automation Lead
- **Scope:** Root-cause gap analysis of all checklist findings and phased implementation roadmap to achieve production-grade, FAANG-level Razorpay integration.

---

# PART I — GAP ANALYSIS & RISK MATRIX

## 1. Executive Gap Summary

The audit discovered **50 Defective `[!]`**, **33 Partially Implemented `[~]`**, and **23 Missing `[ ]`** items out of 147 checklist requirements.

While basic foundation elements exist (Spring Boot service abstraction, PostgreSQL tables, Flyway migrations, and basic HMAC verification math), the system currently operates in a **fragile simulated mock state with severe security vulnerabilities, broken commercial workflows, and PCI-DSS compliance violations**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEVERITY DISTRIBUTION OF FINDINGS                    │
├────────────────────────────────────────────────────────────────────────┤
│  P0 (Blocker / Critical Security & Financial Vulnerability):  18 items │
│  P1 (High / Architecture, Data Integrity & Flow Defect):      36 items │
│  P2 (Medium / Operational, Edge Case & Reliability Gap):       34 items │
│  P3 (Low / Code Cleanup, Typings & Best Practice):             18 items │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Critical P0 Vulnerabilities & Systemic Defects

### Gap 1 (P0): Free Masterclass Training Enrollment Bypass
- **Location:** `PaymentService.java:377-427` (`verifyEnrollmentPayment`) and `TrainingController.java:81-88`.
- **Root Cause:** Training enrollments do NOT generate Razorpay gateway orders. The verification endpoint accepts any arbitrary string `transactionReference` from the client and immediately transitions the enrollment to `CONFIRMED` and `CAPTURED`.
- **Business Impact:** Any customer can enroll in courses valued up to ₹4,999 for free by passing an arbitrary dummy string.
- **Compliance / Financial Risk:** 100% loss of commercial training revenue; zero transactional backing.

### Gap 2 (P0): Arbitrary Wallet Balance Inflation via Client Query Param
- **Location:** `WalletController.java:116-150` (`verifyAddMoney`).
- **Root Cause:** When adding money to wallet, no server-side intent record is stored. The verification endpoint takes `amount` directly from `@RequestParam BigDecimal amount` in the client request.
- **Business Impact:** A malicious user can pay ₹1 on Razorpay, pass `?amount=100000`, and have ₹100,000 credited to their Sporekart Wallet.
- **Compliance / Financial Risk:** Unlimited theft of merchant funds; fraudulent withdrawal to bank accounts.

### Gap 3 (P0): PCI-DSS SAQ A Violation on Primary Checkout Screen
- **Location:** `PaymentPage.jsx:340-375`.
- **Root Cause:** The application does not load `https://checkout.razorpay.com/v1/checkout.js`. Instead, it renders raw HTML `<input>` fields collecting credit card number, expiration date, and CVV on the merchant domain.
- **Business Impact:** Gross violation of PCI-DSS SAQ A compliance. Collecting card credentials on an uncertified merchant origin exposes the merchant to catastrophic regulatory fines and processor suspension.
- **Compliance / Financial Risk:** Payment processor termination; PCI-DSS Level 1 audit requirement.

### Gap 4 (P0): Silent Production Mock Bypass on Missing Credentials
- **Location:** `RazorpayPaymentGateway.java:59,85,124`.
- **Root Cause:** `isMockMode()` evaluates to `true` if `keyId == null || keyId.trim().isEmpty()`. When `isMockMode()` is active, `verifySignature` and `verifyWebhookSignature` unconditionally return `true`.
- **Business Impact:** If a production container is deployed without `RAZORPAY_KEY_ID`, the server boots silently in bypass mode where ANY payment signature is accepted as valid, allowing free purchases of all physical products.
- **Compliance / Financial Risk:** Catastrophic free-checkout loophole in production.

### Gap 5 (P0): Broken Split-Payment Flow (Orphaned Deductions & Crash)
- **Location:** `WalletController.java:164-216` (`processCheckoutWalletPay`).
- **Root Cause:**
  1. `WalletController` calls `paymentGateway.createPaymentOrder` directly without saving a `Payment` entity. When the customer verifies the remaining gateway amount, `paymentRepository.findByRazorpayOrderId` returns empty and crashes.
  2. Wallet funds are deducted immediately before gateway checkout. If the gateway payment fails or is abandoned, the wallet funds are permanently lost.
- **Business Impact:** Split-payment checkout is 100% broken; customer funds are lost on abandoned checkout.
- **Compliance / Financial Risk:** Severe customer disputes, chargebacks, and legal liability.

### Gap 6 (P0): Double Wallet Credit Bug on Refund
- **Location:** `PaymentService.java:274,288` and `OrderService.java:409`.
- **Root Cause:** If `PaymentService.refundPayment` is executed, line 274 credits the customer's wallet. Line 288 then calls `orderService.updateOrderStatus(..., REFUNDED)`, which ALSO credits the wallet on line 409.
- **Business Impact:** Customers receive double the refund amount into their wallet.
- **Compliance / Financial Risk:** Direct financial loss.

### Gap 7 (P0): Verification Endpoint Crash on Duplicate Requests
- **Location:** `PaymentService.java:119` and `InventoryRecord.java:80`.
- **Root Cause:** `verifyPayment` lacks an idempotency check. When a client double-clicks or retries verification, `confirmOrderInventory` is invoked a second time. In `InventoryRecord.confirmSold`, line 80 throws `IllegalArgumentException` because `reservedQuantity` has already been reduced to 0.
- **Business Impact:** Legitimate customers who pay successfully see an error screen instead of order confirmation if their browser retries.
- **Compliance / Financial Risk:** High customer friction, false complaints of failed payments.

### Gap 8 (P0): Permanent Inventory Depletion on Abandoned Checkouts
- **Location:** `OrderService.java:161` and `InventoryService.java:45`.
- **Root Cause:** Inventory is reserved atomically when the order is created. There is no background scheduler or expiration job to release reserved inventory when checkout is abandoned.
- **Business Impact:** Reserved inventory remains locked forever; store catalog shows products as out of stock when they have not been purchased.
- **Compliance / Financial Risk:** Denial of inventory; commercial paralysis.

---

## 3. High-Priority P1 Architecture & Integrity Defects

| Gap ID | Defect Description | Impacted Components | Risk & Failure Mode |
|---|---|---|---|
| **GAP-P1-01** | Missing Database Unique Constraints | `payments.razorpay_order_id`, `payments.razorpay_payment_id`, `orders.razorpay_order_id` | Duplicate payment records can be inserted; `findByRazorpayOrderId` crashes with `NonUniqueResultException`. |
| **GAP-P1-02** | Absence of Optimistic/Pessimistic Locking | `Order.java`, `Payment.java`, `OrderRepository` | Race conditions between simultaneous browser callback and Razorpay webhook. |
| **GAP-P1-03** | Guest Order Refunds Lost Permanently | `OrderService.java:406` | Cancelled guest orders cannot be credited to a wallet and have no gateway refund mechanism. Funds are trapped. |
| **GAP-P1-04** | Webhooks Overwriting Cancelled Orders to PAID | `PaymentService.java:210` | Late webhooks revive cancelled orders without verifying inventory availability. |
| **GAP-P1-05** | Gateway Refunds Completely Unwired | `AdminOrderController.java`, `PaymentService.java` | Zero ability for administrators to initiate refunds back to original credit card/UPI sources. |
| **GAP-P1-06** | Cumulative Refund Over-Payment | `PaymentService.java:251` | Partial refunds check against original order total each time instead of remaining balance. Cumulative refunds can exceed order value. |
| **GAP-P1-07** | Missing Webhook Handlers | `PaymentService.processWebhook` | `refund.processed`, `refund.failed`, and `payment.authorized` events are completely ignored. |
| **GAP-P1-08** | Insecure IDOR on Payment Endpoints | `SecurityConfig.java:85`, `PaymentController.java` | `/payment/initiate` and `/payment/verify` are `permitAll()` without checking if caller owns the order. |

---

# PART II — PRIORITIZED IMPLEMENTATION ROADMAP

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     FAANG-GRADE IMPLEMENTATION ROADMAP                             │
├───────────────────────────────────────────────────────────────────────────────────┤
│  PHASE 1: Security, Vulnerability & Compliance Hotfixes (P0)          [Sprint 1]  │
│  PHASE 2: Razorpay Hosted Checkout SDK & Webhook Hardening (P0/P1)     [Sprint 1-2]│
│  PHASE 3: State Machine, Concurrency & Inventory Release TTL (P1)     [Sprint 2]  │
│  PHASE 4: Multi-Tender Split-Payment & Real Gateway Refunds (P1)      [Sprint 3]  │
│  PHASE 5: QA Automation, Contract Tests & Production Readiness Gate   [Sprint 3]  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: Security, Vulnerability & Compliance Hotfixes (P0)
*Target: Eliminate all financial loss loopholes, authorization bypasses, and PCI-DSS violations.*

### 1.1 Secure Training Enrollment Payment Flow
- **Task 1.1.1:** Update `PaymentService.initiatePayment` to accept target type (`ORDER` or `ENROLLMENT`).
- **Task 1.1.2:** For training enrollments, calculate fee authoritatively via `TrainingService`, create a real Razorpay gateway order with `receipt = "ENROLL-" + enrollment.getId()`, and persist a `Payment` entity.
- **Task 1.1.3:** Rewrite `PaymentService.verifyEnrollmentPayment` to mandate valid `razorpayOrderId`, `razorpayPaymentId`, and `razorpaySignature`. Verify HMAC-SHA256 signature against `keySecret`.
- **Task 1.1.4:** Remove arbitrary string `transactionReference` bypass from `TrainingController.confirmPayment`.

### 1.2 Eliminate Arbitrary Wallet Balance Top-up Injection
- **Task 1.2.1:** Create `wallet_topup_intents` Flyway migration (`V38__create_wallet_topup_intents.sql`) storing `id`, `user_id`, `amount_inr`, `razorpay_order_id`, `status`, `created_at`.
- **Task 1.2.2:** In `WalletController.addMoney`, insert intent row before creating Razorpay order.
- **Task 1.2.3:** In `WalletController.verifyAddMoney`, remove `@RequestParam amount`. Fetch expected amount authoritatively from `wallet_topup_intents` by `razorpayOrderId`. Verify paid amount matches with Razorpay API before crediting wallet.

### 1.3 Fix Production Mock Bypass & Separate Environments
- **Task 1.3.1:** Introduce explicit configuration: `sporekart.razorpay.mode: ${RAZORPAY_MODE:LIVE}`.
- **Task 1.3.2:** Split `PaymentGateway` into two distinct beans:
  - `RazorpayPaymentGateway` annotated with `@Profile("!test & !mock")` or conditioned on `mode == LIVE`. Contains ZERO mock bypass code.
  - `MockPaymentGateway` annotated with `@Profile({"test", "dev-mock"})`.
- **Task 1.3.3:** Add `@PostConstruct` startup validator: If running under `prod` profile, assert that `keyId` is non-empty and starts with `rzp_live_`, and `webhookSecret` is non-empty; fail application boot immediately if invalid.

### 1.4 PCI-DSS Compliance: Remove Card Inputs from Frontend
- **Task 1.4.1:** Purge all card number, expiry, CVV, and UPI ID input elements from `frontend/src/pages/PaymentPage.jsx`.
- **Task 1.4.2:** Ensure zero credit card data ever touches Sporekart frontend memory or backend servers.

---

## PHASE 2: Razorpay Hosted Checkout SDK & Webhook Hardening (P0/P1)
*Target: Seamless customer checkout experience and robust asynchronous reconciliation.*

### 2.1 Frontend Razorpay Checkout SDK Integration
- **Task 2.1.1:** Add dynamic loader utility `loadRazorpayCheckoutScript()` in `frontend/src/utils/payment.js` loading `https://checkout.razorpay.com/v1/checkout.js`.
- **Task 2.1.2:** In `PaymentPage.jsx`, initialize `new window.Razorpay(options)` with:
  ```javascript
  const options = {
    key: summary.razorpayKeyId,
    amount: summary.amountInr * 100,
    currency: "INR",
    name: "Sporekart Agritech",
    description: summary.title,
    order_id: summary.razorpayOrderId,
    handler: async function (response) {
      await paymentApi.verifyPayment(
        summary.id,
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature
      );
    },
    prefill: {
      name: summary.customerName,
      contact: summary.customerPhone,
      email: summary.customerEmail
    },
    theme: { color: "#1B4D3E" }
  };
  ```
- **Task 2.1.3:** Handle checkout modal dismissal callback (`modal.ondismiss`) to notify customer safely without leaving hung UI state.

### 2.2 Authoritative Verification & Gateway Status Check
- **Task 2.2.1:** In `PaymentService.verifyPayment`, after HMAC verification, execute server-to-server check:
  `com.razorpay.Payment rzpPayment = razorpayClient.payments.fetch(request.getRazorpayPaymentId())`.
- **Task 2.2.2:** Verify that `rzpPayment.get("status").equals("captured")`, `rzpPayment.get("amount") == expectedAmountPaise`, and `rzpPayment.get("currency").equals("INR")`.
- **Task 2.2.3:** Add caller ownership check: ensure authenticated user or session ID matches order owner before processing verification.

### 2.3 Webhook Infrastructure Expansion
- **Task 2.3.1:** Add support for `refund.processed` and `refund.failed` in `PaymentService.processWebhook`.
- **Task 2.3.2:** Add support for training enrollment payments in `PaymentService.processWebhook` when `payment.entity.order_id` belongs to an enrollment.
- **Task 2.3.3:** Use constant-time comparison `MessageDigest.isEqual` for HMAC comparisons.

---

## PHASE 3: State Machine, Concurrency & Inventory Release TTL (P1)
*Target: Guarantee transactional consistency, eliminate race conditions, and fix inventory leaks.*

### 3.1 Idempotency & Concurrency Hardening
- **Task 3.1.1:** In `PaymentService.verifyPayment`, add idempotency guard:
  ```java
  if (payment.getStatus() == PaymentStatus.CAPTURED) {
      log.info("Payment {} already captured. Returning idempotent success.", payment.getId());
      return PaymentDtos.VerifyPaymentResponse.builder().isSuccess(true).message("Payment already verified").orderId(targetOrderId).build();
  }
  ```
- **Task 3.1.2:** Add `@Version private Long version;` to `Order.java` and `Payment.java` for optimistic locking.
- **Task 3.1.3:** Add database migration `V39__add_unique_constraints_to_payments.sql`:
  - `ALTER TABLE payments ADD CONSTRAINT uq_payments_razorpay_order_id UNIQUE (razorpay_order_id);`
  - `ALTER TABLE payments ADD CONSTRAINT uq_payments_razorpay_payment_id UNIQUE (razorpay_payment_id);`
  - `ALTER TABLE orders ADD CONSTRAINT uq_orders_razorpay_order_id UNIQUE (razorpay_order_id);`

### 3.2 Automated Abandoned Order Expiration & Stock Release
- **Task 3.2.1:** Implement `@Scheduled(fixedRate = 60000)` job in `OrderExpirationService.java`.
- **Task 3.2.2:** Query orders where `status = PENDING_PAYMENT` and `createdAt < now() - 30 minutes`.
- **Task 3.2.3:** Atomically transition status to `CANCELLED`, log order event `EXPIRED_UNPAID_TIMEOUT`, and call `inventoryService.releaseReservation(variantId, quantity, orderNumber, "Order checkout expired", "SYSTEM_EXPOSURE")`.

---

## PHASE 4: Multi-Tender Split-Payment & Real Gateway Refunds (P1)
*Target: Seamless wallet + gateway hybrid payments and full refund operations.*

### 4.1 Two-Phase Wallet Split Checkout
- **Task 4.1.1:** Add `hold_balance` column to `wallets` table.
- **Task 4.1.2:** When customer selects partial wallet payment, place wallet funds on `HOLD` (reducing available balance, but not committing ledger debit).
- **Task 4.1.3:** Authoritatively calculate `remainingGatewayAmount = order.totalAmountInr - walletHoldAmount` on server.
- **Task 4.1.4:** Generate Razorpay order for `remainingGatewayAmount` and insert `Payment` entity.
- **Task 4.1.5:** When gateway payment succeeds, atomically commit wallet hold to permanent `DEBIT`. If gateway payment fails or expires, release wallet hold back to available balance.

### 4.2 Gateway Refund Operations & Dedication Table
- **Task 4.2.1:** Add Flyway migration `V40__create_refunds_table.sql` (`id`, `order_id`, `payment_id`, `gateway_refund_id`, `amount_inr`, `status`, `reason`, `created_at`).
- **Task 4.2.2:** Remove duplicate wallet credit bug from `PaymentService.refundPayment`.
- **Task 4.2.3:** In `OrderService.updateOrderStatus`, add support for guest order refunds by calling gateway refund directly when `userId == null`.
- **Task 4.2.4:** Expose `POST /api/v1/admin/payments/refund` in `AdminPaymentController` with `hasRole('ADMIN')` guard.

---

## PHASE 5: QA Automation, Contract Tests & Production Gate (P1/P2)
*Target: 100% automated test verification without relying on mock bypasses.*

### 5.1 WireMock Integration Test Suite
- **Task 5.1.1:** Add `wiremock-standalone` to `backend/pom.xml`.
- **Task 5.1.2:** Create `RazorpayGatewayWireMockTest.java` verifying real HTTP communication with Razorpay API stubs:
  - Test order creation HTTP 200 payload parsing.
  - Test signature verification against WireMock endpoint.
  - Test payment fetch validation (`payments.fetch`).
  - Test gateway 504 gateway timeout handling and retry.

### 5.2 Concurrency & Race Condition Verification
- **Task 5.2.1:** Implement `PaymentConcurrencyTest.java` running 20 concurrent threads attempting simultaneous `/payment/verify` calls for the same order. Verify that exactly ONE thread executes inventory confirmation and 19 receive idempotent success.

### 5.3 Playwright E2E Mock Gateway Injection
- **Task 5.3.1:** In Playwright test setup, stub `window.Razorpay` to simulate real modal interactions:
  - Simulate successful user payment modal callback.
  - Simulate user clicking modal close button (`modal.ondismiss`).
  - Verify that UI updates correctly on both branches.

### 5.4 Production Readiness Gate
- **Gate Criteria:**
  1. Zero P0 vulnerabilities open.
  2. 100% of integration tests pass without mock bypass active.
  3. Live Razorpay Test Mode keys (`rzp_test_...`) successfully execute end-to-end checkout on staging.
  4. Webhook endpoint verified via Razorpay Webhook simulator with real HMAC verification.

---

# PART III — ESTIMATED EFFORT & RESOURCE ALLOCATION

| Phase | Description | Estimated Engineering Effort | Risk Level |
|---|---|:---:|:---:|
| **Phase 1** | Security, Vulnerability & Compliance Hotfixes | 2-3 Days | Critical |
| **Phase 2** | Razorpay Hosted Checkout SDK & Webhook Hardening | 2-3 Days | High |
| **Phase 3** | State Machine, Concurrency & Inventory Release TTL | 2 Days | Medium |
| **Phase 4** | Multi-Tender Split-Payment & Real Gateway Refunds | 3 Days | Medium |
| **Phase 5** | QA Automation, Contract Tests & Readiness Gate | 2 Days | Low |
| **TOTAL** | **Full Production Readiness Hardening** | **11-13 Days** | **High ROI** |
