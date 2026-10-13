# SPOREKART IN-APP NOTIFICATION SYSTEM ASSESSMENT & DESIGN PROPOSAL
**Phase 1 Production Engineering Deliverable**  
**Document ID:** `DOC-NOTIF-001`  
**Status:** PROPOSED — PENDING EXPLICIT USER APPROVAL  
**Author:** Principal Software Architect & Engineering Team  
**Date:** October 12, 2026  

---

## 1. EXECUTIVE SUMMARY & OBJECTIVE

This document presents the Phase 1 engineering assessment and detailed architectural design proposal for implementing a production-grade, database-backed **In-App Notification System** across Sporekart.

Sporekart currently has an asynchronous notification outbox queue (`notification_events`) used exclusively for SMTP emails and Twilio SMS. However, users (Customers, Trainees, and Administrators) have no interactive in-app notification center:
- There is no UI notification bell icon, unread badge counter, or notification drawer/panel.
- There are no read/unread tracking fields in the database schema (`is_read`, `read_at`).
- There are no in-app read-state APIs (`GET /unread-count`, `PATCH /{id}/read`, `PATCH /read-all`).
- Key business events (Blog publications, Promotion announcements, Course batch notices, Ticket updates, and Administrator operational alerts) do not produce structured in-app notifications.

This proposal defines a non-invasive, backward-compatible extension to the existing architecture that achieves 100% of the functional requirements while preserving existing SMTP delivery flows and business logic without regression.

---

## 2. PHASE 0 BASELINE AUDIT

### 2.1 Git Working Tree & Branch Status
- **Active Branch:** `dev`
- **Working Tree:** Contains uncommitted additions and improvements related to admin single-entity access governance and schema migrations. All uncommitted changes will be preserved intact.

### 2.2 Existing Architecture Overview
- **Backend:** Spring Boot 3.3.3, Java 21, Spring Security, Hibernate ORM 6.5.2, Flyway 10.x.
- **Frontend:** React 18, Vite 5, Tailwind CSS, Lucide React icons, React Router DOM 6.
- **Database:** Supabase PostgreSQL 17 (remote pooler at `aws-0-ap-northeast-1.pooler.supabase.com:6543`), 34 Flyway migrations applied (`v1` through `v34`).
- **Existing Delivery Service:** `NotificationEventService` writes to `notification_events` table; `NotificationWorker` runs a scheduled polling loop (`@Scheduled(fixedDelay = 10000)`) sending HTML emails via `JavaMailSender` and SMS via `TwilioSmsService`.

### 2.3 Baseline Test Results
- **Frontend Tests:** 79 tests across 15 test suites passed (`npm test -- --run`).
- **Backend Test Compilation:** Clean build (`mvn test-compile` passed).
- **Known Pre-existing Baseline Issue:** `OrderServiceUnitTest` had 6 unit test failures caused by `userRepository` not being initialized in mock-based constructor setup in that specific unit test file. This pre-existing failure is documented to distinguish it from any future notification test runs.

---

## 3. EXISTING NOTIFICATION CAPABILITIES & INTEGRATION GAPS

