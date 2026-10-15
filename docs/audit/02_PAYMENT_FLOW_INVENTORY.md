# Sporekart — Payment Business-Flow Inventory
**Phase 2 Deliverable — Comprehensive Financial & Payment State-Transition Audit**

- **Date:** October 13, 2026
- **Auditors:** Principal Software Architect, Senior Payment Systems Engineer, Application Security Engineer, Database Architect, QA Automation Lead
- **Scope:** Complete analysis of all 25 financial, transactional, and status-mutating flows across Sporekart.

---

## Master Flow Matrix & Readiness Assessment

| Flow ID | Business Flow Description | Frontend Component | API Endpoint | Primary Backend Service | Current Implementation State | Gateway Dependency |
|---|---|---|---|---|---|---|
| **FL-01** | Product Order Checkout | `CheckoutPage.jsx` | `POST /orders` | `OrderService.createOrderFromCart` | Functional (Backend Authoritative) | None |
| **FL-02** | Payment Initiation | `PaymentPage.jsx` | `POST /payment/initiate` | `PaymentService.initiatePayment` | Functional (Generates Intent & Payment) | Razorpay Orders API |
| **FL-03** | Razorpay Order Creation | `PaymentPage.jsx` | `POST /payment/initiate` | `RazorpayPaymentGateway.createPaymentOrder` | Functional (Mock fallback in dev) | `client.orders.create` |
| **FL-04** | Payment Authorization & Capture | `PaymentPage.jsx` | Client Modal / Gateway | Razorpay Hosted Modal | **DEFECTIVE / MISSING:** No SDK iframe loaded | Razorpay Checkout SDK |
| **FL-05** | Payment Success & Verification | `PaymentPage.jsx` | `POST /payment/verify` | `PaymentService.verifyPayment` | Defective (Bypasses with mock sig) | HMAC SHA256 Signature |
| **FL-06** | Checkout Abandonment & Timeout | `CheckoutPage.jsx` / None | None | None | **DEFECTIVE:** Stock reserved forever | None |
| **FL-07** | Payment Retries | `DashboardPage.jsx` | `POST /payment/initiate` | `PaymentService.initiatePayment` | Defective (Creates duplicate orders) | Razorpay Orders API |
| **FL-08** | Duplicate Payment Attempts | Browser double-click | `POST /payment/verify` | `PaymentService.verifyPayment` | **DEFECTIVE:** Crashes with inventory error | HMAC Signature |
| **FL-09** | Customer Order Cancellation | `DashboardPage.jsx` | `POST /orders/{id}/cancel` | `OrderService.updateOrderStatus` | Partial (Refunds to wallet only) | None |
| **FL-10** | Admin Order Cancellation | `AdminDashboardPage.jsx` | `PUT /admin/orders/{id}/status` | `OrderService.updateOrderStatus` | Partial (Refunds to wallet only) | None |
| **FL-11** | Full Gateway Refund | `AdminDashboardPage.jsx` | Unwired / None | `PaymentService.refundPayment` | **DEFECTIVE:** Method never called by any API | `client.payments.refund` |
| **FL-12** | Partial Gateway Refund | None | Unwired / None | `PaymentService.refundPayment` | Defective (Allows over-refunding) | `client.payments.refund` |
| **FL-13** | Refund Failure and Retry | None | None | None | **MISSING:** Zero retry or dead-letter queue | None |
| **FL-14** | Wallet Top-Up (Add Money) | `DashboardPage.jsx` | `POST /wallet/verify-add-money` | `WalletController.verifyAddMoney` | **CRITICAL VULNERABILITY:** Takes amount from query param | Gateway Verification |
| **FL-15** | Wallet-Funded Checkout (100%) | `PaymentPage.jsx` | `POST /wallet/checkout-pay` | `WalletController.processCheckoutWalletPay` | Defective (Order not marked PAID in DB) | None |
| **FL-16** | Split Wallet + Gateway Checkout | `PaymentPage.jsx` | `POST /wallet/checkout-pay` | `WalletController.processCheckoutWalletPay` | **DEFECTIVE:** No Payment entity created | Split Calculation |
| **FL-17** | Wallet Withdrawals (Bank) | `DashboardPage.jsx` | `POST /wallet/withdraw` | `WalletService.requestWithdrawal` | Functional (Pessimistic lock) | Manual Bank Payout |
| **FL-18** | Wallet Refunds and Reversals | Admin / Order Cancel | `POST /orders/{id}/cancel` | `WalletService.processRefundToWallet` | Functional (Double-entry ledger) | None |
| **FL-19** | Training Batch Enrolment | `CourseDetailPage.jsx` | `POST /training/enroll` | `TrainingService.enrollCustomer` | Functional (`PENDING_PAYMENT`) | None |
| **FL-20** | Training Enrolment Verification | `PaymentPage.jsx` | `POST /payment/verify-enrollment` | `PaymentService.verifyEnrollmentPayment` | **CRITICAL VULNERABILITY:** Arbitrary reference bypass | None |
| **FL-21** | Delayed Payment Callbacks | Webhook delivery | `POST /payment/webhook` | `PaymentService.processWebhook` | Partial (`payment.captured` supported) | Webhook Engine |
| **FL-22** | Duplicate & Out-of-Order Webhooks| Webhook retries | `POST /payment/webhook` | `PaymentService.processWebhook` | Partial (Duplicate checked, sequencing missing)| Webhook Engine |
| **FL-23** | Browser Closure After Payment | Customer closes tab | Gateway Webhook | `PaymentService.processWebhook` | Functional via webhook synchronization | Webhook Engine |
| **FL-24** | Network Failure in Verification | Browser network drop | `POST /payment/verify` | None | Defective (No automatic recovery) | None |
| **FL-25** | Payment Reconciliation & Recovery| Admin / Scheduled | None | None | **MISSING:** Zero reconciliation job | Razorpay Settlement API|

