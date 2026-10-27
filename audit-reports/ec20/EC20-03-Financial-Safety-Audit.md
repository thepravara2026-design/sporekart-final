# EC20-03: Financial Safety, Secrets, and Data Privacy Audit

**Execution Date:** 2026-10-27  
**Auditor Roles:** Principal Application Security Engineer, Payment & Financial Safety Auditor  
**Audit Phase:** EC-20 Master Release Readiness Audit  
**Target System:** Sporekart E-Commerce Platform (Pravara Media)  
**Classification:** Highly Confidential — Financial & Privacy Audit  

---

## 1. Executive Summary

The financial safety audit evaluated the integrity of online payment processing, refund handling, server-side price validation, credential storage, and customer personal data privacy.

### Key Audit Findings:
1. **Rule C.1 Zero-Wallet Architecture:** Fully enforced. All customer and admin wallet mutation endpoints return **HTTP 410 GONE**. The underlying `wallets` table was permanently retired via Flyway migration `V41`.
2. **Rule C.2 Razorpay Payment Processing:** 100% of online transactions flow through Razorpay with mandatory HMAC-SHA256 signature verification.
3. **Refund Safety:** Unlinked, arbitrary refunds are strictly prohibited. Refunds can only be initiated through verified order cancellation lifecycles and are bounded by the exact amount paid.
4. **Secret Management:** Zero production API keys, service-role tokens, or payment secret keys were discovered in source code, version history, or compiled frontend bundles.
5. **Data Privacy:** Internal classpaths and stack traces are suppressed in API error payloads (`server.error.include-stacktrace: never`).

---

## 2. Rule C.1 & C.2 Compliance Matrix

| Rule | Mandatory Decision | System Implementation | Verification Result |
| :--- | :--- | :--- | :--- |
| **Rule C.1** | No customer wallet and no admin wallet | [WalletController.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/controller/WalletController.java) returns `410 GONE` on `/add-money` and `/withdraw`. `V41` archives DB table. | **COMPLIANT (PASS)** |
| **Rule C.2** | All payments & refunds use Razorpay | [RazorpayService.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/service/RazorpayService.java) executes payment verification & refunds. | **COMPLIANT (PASS)** |
| **Rule C.3** | No SMS / OTP login services | Deprecated OTP endpoints retired with `410 GONE`. | **COMPLIANT (PASS)** |
| **Rule C.4** | Google OAuth authentication only | `/api/v1/auth/oauth/google` serves as sole identity provider. | **COMPLIANT (PASS)** |
| **Rule C.7** | Zero live money testing | Sandbox test credentials and mock verification applied during audit. | **COMPLIANT (PASS)** |

---

## 3. Financial Transaction Safety (EC20-11)

### 3.1 Razorpay Signature Verification

Online orders generate a gateway order ID on the backend. When the customer completes payment in the frontend Razorpay modal, the gateway returns:
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`

In [RazorpayService.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/service/RazorpayService.java#L85-L102), signature verification is executed using HMAC-SHA256:
$$\text{Signature} = \text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{secret})$$

| Test ID | Test Scenario | Payload / Method | Expected Result | Actual Observed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EC20-FIN-PAY-01** | Tampered Razorpay Signature | Valid order/payment ID with invalid signature hash | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **EC20-FIN-PAY-02** | Forged Webhook Event | Unauthenticated webhook POST with invalid `X-Razorpay-Signature` | HTTP 400 / 401 | HTTP 400 Bad Request | **PASS** |
| **EC20-FIN-PAY-04** | Arbitrary Unlinked Refund | Direct refund request to unlinked endpoint | HTTP 404 / 405 Method Not Allowed | HTTP 405 Method Not Allowed | **PASS** |
| **EC20-FIN-PAY-05** | Wallet Mutation Retirement | `POST /api/v1/wallet/add-money` & `/withdraw` | HTTP 410 GONE | HTTP 410 GONE | **PASS** |

### 3.2 Refund Life-Cycle and Double-Refund Prevention

1. **State Machine Locking:** Refunds are only permitted for orders in `PAID` or `CONFIRMED` state.
2. **Cancellation Coupling:** An order cannot be refunded without transitioning through [OrderService.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/service/OrderService.java) cancellation logic. Once cancelled, the order state becomes `CANCELLED`, and duplicate refund attempts are rejected with `IllegalStateException: Order is already cancelled/refunded`.
3. **Idempotency:** Razorpay refund API calls transmit an idempotency key composed of `refund_{orderId}_{paymentId}`, ensuring the gateway prevents double debits.

---

## 4. Secret & Configuration Management (EC20-09)

A comprehensive scan was conducted across source code, git commits, configuration files, and compiled assets.

### 4.1 Secrets Inspection Results

| Secret Type | Expected Location | Exposure Risk | Findings / Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Razorpay Live Secret** | Environment variable only | High | No `rzp_live_` keys in source, configs, or frontend bundles. | **CLEAN** |
| **Razorpay Test Secret** | Config fallback `${RAZORPAY_KEY_SECRET:...}` | Low (Dev fallback) | Test key `rzp_test_Tqs0MmdXUl8FRk` present in `application.yml` as dev default. Must be overridden in production. | **P2 Config Finding** |
| **JWT Signing Key** | `${JWT_SECRET:...}` | Critical | Fallback HMAC key present for local dev. Production deployment must inject 256-bit secret. | **P2 Config Finding** |
| **Supabase Service Role Key** | Backend only | Critical | Zero service-role keys bundled into Vite frontend distribution. | **CLEAN** |
| **Database Credentials** | Environment variables | High | Database password passed via `${DB_PASSWORD}` in production profile. | **CLEAN** |

---

## 5. Customer Data Privacy & PII Handling (EC20-10)

| Requirement | Audit Method | Observed Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Error Message Stack Suppression** | Triggered 400, 404, and 500 errors | Stack traces completely suppressed in JSON responses. | **PASS** |
| **Log Sanitization** | Inspected `logback-spring.xml` and application logs | Passwords, tokens, and payment secrets are omitted from logging patterns. | **PASS** |
| **Public Catalog Data Privacy** | Queried `/api/v1/catalog/products` and `/search` | Zero customer PII or internal system keys in responses. | **PASS** |
| **Address & Order Isolation** | Tested multi-tenant access across Customer A & B | Orders and addresses isolated by authenticated JWT principal. | **PASS** |

---

## 6. Financial Audit Conclusion

Sporekart's financial architecture is strictly aligned with Rule C decisions. The retirement of wallets is complete and permanent. Payment verification and refund lifecycles are safe from manipulation, and sensitive credentials are well segregated.
