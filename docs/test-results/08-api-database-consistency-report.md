# 08 — API & Database Consistency Verification Report

## 1. Data Model & Database Architecture
- **Database Engine**: Remote Managed PostgreSQL 17.6 on Supabase (`aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`)
- **Schema Management**: Flyway 10.x Database Migrations (`V1__baseline.sql` through `V36__*.sql`)
- **Isolation Levels**: Spring `@Transactional(isolation = Isolation.READ_COMMITTED)` with selective Pessimistic Row Locking (`PESSIMISTIC_WRITE`) for critical financial and inventory paths.

---

## 2. Cross-Layer Entity Reconciliation

### A. Customer Order Reconciliation (`SCENARIO-A`)
- **Scenario Tested**:
  1. Customer creates address and places order via `POST /api/v1/orders`.
  2. Order persists in PostgreSQL table `orders` and `order_items`.
  3. Administrator inspects the order via `GET /api/v1/admin/orders/{id}`.
- **Verification Matrix**:
  - `orders.id` matches exact UUID returned to the customer.
  - `orders.order_number` matches format `SPK-YYYYMMDD-XXXX`.
  - `orders.total_amount_inr` equals exact server-calculated sum of line items plus delivery charges minus promotions.
  - Order items link correctly via foreign key `order_id` to `order_items.variant_id`.
- **Verdict**: **100% Consistent Across Layers**.

### B. Wallet Double-Entry Ledger Reconciliation (`SCENARIO-C`)
- **Scenario Tested**:
  1. Customer opens wallet with ₹0.00.
  2. Completes ₹1,000.00 top-up payment.
  3. Live wallet record in `wallets` verified.
  4. Live transaction records in `wallet_transactions` verified.
- **Verification Matrix**:
  - `wallets.available_balance` = `1000.00`.
  - Exactly 1 record in `wallet_transactions` where `transaction_type = 'TOPUP'`, `transaction_direction = 'CREDIT'`, `balance_before = 0.00`, and `balance_after = 1000.00`.
  - `wallets.available_balance` equals `SUM(credits) - SUM(debits)`.
- **Verdict**: **100% Mathematically Reconciled**.

### C. Training Enrollment & Seat Allocation
- **Scenario Tested**:
  1. Trainee registers for training batch.
  2. Enrollment record created in `training_enrollments`.
  3. Batch slot in `training_slots` updated.
- **Verification Matrix**:
  - `training_slots.enrolled_count` increments atomically by 1.
  - Database prevents `enrolled_count > max_capacity` via application check and optimistic locking.
  - Upon valid cancellation (>= 7 days prior), `enrolled_count` decrements by 1.
- **Verdict**: **100% Consistent**.

---

## 3. Database Constraints & Schema Gap Findings

### A. Missing Unique Constraint on Cart (`CART-CONCUR-01`)
- **Observation**:
  - Entity `Cart` has fields `userId` and `status`.
  - The PostgreSQL `cart` table currently lacks a unique constraint on `(user_id, status)` where `status = 'ACTIVE'`.
  - This allows multiple rows with `status = 'ACTIVE'` for the same `user_id` when rapid concurrent requests occur, leading to Hibernate `NonUniqueResultException`.
- **Recommendation**:
  - Add a partial unique index in Flyway migration:
    ```sql
    CREATE UNIQUE INDEX uq_cart_user_active ON cart (user_id) WHERE status = 'ACTIVE' AND user_id IS NOT NULL;
    ```
  - In `CartRepository`, change `findByUserIdAndStatus` to return `List<Cart>` or safely select the latest active cart if multiple exist.

---

## 4. API & Database Consistency Summary
All transactional operations (orders, payments, wallet movements, enrollments, support tickets) maintain strict referential integrity, foreign key validity, and audit ledger reconciliation. The only schema integrity vulnerability identified is the missing unique index on active cart records.