---

## Detailed Audit of Every Business Flow

---

### Flow 1: Product Order Checkout
- **Entry Point:** Customer clicks "Checkout" in Cart Drawer or Cart Page.
- **Frontend Component:** `frontend/src/pages/CheckoutPage.jsx:161-208` (`handlePlaceOrder`).
- **API Endpoint:** `POST /api/v1/orders` (Headers: `Idempotency-Key: chk_...`, `X-Session-ID: sess_...`, `Authorization: Bearer ...` if logged in).
- **Backend Controller & Service:** `OrderController.createOrder` $\rightarrow$ `OrderService.createOrderFromCart`.
- **Database Entities & Transactions:**
  - `@Transactional` scope across `orders`, `order_items`, `inventory_records`, `inventory_audit_logs`, `order_events`, `cart_items`.
  - Atomically locks `inventory_records` via `findByVariantIdForUpdate(variantId)` and decrements `availableQuantity`, increments `reservedQuantity`.
  - Clears `cart_items` for user/session.
- **Gateway Operations:** None at this step.
- **State Transitions:** Order is created in `OrderStatus.PENDING_PAYMENT`.
- **Notifications & Side Effects:** Publishes `CheckoutStartedEvent` and `OrderCreatedEvent`.
- **Error-Handling Behavior:** Rejects empty cart, inactive products, or insufficient stock. Returns HTTP 400/409 with standardized error response.
- **Tests Available:** `PaymentModuleTest.java:103-132`, `07_payment.spec.js`, `fe-3.test.jsx`.
- **Missing Prerequisites:** Cart is wiped before payment authorization. If user abandons payment, cart items cannot be restored without re-adding.

---

### Flow 2: Payment Initiation
- **Entry Point:** Customer arrives on Payment Page (`/payment?type=order&id={orderId}`).
- **Frontend Component:** `frontend/src/pages/PaymentPage.jsx:136` (triggered during payment process).
- **API Endpoint:** `POST /api/v1/payment/initiate` (Payload: `{ "orderId": "..." }`).
- **Backend Controller & Service:** `PaymentController.initiatePayment` $\rightarrow$ `PaymentService.initiatePayment`.
- **Database Entities & Transactions:**
  - `@Transactional` scope.
  - Queries `Order` by ID.
  - Inserts new row into `payments` table with `status = PaymentStatus.INITIATED`, `amount_inr = order.totalAmountInr`, `currency = 'INR'`.
  - Inserts `payment_events` record (`PAYMENT_INITIATED`).
  - Updates `orders.razorpay_order_id`.
- **Gateway Operations:** Invokes `paymentGateway.createPaymentOrder(orderId, orderNumber, totalAmountInr)`.
- **State Transitions:** Order remains `PENDING_PAYMENT`. Payment is `INITIATED`.
- **Notifications & Side Effects:** None.
- **Error-Handling Behavior:** If order not found, returns HTTP 404 (`ResourceNotFoundException`).
- **Tests Available:** `PaymentModuleTest.testRazorpayOrderCreation`, `PaymentServiceUnitTest.PAY_1_initiate_payment_success`.
- **Missing Prerequisites / Defects:**
  1. `/payment/initiate` is `permitAll()` in `SecurityConfig.java:85` and performs **zero caller ownership verification**. Any anonymous user can initiate payments against any other user's order ID.
  2. Repeated calls create multiple `Payment` rows for the same `orderId` without checking if an active intent exists.

---

### Flow 3: Razorpay Order Creation
- **Entry Point:** Backend server execution inside `PaymentService.initiatePayment`.
- **Frontend Component:** Indirectly triggered via `PaymentPage.jsx`.
- **API Endpoint:** Outbound HTTP REST to Razorpay: `POST https://api.razorpay.com/v1/orders`.
- **Backend Controller & Service:** `RazorpayPaymentGateway.createPaymentOrder`.
- **Database Entities & Transactions:** None directly inside the gateway adapter.
- **Gateway Operations:**
  - Instantiates `com.razorpay.RazorpayClient(keyId, keySecret)`.
  - Constructs JSON: `{ "amount": amountInr * 100, "currency": "INR", "receipt": orderNumber }`.
  - Calls `client.orders.create(orderRequest)`. Returns `order_...` ID.
- **State Transitions:** N/A.
- **Notifications & Side Effects:** None.
- **Error-Handling Behavior:** Catches `RazorpayException` and re-throws `RuntimeException`. In mock mode, generates `order_mock_...`.
- **Tests Available:** `PaymentModuleTest.java:135`.
- **Missing Prerequisites / Defects:**
  1. No connection or read timeouts configured on the HTTP client (potential thread starvation during gateway outage).
  2. Uses `amountInr.multiply(new BigDecimal("100")).longValue()` without explicit scale checking.

---

