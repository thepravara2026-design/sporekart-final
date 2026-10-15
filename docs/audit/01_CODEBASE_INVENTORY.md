# Sporekart — Razorpay Pre-Integration Codebase Inventory
**Phase 1 Deliverable — Repository Reconnaissance & Architectural Inventory**

- **Date:** October 13, 2026
- **Auditor Role:** Principal Software Architect, Senior Backend Engineer, Payment Systems Engineer, Application Security Engineer, Database Architect, QA Automation Lead
- **Target Repository:** Sporekart E-Commerce Monorepo (`backend` Spring Boot 3.3.3 + `frontend` React 18 / Vite 5.4.1)
- **Scope:** Complete payment ecosystem inventory across frontend, backend, database schemas, security rules, configurations, and test suites.

---

## 1. Executive Technology Stack Baseline

| Architectural Layer | Technology & Version | Key Libraries / Frameworks | Deployment / Runtime Mode |
|---|---|---|---|
| **Backend Framework** | Java 21, Spring Boot `3.3.3` | Spring Data JPA, Spring Security 6.3.3, Hibernate 6.5.2, Spring Boot Validation, Spring Mail, Actuator | Embedded Tomcat on Port 8080 (`/api/v1` context path) |
| **Payment Gateway SDK** | Razorpay Java SDK `com.razorpay:razorpay-java:1.4.6` | `org.json:json:20240303`, Apache Commons, OkHttp (transitive via SDK) | Server-side REST & HMAC signature verification |
| **Database & Migrations** | PostgreSQL 15+ (Production) / H2 2.3+ (Dev/Test) | Flyway `10.17.3` (`flyway-core`, `flyway-database-postgresql`), HikariCP | 37 SQL migration scripts under `src/main/resources/db/migration/` |
| **Authentication & Tokens** | JJWT `0.12.6` (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`) | Google OAuth2 ID Token client, BCrypt (`strength=12`), Custom Guest Session UUIDs | Stateless Bearer JWT + `X-Session-ID` header |
| **Frontend Framework** | React `18.3.1`, Vite `5.4.1` | React Router `6.26.1`, Axios `1.7.4`, TailwindCSS `3.4.10`, Lucide React `0.435.0`, Framer Motion `11.3.28` | SPA with client-side routing, static Vite build |
| **Automated Testing** | JUnit 5, Mockito, Testcontainers `1.20.1`, ArchUnit `1.3.0`, JaCoCo `0.8.12` | Vitest `1.6.1`, React Testing Library `16.3.3`, Playwright `1.63.0` | In-memory H2 `@SpringBootTest` test profiles + Playwright E2E specs |

---

## 2. Frontend Payment & Checkout Component Inventory

| Component / Page | File Path | Route / Context | Primary Responsibilities | Payment Gateway Integration Observed |
|---|---|---|---|---|
| `CheckoutPage.jsx` | `frontend/src/pages/CheckoutPage.jsx` | `/checkout` | Cart validation, shipping address resolution, guest/customer auth, order placement | Calls `orderApi.createOrder()`, then navigates to `/payment?type=order&id=${order.id}`. Does NOT load Razorpay SDK. |
| `PaymentPage.jsx` | `frontend/src/pages/PaymentPage.jsx` | `/payment?type={order\|enrollment}&id={uuid}` | Payment summary display, wallet balance toggle, payment method selection, payment execution | **DEFECTIVE MOCK UI:** Renders manual Card/UPI inputs. Does NOT load `checkout.js`. Submits `mock_signature_bypass` to `/payment/verify`. |
| `OrderConfirmationPage.jsx` | `frontend/src/pages/OrderConfirmationPage.jsx` | `/order-confirmation/:id` | Order receipt display, download invoice, customer summary | Displays payment status, total paid, order number. |
| `CourseDetailPage.jsx` | `frontend/src/pages/CourseDetailPage.jsx` | `/training/courses/:slug` | Course syllabus, batch slot selection, enrollment trigger | Opens `TraineeProfileEnrollmentModal` for booking. |
| `TraineeProfileEnrollmentModal.jsx` | `frontend/src/components/TraineeProfileEnrollmentModal.jsx` | Modal inside Course / Training page | Trainee profile verification, Indian address form, batch slot reservation | Calls `trainingApi.bookSlot()`, then navigates to `/payment?type=enrollment&id=${enrollment.id}`. |
| `TrainingConfirmationPage.jsx` | `frontend/src/pages/TrainingConfirmationPage.jsx` | `/training/confirmation/:id` | Masterclass enrollment confirmation, schedule, batch code | Displays confirmed enrollment receipt. |
| `DashboardPage.jsx` | `frontend/src/pages/DashboardPage.jsx` | `/dashboard` | Customer dashboard: Orders, Wallet, Training Bookings | Provides "Pay Now" links for pending orders (`/payment?type=order`) and pending enrollments (`/payment?type=enrollment`). Contains Wallet Topup & Withdrawal modals. |
| `AdminDashboardPage.jsx` | `frontend/src/pages/AdminDashboardPage.jsx` | `/admin/*` | Orders, Finance/Ledger, Shipments, Reviews, Training management | Order status update (including Cancel/Refund). Finance ledger view. |
| `api.js` | `frontend/src/api.js` | Core Axios HTTP client (`/api/v1`) | `paymentApi`, `walletApi`, `orderApi`, `trainingApi` HTTP endpoints | Contains `initiatePayment`, `verifyPayment`, `getPaymentSummary`, `verifyEnrollmentPayment`, `checkoutPay`, `addMoney`, `verifyAddMoney`. |

---

## 3. Backend Module & Service Inventory

### 3.1 Payment Module (`com.sporekart.payment`)
- **Controllers:**
  - `PaymentController.java` (`f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/payment/api/PaymentController.java`): Exposes `POST /payment/initiate`, `POST /payment/verify`, `GET /payment/summary`, `POST /payment/verify-enrollment`.
  - `PaymentWebhookController.java` (`f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/payment/api/PaymentWebhookController.java`): Exposes `POST /payment/webhook` with `X-Razorpay-Signature` header validation.
- **Services & Adapters:**
  - `PaymentService.java` (`f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/payment/application/PaymentService.java`): Core orchestration for initiation, verification, webhook parsing, refund processing, and enrollment verification.
  - `PaymentGateway.java` (`f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/payment/application/PaymentGateway.java`): Abstraction interface (`createPaymentOrder`, `verifySignature`, `verifyWebhookSignature`, `refund`).
  - `RazorpayPaymentGateway.java` (`f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/payment/application/RazorpayPaymentGateway.java`): Concrete implementation wrapping `com.razorpay.RazorpayClient` and `com.razorpay.Utils`.
- **Entities & Repositories:**
  - `Payment.java` (`domain/Payment.java`): Maps to `payments` table.
  - `PaymentEvent.java` (`domain/PaymentEvent.java`): Maps to `payment_events` table.
  - `PaymentStatus.java` (`domain/PaymentStatus.java`): Enum (`INITIATED`, `CAPTURED`, `FAILED`, `REFUNDED`).
  - `PaymentRepository.java` (`infrastructure/PaymentRepository.java`): JpaRepository for `payments`.
  - `PaymentEventRepository.java` (`infrastructure/PaymentEventRepository.java`): JpaRepository for `payment_events`.

### 3.2 Order Module (`com.sporekart.order`)
- **Controllers:**
  - `OrderController.java`: Customer-facing order creation, order retrieval, customer cancellation.
  - `AdminOrderController.java`: Admin order search, order status updates, packing slip download.
- **Services:**
  - `OrderService.java` (`application/OrderService.java`): Authoritative line-item calculation, atomic inventory reservation, promo discount application, status transition state machine, invoice generation.
- **Entities & Repositories:**
  - `Order.java` (`domain/Order.java`): Maps to `orders` table. Contains `razorpay_order_id`, `razorpay_payment_id`.
  - `OrderItem.java`: Line items with GST rates and snapshots.
  - `OrderStatus.java`: Enum (`PENDING_PAYMENT`, `PAID`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUND_PENDING`, `REFUNDED`).
  - `OrderRepository.java`: Queries for orders by number, razorpayOrderId, idempotencyKey.

### 3.3 Wallet Module (`com.sporekart.wallet`)
- **Controllers:**
  - `WalletController.java` (`api/WalletController.java`): Customer wallet balance, transactions, add money, withdrawal requests, checkout wallet payment (`/wallet/checkout-pay`).
  - `AdminFinanceController.java` (`api/AdminFinanceController.java`): Platform financial overview, withdrawal approval/rejection, manual adjustments.
- **Services:**
  - `WalletService.java` (`application/WalletService.java`): Atomic credits and debits with `PESSIMISTIC_WRITE` locks, refund processing to wallet.
- **Entities & Repositories:**
  - `Wallet.java`: Maps to `wallets` table.
  - `WalletTransaction.java`: Maps to `wallet_transactions` table (ledger).
  - `WalletWithdrawal.java`: Maps to `wallet_withdrawals` table.

### 3.4 Training Module (`com.sporekart.training`)
- **Controllers:**
  - `TrainingController.java` (`api/TrainingController.java`): Customer course catalog, enrollment (`/training/enroll`), bookings, confirmation.
  - `AdminTrainingController.java`: Course/batch creation, attendance, certificate issuance.
- **Services:**
  - `TrainingService.java` (`application/TrainingService.java`): Capacity check, enrollment state lifecycle.
- **Entities & Repositories:**
  - `Course.java`, `Batch.java`, `Enrollment.java` (`domain/Enrollment.java`).
  - `EnrollmentStatus.java`: Enum (`PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).

---

## 4. Database Schema & Migration Inventory

| Migration File | Tables Created / Modified | Payment Relevance |
|---|---|---|
| `V1__init_schema.sql` | `orders`, `order_items`, `payments`, `courses`, `training_slots`, `training_bookings` | Original creation of `orders` (`razorpay_order_id`, `razorpay_payment_id`) and `payments` table. |
| `V7__create_order_tables.sql` | `orders` table enhancements | Added order event history and additional tracking fields. |
| `V8__create_payment_tables.sql` | `payments`, `payment_events` | Added `currency`, `updated_at`, `payment_events` with unique `event_id`, added secondary indexes on `order_id`, `razorpay_order_id`, `razorpay_payment_id`. |
| `V10__create_training_tables.sql` | `courses`, `training_batches`, `enrollments`, `batch_schedules` | Replaced legacy slots with batches and enrollments (`PENDING_PAYMENT`, `CONFIRMED`). |
| `V17__add_session_id_to_orders.sql` | `orders` | Added `session_id` to allow guest order tracking. |
| `V18__create_wallet_and_ledger_tables.sql` | `wallets`, `wallet_transactions`, `wallet_withdrawals` | Double-entry ledger with balance before/after, transaction references, source tracking. |
| `V32__add_wallet_non_negative_check.sql` | `wallets` | Added database check constraint `CHECK (available_balance >= 0.00)`. |
| `V33__make_payments_order_id_nullable.sql` | `payments` | Dropped `NOT NULL` on `order_id` and `razorpay_order_id` to accommodate non-order transactions. |

---

## 5. Configuration & Environment Variables Inventory

| Config Key | Bound Variable | Source File / Profile | Current Value / Default | Exposure Risk |
|---|---|---|---|---|
| `app.razorpay.key-id` | `${RAZORPAY_KEY_ID:}` | `application.yml:77` | Empty string in default profile; `rzp_test_mockkey123` in `application-test.yml` | Low. Exposed to frontend in response payload. |
| `app.razorpay.key-secret` | `${RAZORPAY_KEY_SECRET:}` | `application.yml:78` | Empty string in default profile; `mocksecret123` in `application-test.yml` | High if exposed. Kept strictly on backend. |
| `app.razorpay.webhook-secret` | `${RAZORPAY_WEBHOOK_SECRET:}` | `application.yml:79` | Empty string in default profile; omitted in test profile | High if exposed. Kept strictly on backend. |
| `sporekart.razorpay.mode` | *Not implemented* | N/A | Missing explicit mode selector | **High Risk:** Mode evaluated via substring check. |
| `server.servlet.context-path` | `/api/v1` | `application.yml:66` | Prefixes all REST endpoints | Webhook URL is `/api/v1/payment/webhook`. |

---

## 6. Automated Test Inventory

| Test File | Type | Framework | Coverage & Focus | Gateway Execution Reality |
|---|---|---|---|---|
| `PaymentModuleTest.java` | Spring Boot Integration Test | JUnit 5 + Mockito + H2 | Tests `initiatePayment`, `verifyPayment`, `processWebhook`, `refundPayment`. | Runs with `@ActiveProfiles("test")`. Because `keyId` starts with `rzp_test_mock`, **100% of gateway logic runs in MOCK MODE**. Does not test real SDK client. |
| `PaymentSecurityTest.java` | Security Integration Test | JUnit 5 + MockMvc + H2 | Tests order ID mismatch rejection, mock signature rejection under simulated live keys via reflection. | Reflection is used to inject non-mock keys to verify that `null` or `mock_signature` are rejected. |
| `VerifyEnrollmentBypassReproductionTest.java` | Security Regression Test | JUnit 5 + MockMvc + H2 | Tests that unauthenticated users or attackers cannot verify other users' enrollments. | Validates authorization barrier, but confirms that any non-blank `transactionReference` succeeds without gateway check. |
| `PaymentServiceUnitTest.java` | Unit Test | JUnit 5 + Mockito | 15 unit tests covering payment initiation, verification, duplicate webhooks, summary access. | Pure Mockito mocks (`PaymentGateway` mocked). Tests service logic in isolation. |
| `07_payment.spec.js` | End-to-End Test | Playwright Browser | Full customer flow from Catalog -> Cart -> Checkout -> PaymentPage -> OrderConfirmation. | Clicks through mock `PaymentPage.jsx`. Never invokes Razorpay iframe or real payment gateway. |
| `05_payment_refund_lifecycle.spec.js` | E2E Audit Test | Playwright API | Tests `/payment/initiate`, `/payment/verify` with mock signature, order status transition to `PAID`. | Relies on backend mock mode bypass (`mock_sig_pass`). |
