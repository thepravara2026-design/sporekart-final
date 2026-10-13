# 04 — Payment, Refund & Customer Wallet Lifecycle Report

## 1. Payment Gateway Lifecycle & Verification

### A. Razorpay Integration Architecture
- The application integrates with Razorpay via Spring Boot `PaymentService` and `RazorpayClient`.
- In local development mode (`dev` profile), test orders and verification simulation are supported using mock credentials while strictly preserving full server-side state transitions.

### B. Payment Initiation Flow
1. Client calls `POST /api/v1/payment/initiate` passing `{ orderId: UUID }`.
2. Backend validates that the order is in `PENDING` payment state and calculates total amount in paise (`INR * 100`).
3. Backend creates an order with Razorpay and returns:
   - `razorpayOrderId`: Gateway order identifier (e.g. `order_K1...`).
   - `amount`: Exact amount in paise.
   - `currency`: `INR`.
   - `key`: Public key identifier.

### C. Signature Verification & Tamper Protection
- Client submits payment verification via `POST /api/v1/payment/verify`:
  ```json
  {
    "orderId": "...",
    "razorpayOrderId": "order_...",
    "razorpayPaymentId": "pay_...",
    "razorpaySignature": "hmac_sha256_hex"
  }
  ```
- **Security Negative Test (`SCENARIO-I`)**:
  - A malicious payload containing an invalid/mismatched signature was submitted to `/api/v1/payment/verify`.
  - **Result**: Backend rejected the verification with HTTP 400 Bad Request.
  - **Database Check**: Order status strictly remained `PENDING`; order was NOT marked `PAID`. Financial security integrity verified.
- **Valid Payment Verification**:
  - With valid signature, order status transitions atomically to `PAID`.
  - Payment record marked `CAPTURED`.
  - In-app payment success notification dispatched.

---

## 2. Customer Wallet & Double-Entry Ledger

### A. Wallet Balance Architecture
- The `wallets` table maintains:
  - `available_balance`: Funds available for purchases and withdrawals.
  - `pending_balance`: Balance held in transit (reserved for unsettled withdrawals or locks).
  - `withdrawable_balance`: Net funds eligible for external bank account transfer.
  - `currency`: Default `INR`.
- Every balance mutation requires a corresponding record in `wallet_transactions` specifying:
  - `transaction_type`: `TOPUP`, `ORDER_PAYMENT`, `REFUND`, `WITHDRAWAL`, `ADJUSTMENT`.
  - `transaction_direction`: `CREDIT` or `DEBIT`.
  - `balance_before` and `balance_after`.
  - `idempotency_key` ensuring duplicate callbacks do not produce duplicate credits.

### B. Wallet Top-Up (Add Money)
- **Execution Flow**:
  1. `POST /api/v1/wallet/add-money` with `{ amount: 1000.00 }`.
  2. Initiates Razorpay payment intent.
  3. `POST /api/v1/wallet/verify-add-money?amount=1000.00` verifies payment.
  4. Balance increases from ₹0.00 to ₹1000.00.
  5. Transaction ledger appends credit entry with `balanceAfter = 1000.00`.
- **Audit Verification (`SCENARIO-C`)**:
  - Initial balance checked: ₹0.00.
  - Top-up executed: ₹1000.00.
  - Live ledger queried: exactly 1 transaction found, `amount = 1000.00`. Verified pass.

### C. Wallet Spending & Purchasing
- Customers can select `Wallet Balance` during checkout if `available_balance >= order_total`.
- The exact order amount is debited atomically using pessimistic row locks (`SELECT ... FOR UPDATE`).
- If balance is insufficient, checkout is blocked with an explicit error. Overdrafts and negative balances are mathematically prohibited.

### D. Bank Account Withdrawal Lifecycle
- **Execution Flow**:
  - Customer requests withdrawal via `POST /api/v1/wallet/withdraw` specifying bank name, account number, IFSC code, and account holder name.
  - Backend debits `available_balance` and `withdrawable_balance` immediately to prevent double spending.
  - Creates a `wallet_withdrawals` entity with initial status `REQUESTED` and masked account number (`••••5678`).
  - Dispatches admin notification for withdrawal review.
- **Design Observation (`WALLET-HOLD-01`)**:
  - Current implementation decrements `available_balance` and records the withdrawal directly, leaving `pending_balance` at 0 rather than moving the funds into `pending_balance`.
  - While financially safe against double-spending, documentation should clarify whether `pending_balance` is intended for escrow tracking.

---

## 3. Refund Lifecycle

### A. Order Refund Policy & Mechanics
- Order refunds are triggered automatically upon customer cancellation or admin cancellation of an eligible paid order.
- **Refund Destination Rules**:
  - Orders originally paid via Wallet are refunded back to the user's Wallet immediately.
  - Orders paid via Gateway trigger a gateway reversal entry.
- **Idempotency Guarantee**:
  - Repeated cancellation calls on an already-cancelled order are rejected with HTTP 409 Conflict.
  - No duplicate refunds or double ledger entries occur.

---

## 4. Payment & Wallet Status Summary
- **Razorpay Intent Generation**: **PASS**
- **Signature Verification**: **PASS**
- **Tampered Payment Prevention**: **PASS**
- **Wallet Top-Up Flow**: **PASS**
- **Wallet Ledger Reconciliation**: **PASS**
- **Wallet Order Spend**: **PASS**
- **Withdrawal Request Creation**: **PASS**
- **Refund Idempotency**: **PASS**