| Capability | Current State | Target State | Integration Gap |
|---|---|---|---|
| **Outbox Persistence** | `notification_events` table with UUID, event_type, payload_json, deduplication_key | Extend table with `is_read`, `read_at`, `action_url`, `target_role`, `is_admin_notification` | Missing read-tracking, navigation URL, and role-targeting columns |
| **In-App Query APIs** | Only `GET /api/v1/notifications` returning raw outbox rows | Clean DTOs for `GET /api/v1/notifications`, `GET /unread-count`, `PATCH /{id}/read`, `PATCH /read-all` | No unread query or state mutation endpoints |
| **Admin Notifications** | `AdminNotificationController` only provides outbox email retry | Dedicated operational notification stream with unread count and mark-read | Administrators lack operational alert stream |
| **Frontend UI** | None (No bell icon, drawer, or badge) | Bell icon in Navbar with unread badge, interactive slide-out panel, filters, action links | Completely absent on frontend |
| **Blog Notifications** | None | `BLOG_PUBLISHED` in-app notification to all customer/trainee users | No trigger on blog publication |
| **Promotion Notifications** | None | `PROMOTION_PUBLISHED` in-app notification targeting eligible audiences | No trigger on promotion creation |
| **Training Batches & Notices** | Only `ENROLLMENT_CONFIRMED` | `TRAINING_BATCH_PUBLISHED`, `TRAINING_ANNOUNCEMENT`, `ENROLLMENT_CANCELLED` | Batch and schedule notices not emitted |
| **Support Tickets** | Only `SUPPORT_TICKET_CLOSED` | `SUPPORT_TICKET_CREATED`, `SUPPORT_TICKET_REPLY_RECEIVED`, `SUPPORT_TICKET_STATUS_CHANGED` | Initial ticket and message replies not emitted |
| **SMTP Coexistence** | Working (`NotificationWorker` sends HTML emails) | Preserved 100% untouched. In-app notifications do not interfere with email dispatch | Channels operate independently |

---

## 4. PROPOSED NOTIFICATION EVENT CATALOGUE

