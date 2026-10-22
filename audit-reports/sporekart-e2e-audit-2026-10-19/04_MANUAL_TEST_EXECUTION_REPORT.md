# 04 — Manual Test Execution & Operator Verification Report

**Execution Date:** October 19, 2026  
**Target Application:** Sporekart E-Commerce & Agritech Platform  
**Standard Operating Procedure:** Strictly separating AI automated script execution from Human Operator physical verifications.  

---

## 1. Boundary Principle
- **AI / Automated Test Scope:** Software execution, script simulation, and assertion testing performed programmatically are documented under `03_AUTOMATED_TEST_EXECUTION_REPORT.md`.
- **Human Operator Scope:** Verification involving physical mobile hardware, real cellular carriers, physical thermal printers, physical mailboxes, and visual touch ergonomics.

---

## 2. Operator Manual Test Verification Log

| Test Identifier | Manual Test Scenario | Verification Protocol | Performed By | Execution Status | Observational Findings |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **MAN-UI-01** | Mobile Browser Visual Rendering & Touch Targets | Open site on iOS Safari (iPhone 14) & Android Chrome (Pixel 7); test sticky CTA button, hamburger drawer, and payment sheet. | Authorized Human Operator | **PASS** | UI renders cleanly; sticky cart bar accessible on 375px viewport; touch targets meet 44x44px minimum. |
| **MAN-PAY-01** | Real Razorpay UPI Mobile App Intent | Trigger live UPI checkout on Android device; open Google Pay / PhonePe; complete ₹1 payment. | Authorized Human Operator | **BLOCKED / SKIPPED** | Live UPI payments disabled in staging environment (mock gateway active). Verified via simulated gateway in E2E suite. |
| **MAN-SMS-01** | Real Twilio Physical SMS Reception | Trigger order confirmation to physical Indian phone number (+91); verify SMS delivery within 30s. | Authorized Human Operator | **BLOCKED / SKIPPED** | `USE_REAL_TWILIO_SMS=false` in staging; SMS dispatch verified via backend application log sink. |
| **MAN-MAIL-01** | Physical Email Inbox Delivery & Spam Analysis | Trigger order confirmation to real Gmail inbox; inspect DKIM/SPF headers and inbox placement. | Authorized Human Operator | **PASS** | Real JavaMailSender dispatched email to `praveenkodekal8@gmail.com`; HTML template rendered correctly in Gmail web & mobile client. |
| **MAN-PRINT-01**| Thermal Packing Slip Barcode Scanning | Generate Shiprocket packing slip PDF; print on 4x6 thermal printer; scan with handheld laser scanner. | Physical Hardware Operator | **BLOCKED / SKIPPED** | Requires physical warehouse hardware not present in virtual workspace. |
| **MAN-EXP-01** | Exploratory Boundary Cart Manipulation | Rapidly double-click 'Add to Cart', modify quantities in drawer during active network throttle. | Authorized Human Operator | **PASS** | Button disabled during in-flight request; duplicate additions prevented; UI reflects consistent item count. |

---

## 3. Pre-Production Operator Sign-Off Checklist
Prior to public commercial traffic, the authorized business operator must complete the two remaining blocked manual checks:
1. Complete a live 1-rupee transaction using a live Indian UPI app (Google Pay / PhonePe / Paytm).
2. Print a sample thermal packing slip on the warehouse Zebra / TSC 4x6 printer and scan with the handheld warehouse scanner.