### Flow 4: Payment Authorization and Capture (Hosted Checkout)
- **Entry Point:** Customer interacts with payment options on Payment Page.
- **Frontend Component:** `frontend/src/pages/PaymentPage.jsx`.
- **API Endpoint:** Should be Razorpay Hosted Checkout iframe / modal.
- **Backend Controller & Service:** N/A (Client-to-Gateway interaction).
- **Database Entities & Transactions:** None.
- **Gateway Operations:** Should open `new window.Razorpay(options).open()`.
- **State Transitions:** N/A.
- **Notifications & Side Effects:** N/A.
- **Error-Handling Behavior:** N/A.
- **Tests Available:** None.
- **Missing Prerequisites / Defects:**
  - **CRITICAL DEFECT:** Razorpay Checkout script (`https://checkout.razorpay.com/v1/checkout.js`) is completely missing from `index.html` and `PaymentPage.jsx`.
  - `PaymentPage.jsx` renders custom text inputs for `cardNumber`, `cardExpiry`, `cardCvv`, and `upiId`. This mock implementation violates standard Razorpay SAQ-A compliance and does not connect to Razorpay's checkout modal.

---

### Flow 5: Payment Success and Verification
- **Entry Point:** Gateway checkout callback on client.
- **Frontend Component:** `frontend/src/pages/PaymentPage.jsx:140-156` (`paymentApi.verifyPayment`).
- **API Endpoint:** `POST /api/v1/payment/verify` (Payload: `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }`).
- **Backend Controller & Service:** `PaymentController.verifyPayment` $\rightarrow$ `PaymentService.verifyPayment`.
- **Database Entities & Transactions:**
  - `@Transactional(isolation = READ_COMMITTED)`.
  - Fetches `Payment` by `razorpayOrderId`.
  - Validates `payment.getOrderId().equals(request.getOrderId())`.
  - Updates `payment.status = PaymentStatus.CAPTURED`, `payment.razorpayPaymentId`, `payment.razorpaySignature`.
  - Inserts `payment_events` record (`PAYMENT_CAPTURED_SIGNATURE`).
  - Calls `orderService.setRazorpayPaymentId(orderId, paymentId)`.
  - Calls `orderService.updateOrderStatus(orderId, OrderStatus.PAID, ...)`.
  - Calls `orderService.confirmOrderInventory(orderId)` which calls `inventoryService.confirmPurchase(variantId, qty)` (decrements `reservedQuantity`, increments `soldQuantity`).
- **Gateway Operations:** Computes `HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, keySecret)` via `Utils.verifyPaymentSignature`.
- **State Transitions:** Order transitions from `PENDING_PAYMENT` $\rightarrow$ `PAID`. Payment transitions from `INITIATED` $\rightarrow$ `CAPTURED`.
- **Notifications & Side Effects:** Publishes `PaymentCapturedEvent`.
- **Error-Handling Behavior:**
  - If signature invalid: sets `payment.status = FAILED`, returns `isSuccess: false`. Order remains `PENDING_PAYMENT`.
  - If order mismatch: throws `IllegalArgumentException("Payment verification failed: Mismatched order reference")`.
- **Tests Available:** `PaymentModuleTest.testPaymentSignatureVerificationAndOrderCapture`, `PaymentSecurityTest.testMismatchedOrderIdPaymentVerificationIsRejected`, `PaymentServiceUnitTest.PAY_3_verify_payment_success`.
- **Missing Prerequisites / Defects:**
  1. In dev/mock mode (`keyId` empty or `rzp_test_mock`), `RazorpayPaymentGateway.verifySignature` returns `true` unconditionally (line 60), bypassing signature validation.
  2. The endpoint is `permitAll()` without checking if caller owns the order.
  3. Does not verify that payment status is actually `captured` on Razorpay REST API (`client.payments.fetch`).
  4. Non-idempotent: calling verification twice invokes `inventoryService.confirmPurchase` twice, which crashes because `reservedQuantity` has already been cleared.

---

### Flow 6: Checkout Abandonment and Timeout
- **Entry Point:** Customer closes browser, navigates away, or lets payment gateway modal time out.
- **Frontend Component:** `CheckoutPage.jsx` / `PaymentPage.jsx`.
- **API Endpoint:** None.
- **Backend Controller & Service:** None.
- **Database Entities & Transactions:** None.
- **Gateway Operations:** None.
- **State Transitions:** None. Order remains stuck in `PENDING_PAYMENT`.
- **Notifications & Side Effects:** None.
- **Error-Handling Behavior:** Zero handling.
- **Tests Available:** None.
- **Missing Prerequisites / Defects:**
  - **CRITICAL ARCHITECTURAL LEAK:** `InventoryService.reserveInventory` was called when the order was created. There is no background scheduler, cron job, or TTL mechanism to cancel abandoned orders and call `InventoryService.releaseReservation`. The reserved stock remains permanently locked, preventing other customers from purchasing it.

---