| Event Identifier | Category | Target Audience | Authoritative Trigger | Navigation URL | SMTP Action |
|---|---|---|---|---|---|
| `ORDER_CONFIRMED` | ORDER | Customer (`userId`) | `OrderService` / `PaymentService` verification | `/dashboard?tab=orders&orderId={id}` | Existing Email Preserved |
| `ORDER_CANCELLED` | ORDER | Customer (`userId`) | `OrderService.cancelOrder()` / `updateOrderStatus(CANCELLED)` | `/dashboard?tab=orders&orderId={id}` | Existing Email Preserved |
| `ORDER_PACKED` | ORDER | Customer (`userId`) | `OrderService.updateOrderStatus(PROCESSING)` | `/dashboard?tab=orders&orderId={id}` | Existing Email Preserved |
| `SHIPMENT_DISPATCHED` | SHIPPING | Customer (`userId`) | `ShippingService` AWB assignment / carrier pickup | `/dashboard?tab=orders&orderId={id}` | Existing Email Preserved |
| `SHIPMENT_IN_TRANSIT` | SHIPPING | Customer (`userId`) | `ShippingService.processWebhookUpdate(IN_TRANSIT)` | `/dashboard?tab=orders&orderId={id}` | Existing Email Preserved |
| `ORDER_DELIVERED` | SHIPPING | Customer (`userId`) | `ShippingService.processWebhookUpdate(DELIVERED)` | `/dashboard?tab=orders&orderId={id}` | Existing Email Preserved |
| `WALLET_TOPUP_SUCCESS` | WALLET | Customer (`userId`) | `WalletService.creditWallet(TOPUP)` | `/dashboard?tab=wallet` | Existing Email Preserved |
| `WALLET_REFUND_CREDIT` | WALLET | Customer (`userId`) | `WalletService.processRefundToWallet()` | `/dashboard?tab=wallet` | Existing Email Preserved |
| `WALLET_PAYMENT_SUCCESS` | WALLET | Customer (`userId`) | `WalletService.debitWallet()` | `/dashboard?tab=wallet` | Existing Email Preserved |
| `WALLET_WITHDRAWAL_REQUESTED`| WALLET | Customer (`userId`) | `WalletService.requestWithdrawal()` | `/dashboard?tab=wallet` | Existing Email Preserved |
| `WALLET_WITHDRAWAL_COMPLETED`| WALLET | Customer (`userId`) | `WalletService.completeWithdrawal()` | `/dashboard?tab=wallet` | Existing Email Preserved |
| `WALLET_WITHDRAWAL_REVERSED` | WALLET | Customer (`userId`) | `WalletService.rejectWithdrawal()` | `/dashboard?tab=wallet` | Existing Email Preserved |
| `ENROLLMENT_CONFIRMED` | TRAINING | Trainee (`userId`) | `TrainingService.confirmEnrollmentPayment()` | `/dashboard?tab=training` | Existing Email Preserved |
| `ENROLLMENT_CANCELLED` | TRAINING | Trainee (`userId`) | `TrainingService.cancelEnrollment()` | `/dashboard?tab=training` | Existing Email Preserved |
| `TRAINING_BATCH_PUBLISHED` | TRAINING | Trainees / Customers | `TrainingService.createBatch()` | `/training/{courseSlug}` | In-app notification only |
| `TRAINING_ANNOUNCEMENT` | TRAINING | Enrolled Trainees | `TrainingService.addBatchSchedule()` | `/dashboard?tab=training` | In-app notification only |
| `BLOG_PUBLISHED` | CONTENT | All Users | `BlogContentService.publishPost()` | `/blog/{slug}` | In-app notification only |
| `PROMOTION_PUBLISHED` | PROMOTION | Target Audience | `PromotionService.createPromotion()` | `/products` or `/promotions` | In-app notification only |
| `SUPPORT_TICKET_CREATED` | SUPPORT | Customer & Admin | `SupportApplicationService.createTicket()` | `/dashboard?tab=support` & `/admin?tab=support` | In-app notification only |
| `SUPPORT_TICKET_REPLY` | SUPPORT | Ticket Owner / Admin | `SupportApplicationService.addMessageToTicket()`| `/dashboard?tab=support` & `/admin?tab=support` | In-app notification only |
| `SUPPORT_TICKET_CLOSED` | SUPPORT | Ticket Owner (`userId`)| `SupportApplicationService.closeTicketWithCsat()` | `/dashboard?tab=support` | Existing Email Preserved |
| `ADMIN_NEW_ORDER` | ADMIN | Admin (`ROLE_ADMIN`)| High-value / Confirmed Order | `/admin?tab=orders&id={id}` | Admin Alert (In-App) |
| `ADMIN_ORDER_CANCELLED` | ADMIN | Admin (`ROLE_ADMIN`)| Customer Order Cancellation | `/admin?tab=orders&id={id}` | Admin Alert (In-App) |
| `ADMIN_WITHDRAWAL_REQUESTED`| ADMIN | Admin (`ROLE_ADMIN`)| Wallet Withdrawal Submitted | `/admin?tab=wallet` | Admin Alert (In-App) |
| `ADMIN_PAYMENT_FAILURE` | ADMIN | Admin (`ROLE_ADMIN`)| Failed Verification / Razorpay Webhook | `/admin?tab=payments` | Admin Alert (In-App) |

---

## 5. DATABASE SCHEMA PROPOSAL

### 5.1 Schema Migration (`V35__enhance_notifications_for_in_app.sql`)
To avoid duplicating tables and maintain atomic transactionality with the existing outbox, we extend `notification_events`:

```sql
-- Flyway Migration V35: Enhance Notification Events for In-App Notification Center
ALTER TABLE notification_events 
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS action_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS target_role VARCHAR(50) DEFAULT 'ROLE_CUSTOMER',
    ADD COLUMN IF NOT EXISTS is_admin_notification BOOLEAN NOT NULL DEFAULT FALSE;

-- High-performance composite indexes for instant notification badge and feed queries
CREATE INDEX IF NOT EXISTS idx_notification_events_in_app_feed 
    ON notification_events(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_events_admin_in_app 
    ON notification_events(is_admin_notification, is_read, created_at DESC);
```

### 5.2 Deduplication Strategy
- Every notification continues to enforce unique constraint on `deduplication_key`.
- Pattern: `{EVENT_TYPE}:{ENTITY_ID}:{RECIPIENT_OR_ACTION}` (e.g., `ORDER_CONFIRMED:c4a8...:USER`, `ADMIN_NEW_ORDER:c4a8...`).
- Repetitive webhooks or retries will gracefully no-op without creating duplicate entries or noisy popups.

