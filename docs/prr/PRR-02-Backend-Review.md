# PRR-02: Backend Peer Review — Sporekart

**Date:** October 9, 2026  
**Review Board:** Senior Backend Engineer & Application Security Engineer  
**Target Repository:** `f:\sporekart-v1\sporekart-final\backend`  

---

## 1. Domain Controller & Service Inventory

| Package Module | Controller Class | Endpoint Count | Role Access | Transaction Boundary | Key Logic / Integrity Controls |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `identity` | `AuthController.java` | 5 | PUBLIC / CUSTOMER | `@Transactional` | Bcrypt hashing (`strength=12`), JWT generation, OTP validation |
| `identity` | `AdminAuthController.java` | 2 | ADMIN | `@Transactional` | Admin role enforcement, audit log entry |
| `catalog` | `CatalogController.java` | 6 | PUBLIC | Read-only | Category slug lookup, product variant expansion |
| `catalog` | `AdminCatalogController.java` | 8 | ADMIN | `@Transactional` | Stock update, price edit, image order adjustment |
| `order` | `OrderController.java` | 7 | CUSTOMER | `@Transactional` | Inventory pessimistic lock reservation, order number generation |
| `order` | `AdminOrderController.java` | 6 | ADMIN | `@Transactional` | Permitted status transitions (CREATED -> PAID -> SHIPPED) |
| `payment` | `PaymentController.java` | 4 | CUSTOMER | `@Transactional` | Razorpay Order creation, HMAC verification |
| `payment` | `PaymentWebhookController.java` | 1 | PUBLIC / GATEWAY | `@Transactional` | Webhook idempotency, HMAC SHA256 signature check |
| `training` | `TrainingController.java` | 8 | PUBLIC / TRAINEE | `@Transactional` | Batch slot capacity check, concurrency lock on enrollment |
| `training` | `AdminTrainingController.java` | 7 | ADMIN | `@Transactional` | Course & Batch CRUD, Schedule management |
| `wallet` | `WalletController.java` | 5 | CUSTOMER / TRAINEE | `@Transactional` | Balance fetch, Withdrawal request, Idempotency key check |
| `wallet` | `AdminFinanceController.java` | 4 | ADMIN | `@Transactional` | Manual wallet credit/debit adjustment with ledger entry |
| `shipping` | `ShippingController.java` | 5 | ADMIN | `@Transactional` | Shiprocket API integration, AWB tracking fetch |
| `shipping` | `ShippingWebhookController.java` | 1 | PUBLIC / SHIPROCKET | `@Transactional` | Automated order tracking status update |

---

## 2. Backend Security & Transaction Audit Findings

### 2.1 Webhook Signature Security Verification
- **Finding ID:** `BE-SEC-01` (PASS / Strong)
- **Components:** `PaymentWebhookController.java`, `RazorpayService.java`
- **Assessment:** Webhook handler validates `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` using `javax.crypto.Mac` HMAC-SHA256 before processing payload.

### 2.2 Inventory & Batch Enrollment Concurrency Controls
- **Finding ID:** `BE-CONC-01` (PASS / Strong)
- **Components:** `OrderService.java`, `TrainingService.java`
- **Assessment:** `PessimisticWrite` lock (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) is active on `ProductVariant` stock deduction and `Batch` booked capacity increments, preventing overbooking race conditions.

### 2.3 Unhandled Null Bean Fallbacks in Wallet Notifications
- **Finding ID:** `BE-DEF-01` (P3)
- **Component:** `WalletService.java`
- **Assessment:** Logs indicate `NotificationEventService` can be null during unit testing or non-standard context initialization, emitting error log lines during wallet transactions.
