# Sporekart — Shiprocket API Readiness Matrix

**Document Version:** 1.0  
**Audit Date:** October 12, 2026  
**Auditor:** Senior Backend Integration Engineer & Application Security Reviewer  
**Integration Target:** Shiprocket Logistics API v1 (`https://apiv2.shiprocket.in/v1/external`)  

---

## 1. API Readiness Matrix Overview

| Operation Code | Business Operation | Official Endpoint & Method | Auth Header | Current Implementation Status | Mock Test Coverage | Live Verification Gate | Risk Classification |
|---|---|---|---|---|---|---|:---:|
| **OP-AUTH-01** | Account Login & JWT Token Exchange | `POST /v1/external/auth/login` | None (Basic/Body) | **IMPLEMENTED** (`ShiprocketTokenManager`) | `100%` (`MockRestServiceServer`) | `READY` | **LOW** |
| **OP-SERV-01** | Check Pincode & Courier Serviceability | `GET /v1/external/courier/serviceability/` | `Bearer <token>` | **IMPLEMENTED** (`ShippingApplicationService`) | `100%` (Unit + Live mock) | `READY` | **LOW** |
| **OP-ORD-01** | Create Adhoc Order & Consignment | `POST /v1/external/orders/create/adhoc` | `Bearer <token>` | **IMPLEMENTED** (`ShiprocketRestClient`) | `100%` (`MockRestServiceServer`) | `READY` | **LOW** |
| **OP-AWB-01** | Courier Allocation & AWB Assignment | `POST /v1/external/courier/assign/awb` | `Bearer <token>` | **IMPLEMENTED** (`ShiprocketRestClient`) | `100%` (`MockRestServiceServer`) | `READY` | **LOW** |
| **OP-PICK-01** | Request Courier Pickup | `POST /v1/external/courier/generate/pickup` | `Bearer <token>` | **IMPLEMENTED** (`ShiprocketRestClient`) | `100%` (`MockRestServiceServer`) | `READY` | **LOW** |
| **OP-LBL-01** | Generate Shipping Label PDF | `POST /v1/external/courier/generate/label` | `Bearer <token>` | **IMPLEMENTED** (`ShiprocketRestClient`) | `100%` (`MockRestServiceServer`) | `READY` | **LOW** |
| **OP-MNF-01** | Generate Manifest PDF | `POST /v1/external/manifests/generate` | `Bearer <token>` | **SUPPORTED** (Schema ready) | `50%` | `READY` | **LOW** |
| **OP-TRK-01** | Track Shipment Status by AWB | `GET /v1/external/courier/track/awb/{awb}` | `Bearer <token>` | **IMPLEMENTED** (`ShiprocketRestClient`) | `100%` (`MockRestServiceServer`) | `READY` | **LOW** |
| **OP-CAN-01** | Cancel Order / Consignment | `POST /v1/external/orders/cancel` | `Bearer <token>` | **IMPLEMENTED** (`ShiprocketRestClient`) | `100%` (`MockRestServiceServer`) | `READY` | **LOW** |
| **OP-WHK-01** | Receive Tracking Webhook Scans | `POST /api/v1/shipping/webhook` (Inbound) | Shiprocket Header | **SECURED** (Token verify + Dedup) | `100%` (MockMvc integration) | `READY` | **LOW** |

---

## 2. Operation Specifications and Gap Analysis

### OP-AUTH-01: Authentication & Token Exchange
- **Business Purpose:** Authenticate Sporekart backend with Shiprocket to obtain a 10-day JWT Bearer token.
- **Verified Official Endpoint:** `POST https://apiv2.shiprocket.in/v1/external/auth/login`
- **Request Headers:** `Content-Type: application/json`
- **Request Schema:**
  ```json
  {
    "email": "logistics@sporekart.in",
    "password": "SecretPassword123"
  }
  ```
- **Response Schema:**
  ```json
  {
    "id": 123456,
    "first_name": "Sporekart",
    "last_name": "Admin",
    "email": "logistics@sporekart.in",
    "company_id": 98765,
    "created_at": "2026-10-12 12:00:00",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOi..."
  }
  ```
