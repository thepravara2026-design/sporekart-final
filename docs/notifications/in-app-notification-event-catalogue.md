# SPOREKART IN-APP NOTIFICATION EVENT CATALOGUE
**Document ID:** `DOC-NOTIF-003`  
**Status:** SPECIFICATION  
**Author:** Lead Software Architect  
**Date:** October 12, 2026  

---

## 1. COMPREHENSIVE EVENT SPECIFICATIONS

### 1.1 Customer & Trainee Events

#### `ORDER_CONFIRMED`
- **Category:** `ORDER`
- **Trigger:** Razorpay payment capture or order checkout confirmation.
- **Recipient:** Customer account (`order.userId`).
- **Title:** `Order #{orderNumber} Confirmed 🍄`
- **Message:** `Your order for {itemCount} items totaling ₹{totalAmount} has been received and confirmed.`
- **Action URL:** `/dashboard?tab=orders&id={orderId}`
- **Deduplication Key:** `ORDER_CONFIRMED:{orderId}`
- **SMTP Channel:** Order Confirmation Email (`OrderService` / `NotificationWorker`).

#### `ORDER_CANCELLED`
- **Category:** `ORDER`
- **Trigger:** Customer cancellation or administrative cancellation in `OrderService.cancelOrder()`.
- **Recipient:** Customer account (`order.userId`).
- **Title:** `Order #{orderNumber} Cancelled`
- **Message:** `Your order #{orderNumber} has been cancelled. Refund of ₹{refundAmount} credited to your Sporekart Wallet.`
- **Action URL:** `/dashboard?tab=orders&id={orderId}`
- **Deduplication Key:** `ORDER_CANCELLED:{orderId}`
- **SMTP Channel:** Order Cancellation Email.

#### `ORDER_PACKED`
- **Category:** `ORDER`
- **Trigger:** Status transition to `PROCESSING` / Packed.
- **Recipient:** Customer account (`order.userId`).
- **Title:** `Order #{orderNumber} Packed & Ready`
- **Message:** `Your mushroom spawn order is freshly packed and scheduled for courier dispatch.`
- **Action URL:** `/dashboard?tab=orders&id={orderId}`
- **Deduplication Key:** `ORDER_PACKED:{orderId}`
- **SMTP Channel:** Order Status Email.

#### `SHIPMENT_DISPATCHED`
- **Category:** `SHIPPING`
- **Trigger:** Courier AWB assignment and pickup in `ShippingService`.
- **Recipient:** Customer account (`order.userId`).
- **Title:** `Order #{orderNumber} Dispatched 🚚`
- **Message:** `Your package has been handed over to {courierName} with Tracking AWB: {awbCode}.`
- **Action URL:** `/dashboard?tab=orders&id={orderId}`
- **Deduplication Key:** `SHIPMENT_DISPATCHED:{shipmentId}`
- **SMTP Channel:** Shipping Notice Email.

#### `SHIPMENT_IN_TRANSIT`
- **Category:** `SHIPPING`
- **Trigger:** Courier tracking webhook event `IN_TRANSIT`.
- **Recipient:** Customer account (`order.userId`).
- **Title:** `Shipment Update: In Transit 📦`
- **Message:** `Your package is on its way. Current location: {location}.`
- **Action URL:** `/dashboard?tab=orders&id={orderId}`
- **Deduplication Key:** `SHIPMENT_IN_TRANSIT:{shipmentId}:{timestamp}`
- **SMTP Channel:** None (In-App only).

#### `ORDER_DELIVERED`
- **Category:** `SHIPPING`
- **Trigger:** Courier webhook event `DELIVERED` or delivery confirmation.
- **Recipient:** Customer account (`order.userId`).
- **Title:** `Order #{orderNumber} Delivered 🎉`
- **Message:** `Your order has been successfully delivered. Thank you for cultivating with Sporekart!`
- **Action URL:** `/dashboard?tab=orders&id={orderId}`
- **Deduplication Key:** `ORDER_DELIVERED:{orderId}`
- **SMTP Channel:** Delivery Confirmation Email.

#### `WALLET_TOPUP_SUCCESS`
- **Category:** `WALLET`
- **Trigger:** Credit to customer wallet in `WalletService.creditWallet()`.
- **Recipient:** Customer account (`userId`).
- **Title:** `Wallet Credited: ₹{amount}`
- **Message:** `₹{amount} has been added to your Sporekart Wallet. New balance: ₹{balance}.`
- **Action URL:** `/dashboard?tab=wallet`
- **Deduplication Key:** `WALLET_TOPUP:{transactionId}`
- **SMTP Channel:** Transactional Email.

#### `WALLET_REFUND_CREDIT`
- **Category:** `WALLET`
- **Trigger:** Order refund credited to wallet in `WalletService.processRefundToWallet()`.
- **Recipient:** Customer account (`userId`).
- **Title:** `Refund Credited: ₹{amount}`
- **Message:** `₹{amount} for Order #{orderNumber} was credited to your Sporekart Wallet balance.`
- **Action URL:** `/dashboard?tab=wallet`
- **Deduplication Key:** `WALLET_REFUND:{transactionId}`
- **SMTP Channel:** Refund Credit Email.

