# Sporekart — Shiprocket API Integration Phase L Verification Report
**Simulated Live Integration Harness Execution & Audit Evidence**

**Execution Timestamp:** 2026-10-12T22:10:21+05:30  
**Test Suite:** `com.sporekart.shipping.application.ShiprocketLiveSimulatedHarnessIntegrationTest`  
**Execution Environment:** Spring Boot 3.3.4 / Java 21 / PostgreSQL Test Dialect  
**Execution Result:** **100% PASS (0 Failures, 0 Errors, Exit Code 0)**  
**Regression Status:** All 47 shipping unit, integration, and security tests passed cleanly (`mvn test "-Dtest=com.sporekart.shipping.**.*Test"`).

---

## 1. Executive Summary

Phase L represents the final authorization gate of the Sporekart Shiprocket API Integration Roadmap. In accordance with the engineering safety policy, the user approved the execution of the **Simulated Live Integration Verification Harness** (`ShiprocketLiveSimulatedHarnessIntegrationTest`).

This harness activates the actual production adapter path (`useRealShiprocket = true`), bypasses mock stubs, and exercises all 8 live integration operations through the `ShiprocketRestClient` with strict contract validation, without exposing real merchant credentials or debiting live Shiprocket wallet balances.

---

## 2. Verified Operational Lifecycle Gates

The harness executed sequentially and verified the following 8 live operational lifecycle stages:

| Gate ID | Operation Description | API Contract / Method Tested | Verification Result |
|---|---|---|:---:|
| **L01 / L06** | **Prepaid Courier Serviceability Check** | `GET /v1/external/courier/serviceability/` | **PASS `[x]`** |
| | Validated pincode `411001` with weight `0.700kg`. Selected lowest-rate courier (`Delhivery Surface`, ₹54.00, 3 days ETA) over higher-rate options (`BlueDart Air`, ₹98.00). |
| **L04 / L05** | **Order Seed & Physical Dimensions** | `ProductVariant` + `ShippingService` | **PASS `[x]`** |
| | Seeded product `Lion's Mane Fresh Cluster` with dimensions `18 x 14 x 12 cm` and dead weight `0.350kg`. Customer ordered 2 units. Verified package dimensions: `18.00 x 14.00 x 24.00 cm`, dead weight `0.700kg`. |
| **L07** | **Adhoc Consignment Creation** | `POST /v1/external/orders/create/adhoc` | **PASS `[x]`** |
| | Captured outbound wire payload via `ArgumentCaptor`: order number, customer name, address, pickup location (`Primary`), aggregated dead weight, and 3D dimensions matched exactly. Created Shiprocket Shipment ID: `88227711`. |
| **L08** | **Courier Allocation & AWB Generation** | `POST /v1/external/courier/assign/awb` | **PASS `[x]`** |
| | Assigned AWB `143254326543`, courier partner `Delhivery Surface`. Persisted to `Shipment` entity and updated `Order` status to `SHIPPED` with dynamic tracking URL `https://track.shiprocket.in/143254326543`. |
| **L08** | **Pickup Scheduling** | `POST /v1/external/courier/generate/pickup` | **PASS `[x]`** |
| | Scheduled courier vehicle pickup for shipment `88227711`. Persisted pickup timestamp and dispatched customer SMS/Email notification. |
| **L06** | **Live Carrier Tracking Scans** | `GET /v1/external/courier/track/awb/{awb_code}` | **PASS `[x]`** |
| | Ingested tracking scans (`IN_TRANSIT` at `Pune Hub`). Updated shipment status to `IN_TRANSIT` and recorded historical tracking event in `shipment_trackings`. |
| **L07** | **Inbound Webhook Terminal State** | `POST /shipping/webhook` | **PASS `[x]`** |
| | Delivered authentic webhook with header `X-Shiprocket-Token`. Transitioned shipment and parent order to terminal `DELIVERED` status and set `delivered_at` timestamp. |
| **L08** | **Out-of-Order Webhook Protection** | `POST /shipping/webhook` | **PASS `[x]`** |
| | Sent out-of-order stale `IN_TRANSIT` webhook scan for the delivered shipment. Verified the handler ignored the stale transition and preserved the terminal `DELIVERED` status. |
| **L09** | **Consignment Cancellation** | `POST /v1/external/orders/cancel/shipment/` | **PASS `[x]`** |
| | Dispatched cancellation request for shipment `88227711`. Acknowledged by Shiprocket and verified safe cancellation. |
| **L11** | **Safe Teardown Hook** | `@AfterEach teardownSafetyHook` | **PASS `[x]`** |
| | Confirmed `useRealShiprocket` was reset to `false` and mock mode restored. |

