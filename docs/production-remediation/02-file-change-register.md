# Sporekart Critical Production Remediation: File Change Register
**Document ID:** `SPOREKART-REMED-02`  
**Execution Date:** 2026-11-13  
**Status:** COMPLETE & VERIFIED  

---

## 1. Summary of Changes

A total of **24 files** were modified, created, or reconciled across the backend source tree, configuration profiles, migration folders, and automated test directories.

---

## 2. Exhaustive File Modification Register

### File 01: `backend/pom.xml`
- **Action:** MODIFIED
- **Lines Changed:** Added Maven Surefire Plugin configuration (`<plugins>...<artifactId>maven-surefire-plugin</artifactId>`).
- **Purpose:** Configured Surefire with `-javaagent:.../byte-buddy-agent-1.14.19.jar -XX:+EnableDynamicAgentLoading` to prevent ByteBuddy dynamic agent named pipe attachment hang/corruption in Windows sandbox during Mockito test runs.
- **Verification Evidence:** Enables clean and deterministic JVM execution of all unit and integration tests.

### File 02: `backend/src/main/resources/application-prod.yml`
- **Action:** MODIFIED
- **Lines Changed:** Added `sporekart.shiprocket.use-real-shiprocket: true` and `app.razorpay.mock-mode: false`.
- **Purpose:** Declares explicit production requirements that mock modes are disabled and real gateway/carrier services are mandatory.
- **Verification Evidence:** Verified via `SecurityConfigValidator` test assertions.

### File 03: `backend/src/main/java/com/sporekart/shipping/application/ShippingProvider.java`
- **Action:** MODIFIED
- **Lines Changed:** Added `boolean isMockMode();` contract method to `ShippingProvider` interface.
- **Purpose:** Allows consuming services and health checks to query provider execution mode without casting or inspecting private fields.
- **Verification Evidence:** Implemented in `ShiprocketAdapter`, `ShiprocketMockAdapter`, and `ShiprocketLiveAdapter`.

### File 04: `backend/src/main/java/com/sporekart/shipping/application/ShiprocketMockAdapter.java`
- **Action:** CREATED
- **Lines Changed:** 108 lines.
- **Purpose:** Dedicated mock implementation of `ShippingProvider` for `dev` and `test` environments. Retains development simulation capabilities without polluting live code paths.
- **Verification Evidence:** Tested via `SHIP-CRIT-001` and `SHIP-CRIT-002`.

### File 05: `backend/src/main/java/com/sporekart/shipping/application/ShiprocketLiveAdapter.java`
- **Action:** CREATED
- **Lines Changed:** 168 lines.
- **Purpose:** Dedicated live implementation of `ShippingProvider` that enforces real Shiprocket calls, verifies presence of credentials and REST client, and rejects missing configuration with `IllegalStateException`.
- **Verification Evidence:** Tested via `SHIP-CRIT-007` and `SHIP-CRIT-008`.

### File 06: `backend/src/main/java/com/sporekart/shipping/application/ShiprocketAdapter.java`
- **Action:** MODIFIED
- **Lines Changed:** 55-90, 115-180, 210-245.
- **Purpose:** 
  1. Profile detection: Added `isProductionEnvironment()`. In production, `isMockMode()` strictly returns `false`. If REST client is null in production, it throws `IllegalStateException`.
  2. Eliminated synthetic AWB generation: Removed `if (awbCode == null) awbCode = "SR-" + shipmentId`. If AWB is null, the result status is set to `AWB_PENDING` and AWB remains null.
  3. Eliminated fabricated tracking: Removed hardcoded locations (`"Central Sorting Facility"`) and fake `IN_TRANSIT`. On error, returns `TRACKING_UNAVAILABLE` without corrupting shipment records.
- **Verification Evidence:** Tested via `SHIP-CRIT-003`, `SHIP-CRIT-013`, `SHIP-CRIT-014`, `SHIP-CRIT-018`.

### File 07: `backend/src/main/java/com/sporekart/shipping/application/ShippingService.java`
- **Action:** MODIFIED
- **Lines Changed:** 65-85, 180-230, 235-280, 340-380.
- **Purpose:**
  1. Address pre-dispatch validation: Added validation for recipient name (>=2 chars), address line 1 (>=3 chars), city, state, valid 6-digit postal code (`^[1-9][0-9]{5}$`), and 10-digit Indian mobile number (`^[6-9][0-9]{9}$`).
  2. Concurrency conflict recovery: Catches `DataIntegrityViolationException` on unique `order_id` shipment constraint, returning existing shipment safely.
  3. Safe AWB assignment: Added `assignAwbForShipment` to allow carrier AWB reconciliation.
  4. Non-regressing tracking updates: On `TRACKING_UNAVAILABLE`, logs a warning and creates an audit entry without altering shipment business state.
- **Verification Evidence:** Tested via `SHIP-CRIT-021` to `SHIP-CRIT-029` and `scenarioA`, `scenarioB`, `scenarioE`.

### File 08: `backend/src/main/java/com/sporekart/shipping/domain/ShipmentStatus.java`
- **Action:** MODIFIED
- **Lines Changed:** Added `AWB_PENDING` and `SHIPMENT_FAILED` enum constants.
- **Purpose:** Enables explicit lifecycle tracking for shipments awaiting carrier AWB allocation or failing dispatch, eliminating ambiguity.
- **Verification Evidence:** Referenced and validated in `ShiprocketRemediationCriticalTest`.

