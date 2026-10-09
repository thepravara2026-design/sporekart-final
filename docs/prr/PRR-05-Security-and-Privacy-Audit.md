# PRR-05: Security & Privacy Audit — Sporekart

**Date:** October 9, 2026  
**Review Board:** Application Security Engineer & Data Privacy Reviewer  
**Target Repository:** `f:\sporekart-v1\sporekart-final\backend`  

---

## 1. Executive Summary & OWASP Assessment

We conducted a defensive security review aligned with the **OWASP Top 10 (2021)** and **OWASP Application Security Verification Standard (ASVS v4.0)**. 

### Security Posture Summary
- **Strong Areas:** Passwords hashed with BCrypt (`strength=12`), Razorpay payment webhook signatures verified using HMAC-SHA256, SQL injection prevented via JPA Parameterized Queries, XSS prevented in React via automatic string escaping.
- **Critical Vulnerabilities Discovered:**
  1. **BOLA / IDOR Vulnerability (`GET /api/v1/orders/*`)**: Public unauthenticated access permitted for order details and invoices.
  2. **Overly Permissive CORS Configuration (`SecurityConfig.java`)**: Wildcard origins allowed with credentials enabled (`allowCredentials(true)` combined with `allowedOriginPatterns: http://*, https://*`).

---

## 2. OWASP Risk Analysis & Finding Register

### 2.1 [SEC-01] BOLA / IDOR on Order & Invoice Retrieval (Severity: P0 — Critical / Release Blocker)
- **OWASP Category:** A01:2021 – Broken Access Control
- **Location:** [`backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java:84`](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java#L84)
- **Evidence:** `.requestMatchers(HttpMethod.GET, "/orders/*", "/orders/*/invoice").permitAll()`
- **Impact:** Any unauthenticated attacker can iterate order IDs/numbers (e.g., `GET /api/v1/orders/ORD-1001` or `GET /api/v1/orders/ORD-1001/invoice`) to access other customers' personal addresses, phone numbers, email addresses, line items, and financial payment totals.
- **Remediation:** Remove `.permitAll()` from `GET /orders/*`. Restrict access to authenticated users (`.authenticated()`) and verify in `OrderService` that the authenticated user ID matches `orders.user_id` (or enforce guest order access tokens).

### 2.2 [SEC-02] Overly Permissive CORS with Credentials (Severity: P1 — High / Release Blocker)
- **OWASP Category:** A05:2021 – Security Misconfiguration
- **Location:** [`backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java:107-115`](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java#L107-L115)
- **Evidence:** `configuration.setAllowedOriginPatterns(List.of("http://*:*", "https://*:*"))` with `configuration.setAllowCredentials(true)`.
- **Impact:** Allows malicious third-party websites visited by a logged-in Sporekart user to make authenticated CORS requests using the browser's credentials/cookies.
- **Remediation:** Restrict `allowedOrigins` strictly to explicitly white-listed domain URLs (e.g., `${CORS_ALLOWED_ORIGINS}` configured per environment) and remove wildcard origin patterns in production profiles.

### 2.3 [SEC-03] Exposure of Direct Supabase Client Anon Key (Severity: P2 — Medium)
- **OWASP Category:** A01:2021 – Broken Access Control
- **Location:** [`frontend/src/lib/supabase.js`](file:///f:/sporekart-v1/sporekart-final/frontend/src/lib/supabase.js)
- **Impact:** If RLS (Row Level Security) is not configured for every table in PostgreSQL, public browser users could execute direct CRUD calls via the Supabase Javascript SDK.
- **Remediation:** Restrict Supabase anon key usage strictly to public read-only CDN bucket operations.

---

## 3. Privacy & PII Compliance Audit

| Data Field | Storage Format | Redaction in Logs | Transport Security | Access Restriction |
| :--- | :--- | :--- | :--- | :--- |
| **Passwords** | BCrypt Hash (`strength=12`) | **REDACTED** | HTTPS / TLS 1.3 | Admin / System |
| **Email Address** | Plaintext in `users` | Exposed in Notification logs | HTTPS | Owner / Admin |
| **Phone Number** | Plaintext in `users` | Exposed in SMS debug logs | HTTPS | Owner / Admin |
| **Shipping Address**| JSON string in `orders` | Excluded from logs | HTTPS | **FAIL (Exposed via IDOR bug)** |
| **Razorpay Keys** | Encrypted Env Vars | **REDACTED** in application.yml | HTTPS / SDK | System Only |

---

## 4. Security Gate Requirements Prior to Launch

- [ ] **[MANDATORY]** Fix BOLA/IDOR bug on `GET /api/v1/orders/*` by requiring user ownership verification.
- [ ] **[MANDATORY]** Restrict CORS allowed origins to explicit domains in `SecurityConfig.java`.
- [ ] **[MANDATORY]** Verify HTTPS TLS redirection on production reverse proxy configuration.
