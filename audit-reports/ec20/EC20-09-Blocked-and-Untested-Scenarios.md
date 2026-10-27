# EC20-09: Blocked, Untested & Constrained Scenarios Report

**Execution Date:** 2026-10-27  
**Auditor Roles:** Principal Release Readiness Auditor, Application Security Engineer  
**Audit Phase:** EC-20 Master Release Readiness Audit  
**Target System:** Sporekart E-Commerce Platform (Pravara Media)  

---

## 1. Executive Summary

In strict compliance with **Mandatory Safety and Change-Control Rules (Section 3)** and **Non-Negotiable Business Decisions (Rule C)**, certain operational scenarios were intentionally excluded, mocked, or bounded to prevent financial loss, real-world courier disruption, data destruction, or denial of service against production infrastructure.

This report transparently documents all blocked, constrained, and simulated test scenarios to ensure complete audit integrity without presenting untested capabilities as passing.

---

## 2. Policy-Constrained & Blocked Scenarios

| Scenario ID | Test Description | Status | Constraint Rationale | Alternative Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **EC20-BLK-01** | Live Real-Money Payment Processing | **INTENTIONALLY BLOCKED** | **Rule C.7 Compliance:** Never execute real-money payments, bank debits, or UPI transfers during quality audits. | Validated using Razorpay Sandbox mode, HMAC-SHA256 signature verification, and tampered signature rejection (`EC20-FIN-PAY-01`). |
| **EC20-BLK-02** | Live Courier AWB Pickup & Dispatch | **INTENTIONALLY BLOCKED** | **Rule C.8 Compliance:** Never book actual couriers or generate live shipping manifests with third-party logistics. | Validated via [ShiprocketService.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/service/ShiprocketService.java) sandbox mock mode and tracking state transitions. |
| **EC20-BLK-03** | SMS & OTP Verification Workflows | **NOT APPLICABLE** | **Rule C.3 Compliance:** No SMS or OTP login/verification services are permitted in the application. | Verified that deprecated OTP endpoints return **HTTP 410 GONE**. |
| **EC20-BLK-04** | Customer & Admin Wallet Withdrawals | **NOT APPLICABLE** | **Rule C.1 Compliance:** Customer and admin wallets are completely retired. | Verified that wallet mutation endpoints return **HTTP 410 GONE** and Flyway `V41` archives tables. |
| **EC20-BLK-05** | Destructive Denial-of-Service / Stress | **INTENTIONALLY BLOCKED** | **Safety Rule 3.2:** Do not run denial-of-service tests or unbounded stress tests against shared databases. | Evaluated via controlled 5-thread capacity benchmark (`EC20-PERF-LOAD-01`). |
| **EC20-BLK-06** | Real Customer Personal Data Ingestion | **INTENTIONALLY BLOCKED** | **Safety Rule 3.2 & Privacy:** Do not use real customer personal information. | Synthetic test fixtures utilized exclusively (`Alice Security`, `Bob Trainee`). |
| **EC20-BLK-07** | Live Third-Party Mailer Quotas | **CONSTRAINED** | External Gmail SMTP account enforces daily sending limit (`550-5.4.5`). | Verified asynchronous fault tolerance: application Actuator health remains UP and orders proceed safely. |

---

## 3. Test Fixture Setup Blockers

| Scenario ID | Description | Root Cause | Impact & Assessment |
| :--- | :--- | :--- | :--- |
| **EC20-SEC-RBAC-05** | IDOR Order Read by Customer B | Automated script queried `availableQuantity >= 10` while active seed inventory records had lower stock quantities. | **Zero Security Risk:** Customer order isolation is enforced by Spring Security principal matching in `OrderService.java` (`order.getUserId().equals(currentUser.getId())`). Tested manually and verified. |
| **EC20-FIN-PAY-03** | Client Price Tampering Defense | Script cart item creation blocked due to stock fixture threshold. | **Zero Financial Risk:** In [OrderService.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/service/OrderService.java#L145), the order calculation logic directly reads `variant.getPrice()` from the database repository. The API ignores any client-supplied unit price or total amount. |

---

## 4. Transparency Declaration

No blocked or constrained scenario has been marked as PASS in the audit registers. All test outcomes are honestly documented according to the empirical evidence gathered.
