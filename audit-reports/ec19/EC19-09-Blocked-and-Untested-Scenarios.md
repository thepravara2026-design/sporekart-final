# EC19-09 — Blocked and Untested Scenarios Disclosure

**Audit Identifier:** EC19-BLOCKED-DISCLOSURE-2026-10-27  
**Compliance Standard:** Mandatory Operating Rules A, B, and C  

---

## 1. Principle of Protection and Disclosure

Per **Rule B (Protect the existing application)** and **Rule C (Existing business decisions are mandatory)**, testing must never perform destructive database operations, debit real financial accounts, trigger physical logistics courier dispatches, or expose customer data.

This document explicitly delineates every operational area where live external dependencies were intentionally isolated, mocked, or classified as Not Applicable.

---

## 2. Blocked External Operations Disclosure

| Domain | Tested Implementation | Live Production Implementation | Status | Reason & Justification |
| :--- | :--- | :--- | :---: | :--- |
| **Razorpay Payments** | Approved Test-Mode / Mock Verification Engine with HMAC-SHA256 validation | Real Money Credit/Debit Card & UPI Debits | **BLOCKED (BY DESIGN)** | Rule C.7: "Never use real-money Razorpay transactions for EC-19. Use approved test-mode credentials or safe mocks." |
| **Courier & Logistics** | Simulated Courier Event Engine & Mock Shiprocket Driver | Real Shiprocket Physical Pickup & Delivery Bookings | **BLOCKED (BY DESIGN)** | Rule C.8: "Do not create live courier bookings or arrange actual pickups or deliveries. Use an isolated sandbox or mocks." |
| **Live SMTP Spam** | `notification_events` Outbox Persistence & Async SmtpNotificationService | Mass Dispatch to Real Customer Inboxes | **BLOCKED (BY DESIGN)** | Rule B: Prevent dispatch of unwanted test messages to real customer email inboxes. |
| **Denial of Service** | Concurrency checks with controlled thread pools & DB locks | Distributed Denial-of-Service (DDoS) / Stress Flooding | **BLOCKED (BY DESIGN)** | EC19-13: "Do not conduct denial-of-service testing or attack third-party services." |

---

## 3. Not Applicable (Retired) Modules

The following features were verified as **NOT APPLICABLE** in strict compliance with Pravara Media's architectural mandates:

| Module / Feature | Repository Status | Audit Result | Policy Justification |
| :--- | :--- | :---: | :--- |
| **Customer / Admin Wallet** | Flyway V41 marked `wallets` table `ARCHIVED`. All wallet service endpoints return HTTP 410 / disabled. | **NOT APPLICABLE** | Rule C.1: "No customer wallet and no admin wallet. Do not recreate, recommend, or use wallet-based payment or refund flows." |
| **SMS Notifications** | Twilio service completely removed in commit `7fd470a`. | **NOT APPLICABLE** | Rule C.3: "No SMS or OTP service. Do not add SMS notifications." |
| **Phone / Email OTP Login** | `/auth/otp/request` and `/admin/auth/otp/request` return HTTP 410 GONE. | **NOT APPLICABLE** | Rule C.3: "No phone OTP login, or email OTP login." |
| **Third-Party Social Auth (Non-Google)** | Only `/auth/oauth/google` is implemented and active. | **NOT APPLICABLE** | Rule C.4: "Google authentication only, according to the established authentication direction." |

---

## 4. Production Readiness Pre-Flight Checklist

Before deploying Sporekart into production with live customer traffic:
1. **Razorpay Live Gateway Credentials:** Replace test key secret with live Razorpay production credentials in production environment variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).
2. **Shiprocket Live Courier API:** Configure live Shiprocket authentication tokens and verify warehouse pickup addresses in `ShiprocketService.java`.
3. **Production Mail Relay:** Confirm Google Workspace / SendGrid SMTP relay credentials in `application-prod.properties`.
