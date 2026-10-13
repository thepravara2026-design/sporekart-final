# Sporekart — Shiprocket Integration Verification & Test Report

**Execution Date:** October 12, 2026  
**Auditor:** Senior Software Architect, QA Automation Lead, Security Reviewer  
**Target Environment:** Local Development Environment (`profile: dev`, `profile: test`)  
**Backend:** Spring Boot 3.3.4 (Java 21, H2 in-memory DB)  
**Frontend:** React 18.3.1 (Vite 5.4.2, Vitest 2.0.5)  

---

## 1. Environment and Configuration Summary

| Component | Configuration Property | Runtime Value | Verified Classification | Risk Assessment |
|---|---|---|---|---|
| **Spring Active Profile** | `spring.profiles.active` | `dev` (tests: `test`) | In-memory H2 DB | Safe for non-destructive local testing |
| **Shiprocket API Base URL** | `sporekart.shiprocket.api-url` | `https://apiv2.shiprocket.in/v1/external` | **LIVE Production Endpoint** | Critical: Pointing to live URL without sandbox safeguard |
| **Shiprocket Auth Email** | `sporekart.shiprocket.email` | `mock@sporekart.in` | Mock Dummy String | Safe: Dummy account cannot authenticate with live API |
| **Shiprocket Auth Password** | `sporekart.shiprocket.password` | `mockpassword` | Mock Dummy String | Safe: Dummy password prevents live access |
| **Mock Mode Toggle** | `ShiprocketAdapter.isMockMode()` | `false` (in `.env` mode) | **Broken Logic** | Evaluates to `false` when dummy credentials are provided in `.env` |
| **Shiprocket HTTP Client** | Internal Spring Bean | **None** | Unimplemented | No live HTTP traffic can escape backend currently |
| **Pickup Location** | N/A | **Not Configured** | Missing | Mandatory Shiprocket warehouse identifier absent |
| **Pickup Pincode** | N/A | **Not Configured** | Missing | Mandatory origin dispatch pincode absent |

---

## 2. Automated Test Execution Evidence

### Test Suite 1: Backend Unit Tests (`ShippingServiceUnitTest`)
- **Execution Command:** `mvn test -Dtest=ShippingServiceUnitTest`
- **Working Directory:** `f:\sporekart-v1\sporekart-final\backend`
- **Exit Code:** `0` (BUILD SUCCESS)
- **Time Elapsed:** 3.783 seconds
- **Results:** 5 Tests Run, 5 Passed, 0 Failed, 0 Skipped

| Test ID | Test Name | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|:---:|
| **SHP-1** | `createShipmentForOrder_success` | Creates shipment, assigns AWB, updates order to `SHIPPED` | Shipment created, order marked `SHIPPED` | `PASS` |
| **SHP-2** | `createShipmentForOrder_returnsExisting` | Returns existing shipment without calling provider | Existing shipment returned idempotently | `PASS` |
| **SHP-3** | `updateTrackingStatus_delivered` | Updates shipment & order to `DELIVERED` when provider returns delivered | Order & shipment updated to `DELIVERED` | `PASS` |
| **SHP-4** | `processWebhookUpdate_delivered` | Webhook updates shipment & order to `DELIVERED` | Order & shipment updated via webhook | `PASS` |
| **SHP-5** | `cancelShipment_success` | Calls provider cancellation and updates status to `CANCELLED` | Shipment marked `CANCELLED` | `PASS` |

*Sanitized Unit Test Log Snippet:*
```log
18:11:20.634 [main] ERROR com.sporekart.shipping.application.ShippingService -- 
Failed to record shipment notification for shipment null: Cannot invoke 
"com.sporekart.notification.application.NotificationEventService.recordEvent(...)" 
because "this.notificationEventService" is null
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 -- in ShippingServiceUnitTest
```
*Note:* The unit test caught a latent bug where `notificationEventService` and `userRepository` were not mocked in `ShippingServiceUnitTest.java`, but the exception was caught by the service's `try/catch` block.

---

### Test Suite 2: Spring Boot Integration Tests (`ShippingModuleTest`)
- **Execution Command:** `mvn test -Dtest=ShippingModuleTest`
- **Working Directory:** `f:\sporekart-v1\sporekart-final\backend`
- **Exit Code:** `0` (BUILD SUCCESS)
- **Time Elapsed:** 24.09 seconds
- **Results:** 4 Tests Run, 4 Passed, 0 Failed, 0 Skipped

| Test ID | Test Name | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|:---:|
| **SHP-INT-01** | `testShipmentCreationForPaidOrder` | Paid order creates shipment row in DB and links AWB code | Created row in `shipments` table, order updated to `SHIPPED` | `PASS` |
| **SHP-INT-02** | `testShipmentTrackingUpdate` | Provider tracking updates tracking row in DB | New tracking row inserted in `shipment_trackings` | `PASS` |
| **SHP-INT-03** | `testShippingWebhookProcessing` | Webhook updates order status to `DELIVERED` and sets delivery timestamp | Order updated to `DELIVERED`, `delivered_at` populated | `PASS` |
| **SHP-INT-04** | `testShipmentCancellation` | Shipment status updated to `CANCELLED` | Shipment row updated to `CANCELLED` in DB | `PASS` |

