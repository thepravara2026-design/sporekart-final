# SPOREKART IN-APP NOTIFICATION SYSTEM ARCHITECTURE
**Document ID:** `DOC-NOTIF-002`  
**Status:** PROPOSED ARCHITECTURAL SPECIFICATION  
**Author:** Principal Software Architect  
**Date:** October 12, 2026  

---

## 1. ARCHITECTURAL OVERVIEW & DESIGN PRINCIPLES

The Sporekart In-App Notification System is designed as an integral subsystem of the modular monolith. It bridges domain business events with interactive user awareness channels (In-App Feed, Unread Badges, SMTP Emails, and SMS).

```
   [ Domain Business Events ]
   (Orders, Shipping, Payments, Training, Support, Content, Promotions)
                 |
                 v
   +-----------------------------------------------------------+
   |              NotificationEventService                     |
   |  - Recipient Resolution                                   |
   |  - Content & Action URL Formatting                        |
   |  - Idempotent Deduplication Key Generation                |
   +-----------------------------------------------------------+
                 |
                 v
   +-----------------------------------------------------------+
   |         Database Outbox (notification_events)             |
   |  - id, user_id, event_type, category, is_read, read_at    |
   |  - action_url, payload_json, deduplication_key            |
   |  - status (PENDING / SENT / FAILED)                       |
   +-----------------------------------------------------------+
         /                                               \
        /                                                 \
  (Asynchronous Polling Worker)                  (Synchronous REST API)
       v                                                   v
+--------------------------+                  +--------------------------+
|    NotificationWorker    |                  |  NotificationControllers |
|  - SMTP JavaMailSender   |                  |  - /unread-count         |
|  - Twilio SMS Service    |                  |  - /feed                 |
|  (Preserved Email Flow)  |                  |  - /{id}/read            |
+--------------------------+                  +--------------------------+
                                                           |
                                                           v
                                              +--------------------------+
                                              |  Frontend Navbar & Panel |
                                              |  - Unread Bell Badge     |
                                              |  - Slide-out Feed Panel  |
                                              |  - Optimistic Mark-Read  |
                                              |  - Internal Routing      |
                                              +--------------------------+
```

### Key Principles
1. **Decoupled & Non-blocking:** Notification persistence and delivery never block or fail the primary business transaction (such as payment processing, order placement, or wallet ledger updates).
2. **Dual-Channel Coexistence:** In-app notifications and SMTP emails are separate delivery channels sharing the same authoritative domain events. In-app reading does not suppress or alter email outbox states.
3. **Strict Data Privacy:** Recipient identity is derived from authenticated backend JWT tokens. Cross-user access is impossible.
4. **Idempotence & Deduplication:** Every event is protected by a deterministic deduplication key, preventing duplicate records from webhooks, retries, or multiple clicks.

---

## 2. COMPONENT DECOMPOSITION

### 2.1 Persistence Layer (`notification_events`)
- Serves as both the durable transactional outbox for external dispatchers (SMTP/SMS) and the source-of-truth store for in-app notification queries.
- Indexed by `(user_id, is_read, created_at DESC)` and `(is_admin_notification, is_read, created_at DESC)` to achieve sub-millisecond badge queries.

### 2.2 Event Detection & Emission Layer
- **Spring Application Events & Transactional Observers:** Listens to `OrderCreatedEvent`, `OrderDeliveredEvent`, `PaymentCapturedEvent`, and `EnrollmentConfirmedEvent` with `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.
- **Direct Service Integration:** Where domain events are not yet isolated as event classes (such as `SupportApplicationService`, `ShippingService`, `WalletService`, `BlogContentService`, `PromotionService`), the service invokes `notificationEventService.recordEvent(...)` within safe try-catch blocks.

### 2.3 API Layer
- `CustomerNotificationController`: Provides authenticated customer/trainee endpoints (`/api/v1/notifications`).
- `AdminNotificationController`: Provides operational feed endpoints (`/api/v1/admin/notifications/in-app`).
- Adheres to `ApiResponse<T>` unified wrapper convention.

### 2.4 Frontend Presentation Layer
- `Navbar.jsx`: Hosts the notification trigger button and badge counter.
- `NotificationPanel.jsx`: Reusable slide-out drawer rendering notification cards, category badges, unread filters, and mark-all-read action.
- `api.js`: Exposes typed methods with token management and auto-retry handling.
