# 06 — Support Ticket & In-App Notification System Report

## 1. Customer Support Ticket & Helpdesk Lifecycle

### A. Ticket Submission & Creation
- **Submission Channels**:
  - Direct form on Contact Page (`/contact`).
  - Helpdesk tab on Customer Dashboard (`/dashboard?tab=support`).
  - API endpoint: `POST /api/v1/support/tickets`.
- **Form Fields & Validation**:
  - `subject`: Summary title of query (min 5, max 120 chars).
  - `category`: `GENERAL_INQUIRY`, `ORDER_ISSUE`, `PAYMENT_PROBLEM`, `TRAINING_INQUIRY`, `SPAWN_CULTURE_SUPPORT`.
  - `priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `message`: Description of query or problem.
- **State Initialization**:
  - New tickets are created with a unique UUID in `OPEN` status.
  - Linked to the submitting customer's account (`customer_id`).
  - Creates an in-app administrative notification alerting staff to the new ticket.

### B. Bi-Directional Conversation Exchange (`TICKET-02`)
- **Conversation Threading**:
  - Messages are stored in `support_messages` referencing `ticket_id`.
  - Customer can submit follow-up replies via `POST /api/v1/support/tickets/{id}/messages`.
  - Admin replies from the Admin Control Console via `POST /api/v1/admin/support/tickets/{id}/reply`.
  - When the admin replies, the customer receives an in-app notification linking to the ticket.
- **Status Progression**:
  - `OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`.
  - Admin can update status and record resolution notes.
  - Customer can view full conversation timeline and timestamped staff replies.

### C. Multi-Tenant Support Isolation (`SCENARIO-K`)
- Customer A cannot query or message on Customer B's tickets.
- Submitting an update to an alien ticket returns HTTP 403 Forbidden or 404 Not Found.

---

## 2. In-App Notification System Validation

### A. Notification Center Architecture
- **Component**: `NotificationCenter.jsx` embedded in the global navigation topbar.
- **Triggers**:
  - Bell icon with unread count badge (e.g. `27 unread`).
  - Polls `/api/v1/notifications/unread-count` periodically and updates when window regains visibility.
  - Clicking bell opens an interactive sliding notification feed panel.

### B. Event Type Coverage
The application produces dedicated in-app notification events for:
1. **Order Placed**: `ORDER_PLACED` (Customer & Admin)
2. **Order Shipped**: `ORDER_SHIPPED` (Customer with tracking URL)
3. **Order Cancelled**: `ORDER_CANCELLED` (Customer & Admin)
4. **Payment Received**: `PAYMENT_SUCCESS` (Customer)
5. **Refund Queued**: `REFUND_INITIATED` (Customer)
6. **Wallet Top-Up Credited**: `WALLET_TOPUP_CREDITED` (Customer)
7. **Withdrawal Requested**: `WALLET_WITHDRAWAL_REQUESTED` (Customer & Admin)
8. **Training Enrolled**: `TRAINING_ENROLLED` (Trainee & Admin)
9. **Support Ticket Created/Replied**: `TICKET_UPDATE` (Customer & Admin)

### C. Read/Unread State & Deep-Link Navigation
- Individual notification click:
  - Calls `PATCH /api/v1/notifications/{id}/read`.
  - Closes panel and navigates immediately to the relevant entity (e.g. `/dashboard?tab=orders&id=...`).
- "Mark all as read" button:
  - Calls `POST /api/v1/notifications/read-all`.
  - Resets unread badge to 0 instantly in UI state and database.
  - State persists cleanly across full page reloads.

---

## 3. Ticketing & Notification Status Summary
- **Ticket Creation (API)**: **PASS**
- **Ticket Creation (Dashboard UI)**: **PASS**
- **Customer-Admin Conversation Exchange**: **PASS**
- **Ticket Resolution & Status Transitions**: **PASS**
- **Multi-Tenant Ticket Isolation**: **PASS**
- **Notification Generation across Events**: **PASS**
- **Unread Counter Synchronization**: **PASS**
- **Mark as Read / Mark All as Read**: **PASS**
- **Deep-Link URL Traversal**: **PASS**