### Flow 7: Payment Retries
- **Entry Point:** Customer fails first attempt (e.g. insufficient bank balance) and clicks "Retry Payment" or re-opens `/payment?type=order&id={id}` from Dashboard.
- **Frontend Component:** `DashboardPage.jsx` $\rightarrow$ `PaymentPage.jsx`.
- **API Endpoint:** `POST /api/v1/payment/initiate`.
- **Backend Controller & Service:** `PaymentService.initiatePayment`.
- **Database Entities & Transactions:** Inserts an additional row in `payments` with a new `razorpayOrderId`. Overwrites `orders.razorpay_order_id`.
- **Gateway Operations:** `client.orders.create` called again.
- **State Transitions:** Order stays `PENDING_PAYMENT`.
- **Notifications & Side Effects:** None.
- **Error-Handling Behavior:** Creates a new order on gateway.
- **Tests Available:** None specifically for retry flow.
- **Missing Prerequisites / Defects:**
  - The previous `Payment` record remains in `INITIATED` status indefinitely.
  - If the customer pays the *first* Razorpay order after a delayed webhook arrives, the backend finds the older `Payment` record and updates it, but the order's `razorpay_order_id` pointer may have been overwritten by the second attempt.

---

### Flow 8: Duplicate Payment Attempts (Race Condition)
- **Entry Point:** User double-clicks "Pay Securely" button or network duplicate submits `/payment/verify`.
- **Frontend Component:** `PaymentPage.jsx`.
- **API Endpoint:** `POST /api/v1/payment/verify`.
- **Backend Controller & Service:** `PaymentService.verifyPayment`.
- **Database Entities & Transactions:** Parallel `@Transactional` executions.
- **Gateway Operations:** Validates signature.
- **State Transitions:** First thread updates status to `PAID`. Second thread executes.
- **Notifications & Side Effects:** Second thread publishes duplicate `PaymentCapturedEvent`.
- **Error-Handling Behavior:**
  - **SYSTEM CRASH:** Second thread calls `orderService.confirmOrderInventory(targetOrderId)` $\rightarrow$ `inventoryService.confirmPurchase` $\rightarrow$ `record.confirmSold(quantity)`. Line 80 of `InventoryRecord.java` executes:
    `if (reservedQuantity < quantity) throw new IllegalArgumentException("Cannot confirm sold quantity exceeding reserved quantity");`
  - The second request crashes with HTTP 400/500 and fails instead of returning an idempotent success response!
- **Tests Available:** None.
- **Missing Prerequisites / Defects:**
  - Lack of idempotency guard in `verifyPayment` (`if (payment.getStatus() == PaymentStatus.CAPTURED) return cachedSuccess;`).
  - Lack of optimistic (`@Version`) or pessimistic (`PESSIMISTIC_WRITE`) lock on `Order` and `Payment`.

---

### Flow 9: Customer Order Cancellation
- **Entry Point:** Customer clicks "Cancel Order" on Dashboard Order card.
- **Frontend Component:** `DashboardPage.jsx` (`orderApi.cancelOrder`).
- **API Endpoint:** `POST /api/v1/orders/{id}/cancel?reason=...`.
- **Backend Controller & Service:** `OrderController.cancelOrder` $\rightarrow$ `OrderService.updateOrderStatus`.
- **Database Entities & Transactions:**
  - `@Transactional` scope.
  - Checks: If previous status was `PAID`, `CONFIRMED`, or `PROCESSING`, transitions status to `REFUNDED`.
  - Credits customer wallet: `walletService.processRefundToWallet(...)` with amount `order.totalAmountInr`.
  - Restocks inventory: If item was reserved or sold, restocks via `inventoryService.releaseCancelledOrder`.
- **Gateway Operations:** **NONE.** No gateway refund API call is made.
- **State Transitions:** `PAID` $\rightarrow$ `REFUNDED` (or `PENDING_PAYMENT` $\rightarrow$ `CANCELLED`).
- **Notifications & Side Effects:** Publishes notification event `WALLET_REFUND_CREDIT`.
- **Error-Handling Behavior:** If order is already `SHIPPED` or `DELIVERED`, cancellation is rejected with `IllegalStateException`.
- **Tests Available:** `04_order_cancellation_lifecycle.spec.js`.
- **Missing Prerequisites / Defects:**
  1. Does not initiate a Razorpay gateway refund (`paymentGateway.refund`). All refunds are strictly credited to the internal Sporekart Wallet.
  2. If the customer checked out as a guest (`order.userId == null`), the refund is completely lost! Line 406 of `OrderService.java` checks `if (order.getUserId() != null)` before crediting the wallet. For guest orders, the money is neither refunded to wallet nor refunded via gateway!

---

### Flow 10: Admin Order Cancellation
- **Entry Point:** Admin updates order status to `CANCELLED` or `REFUNDED` from Admin Console.
- **Frontend Component:** `AdminDashboardPage.jsx` (`adminApi.updateOrderStatus`).
- **API Endpoint:** `PUT /api/v1/admin/orders/{id}/status` (Payload: `{ "status": "CANCELLED", "reason": "..." }`).
- **Backend Controller & Service:** `AdminOrderController.updateOrderStatus` $\rightarrow$ `OrderService.updateOrderStatus`.
- **Database Entities & Transactions:** Same as Flow 9.
- **Gateway Operations:** None.
- **State Transitions:** Updates to `REFUNDED` (if previously paid) or `CANCELLED`.
- **Notifications & Side Effects:** Audited in `admin_audit_logs`. Wallet notification sent.
- **Error-Handling Behavior:** Rejects modification of immutable terminal states (`CANCELLED`, `REFUNDED`).
- **Tests Available:** `PaymentModuleTest.java:201-218`.
- **Missing Prerequisites / Defects:** Same as Flow 9. No gateway refund initiated.

---