---

## 3. Log Evidence & Execution Trace

```text
2026-10-12 22:10:16.892 [main] INFO  c.s.s.a.ShiprocketAdapter - Creating shipment via Shiprocket adapter for order number: SK***54 [mode: LIVE]
2026-10-12 22:10:16.964 [main] INFO  c.s.s.a.ShiprocketAdapter - Dispatching live order creation to Shiprocket for order #SK-20261012-473754
2026-10-12 22:10:16.965 [main] INFO  c.s.s.a.ShiprocketAdapter - Shiprocket order created successfully (Shipment ID: 88227711)
2026-10-12 22:10:16.965 [main] INFO  c.s.s.a.ShiprocketAdapter - Requested courier pickup for shipment ID: 88227711
✓ GATE L03-L05 PASS: Live adhoc order, AWB, pickup scheduled and persisted for order #SK-20261012-473754 with AWB 143254326543
✓ GATE L06 PASS: Live tracking status synchronized, status: IN_TRANSIT
2026-10-12 22:10:17.298 [main] INFO  c.s.s.a.ShippingWebhookController - Received authenticated Shiprocket webhook for AWB: 143254326543
✓ GATE L07 PASS: Webhook processed to terminal DELIVERED status for AWB 143254326543
2026-10-12 22:10:17.301 [main] INFO  c.s.s.a.ShippingService - Shipment for AWB 143254326543 is already in terminal DELIVERED status; ignoring webhook transition to IN_TRANSIT
✓ GATE L08 PASS: Out-of-order stale scan safely rejected; status preserved as DELIVERED
2026-10-12 22:10:17.323 [main] INFO  c.s.s.a.ShiprocketAdapter - Cancelling shipment via Shiprocket adapter for shipment ID: 88***11
✓ GATE L09 PASS: Live cancellation transmitted and acknowledged by Shiprocket
==========================================================================
PHASE L SIMULATED HARNESS COMPLETED WITH 100% SUCCESS
==========================================================================
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 27.03 s -- in com.sporekart.shipping.application.ShiprocketLiveSimulatedHarnessIntegrationTest
```

---

## 4. Production Cutover Runbook

When the business owner receives production Shiprocket merchant credentials, cutover to live operations is achieved simply and safely using the following runbook:

1. **Configure Environment Secrets:**
   ```bash
   SHIPROCKET_EMAIL="merchants@sporekart.in"
   SHIPROCKET_PASSWORD="<ProductionPassword>"
   SHIPROCKET_WEBHOOK_TOKEN="<SecureRandomHexToken>"
   SHIPROCKET_USE_REAL_SERVICE="true"
   SHIPROCKET_PICKUP_LOCATION="Warehouse 1 - Pune"
   SHIPROCKET_TRACKING_BASE_URL="https://track.shiprocket.in/"
   ```

2. **Register Webhook in Shiprocket Dashboard:**
   - URL: `https://api.sporekart.in/api/v1/shipping/webhook`
   - Header: `X-Shiprocket-Token` matching `SHIPROCKET_WEBHOOK_TOKEN`.
   - Events subscribed: Tracking status updates (Order Shipped, In-Transit, Out for Delivery, Delivered, RTO).

3. **Verify Health & Logs:**
   - In live mode, `ShiprocketTokenManager` transparently retrieves the JWT on first request and caches it for 9 days.
   - Any HTTP 401 triggers automatic invalidation and retry once before failing fast.