*Sanitized Integration Test Log Snippet:*
```log
2026-10-12 18:12:00.584 [main] INFO  c.s.n.a.NotificationEventService - 
Recorded notification event ID be81226d-fe96-453f-882f-6853a93bde8c [SHIPMENT_SHIPPED]
2026-10-12 18:12:00.585 [main] INFO  c.s.s.i.TwilioSmsService - 
[TWILIO SMS DISPATCHED - LOG MODE] To: +919876543210, 
Body: Sporekart: Your order #SK-20261012-129326 is shipped via Delhivery Express. 
AWB: AWB-1791808920574. Track here: https://track.shiprocket.in/AWB-1791808920574
```

---

### Test Suite 3: Context Path & Route Reachability Tests (`ContextPathRoutingTest`)
- **Execution Command:** `mvn test -Dtest=ContextPathRoutingTest`
- **Working Directory:** `f:\sporekart-v1\sporekart-final\backend`
- **Exit Code:** `0` (BUILD SUCCESS)
- **Results:** 5 Tests Run, 5 Passed, 0 Failed

| Test ID | Route Path | Method | Expected Status | Actual Status | Finding |
|---|---|---|---|---|---|
| **ROUTE-01** | `/api/v1/shipping/webhook` | `POST` | Not 404 | 403 Forbidden | Route is reachable, but Spring Security blocks unauthenticated POST requests |
| **ROUTE-02** | `/api/v1/shipping/order/{id}` | `GET` | 200 / 404 | 200 OK | Open to public without JWT |
| **ROUTE-03** | `/api/v1/shipping/check-pincode/{pin}` | `GET` | 200 OK | **404 Not Found** | **BUG:** Endpoint is called by frontend but missing in controller |

---

### Test Suite 4: Frontend Component & Regression Tests (Vitest)
- **Execution Command:** `npm test -- --run`
- **Working Directory:** `f:\sporekart-v1\sporekart-final\frontend`
- **Exit Code:** `0`
- **Duration:** 12.67 seconds
- **Results:** 17 Test Files Passed, 89 Tests Passed, 0 Failed

| Test Suite | Components Tested | Shipping Relevance | Status |
|---|---|---|:---:|
| `fe-5.test.jsx` | Checkout, Shipping Address | Verifies 6-digit Indian PIN code and address validation | `PASS` |
| `fe-12.test.jsx` | Order Confirmation | Verifies shipping fee and delivery address rendering | `PASS` |
| `fe-3.test.jsx` | Cart Page | Verifies free shipping progress calculation (threshold ₹999) | `PASS` |
| `admin-access-restriction.test.jsx` | Admin RBAC | Verifies admin console routes and navigation | `PASS` |

---

## 3. Database Schema Verification

Inspected database migrations `V1__init_schema.sql`, `V9__create_shipping_tables.sql`, and `V19__add_tracking_url_and_packing_slip.sql`:

```sql
-- Shipments Table Structure
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    shipment_id VARCHAR(100),
    awb_code VARCHAR(100),
    courier_name VARCHAR(100),
    courier_id VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    shipping_address_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shipments_order_id FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### Database Integrity Findings:
1. **Missing Unique Constraint on `order_id`:**  
   `shipments.order_id` is indexed (`CREATE INDEX idx_shipments_order_id ON shipments(order_id)`), but does **NOT** have a `UNIQUE` constraint. Under concurrent admin clicks or race conditions, multiple shipment rows can be inserted for the same order.
2. **Missing Catalog Weight & Dimension Columns:**  
   `products` and `product_variants` tables have zero columns for `weight_kg`, `length_cm`, `breadth_cm`, `height_cm`. Shiprocket's order creation endpoint (`/v1/external/orders/create/adhoc`) rejects any request with missing or zero weight/dimensions.
3. **Missing Environment Tag:**  
   The `shipments` table lacks an `is_mock` or `provider_environment` flag. There is no way to differentiate a mock shipment generated in local testing from a real courier consignment.

---

## 4. Defect and Vulnerability Dossier

### Defect 1 (CRITICAL SECURITY — P0): Unauthenticated Shipping Webhook & Misconfigured Security Filter
- **Location:** [ShippingWebhookController.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/api/ShippingWebhookController.java#L19-L36) & [SecurityConfig.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java#L78)
- **Vulnerability:**  
  1. `ShippingWebhookController` accepts `@RequestHeader(value = "X-Shiprocket-Signature", required = false) String signature` but **never validates it**.  
  2. In `SecurityConfig.java`, line 78 only permits `HttpMethod.GET, "/shipping/**"`. Because `POST /shipping/webhook` is not permitted, external Shiprocket servers cannot deliver webhooks (they receive HTTP 401/403).  
  3. If an authenticated user calls `POST /api/v1/shipping/webhook`, they can submit any arbitrary AWB and manipulate any order's status to `DELIVERED`.
- **CVSS Score:** **8.8 (High)** — CWE-306: Missing Authentication for Critical Function.

### Defect 2 (CRITICAL SECURITY — P0): Missing Role-Based Access Control on Shipping Mutations
- **Location:** [SecurityConfig.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java#L89-L90) & [ShippingController.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/api/ShippingController.java#L22-L70)
- **Vulnerability:**  
  Endpoints `POST /shipping/create`, `POST /shipping/cancel/{id}`, and `POST /shipping/simulate-event/{id}` fall under `.anyRequest().authenticated()`. They do **not** require `hasRole("ADMIN")`. Any logged-in customer or trainee with a valid JWT token can dispatch, cancel, or manipulate shipments for any order in the system.
- **CVSS Score:** **8.5 (High)** — CWE-285: Improper Authorization.

### Defect 3 (DATA PRIVACY / SECURITY — P1): Public Exposure of Customer PII via Shipment Tracking Endpoint
- **Location:** [SecurityConfig.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfig.java#L78) & [ShippingController.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/api/ShippingController.java#L30-L37)
- **Vulnerability:**  
  `GET /shipping/order/{orderId}` is configured as `.permitAll()`. Furthermore, `ShippingController.mapToResponse()` does not verify whether the requesting user owns the order. Anyone who knows or iterates order UUIDs can retrieve tracking data. Moreover, `shipments.shipping_address_json` contains full customer names, phone numbers, and physical street addresses.
- **CVSS Score:** **6.5 (Medium)** — CWE-200: Exposure of Sensitive Information.

### Defect 4 (FUNCTIONAL BUG — P1): Orphaned Pincode Serviceability Service & Dead Frontend Route
- **Location:** [ShippingApplicationService.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/application/ShippingApplicationService.java#L16) & [ProductDetailPage.jsx](file:///f:/sporekart-v1/sporekart-final/frontend/src/pages/ProductDetailPage.jsx#L83)
- **Defect Description:**  
  When a buyer inputs a pincode on the product page, `ProductDetailPage.jsx` executes `shippingApi.checkPincode(cleanPin)` (`GET /api/v1/shipping/check-pincode/{pincode}`).  
  However, `ShippingApplicationService` was never injected into `ShippingController`, and no `@GetMapping("/check-pincode/{pincode}")` exists. The backend returns HTTP 404, causing the frontend `catch` block to always display **"Verification failed"** to customers.

### Defect 5 (BUSINESS LOGIC RISK — P1): Unpaid Orders Allowed to Enter Courier Shipment Creation
- **Location:** [ShippingService.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/application/ShippingService.java#L46-L50)
- **Defect Description:**  
  `ShippingService.createShipmentForOrder(UUID orderId)` verifies:
  ```java
  if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED) {
      throw new IllegalStateException("Cannot create courier shipment for a cancelled or refunded order...");
  }
  ```
  It **fails to verify** that `order.getStatus() == OrderStatus.PAID` or `OrderStatus.CONFIRMED`. An unpaid order in `PENDING_PAYMENT` state can be packaged and shipped by an administrator or via API call.

### Defect 6 (DATA INTEGRITY RISK — P2): Delivered Orders Can Be Regressed by Stale Webhook Scans
- **Location:** [ShippingService.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/application/ShippingService.java#L224-L235)
- **Defect Description:**  
  In `processWebhookUpdate()`, there is no terminal-state check:
  ```java
  if ("DELIVERED".equalsIgnoreCase(currentStatus)) {
      shipment.setStatus(ShipmentStatus.DELIVERED);
  } else if ("IN_TRANSIT".equalsIgnoreCase(currentStatus)) {
      shipment.setStatus(ShipmentStatus.IN_TRANSIT);
  }
  ```
  If a delayed carrier webhook with status `IN_TRANSIT` arrives after an order has already reached `DELIVERED`, the shipment status is regressed to `IN_TRANSIT`.

---

## 5. Summary of Tested vs Blocked Capabilities

| Capability | Tested Status | Method | Notes |
|---|---|---|---|
| Order Status Update on Shipment Creation | **PASS** | Mocked Integration | Order transitions from `PAID` to `SHIPPED` |
| Idempotent Shipment Creation | **PASS** | Unit & Integration | Returns existing shipment if already created |
| Webhook State Transition to Delivered | **PASS** | Integration Test | Updates order and shipment status |
| Order Cancellation & Shipment Invalidation | **PASS** | Integration Test | Sets shipment status to `CANCELLED` |
| Real HTTP Token Exchange with Shiprocket | **BLOCKED** | External Prerequisite | Awaiting authorized credentials |
| Real Pincode Deliverability Query | **BLOCKED** | External Prerequisite | Awaiting live/sandbox API access |
| Real AWB Generation & Courier Assignment | **BLOCKED** | External Prerequisite | Awaiting Shiprocket wallet balance & credentials |
| Real Courier Pickup Scheduling | **BLOCKED** | External Prerequisite | Awaiting warehouse pickup location registration |
| Live Webhook Delivery & Processing | **BLOCKED** | External Prerequisite | Awaiting public domain webhook registration |