### Flow 11: Full Gateway Refund
- **Entry Point:** *Hypothetical / Intended* — Admin initiates full gateway refund to original payment source (Razorpay).
- **Frontend Component:** None. No UI button exists in `AdminDashboardPage.jsx`.
- **API Endpoint:** None. No controller route exposes `PaymentService.refundPayment`.
- **Backend Controller & Service:** `PaymentService.refundPayment(orderId, amountInr, reason)` exists as dead/unwired service code.
- **Database Entities & Transactions:**
  - Calls `paymentGateway.refund(paymentId, amountInr, reason)`.
  - Sets `payment.status = PaymentStatus.REFUNDED`.
  - Logs `PaymentEvent` (`REFUND_PROCESSED`).
  - Calls `walletService.processRefundToWallet(...)` on line 274.
  - Calls `orderService.updateOrderStatus(orderId, OrderStatus.REFUNDED, ...)` on line 288.
- **Gateway Operations:** `client.payments.refund(paymentId, refundRequest)`.
- **State Transitions:** Payment $\rightarrow$ `REFUNDED`. Order $\rightarrow$ `REFUNDED`.
- **Notifications & Side Effects:** None directly from payment service.
- **Error-Handling Behavior:** If `order.razorpayPaymentId` is blank, throws `IllegalStateException`.
- **Tests Available:** `PaymentModuleTest.testRefundProcessing`.
- **Missing Prerequisites / Defects:**
  1. **DOUBLE REFUND DEFECT:** If `PaymentService.refundPayment` is called, line 274 credits the wallet. Then line 288 calls `orderService.updateOrderStatus(..., REFUNDED)`, which ALSO credits the wallet on line 409! The user receives a Razorpay refund AND a double wallet credit!
  2. No controller exposes this endpoint to admins.
  3. No dedicated `refunds` database table exists to store gateway refund IDs (`rfnd_...`), settlement timestamps, or gateway status.

---

### Flow 12: Partial Gateway Refund
- **Entry Point:** None. Unwired.
- **Frontend Component:** None.
- **API Endpoint:** None.
- **Backend Controller & Service:** `PaymentService.refundPayment`.
- **Database Entities & Transactions:** Checks `amountInr.compareTo(order.getTotalAmountInr()) <= 0`.
- **Gateway Operations:** Passes partial amount in paise to `client.payments.refund`.
- **State Transitions:** Marks payment `REFUNDED` even if partial.
- **Notifications & Side Effects:** None.
- **Error-Handling Behavior:** Throws exception if amount exceeds total order amount.
- **Tests Available:** None for partial refunds.
- **Missing Prerequisites / Defects:**
  - Status is flipped to `REFUNDED` on first partial refund. If a second partial refund is attempted, the system has no record of previously refunded amounts, allowing cumulative refunds to exceed the original order total.

---

### Flow 13: Refund Failure and Retry
- **Entry Point:** Gateway failure during refund API call (e.g. gateway timeout, insufficient merchant balance, or bank account frozen).
- **Frontend Component:** None.
- **API Endpoint:** None.
- **Backend Controller & Service:** `RazorpayPaymentGateway.refund`.
- **Database Entities & Transactions:** None.
- **Gateway Operations:** `client.payments.refund` throws `RazorpayException`.
- **State Transitions:** Unhandled.
- **Notifications & Side Effects:** None.
- **Error-Handling Behavior:** Throws generic `RuntimeException("Failed to process Razorpay refund...")`.
- **Tests Available:** None.
- **Missing Prerequisites / Defects:** Completely missing. No retry queue, no dead-letter queue, no webhook handling for `refund.failed`.

---