- **Implementation Location:** [ShiprocketAdapter.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/application/ShiprocketAdapter.java) (No HTTP call made).
- **Prerequisites Missing:**
  1. No `RestTemplate` or `RestClient` bean configured with timeouts.
  2. No in-memory / cache storage (e.g., Spring Cache / Caffeine) to cache token for 9 days to prevent excessive logins.
  3. No re-authentication on 401 Unauthorized response.

---

### OP-SERV-01: Check Pincode & Courier Serviceability
- **Business Purpose:** Validate if buyer pincode is serviceable, retrieve estimated delivery days, and get real courier rates before order dispatch.
- **Verified Official Endpoint:** `GET https://apiv2.shiprocket.in/v1/external/courier/serviceability/`
- **Query Parameters:**
  - `pickup_postcode` (integer, 6 digits) — **MANDATORY**
  - `delivery_postcode` (integer, 6 digits) — **MANDATORY**
  - `weight` (decimal in kg, e.g., `0.5`) — **MANDATORY**
  - `cod` (`0` for Prepaid, `1` for COD) — **MANDATORY**
- **Response Schema:**
  ```json
  {
    "status": 200,
    "data": {
      "available_courier_companies": [
        {
          "courier_company_id": 1,
          "courier_name": "Blue Dart Express",
          "rate": 78.50,
          "etd": "2-3 Days",
          "estimated_delivery_days": 3
        }
      ]
    }
  }
  ```
- **Implementation Location:** [ShippingApplicationService.java](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/application/ShippingApplicationService.java)
- **Defects & Gaps:**
  1. Service is unwired (orphaned). No controller endpoint `@GetMapping("/shipping/check-pincode/{pincode}")` exists.
  2. Pickup pincode is not configured anywhere in Sporekart backend.
  3. Method uses hardcoded mock regex (`!cleanPincode.startsWith("999")`) and fabricated rate (₹70).

---

### OP-ORD-01: Create Adhoc Order & Consignment
- **Business Purpose:** Register order with Shiprocket to obtain `shipment_id` for courier dispatch.
- **Verified Official Endpoint:** `POST https://apiv2.shiprocket.in/v1/external/orders/create/adhoc`
- **Request Schema:**
  ```json
  {
    "order_id": "SK-20261012-000123",
    "order_date": "2026-10-12 18:00",
    "pickup_location": "Sporekart Warehouse Pune",
    "billing_customer_name": "Ramesh",
    "billing_last_name": "Patil",
    "billing_address": "123 Farm House Road",
    "billing_city": "Pune",
    "billing_pincode": "411001",
    "billing_state": "Maharashtra",
    "billing_country": "India",
    "billing_email": "ramesh@example.com",
    "billing_phone": "9876543210",
    "shipping_is_billing": true,
    "order_items": [
      {
        "name": "Fresh Button Mushroom 200g",
        "sku": "MUSH-BTN-200G",
        "units": 2,
        "selling_price": "200.00"
      }
    ],
    "payment_method": "Prepaid",
    "sub_total": 400.00,
    "length": 15,
    "breadth": 15,
    "height": 10,
    "weight": 0.45
  }
  ```
- **Response Schema:**
  ```json
  {
    "order_id": 10842031,
    "shipment_id": 10793214,
    "status": "NEW",
    "status_code": 1
  }
  ```
