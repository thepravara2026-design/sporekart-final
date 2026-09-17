# Sporekart Security & Compliance Audit

## Executive Summary
This audit evaluates the security architecture, authorization mechanisms, API protection, token security, and payment compliance of the Sporekart application against OWASP Top 10 web security standards.

---

## 1. Authentication & Token Management
### Strengths:
1. **Stateless JWT Security**:
   - `JwtTokenProvider.java` signs JWT tokens using HMAC-SHA256 (`Keys.hmacShaKeyFor`) with configurable expiration (`app.jwt.expiration-ms`).
   - Tokens contain user ID, identifier, and assigned role (`ROLE_CUSTOMER`, `ROLE_TRAINEE`, `ROLE_ADMIN`).
2. **Spring Security Filter Chain**:
   - `SecurityConfig.java` enforces stateless session management (`SessionCreationPolicy.STATELESS`).
   - CSRF protection is safely disabled for stateless REST endpoints.
   - CORS configuration explicitly restricts allowed methods and headers.

### Identified Security Vulnerabilities & Mitigations:
1. **Fallback Hardcoded Dev Secret**:
   - `application.yml` contains a fallback default `app.jwt.secret` key if `JWT_SECRET` environment variable is omitted.
   - *Risk*: High if deployed to production without overriding environment variables.
   - *Mitigation*: Fail Spring application context startup if `JWT_SECRET` is missing in production profile (`@Profile("prod")`).
2. **Static OTP Bypass**:
   - `AuthService.java` checks `if (!otp.getOtpCode().equals(code) && !"123456".equals(code))`.
   - *Risk*: Any attacker could log in using OTP `"123456"` if an active OTP request exists.
   - *Mitigation*: Restrict static OTP verification code exclusively to non-production Spring profiles (`dev`, `test`).
3. **Admin Endpoint Exposure**:
   - `SecurityConfig.java` locks `/api/v1/admin/**` behind `hasRole('ADMIN')`.
   - *Audit Check*: Ensure all administrative mutation endpoints (e.g. stock updates, slot capacity changes) require `@PreAuthorize("hasRole('ADMIN')")`.

---

## 2. Payment Security & PCI-DSS Compliance
1. **Razorpay Signature Verification**:
   - `PaymentApplicationService.java` validates payment callback authenticity using Razorpay HMAC-SHA256 signature verification (`Utils.verifyPaymentSignature()`).
   - *Audit Check*: Ensure raw signature verification is strictly enforced before marking order status as `PAID`.
2. **Zero Credit Card Storage**:
   - Sporekart never collects or stores raw credit card details, CVVs, or UPI PINs. All sensitive payment tokens are handled directly within Razorpay's PCI-DSS compliant iframe.

---

## 3. Data Protection & Input Validation
1. **SQL Injection**:
   - All database queries utilize Spring Data JPA / Hibernate parameterized queries, eliminating raw string concatenation risk.
2. **XSS & Content Security Policy (CSP)**:
   - React automatically escapes rendered strings in JSX, mitigating DOM-based Cross-Site Scripting (XSS).
3. **Input Validation**:
   - `@Valid` annotations enforced on controller DTOs (`AuthDtos.OtpRequest`, `OrderDtos.CreateOrderRequest`, `PaymentDtos.VerifyPaymentRequest`).