---

## 6. BACKEND ARCHITECTURE & API CONTRACT

### 6.1 Clean DTO Structure (`NotificationDto.java`)
Never expose internal provider credentials, stack traces, SMS IDs, or raw outbox internals to the frontend.
```json
{
  "id": "UUID",
  "eventType": "ORDER_CONFIRMED",
  "category": "ORDER",
  "title": "Order #SK-1004 Confirmed 🍄",
  "message": "Your order for 2 items totaling ₹850.00 has been received.",
  "isRead": false,
  "readAt": null,
  "actionUrl": "/dashboard?tab=orders&id=c4a8...",
  "createdAt": "2026-10-12T09:15:00Z"
}
```

### 6.2 Customer & Trainee Endpoints (`CustomerNotificationController.java`)
- `GET /api/v1/notifications` — Returns paginated notifications for authenticated user principal (`page`, `size`, `unreadOnly`).
- `GET /api/v1/notifications/unread-count` — Returns `{"unreadCount": 3}` via indexed count query.
- `PATCH /api/v1/notifications/{id}/read` — Marks a specific notification as read (validates that `notification.userId == authenticatedPrincipal.id`).
- `PATCH /api/v1/notifications/read-all` — Marks all unread notifications as read for the authenticated user.

### 6.3 Administrator Endpoints (`AdminNotificationController.java`)
- `GET /api/v1/admin/notifications/feed` — Paginated operational notifications (`is_admin_notification=true`).
- `GET /api/v1/admin/notifications/unread-count` — Unread count for operational feed.
- `PATCH /api/v1/admin/notifications/{id}/read` — Mark operational alert as read.
- `PATCH /api/v1/admin/notifications/read-all` — Mark all operational alerts as read.
- Strictly guarded by `@PreAuthorize("hasRole('ROLE_ADMIN')")`.

---

## 7. FRONTEND USER EXPERIENCE PROPOSAL

### 7.1 Navbar Notification Bell & Badge
- Placed in `Navbar.jsx` between Global Search and Cart/Profile.
- Displays animated badge indicator when `unreadCount > 0` (capped at `99+`).
- Accessible keyboard navigation (`aria-label`, `aria-expanded`, ESC key dismissal).
- Visible only for authenticated sessions; hidden for guests.

### 7.2 Interactive Notification Drawer / Panel (`NotificationPanel.jsx`)
- Slide-over drawer on mobile / floating card on desktop.
- Header contains unread count badge, "Filter unread", and "Mark all as read" button.
- Notification item features:
  - Visual read/unread distinction (soft green left accent bar + unread dot).
  - Category icon (Sprout for orders, Truck for shipping, Wallet for financial, GraduationCap for training, BookOpen for blog, Ticket for support, Shield for admin).
  - Relative timestamp ("Just now", "10m ago", "Yesterday").
  - Title and concise message.
- Clicking an item:
  - Immediately updates UI optimistically and fires background `PATCH /{id}/read`.
  - Navigates to the valid internal destination (`actionUrl`).
  - Closes the panel.
- Empty state: Clean illustration and helpful message ("You're all caught up!").
- Error/Retry state with non-blocking feedback.

### 7.3 Auto-Refresh & Background Polling
- Configured polling interval: 45 seconds when window is active.
- Pauses polling when document tab is hidden (`visibilitychange` API) to eliminate unnecessary backend requests.
- Immediate refresh triggered after significant user actions (e.g. checkout completion, ticket reply submission, enrollment).

---

## 8. SECURITY & PRIVACY CONTROLS

