# EC19-07 — Security and Authorization Findings

**Audit Identifier:** EC19-SEC-AUTH-2026-10-27  
**Security Framework:** Spring Security 6.x + JWT Bearer Authentication  
**Identity Provider:** Google OAuth 2.0 (Single Permissible Auth Provider)  
**Security Assessment Result:** COMPLIANT & HARDENED  

---

## 1. Executive Summary

This report evaluates role boundaries, authentication mechanisms, IDOR protections, input sanitization, API route insulation, and secret hygiene across the entire Sporekart platform.

The audit verified that **unauthenticated requests are consistently blocked (HTTP 401)**, **role escalation and administrative endpoint access by regular users are strictly forbidden (HTTP 403)**, **cross-customer data tampering and IDOR vulnerabilities are prevented (HTTP 403)**, **path traversal attempts in file uploads are sanitized**, and **sensitive gateway credentials are never leaked in API responses**.

---

## 2. Role Boundaries and Access Control Matrix

| Endpoint / Operation | Attempted Role | Expected Response | Observed Response | Security Status |
| :--- | :--- | :---: | :---: | :---: |
| `GET /customer/profile` | Unauthenticated (None) | HTTP 401 | **HTTP 401 Unauthorized** | **SECURE** |
| `GET /orders/{customer_a_id}` | Customer B | HTTP 403 | **HTTP 403 Access Denied** | **SECURE** |
| `GET /admin/analytics/overview` | Customer A | HTTP 403 | **HTTP 403 Forbidden** | **SECURE** |
| `POST /orders` (Place Order) | Admin User | HTTP 409 | **HTTP 409 Account Reserved** | **SECURE** |
| `POST /training/enroll` | Admin User | HTTP 409 | **HTTP 409 Account Reserved** | **SECURE** |
| `POST /support/tickets` (Link Order A) | Customer B | HTTP 403 | **HTTP 403 Access Denied** | **SECURE** |
| `POST /auth/otp/request` | Public / Anonymous | HTTP 410 | **HTTP 410 GONE** | **SECURE** |
| `POST /admin/auth/otp/request` | Public / Anonymous | HTTP 410 | **HTTP 410 GONE** | **SECURE** |

---

## 3. Insecure Direct Object Reference (IDOR) Hardening

### A. Order Ownership Verification
In `OrderService.java`:
```java
if (!isAdmin && order.getUserId() != null && !order.getUserId().equals(currentUserId)) {
    throw new org.springframework.security.access.AccessDeniedException(
        "You do not have permission to view or modify this order."
    );
}
```
- **Test Case `EC19-13-02`:** Customer B attempted to fetch the details of Customer A's order (`060d4b1a-8212-4eb9-a2a6-93883a31c518`).
- **Result:** Successfully blocked with HTTP 403 Forbidden.

### B. Support Ticket Cross-Order Linking
In `SupportApplicationService.java`:
- When a customer creates a support ticket and attaches an `orderId`, the service verifies that the order exists and belongs to the authenticated customer.
- **Test Case `EC19-10-02`:** Customer B attempted to submit a support ticket referencing Customer A's order ID.
- **Result:** Blocked with HTTP 403 AccessDeniedException (`"You cannot link an order belonging to another customer"`).

---

## 4. Single Permissible Entity Enforcement (Admin Separation)

To prevent mixing administrative privilege with customer transactions:
1. **Order Creation:** `OrderService.createOrder` verifies:
   ```java
   if (currentUser.getRole() == Role.ROLE_ADMIN) {
       throw new IllegalStateException("The admin account is permanently reserved for platform operations and cannot place customer orders.");
   }
   ```
2. **Training Enrollment:** `TrainingService.initiateEnrollment` verifies:
   ```java
   if (currentUser.getRole() == Role.ROLE_ADMIN) {
       throw new IllegalStateException("The admin account is permanently reserved for platform operations and cannot enroll as a trainee.");
   }
   ```
Both test scenarios executed with HTTP 409 Conflict, proving strong separation between customer journeys and platform administration.

---

## 5. Media Upload Sanitization and Path Traversal Protection

In `MediaService.java`:
- **Test Case `EC19-13-06`:** Submitted payload with malicious filename:
  ```json
  {
    "originalFilename": "../../../etc/passwd.png",
    "mimeType": "image/png",
    "sizeBytes": 1024
  }
  ```
- **Backend Sanitization:** Stripped `../` sequences, sanitized characters to alphanumeric/safe hyphens, and prefixed with a secure UUID folder key:
  `uploads/2026/10/7b4f910a-etc-passwd.png`
- **Result:** Path traversal was neutralized, zero directory escapement possible.

---

## 6. Secret Hygiene and Environment Isolation

- Scanned all JSON API responses across all 14 suites for sensitive environment variables:
  - Database passwords (`MyDbSporekart@123#`) -> **0 occurrences**.
  - Razorpay Key Secret (`dFrgcYKVv0wBEtGgogcZpFHT`) -> **0 occurrences**.
  - Razorpay Webhook Secret (`mockwebhooksecret123`) -> **0 occurrences**.
  - SMTP Credentials -> **0 occurrences**.
- All API DTOs use explicit response wrappers (`ApiResponse<T>`) and prevent raw entity exposure.

---

## 7. Security Conclusion

The platform exhibits zero P0 or P1 security defects. The architecture strictly adheres to the principle of least privilege, rejects client price tampering, prevents IDOR manipulation, and enforces complete role separation.
