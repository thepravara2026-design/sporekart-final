# 03 — Customer Complete Lifecycle Report

## 1. Customer Account Lifecycle

### A. Authentication & Registration
- **Mechanism**: Google OAuth 2.0 flow integrated via `POST /api/v1/auth/oauth/google`. In development and test automation, dev mode mock authentication bypass is available.
- **Payload Validation**:
  - `email`: Mandatory RFC 5322 format.
  - `googleSub`: Mandatory unique Google subject claim.
  - `phone`: Enforces 10-digit Indian mobile format (`^[6-9]\\d{9}$`).
- **Duplicate User Handling**:
  - If a user with the same Google Sub or email already exists, `IdentityService` retrieves the existing account without generating duplicate database records, refreshing the JWT session token.
- **Session Persistence**:
  - Authentication tokens (`sporekart_token`) are persisted in `localStorage`.
  - Authenticated session remains valid across page reloads and browser tab duplication.
  - Logging out immediately clears `localStorage` and invalidates the active React user context.

### B. Address Management (Delivery Address Book)
- **Validation Rules**:
  - `recipientName`: Strictly checked against regex `^[a-zA-Z\\s\\.\\-]{2,60}$`. Prohibits numeric digits and special symbols (Defect verification: sending numeric characters triggers an immediate HTTP 400 validation error).
  - `phone`: Validated Indian phone format.
  - `pincode`: Validated 6-digit Indian Postal PIN Code (`^\\d{6}$`).
- **CRUD Operations**:
  - Adding address: Persists into `customer_addresses` table linked by `customer_id`.
  - Viewing address: Rendered on dashboard address book and checkout selection dropdown.
  - Deleting address: Deletes address cleanly. Cross-tenant deletion attempts by unauthorized users return HTTP 403 Forbidden.

---

## 2. Product Discovery, Cart & Checkout Lifecycle

### A. Catalog & Variant Selection
- Products are categorized under `Fresh Mushrooms`, `Dry Mushrooms`, `Mushroom Spawn Seeds`, `Mushroom Growing Kits`, and `Cultivation Equipment & Supplies`.
- Each product supports multiple pack size variants (e.g. `100g Pantry Pouch`, `500g Commercial Bag`) with individual pricing, SKUs, and stock quantities.
- Dynamic price updating: Selecting a variant immediately recalculates the displayed unit price, discount percentage, and stock badge.

### B. Shopping Cart Lifecycle
- **Guest vs. Authenticated Carts**:
  - Unauthenticated guests maintain cart items associated with a client-generated `Session-Id` header.
  - Adding items as a guest, updating quantity, or removing items operates as expected.
  - Upon logging in, guest items are designed to merge into the customer's permanent user cart via `CartService.getOrCreateCart`.
- **Cart Concurrency Defect (`CART-CONCUR-01`)**:
  - If rapid concurrent requests hit `getOrCreateCart(userId, sessionId)` before a cart record is committed, Hibernate executes multiple inserts into `cart`.
  - When the user subsequently accesses `/api/v1/cart`, Spring Data JPA throws:
    ```
    org.hibernate.NonUniqueResultException: Query did not return a unique result: 2 results were returned
    ```
  - This results in HTTP 500 and prevents adding further items or proceeding to checkout.

### C. Checkout & Server-Side Integrity
- **Order Creation Rule**:
  - `OrderService.createOrderFromCart` strictly enforces that an order cannot be created with an empty cart (`Cannot create order from an empty cart`).
  - Order totals, taxes, delivery fees, and line item discounts are calculated **exclusively on the backend** by querying live database prices. Client-supplied price tampering is impossible.
- **Admin Order Placement Restriction**:
  - The primary administrator account `thepravara2026@gmail.com` is programmatically blocked from placing consumer orders (`SEC-ADMIN-ROLE-01`), enforcing clear operational separation of concerns.

---

## 3. Order Cancellation Lifecycle

### A. Cancellation Eligibility & Business Rules
- Customers can cancel unfulfilled orders in `PENDING` or `PROCESSING` status from `/dashboard?tab=orders`.
- Orders already in `SHIPPED`, `OUT_FOR_DELIVERY`, or `DELIVERED` status reject cancellation requests with an HTTP 409 Conflict.
- Submitting an order cancellation requires an audit reason string.

### B. State Transitions & Refund Triggers
1. **Transition**: Order status transitions to `CANCELLED`.
2. **Stock Restoration**: Reserved variant stock is restored back to the `inventory_records` table atomically.
3. **Refund Processing**:
   - If the order was unpaid (`PENDING`), no financial movement occurs.
   - If the order was paid via Wallet, the paid amount is credited back to the customer's wallet ledger with type `REFUND`.
   - If the order was paid via Razorpay, a gateway refund record is queued in the `refunds` table.
4. **Notifications**: In-app notifications are generated for both the customer and platform administrator.

---

## 4. Customer Lifecycle Status Summary
- **Registration & Auth**: **PASS**
- **Address Management**: **PASS**
- **Catalog & Variant Selection**: **PASS**
- **Cart Operations (Isolated)**: **PASS**
- **Cart Operations (Concurrent Conversion)**: **FAIL** (`CART-CONCUR-01`)
- **Checkout & Order Creation**: **PASS**
- **Order Cancellation & Stock Restoration**: **PASS**