### Flow 14: Wallet Top-Up (Add Money)
- **Entry Point:** Customer clicks "Add Money" inside Wallet tab on `/dashboard`.
- **Frontend Component:** `DashboardPage.jsx` (`walletApi.addMoney`, `walletApi.verifyAddMoney`).
- **API Endpoint:**
  1. `POST /api/v1/wallet/add-money` (Payload: `{ "amount": 500 }`).
  2. `POST /api/v1/wallet/verify-add-money?amount=500` (Payload: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`).
- **Backend Controller & Service:** `WalletController.addMoney` $\rightarrow$ `paymentGateway.createPaymentOrder`. `WalletController.verifyAddMoney` $\rightarrow$ `paymentGateway.verifySignature` $\rightarrow$ `walletService.creditWallet`.
- **Database Entities & Transactions:**
  - `addMoney`: Does NOT persist any intent record!
  - `verifyAddMoney`: Validates signature. Credits wallet balance via `walletService.creditWallet` (`PESSIMISTIC_WRITE`).
  - Inserts `wallet_transactions` row (`TOPUP`, `CREDIT`, status `SUCCESS`).
- **Gateway Operations:** Creates Razorpay order. Verifies signature.
- **State Transitions:** Wallet `availableBalance` and `withdrawableBalance` increased.
- **Notifications & Side Effects:** Sends `WALLET_TOPUP_SUCCESS` notification.
- **Error-Handling Behavior:** Throws `IllegalArgumentException` on invalid signature.
- **Tests Available:** `06_customer_wallet_lifecycle.spec.js`.
- **Missing Prerequisites / Defects:**
  - **CRITICAL P0 SECURITY VULNERABILITY:** `verifyAddMoney` accepts `@RequestParam BigDecimal amount` directly from the client request query string! Because NO server-side intent record was saved during `addMoney`, the backend blindly credits whatever `amount` the client provides in the query parameter as long as the cryptographic signature is valid. An attacker can pay ₹1, supply `?amount=100000`, and have ₹100,000 credited to their wallet!

---

### Flow 15: Wallet-Funded Checkout (100% Wallet)
- **Entry Point:** Customer selects "Use Sporekart Wallet Balance" on `/payment` when wallet balance $\ge$ order total.
- **Frontend Component:** `frontend/src/pages/PaymentPage.jsx:83-116`.
- **API Endpoint:** `POST /api/v1/wallet/checkout-pay` (Payload: `{ orderId, type: "order", amountFromWallet: total, amountFromGateway: 0 }`).
- **Backend Controller & Service:** `WalletController.processCheckoutWalletPay` $\rightarrow$ `walletService.debitWallet`.
- **Database Entities & Transactions:**
  - `@Transactional` scope in `debitWallet`.
  - Atomically locks wallet, checks balance, debits wallet.
  - Inserts `wallet_transactions` record (`WALLET_PAYMENT`, `DEBIT`).
- **Gateway Operations:** None (`amountFromGateway == 0`).
- **State Transitions:** Returns `{ isFullyPaid: true }` to client.
- **Notifications & Side Effects:** Sends `WALLET_PAYMENT_SUCCESS` notification.
- **Error-Handling Behavior:** Throws exception if wallet balance insufficient.
- **Tests Available:** `PaymentPage.jsx:104-115`.
- **Missing Prerequisites / Defects:**
  - **ARCHITECTURAL DEFECT:** `WalletController.processCheckoutWalletPay` does NOT update the order status in the database! It merely returns `isFullyPaid: true` to the frontend. The frontend is then forced to perform an awkward mock bypass:
    `paymentApi.initiatePayment(id)` $\rightarrow$ `paymentApi.verifyPayment(id, rzpOrderId, 'pay_wallet_...', 'mock_wallet_sig')`!
  - If the client drops connection between `checkout-pay` and `verifyPayment`, the customer's wallet balance has been deducted, but the order remains `PENDING_PAYMENT` in the database!

---

### Flow 16: Partial Wallet Plus Gateway Checkout (Split Tender)
- **Entry Point:** Customer has partial wallet balance and chooses to split payment on `/payment`.
- **Frontend Component:** `frontend/src/pages/PaymentPage.jsx:83-97`.
- **API Endpoint:** `POST /api/v1/wallet/checkout-pay` (Payload: `{ orderId, amountFromWallet: 200, amountFromGateway: 800 }`).
- **Backend Controller & Service:** `WalletController.processCheckoutWalletPay`.
- **Database Entities & Transactions:**
  - Debits ₹200 from wallet immediately.
  - Inserts `wallet_transactions` row (`PARTIAL_PAYMENT`).
- **Gateway Operations:** Calls `paymentGateway.createPaymentOrder(orderId, orderId.toString(), remainingAmount)`.
- **State Transitions:** Returns `razorpayOrderId` for remaining amount.
- **Notifications & Side Effects:** Wallet debit notification sent.
- **Error-Handling Behavior:** None.
- **Tests Available:** None.
- **Missing Prerequisites / Defects:**
  1. **CRITICAL DISCONNECTION:** `paymentGateway.createPaymentOrder` is called directly by `WalletController`, bypassing `PaymentService.initiatePayment`. As a result, **NO row is inserted into the `payments` table**. When the user later completes the payment on Razorpay and calls `/payment/verify`, the backend queries `paymentRepository.findByRazorpayOrderId(rzpOrderId)`, finds nothing, and throws:
     `IllegalArgumentException: "No existing payment record found for Razorpay order ID"`! The transaction is completely broken!
  2. Wallet funds are deducted immediately without reservation or two-phase commit. If the user abandons the remaining gateway payment, their wallet balance is lost with no automatic restoration mechanism.

---

### Flow 17: Wallet Withdrawals (Bank Payout)
- **Entry Point:** Customer requests bank transfer from Wallet balance on `/dashboard`.
- **Frontend Component:** `DashboardPage.jsx` (`walletApi.requestWithdrawal`).
- **API Endpoint:** `POST /api/v1/wallet/withdraw` (Payload: `{ amount, bankName, accountNumber, ifscCode, accountHolderName }`).
- **Backend Controller & Service:** `WalletController.requestWithdrawal` $\rightarrow$ `WalletService.requestWithdrawal`.
- **Database Entities & Transactions:**
  - `@Transactional` scope.
  - Atomically locks wallet via `findByUserIdWithLock`.
  - Checks `availableBalance >= amount`.
  - Debits `availableBalance` immediately.
  - Creates `wallet_transactions` record (`WITHDRAWAL`, `DEBIT`).
  - Creates `wallet_withdrawals` record (`status = REQUESTED`, masked account number).
- **Gateway Operations:** None (manual admin payout or RazorpayX payout needed).
- **State Transitions:** Withdrawal status is `REQUESTED`.
- **Notifications & Side Effects:** Sends `WALLET_WITHDRAWAL_REQUESTED` notification.
- **Error-Handling Behavior:** Rejects if balance insufficient or amount $\le 0$.
- **Tests Available:** `06_customer_wallet_lifecycle.spec.js`.
- **Missing Prerequisites:** Payout is manual. No automated integration with RazorpayX Payouts API.

---

### Flow 18: Wallet Refunds and Reversals
- **Entry Point:** Order cancellation or withdrawal rejection by admin.
- **Frontend Component:** `AdminDashboardPage.jsx` / `DashboardPage.jsx`.
- **API Endpoint:** `POST /admin/finance/withdrawals/{id}/reject` or `POST /orders/{id}/cancel`.
- **Backend Controller & Service:** `WalletService.rejectWithdrawal` / `WalletService.processRefundToWallet`.
- **Database Entities & Transactions:**
  - `@Transactional` scope.
  - Locks wallet with `PESSIMISTIC_WRITE`.
  - Re-credits balance: `availableBalance += amount`, `withdrawableBalance += amount`.
  - Inserts `wallet_transactions` record (`REFUND` or `REVERSAL`, `CREDIT`).
- **Gateway Operations:** None.
- **State Transitions:** Withdrawal $\rightarrow$ `REJECTED`. Order $\rightarrow$ `REFUNDED`.
- **Notifications & Side Effects:** Notification sent for credit.
- **Error-Handling Behavior:** Checks that withdrawal is in `REQUESTED` status.
- **Tests Available:** `06_customer_wallet_lifecycle.spec.js`.
- **Missing Prerequisites:** Verified functional for internal ledger operations.

---

### Flow 19: Training Batch Enrolment
- **Entry Point:** Trainee fills `TraineeProfileEnrollmentModal` on Course Detail page.
- **Frontend Component:** `TraineeProfileEnrollmentModal.jsx:194` (`trainingApi.bookSlot`).
- **API Endpoint:** `POST /api/v1/training/enroll` (Payload: `{ batchId, promoCode }`).
- **Backend Controller & Service:** `TrainingController.enroll` $\rightarrow$ `TrainingService.enrollCustomer`.
- **Database Entities & Transactions:**
  - `@Transactional` scope.
  - Validates promo code if provided.
  - Calculates final fee (`course.feeInr - discount`).
  - Inserts `enrollments` row (`status = PENDING_PAYMENT`).
- **Gateway Operations:** None.
- **State Transitions:** Enrollment is `PENDING_PAYMENT`.
- **Notifications & Side Effects:** Publishes `EnrollmentCreatedEvent`.
- **Error-Handling Behavior:** Rejects if batch ID is null or promo invalid.
- **Tests Available:** `07_training_trainee_lifecycle.spec.js`, `fe-8.test.jsx`.
- **Missing Prerequisites:** Trainee seat capacity is not decremented/reserved during `PENDING_PAYMENT`.

---

### Flow 20: Training Enrolment Verification (Payment Bypass Vulnerability)
- **Entry Point:** Trainee completes payment on `/payment?type=enrollment&id={enrollmentId}`.
- **Frontend Component:** `PaymentPage.jsx:122` (`paymentApi.verifyEnrollmentPayment`).
- **API Endpoint:** `POST /api/v1/payment/verify-enrollment` (Payload: `{ enrollmentId, paymentMethod, transactionReference }`).
- **Backend Controller & Service:** `PaymentController.verifyEnrollmentPayment` $\rightarrow$ `PaymentService.verifyEnrollmentPayment`.
- **Database Entities & Transactions:**
  - `@Transactional(isolation = READ_COMMITTED)`.
  - Verifies caller is enrollment owner (`callingUserId.equals(enrollment.getUserId())`).
  - Fabricates `Payment` row: `razorpayOrderId = "ENROLLMENT-" + id`, `razorpayPaymentId = txRef`, `status = CAPTURED`.
  - Calls `trainingService.confirmEnrollmentPayment(enrollmentId, txRef)`.
  - Calls `batchRepository.incrementEnrolledCountIfCapacityAvailable(batchId)`.
  - Updates `enrollment.status = EnrollmentStatus.CONFIRMED`.
  - Grants customer capability `hasTrainingCapability = true`.
- **Gateway Operations:** **NONE.** No Razorpay order was ever created, and zero signature verification occurs.
- **State Transitions:** Enrollment $\rightarrow$ `CONFIRMED`.
- **Notifications & Side Effects:** Publishes `EnrollmentConfirmedEvent`.
- **Error-Handling Behavior:** Checks ownership. Throws `BatchCapacityExceededException` if batch full.
- **Tests Available:** `VerifyEnrollmentBypassReproductionTest.java:167-208`.
- **Missing Prerequisites / Defects:**
  - **CRITICAL P0 SECURITY FLAW:** Any authenticated customer can submit an arbitrary string (e.g. `txRef = "FREE_COURSE"`) to `POST /payment/verify-enrollment` and be immediately confirmed into any expensive masterclass course without paying a single rupee.

---

### Flow 21: Delayed Payment Callbacks (Webhooks)
- **Entry Point:** Razorpay webhook delivery engine.
- **Frontend Component:** None.
- **API Endpoint:** `POST /api/v1/payment/webhook` (Header: `X-Razorpay-Signature: ...`, Body: raw JSON string).
- **Backend Controller & Service:** `PaymentWebhookController.handleWebhook` $\rightarrow$ `PaymentService.processWebhook`.
- **Database Entities & Transactions:**
  - Validates HMAC-SHA256 signature against `RAZORPAY_WEBHOOK_SECRET`.
  - Reads `eventId`, checks `PaymentEventRepository.findByEventId(eventId)` for duplicates.
  - Fetches `Payment` by `payload.payment.entity.order_id`.
  - Updates `payment.status = PaymentStatus.CAPTURED`.
  - Saves `PaymentEvent` with unique `eventId`.
  - Finds `Order` and updates `order.status = OrderStatus.PAID`.
  - Confirms inventory (`orderService.confirmOrderInventory`).
- **Gateway Operations:** `Utils.verifyWebhookSignature(rawBody, signature, webhookSecret)`.
- **State Transitions:** Order $\rightarrow$ `PAID`. Payment $\rightarrow$ `CAPTURED`.
- **Notifications & Side Effects:** Triggers downstream shipment readiness.
- **Error-Handling Behavior:** Throws `IllegalArgumentException` on invalid signature (returns HTTP 400).
- **Tests Available:** `PaymentModuleTest.testAuthoritativeWebhookHandlingAndDuplicateIdempotency`, `PaymentSecurityTest.testNonMockModeRejectsNullAndMockSignatures`.
- **Missing Prerequisites / Defects:**
  - If `paymentGateway.isMockMode()` is active, `verifyWebhookSignature` returns `true` for all payloads, allowing unauthenticated webhook forgery.
  - Does not handle `order.paid` when payment entity is missing.
  - Does not handle `refund.processed` or `refund.failed`.

---

### Flow 22: Duplicate and Out-of-Order Webhooks
- **Entry Point:** Razorpay webhook retry delivery (e.g. at 15m, 30m, 1h, 2h intervals).
- **Frontend Component:** None.
- **API Endpoint:** `POST /api/v1/payment/webhook`.
- **Backend Controller & Service:** `PaymentService.processWebhook`.
- **Database Entities & Transactions:** Checks `payment_events.event_id` constraint and `payment.getStatus() == CAPTURED`.
- **Gateway Operations:** Signature verified.
- **State Transitions:** Idempotently ignored. Returns `200 OK` with `"Webhook event already processed (idempotent ignore)"`.
- **Notifications & Side Effects:** None repeated.
- **Error-Handling Behavior:** Handled correctly for duplicate `event_id`.
- **Tests Available:** `PaymentModuleTest.java:195-198`.
- **Missing Prerequisites / Defects:**
  - If Razorpay sends webhooks out of order (e.g. `payment.failed` delivered after browser verification marked it `CAPTURED`), line 217 in `PaymentService.java` does not check if the payment is already captured, risking corrupting a captured state to `FAILED`.

---

### Flow 23: Browser Closure After Successful Payment
- **Entry Point:** Customer pays on Razorpay modal, payment captures, but user closes browser before redirection to `/payment/verify`.
- **Frontend Component:** None (tab closed).
- **API Endpoint:** `POST /api/v1/payment/webhook`.
- **Backend Controller & Service:** `PaymentService.processWebhook`.
- **Database Entities & Transactions:** Processes `payment.captured` event from Razorpay webhook, marks `Order` as `PAID`, confirms inventory.
- **Gateway Operations:** Signature validated against webhook secret.
- **State Transitions:** Order transitions to `PAID`.
- **Notifications & Side Effects:** Order confirmation email/SMS dispatched.
- **Error-Handling Behavior:** Idempotent.
- **Tests Available:** `PaymentModuleTest.java:170-198`.
- **Missing Prerequisites / Defects:**
  - Because `PaymentPage.jsx` currently does not launch the real Razorpay modal, this webhook flow is the *only* true way an order would ever be captured under live gateway mode if browser verification is disabled.

---

### Flow 24: Network Failure During Client Verification
- **Entry Point:** Customer's mobile network drops right as Razorpay returns payment ID to the frontend.
- **Frontend Component:** `PaymentPage.jsx`.
- **API Endpoint:** `POST /api/v1/payment/verify` fails (HTTP timeout or `net::ERR_INTERNET_DISCONNECTED`).
- **Backend Controller & Service:** Verification never reaches backend.
- **Database Entities & Transactions:** Order remains `PENDING_PAYMENT`.
- **Gateway Operations:** Money was already captured on Razorpay!
- **State Transitions:** Order is unpaid in Sporekart DB, but paid on Razorpay.
- **Notifications & Side Effects:** None.
- **Error-Handling Behavior:** Customer sees error screen on reload.
- **Tests Available:** None.
- **Missing Prerequisites / Defects:**
  - Relying on browser callback makes the system fragile against client network failure. System MUST rely on webhooks as the primary source of truth, and provide an explicit "Recheck Payment Status with Gateway" button on `/dashboard` that queries Razorpay's API server-to-server.

---

### Flow 25: Payment Reconciliation and Recovery
- **Entry Point:** Automated daily cron job or Admin Finance console.
- **Frontend Component:** None.
- **API Endpoint:** None.
- **Backend Controller & Service:** None.
- **Database Entities & Transactions:** None.
- **Gateway Operations:** Should call Razorpay Settlement / Payments API (`GET https://api.razorpay.com/v1/payments`).
- **State Transitions:** None.
- **Notifications & Side Effects:** None.
- **Error-Handling Behavior:** Zero capability.
- **Tests Available:** None.
- **Missing Prerequisites / Defects:**
  - **COMPLETELY MISSING:** No scheduled task, no batch reconciliation job, and no admin interface to reconcile bank settlements with order records. Any orphaned payments or webhook failures remain undetected indefinitely.