1. **Strict User Isolation:** Notification queries automatically bind to `authentication.getName()` / `userId`. Users can never query, read, or mark notifications belonging to other accounts.
2. **Admin Operational Boundary:** Admin notifications are strictly isolated behind `ROLE_ADMIN` checks; customers/trainees can never see administrative alerts.
3. **Safe Navigation URLs:** All `actionUrl` values are validated against an allowlist of internal relative paths (`/dashboard`, `/admin`, `/blog`, `/training`, `/products`). No arbitrary external redirects or protocol schemes (`javascript:`, `http://`) are permitted.
4. **Data Sanitization:** Notification titles and messages are strictly plain text, sanitized to prevent XSS. No sensitive credentials, Razorpay secret tokens, or customer passwords are ever written into notification records.
5. **Rate Limiting & Bounded Pagination:** Max page size capped at 50 records to prevent denial-of-service query patterns.

---

## 9. DETAILED MODIFICATION MATRIX

| Component | Target File | Problem / Requirement | Expected Impact | Regression Risk | Test Verification |
|---|---|---|---|---|---|
| **Database** | `V35__enhance_notifications_for_in_app.sql` | `notification_events` lacks read tracking & navigation URL | Non-destructive column additions with default values | Very Low (additive schema) | Flyway migration test on clean schema |
| **Domain** | `NotificationEvent.java` | Missing fields for `isRead`, `readAt`, `actionUrl`, `category`, `targetRole`, `isAdminNotification` | Java entity matches enhanced schema | Low | JPA entity validation test |
| **Repository** | `NotificationEventRepository.java` | Needs high-speed unread counting and user feed pagination | Optimized JPQL queries with composite index | Low | Repository unit & integration tests |
| **Service** | `NotificationEventService.java` | Needs methods to mark read, mark all read, record in-app alerts | Unifies outbox creation and in-app feeds | Low | Service layer unit tests |
| **Controllers** | `CustomerNotificationController.java` & `AdminNotificationController.java` | Missing read-state and unread-count endpoints | Exposes clean, authenticated REST contracts | Low | MockMvc authorization & response tests |
| **Event Triggers** | `BlogContentService.java`, `PromotionService.java`, `SupportApplicationService.java`, `TrainingService.java` | Missing in-app event emissions on publish / updates | Domain actions emit in-app notifications | Low (wrapped in try-catch so core domain logic never fails) | Service integration tests |
| **Frontend API** | `frontend/src/api.js` | Needs notification API helper functions | Provides typed client for notification endpoints | None | Frontend mock API tests |
| **Frontend UI** | `frontend/src/components/NotificationCenter.jsx` & `Navbar.jsx` | Missing bell icon, badge counter, and notification feed | Rich notification UX integrated in Navbar | Low | React component & user flow tests |

---

## 10. DEPENDENCY & EXCLUSION DECLARATION

### 10.1 Complete & Ready Dependencies
- Existing `notification_events` table and outbox pattern.
- Existing `NotificationWorker` and SMTP JavaMailSender configuration.
- Existing domain events: `OrderCreatedEvent`, `OrderDeliveredEvent`, `PaymentCapturedEvent`, `EnrollmentConfirmedEvent`.
- Existing UI design system and Tailwind tokens.

### 10.2 Features Explicitly Excluded (Out of Scope)
- **External WebSockets / STOMP Broker:** Polling (45s) provides instant, reliable synchronization without introducing stateful connection servers or socket broker dependencies.
- **SMS / Push Provider Expansion:** Twilio and SMTP are preserved as-is; no Firebase Cloud Messaging (FCM), APNs, or new third-party vendors will be introduced.
- **Modifying Core Financial or Inventory Logic:** Notification recording is strictly downstream and non-blocking. An error in notification generation will never roll back a successful payment, order, or wallet transaction.

---

## 11. NEXT STEPS & APPROVAL GATE

Per Phase 1 instructions:
> **STOP after completing the assessment. Wait for explicit approval before implementing changes.**

We await the user's explicit review and approval of this assessment before proceeding to **Phase 2 (Controlled Implementation)**.
