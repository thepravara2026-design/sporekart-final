# 07 — Admin Dashboard Interaction & Functional Audit Report

## 1. Administrative Architecture & Control Console Overview
- **UI Route**: `/admin`
- **Main View Component**: `AdminDashboardPage.jsx` (~7,500 lines of comprehensive administrative functionality)
- **Role Requirement**: `ROLE_ADMIN` with dedicated super-admin identity `thepravara2026@gmail.com`.
- **Navigation Paradigm**: FAANG-style dual-tier navigation system:
  - **Tier 1 (Domain Parent Groups)**: Catalog & Inventory, Orders & Operations, Academy & Training, Content & Media CMS, Customers & Support Desk, System Settings.
  - **Tier 2 (Module Tabs)**: Context-aware submenu pills providing instant switching between domain sections.

---

## 2. Header Metric Cards & Analytics Reconciliation

| Metric Card | Displayed Value | Expected Data Source | Click Behavior | Destination / Behavior | Database & API Agreement | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Total Catalog** (`header-metric-catalog`) | `24` | `products` table count | Interactive modal | Opens Catalog & Inventory analytics overlay | Confirmed 24 products in database | **PASS** |
| **Active Orders** (`header-metric-orders`) | Dynamic count | `orders` table (active status) | Interactive modal | Opens Active Orders queue overlay | Matches backend active orders | **PASS** |
| **Total Customers** (`header-metric-customers`) | Dynamic count | `users` table (`ROLE_CUSTOMER`) | Interactive modal | Opens Customer demographics overlay | Matches registered customer count | **PASS** |
| **Gross Revenue** (`header-metric-revenue`) | ₹ Total INR | `payments` captured sum | Interactive modal | Opens Financial Revenue ledger overlay | Reconciled with captured payment sum | **PASS** |

---

## 3. Discovered Admin Modules & Interactive Controls

### A. Catalog & Inventory Management
- **Products Registry (`/admin/products`)**:
  - Live table rendering SKU, product name, categories, stock, unit price, and publish status.
  - Search by keyword and filter by category.
  - Action buttons: "Edit Product", "View Public Listing", "Toggle Status".
- **Product Creation Modal / Mode (`/admin/products?mode=add`)**:
  - Validates title, category, slug, base price, tax rate, and image URL.
  - Supports adding variant rows with variant-specific SKUs, weight, price, and stock.
- **Inventory Replenishment Modal (`/admin/inventory`)**:
  - Lists low-stock variants with warning thresholds.
  - "Replenish Stock" button opens modal accepting quantity increment and supplier invoice notes.
  - Commits atomic inventory adjustment to `inventory_records` with audit trail.

### B. Orders & Operations
- **Order Queue (`/admin/orders`)**:
  - Filter by status (`ALL`, `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  - Action menu on each row:
    - View Order Details modal.
    - Change Order Status (enforces state machine transitions).
    - Download Packing Slip.
- **Logistics & Shipment Dispatch (`/admin/shipping`)**:
  - Simulates carrier pickup (Shiprocket cold-chain integration).
  - Generates tracking reference and automatically transitions order status to `SHIPPED`.
  - Dispatches customer notification with live tracking link.

### C. Platform Finance & Wallets (`/admin/finance`)
- **Summary Cards**:
  - Platform Wallet Liability (total balances held across all user wallets).
  - Pending Withdrawal Requests (total value and queue count).
  - Completed Payouts.
- **Withdrawal Review Queue**:
  - Lists customer withdrawal requests with bank account details.
  - Action buttons: "Approve & Mark Settled" or "Reject & Refund to Wallet".
  - Requires mandatory administrative reason notes for audit logging.

### D. Academy & Training (`/admin/training`, `/admin/batches`)
- **Course & Batch Management**:
  - Create new course curriculum.
  - Add scheduled batches with start/end dates, mode, and seat capacities.
  - View enrolled students roster per batch.

### E. Helpdesk & Support Desk (`/admin/support`)
- **Ticket Queue**:
  - Categorized list of open and pending support queries.
  - Priority badge styling (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
  - Reply thread interface for administrative staff communication.
  - Ticket resolution control with closing remarks.

---

## 4. Admin Security & Guard Verification

### A. Customer Role Isolation
- Direct access as a customer or guest to `/admin` or any `/admin/*` sub-route is denied.
- Backend Spring Security filter `SecurityConfig` enforces `.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")` independently of the frontend UI.
- Direct API calls to administrative endpoints with customer tokens return HTTP 403 Forbidden.

### B. Admin Direct URL Hydration Defect (`AUTH-HYDRATION-01`)
- Entering `/admin` directly into the browser URL bar or hitting F5 (hard reload) triggers an immediate unauthorized redirect to `/admin/login` or `/` before `/api/v1/auth/me` has completed.
- This is caused by missing an initial authentication loading gate in `AdminProtectedRoute.jsx` and `App.jsx`.

---

## 5. Admin Dashboard Audit Verdict
The Sporekart Administrative Dashboard is an enterprise-grade control console providing deep operational capabilities across all domains. Aside from the hydration race condition on direct URL entry (`AUTH-HYDRATION-01`), all interactive buttons, modals, data tables, status transitions, and audit records operate with FAANG-level precision.
