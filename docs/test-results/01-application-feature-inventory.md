# 01 — Application Feature Inventory

This inventory captures the discovered features, routes, interactions, dependencies, and test statuses across the Sporekart application.

| Feature ID | Module | UI Route | Action | Expected Result | Dependencies | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Identity | `/login`, `/admin/login` | Click Google Dev OAuth Login | Session created, JWT token stored, user hydrated | Backend `/api/v1/auth/oauth/google` | **PASS** |
| **AUTH-02** | Identity | `/` | Guest direct access | Public catalog & content browsable without auth | None | **PASS** |
| **AUTH-03** | Identity | `/dashboard` | Direct access as unauthenticated guest | Redirected to login with notification prompt | React Router Auth Guard | **PASS** |
| **AUTH-04** | Identity | `/admin` | Direct access as standard customer | 403 Forbidden Access block displayed | Role-based Guard (`ROLE_ADMIN`) | **PASS** |
| **AUTH-05** | Identity | `/admin` | Direct hard refresh or URL entry as Admin | Should maintain admin console without 403 | App.jsx auth hydration gate | **FAIL** (`AUTH-HYDRATION-01`) |
| **AUTH-06** | Identity | Topbar | Click "Logout" | Local storage cleared, user state reset, session closed | React State / LocalStorage | **PASS** |
| **CUST-01** | Account | `/dashboard?tab=profile` | View Profile Information | Name, email, phone, and role render accurately | `/api/v1/customer/profile` | **PASS** |
| **CUST-02** | Account | `/dashboard?tab=addresses` | Add new Indian delivery address | Address saved with strict name & phone regex validation | `/api/v1/customer/addresses` | **PASS** |
| **CUST-03** | Account | `/dashboard?tab=addresses` | Delete saved delivery address | Address removed from account and DOM | `/api/v1/customer/addresses/{id}` | **PASS** |
| **CAT-01** | Catalog | `/products` | Filter by category (e.g. Dry Mushrooms) | Product list filtered, query param updated | `/api/v1/catalog/products` | **PASS** |
| **CAT-02** | Catalog | `/products` | Keyword search in header search bar | Filtered product cards rendered matching query | Catalog API search | **PASS** |
| **CAT-03** | Catalog | `/product/:slug` | View details, select pack size variant | Price, SKU, and stock badge dynamically update | `/api/v1/catalog/products/{slug}` | **PASS** |
| **CART-01** | Cart | `/product/:slug` | Click "Add to Cart" | Variant added to session cart, drawer count increments | `/api/v1/cart/items` | **PASS** |
| **CART-02** | Cart | `/cart` | Modify item quantity | Line total & subtotal recalculate on backend | `/api/v1/cart/items/{id}` | **PASS** |
| **CART-03** | Cart | `/cart` | Remove item from cart | Line item removed, totals update | `/api/v1/cart/items/{id}` | **PASS** |
| **CART-04** | Cart | `/cart` | Concurrent guest/user cart conversion | Cart items merged into single active user cart | `/api/v1/cart` merge logic | **FAIL** (`CART-CONCUR-01`) |
| **ORD-01** | Checkout | `/cart` -> `/checkout` | Initiate checkout with saved address | Order created in `PENDING` status with line items | Active cart with items | **PASS** |
| **ORD-02** | Checkout | `/checkout` | Attempt order creation with empty cart | Blocked with `Cannot create order from an empty cart` | Server-side validation | **PASS** |
| **ORD-03** | Orders | `/dashboard?tab=orders` | View order history & order details card | Correct order number, items, taxes & total shown | `/api/v1/orders` | **PASS** |
| **ORD-04** | Orders | `/dashboard?tab=orders` | Cancel eligible unfulfilled order | Order transitions to `CANCELLED`, stock restored | `/api/v1/orders/{id}/cancel` | **PASS** |
| **ORD-05** | Orders | `/dashboard?tab=orders` | Attempt cancellation of shipped order | Blocked by policy with descriptive error | Order status state machine | **PASS** |
| **PAY-01** | Payment | `/checkout` | Initialize Razorpay payment intent | Server returns valid `razorpayOrderId` and amount in paise | `/api/v1/payment/initiate` | **PASS** |
| **PAY-02** | Payment | `/checkout` | Submit valid payment signature | Order transitions to `PAID`, payment marked captured | `/api/v1/payment/verify` | **PASS** |
| **PAY-03** | Payment | `/checkout` | Submit fraudulent or altered signature | Rejected with HTTP 400, order remains `PENDING` | HMAC-SHA256 signature check | **PASS** |
| **WAL-01** | Wallet | `/dashboard?tab=wallet` | Inspect available balance & transaction ledger | Opening balance agrees with sum of ledger entries | `/api/v1/wallet` | **PASS** |
| **WAL-02** | Wallet | `/dashboard?tab=wallet` | Add money (top-up) with verified payment | Balance credited atomically, transaction ledger appended | `/api/v1/wallet/add-money` | **PASS** |
| **WAL-03** | Wallet | `/checkout` | Pay for cart order using wallet balance | Balance debited, order marked `PAID`, transaction ledger updated | Sufficient wallet balance | **PASS** |
| **WAL-04** | Wallet | `/dashboard?tab=wallet` | Submit bank withdrawal request | Balance debited, withdrawal recorded with status `REQUESTED` | `/api/v1/wallet/withdraw` | **PASS** |
| **TRN-01** | Academy | `/training` | Browse courses and upcoming batches | Course metadata, curriculum, schedules rendered | `/api/v1/training/courses` | **PASS** |
| **TRN-02** | Academy | `/training/:slug` | Enroll in batch & complete payment | Enrollment confirmed, seat deducted, trainee enrolled | `/api/v1/training/enroll` | **PASS** |
| **TRN-03** | Academy | `/dashboard?tab=trainings`| Cancel enrollment within 7-day cutoff | Blocked if within 7 days; allowed if >= 7 days prior | Cutoff business rule | **PASS** |
| **TCK-01** | Support | `/dashboard?tab=support` | Create support ticket with category & message | Ticket created with unique UUID and status `OPEN` | `/api/v1/support/tickets` | **PASS** |
| **TCK-02** | Support | `/dashboard?tab=support` | Customer & Admin conversation exchange | Messages appended to timeline chronologically | `/api/v1/support/tickets/{id}/messages` | **PASS** |
| **TCK-03** | Support | `/admin/support` | Admin resolves ticket | Status transitions to `RESOLVED` | Admin role required | **PASS** |
| **NOTIF-01**| Notifications | Topbar Bell | Inspect notification counter | Unread counter matches unread events | `/api/v1/notifications/unread-count` | **PASS** |
| **NOTIF-02**| Notifications | Topbar Bell | Click "Mark all as read" | All notifications marked read, badge resets to 0 | `/api/v1/notifications/read-all` | **PASS** |
| **NOTIF-03**| Notifications | Topbar Bell | Click notification navigation link | Deep-links to target order, batch or ticket | Notification metadata URL | **PASS** |
| **ADM-01** | Admin Console | `/admin` | Overview analytics metrics cards render | Metrics agree with backend database counts | `/api/v1/admin/analytics` | **PASS** |
| **ADM-02** | Admin Console | `/admin/products` | Search, filter, and inspect catalog products | Table renders SKU, stock, price, status | `/api/v1/admin/products` | **PASS** |
| **ADM-03** | Admin Console | `/admin/inventory` | Replenish stock modal | Stock count updated atomically with audit trail | `/api/v1/admin/inventory/replenish` | **PASS** |
| **ADM-04** | Admin Console | `/admin/orders` | Inspect orders table & update status | Status transitions validated (e.g. PROCESSING -> SHIPPED)| `/api/v1/admin/orders` | **PASS** |
| **ADM-05** | Admin Console | `/admin/finance` | Inspect platform liability & withdrawal requests | Withdrawal records rendered with approve/reject actions | `/api/v1/admin/finance` | **PASS** |
| **ADM-06** | Admin Console | `/admin/training` | Manage courses, batches & view student rosters | Course and batch CRUD operational | `/api/v1/admin/training` | **PASS** |
| **ADM-07** | Admin Console | `/admin/support` | Helpdesk ticket queue & staff replies | Support tickets displayed with filter by status | `/api/v1/admin/support` | **PASS** |
| **ADM-08** | Admin Console | `/admin/shipping` | Initiate logistics shipment dispatch | Tracking number generated and order linked | `/api/v1/shipping/dispatch` | **PASS** |