#### `ENROLLMENT_CONFIRMED`
- **Category:** `TRAINING`
- **Trigger:** Course enrollment payment completion in `TrainingService.confirmEnrollmentPayment()`.
- **Recipient:** Trainee account (`userId`).
- **Title:** `Enrollment Confirmed: {courseTitle} 🎓`
- **Message:** `You are enrolled in Batch {batchCode}. Access your live sessions and syllabus in your dashboard.`
- **Action URL:** `/dashboard?tab=training`
- **Deduplication Key:** `ENROLLMENT_CONFIRMED:{enrollmentId}`
- **SMTP Channel:** Training Confirmation Email.

#### `TRAINING_ANNOUNCEMENT`
- **Category:** `TRAINING`
- **Trigger:** Batch schedule or announcement added in `TrainingService.addBatchSchedule()`.
- **Recipient:** Trainee accounts enrolled in that specific batch.
- **Title:** `Training Update: {batchCode}`
- **Message:** `New session announced: "{topic}" scheduled for {date}. Meeting link is ready.`
- **Action URL:** `/dashboard?tab=training`
- **Deduplication Key:** `TRAINING_ANNOUNCEMENT:{scheduleId}:{userId}`
- **SMTP Channel:** None (In-App only).

#### `BLOG_PUBLISHED`
- **Category:** `CONTENT`
- **Trigger:** Article publication in `BlogContentService.publishPost()`.
- **Recipient:** All active customers and trainees.
- **Title:** `New Grower Guide: {postTitle} 📖`
- **Message:** `{summary}`
- **Action URL:** `/blog/{slug}`
- **Deduplication Key:** `BLOG_PUBLISHED:{postId}:{userId}`
- **SMTP Channel:** None (In-App only).

#### `PROMOTION_PUBLISHED`
- **Category:** `PROMOTION`
- **Trigger:** Creation of active promo code in `PromotionService.createPromotion()`.
- **Recipient:** Eligible audience accounts (`CUSTOMER` or `TRAINEE`).
- **Title:** `Special Offer: {promotionName} 🏷️`
- **Message:** `Use code {code} to get {discount} on your next order.`
- **Action URL:** `/products`
- **Deduplication Key:** `PROMOTION_PUBLISHED:{promoId}:{userId}`
- **SMTP Channel:** None (In-App only).

#### `SUPPORT_TICKET_CREATED`
- **Category:** `SUPPORT`
- **Trigger:** Ticket submission in `SupportApplicationService.createTicket()`.
- **Recipient:** Customer account (`userId`).
- **Title:** `Support Ticket Received: #{ticketNumber}`
- **Message:** `Your request regarding "{subject}" has been received. Our agritech support team is reviewing it.`
- **Action URL:** `/dashboard?tab=support`
- **Deduplication Key:** `SUPPORT_TICKET_CREATED:{ticketId}`
- **SMTP Channel:** None (In-App only).

#### `SUPPORT_TICKET_CLOSED`
- **Category:** `SUPPORT`
- **Trigger:** Ticket resolution in `SupportApplicationService.closeTicketWithCsat()`.
- **Recipient:** Customer account (`userId`).
- **Title:** `Support Ticket Closed: #{ticketNumber}`
- **Message:** `Your ticket #{ticketNumber} has been resolved and closed. Thank you for your feedback!`
- **Action URL:** `/dashboard?tab=support`
- **Deduplication Key:** `SUPPORT_TICKET_CLOSED:{ticketId}`
- **SMTP Channel:** Ticket Resolution Email.

---

### 1.2 Administrator Operational Alerts

#### `ADMIN_NEW_ORDER`
- **Trigger:** New order placed and confirmed.
- **Recipient:** Admin operational stream (`ROLE_ADMIN`).
- **Title:** `New Order #{orderNumber} Received`
- **Message:** `Order value ₹{totalAmount} ({itemCount} items) placed by {customerName}.`
- **Action URL:** `/admin?tab=orders&id={orderId}`
- **Deduplication Key:** `ADMIN_NEW_ORDER:{orderId}`

#### `ADMIN_ORDER_CANCELLED`
- **Trigger:** Order cancelled by customer.
- **Recipient:** Admin operational stream (`ROLE_ADMIN`).
- **Title:** `Order #{orderNumber} Cancelled by Customer`
- **Message:** `Reason: {reason}. Refund of ₹{refundAmount} processed.`
- **Action URL:** `/admin?tab=orders&id={orderId}`
- **Deduplication Key:** `ADMIN_ORDER_CANCELLED:{orderId}`

#### `ADMIN_WITHDRAWAL_REQUESTED`
- **Trigger:** Customer requests wallet withdrawal in `WalletService.requestWithdrawal()`.
- **Recipient:** Admin operational stream (`ROLE_ADMIN`).
- **Title:** `Wallet Withdrawal Request: ₹{amount}`
- **Message:** `User {userId} submitted withdrawal request to bank/UPI. Requires verification.`
- **Action URL:** `/admin?tab=wallet`
- **Deduplication Key:** `ADMIN_WITHDRAWAL_REQUESTED:{withdrawalId}`

#### `ADMIN_PAYMENT_FAILURE`
- **Trigger:** Razorpay webhook reports verification failure or charge error.
- **Recipient:** Admin operational stream (`ROLE_ADMIN`).
- **Title:** `Payment Verification Issue`
- **Message:** `Payment reference {paymentId} for Order #{orderNumber} failed verification.`
- **Action URL:** `/admin?tab=payments`
- **Deduplication Key:** `ADMIN_PAYMENT_FAILURE:{paymentId}`