### File 09: `backend/src/main/java/com/sporekart/shipping/infrastructure/ShippingHealthIndicator.java`
- **Action:** CREATED
- **Lines Changed:** 68 lines.
- **Purpose:** Implements Spring Boot Actuator `HealthIndicator`. Reports provider name, active mode (`LIVE` vs `MOCK`), authentication readiness, and connectivity status without leaking secrets.
- **Verification Evidence:** Tested via `SHIP-CRIT-011`.

### File 10: `backend/src/main/java/com/sporekart/shipping/infrastructure/shiprocket/ShiprocketApiException.java`
- **Action:** MODIFIED
- **Lines Changed:** Added single-argument constructor `public ShiprocketApiException(String message)`.
- **Purpose:** Enables clean exception propagation from adapter validation logic.
- **Verification Evidence:** Verified via unit tests.

### File 11: `backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfigValidator.java`
- **Action:** MODIFIED
- **Lines Changed:** 130-220.
- **Purpose:** Added production startup validation:
  1. Shiprocket: Mandates `use-real-shiprocket=true`, valid email, password, pickup-location, valid 6-digit pickup-pincode, and webhook token.
  2. Razorpay: Mandates `key-id` start with `rzp_live_`, rejects `rzp_test_` keys, rejects `mock-mode=true`, and mandates non-blank key-secret and webhook-secret.
- **Verification Evidence:** Tested via `SHIP-CRIT-003`..`006` and `PAY-CRIT-003`..`006`.

### File 12: `backend/src/main/java/com/sporekart/payment/application/PaymentService.java`
- **Action:** MODIFIED
- **Lines Changed:** 165-175, 589-598.
- **Purpose:**
  1. Wrapped authoritative gateway `fetchPayment` call in `try-catch` to safely catch gateway 504 timeouts, transitioning verification to `FAILED` without crashing or corrupting transaction state.
  2. Added defensive null check for `alreadyRefunded` in `refundPayment`: defaults to `BigDecimal.ZERO` if `sumRefundedAmountByPaymentIdAndStatuses` returns `null` (standard SQL `SUM()` behavior on empty sets).
- **Verification Evidence:** Tested via `PAY-CRIT-012`, `PAY-CRIT-014`, and `scenarioA`.

### File 13: `backend/src/test/java/com/sporekart/shipping/application/ShiprocketAdapterLiveUnitTest.java`
- **Action:** MODIFIED
- **Lines Changed:** 90-110.
- **Purpose:** Updated `ADAPT_LIVE_4` test to assert `assertNull(result.getAwbCode())` and verify `AWB_PENDING` status instead of expecting synthetic `"SR-"` AWB generation.
- **Verification Evidence:** All 4 tests in `ShiprocketAdapterLiveUnitTest` passed.

### File 14: `backend/src/test/java/com/sporekart/shipping/ShiprocketRemediationCriticalTest.java`
- **Action:** CREATED
- **Lines Changed:** 350 lines.
- **Purpose:** Comprehensive test suite executing `SHIP-CRIT-001` through `SHIP-CRIT-029` covering WP 01 and WP 02.
- **Verification Evidence:** 29 of 29 tests passed cleanly.

### File 15: `backend/src/test/java/com/sporekart/payment/RazorpayRemediationCriticalTest.java`
- **Action:** CREATED
- **Lines Changed:** 445 lines.
- **Purpose:** Comprehensive test suite executing `PAY-CRIT-001` through `PAY-CRIT-015` covering WP 03.
- **Verification Evidence:** 15 of 15 tests passed cleanly.

### Files 16-22: Reconciled Supabase Migrations (`backend/supabase/migrations/`)
- `20261013000037_v37__deduplicate_and_unique_active_user_cart.sql` (V37)
- `20261025000042_v42__add_order_status_created_at_index.sql` (V42)
- `20261025000043_v43__alter_inventory_audit_reason_to_text.sql` (V43)
- `20261026000044_v44__cleanup_legacy_orphaned_payments.sql` (V44)
- `20261026000045_v45__add_missing_fk_and_query_performance_indexes.sql` (V45)
- `20261027000046_v46__create_shedlock_table.sql` (V46)
- `20261027000047_v47__enable_rls_and_restrict_anon.sql` (V47)
- **Action:** CREATED
- **Purpose:** Synchronized the 7 missing migrations from Flyway into Supabase CLI timestamped format.
- **Verification Evidence:** Byte-for-byte SQL normalization matches Flyway scripts; verified via `DatabaseMigrationReconciliationTest`.

### File 23: `backend/src/test/java/com/sporekart/database/DatabaseMigrationReconciliationTest.java`
- **Action:** CREATED
- **Lines Changed:** 225 lines.
- **Purpose:** Test suite executing `DB-CRIT-001` through `DB-CRIT-013` validating Flyway and Supabase inventory match, SQL validity, index presence, and RLS lockdown.
- **Verification Evidence:** 13 of 13 tests passed cleanly.

### File 24: `backend/src/test/java/com/sporekart/integration/CrossModuleRemediationScenariosTest.java`
- **Action:** CREATED
- **Lines Changed:** 335 lines.
- **Purpose:** Multi-module integration test suite executing Scenarios A through E.
- **Verification Evidence:** 5 of 5 tests passed cleanly.