- **Implementation Location:** [ShippingService.java:40-120](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/application/ShippingService.java#L40-L120) and [ShiprocketAdapter.java:23-38](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/application/ShiprocketAdapter.java#L23-L38)
- **Defects & Gaps:**
  1. `pickup_location` nickname is not stored or sent.
  2. Dimensions (`length`, `breadth`, `height`) and dead `weight` are not stored in `Product` or `ProductVariant` entities and not sent in command.
  3. `ShiprocketAdapter.createShipment` immediately calls `mockCreateShipment(command)`.

---

### OP-AWB-01: Courier Allocation & AWB Assignment
- **Business Purpose:** Allocate courier partner (e.g., Delhivery, BlueDart, DTDC) and generate the Air Waybill (AWB) tracking number.
- **Verified Official Endpoint:** `POST https://apiv2.shiprocket.in/v1/external/courier/assign/awb`
- **Request Schema:**
  ```json
  {
    "shipment_id": "10793214",
    "courier_id": "1"
  }
  ```
- **Response Schema:**
  ```json
  {
    "response": {
      "data": {
        "awb_code": "143254326543",
        "courier_name": "Delhivery Surface",
        "courier_company_id": 1,
        "assigned_date_time": "2026-10-12 18:05:00"
      }
    }
  }
  ```
- **Defects & Gaps:**
  1. In the current implementation, AWB assignment is bundled into shipment creation as a single mock step.
  2. If AWB generation fails in live mode (e.g., courier unserviceable), there is no fallback or retry handler.

---

### OP-PICK-01: Request Courier Pickup
- **Business Purpose:** Notify the courier partner to dispatch a pickup vehicle to the Sporekart warehouse.
- **Verified Official Endpoint:** `POST https://apiv2.shiprocket.in/v1/external/courier/generate/pickup`
- **Request Schema:**
  ```json
  {
    "shipment_id": ["10793214"]
  }
  ```
- **Response Schema:**
  ```json
  {
    "response": {
      "pickup_status": 1,
      "data": "Pickup scheduled successfully for 2026-10-13",
      "pickup_token_number": "PU-20261012-98432"
    }
  }
  ```
- **Defects & Gaps:**
  1. No separate endpoint or service method exists for requesting pickup.
  2. `pickupScheduledAt` is artificially generated as `ZonedDateTime.now().plusDays(1)`.

---

### OP-TRK-01: Track Shipment Status by AWB
- **Business Purpose:** Fetch carrier tracking scans, current transit hub location, and delivery confirmation.
- **Verified Official Endpoint:** `GET https://apiv2.shiprocket.in/v1/external/courier/track/awb/{awb_code}`
- **Response Schema:**
  ```json
  {
    "tracking_data": {
      "track_status": 1,
      "shipment_status": 6,
      "shipment_track": [
        {
          "id": 10793214,
          "current_status": "IN_TRANSIT",
          "origin": "Pune",
          "destination": "Bengaluru"
        }
      ],
      "shipment_track_activities": [
        {
          "date": "2026-10-12 14:00:00",
          "status": "In Transit",
          "activity": "Bagged at Mumbai Central Hub",
          "location": "Mumbai Hub"
        }
      ]
    }
  }
  ```
- **Implementation Location:** [ShippingService.updateTrackingStatus()](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shipping/application/ShippingService.java#L173-L203)
- **Defects & Gaps:**
  1. `ShiprocketAdapter.trackShipment()` returns static strings (`"Central Sorting Facility"`).
  2. Polling is manual only (triggered by user viewing tracking); no background sync exists for active shipments.

---

### OP-CAN-01: Cancel Order / Consignment
- **Business Purpose:** Cancel an un-dispatched consignment in Shiprocket to release courier booking and prevent pickup.
- **Verified Official Endpoint:** `POST https://apiv2.shiprocket.in/v1/external/orders/cancel`
- **Request Schema:**
  ```json
  {
    "ids": ["10842031"]
  }
  ```
- **Response Schema:**
  ```json
  {
    "status_code": 200,
    "message": "Order cancelled successfully"
  }
  ```
- **Defects & Gaps:**
  1. Calls `mockCreateShipment` cancellation returning true. No actual cancellation sent to Shiprocket.

---

### OP-WHK-01: Inbound Courier Tracking Webhook
- **Business Purpose:** Receive real-time push status updates from Shiprocket when package is picked up, in-transit, out-for-delivery, delivered, or RTO.
- **Sporekart Inbound Endpoint:** `POST /api/v1/shipping/webhook`
- **Verified Payload Contract from Shiprocket:**
  ```json
  {
    "awb": "143254326543",
    "current_status": "DELIVERED",
    "current_location": "Pune East Delivery Center",
    "scans": "Delivered to recipient",
    "courier_name": "Delhivery"
  }
  ```
- **Critical Vulnerabilities:**
  1. **Zero Authenticity Verification:** Header `X-Shiprocket-Signature` is declared as `required = false` and never evaluated.
  2. **Security Config Rejection:** Spring Security requires JWT authentication for `POST /shipping/webhook`, blocking genuine Shiprocket webhooks.
  3. **No Idempotency Protection:** Re-delivered webhooks insert duplicate rows into `shipment_trackings`.
  4. **State Regression Flaw:** Out-of-order `IN_TRANSIT` webhook can overwrite an already `DELIVERED` shipment.
