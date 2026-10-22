# Phase 17 — Master Defect Register

**Execution Date:** October 19, 2026  
**Audit Scope:** Complete Sporekart E-Commerce & Agritech Platform  
**Total Cataloged Defects:** 22 Defects (P0: 2 | P1: 7 | P2: 7 | P3: 4 | P4: 2)  

---

## 1. Severity Distribution Summary

| Severity Level | Count | Definition | Action Required |
| :--- | :---: | :--- | :--- |
| **P0 Critical** | 2 | Catastrophic data integrity, severe security compromise, or critical financial risk. | Immediate pre-launch blocker. |
| **P1 High** | 7 | Core transaction failure, incorrect financial outcomes, or unauthorized sensitive-data access. | Required fix before commercial release. |
| **P2 Medium** | 7 | Significant functional defect with a possible workaround. | Scheduled for near-term sprint. |
| **P3 Low** | 4 | Limited functional or usability defect. | Polishing & UX optimization. |
| **P4 Informational** | 2 | Technical debt, maintainability issue, or improvement opportunity. | Backlog & continuous improvement. |

---

## 2. Complete Defect Register

### DEF-001: Cleartext Supabase Pooler Credentials in application-supabase.yml
- **Severity:** `P0 Critical` | **Confidence:** `Confirmed` | **Status:** `Residual Operational Risk (Requires Secret Rotation in Cloud Console)`
- **Affected Module:** Security & Infrastructure
- **Code Location:** `backend/src/main/resources/application-supabase.yml:lines 3-6`
- **Reproduction Steps:**
```
1. Open application-supabase.yml.
2. Observe datasource URL, username (postgres.irwiiyowpppdynbmwwuz), and password (MyDbSporekart@123#) committed in source.
```
- **Expected Result:** Database credentials must be supplied via environment variables (e.g. ${SUPABASE_DB_PASSWORD}) or cloud secrets manager.
- **Actual Result:** Direct production database connection strings and plain passwords are committed to the code repository.
- **Evidence:** application-supabase.yml lines 3-6: url: jdbc:postgresql://aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?prepareThreshold=0
- **Business Impact:** Full database compromise, catastrophic data exfiltration, unauthorized modification, or complete database wiping.
- **Exception-Handling Implications:** Authentication failures on rotation will trigger unhandled HikariPool connection exceptions and application startup crash.
- **Recommendation:** Immediately rotate the Supabase database password in the Supabase console, purge git history via git filter-repo, and bind Spring datasource properties to environment variables.
- **Future Regression Requirements:** Pre-commit git secret detection hook (e.g. gitleaks / git-secrets) scanning all yml/properties files.

---

### DEF-002: High and Critical Severity Vulnerabilities in Frontend Dependencies
- **Severity:** `P0 Critical` | **Confidence:** `Confirmed` | **Status:** `Residual Staging Constraint (Upgradable via package.json overrides)`
- **Affected Module:** Frontend Architecture & Dependencies
- **Code Location:** `frontend/package.json & frontend/package-lock.json`
- **Reproduction Steps:**
```
1. Navigate to frontend/ directory.
2. Execute 'npm audit --audit-level=high'.
3. Review reported advisories.
```
- **Expected Result:** Zero High or Critical vulnerabilities in dependency tree.
- **Actual Result:** 15 vulnerabilities detected, including Critical RCE in tinypool <= 2.1.1 and High DoS in source-map-js.
- **Evidence:** npm audit report output: 15 vulnerabilities (4 moderate, 9 high, 2 critical). Tinypool CVE-2024-xxxx, source-map-js advisory.
- **Business Impact:** Remote code execution during developer build or Vitest worker threads; denial of service in bundle processing.
- **Exception-Handling Implications:** Worker thread execution crashes with uncaught unhandled exceptions during build / CI runs.
- **Recommendation:** Execute 'npm update' or pin patched subdependencies in overrides block of package.json. Upgrade tinypool to >= 2.1.2.
- **Future Regression Requirements:** Automated Dependabot / Renovate scanning with CI gate blocking merges on High/Critical vulnerabilities.

---

### DEF-003: Static Hardcoded Fallback JWT Secret in Dev and Test Profiles
- **Severity:** `P1 High` | **Confidence:** `Confirmed` | **Status:** `Open / Backlog`
- **Affected Module:** Identity & Authentication
- **Code Location:** `backend/src/main/resources/application-dev.yml:line 32 & application-test.yml:line 19`
- **Reproduction Steps:**
```
1. Launch backend without setting JWT_SECRET environment variable.
2. Application bootstraps using static fallback string 'SporekartSecureJwtSecretKeyMustBeLongEnoughForHS256Algorithm2026'.
3. Forge JWT token signed with this secret string.
4. Call protected endpoint /api/v1/customer/profile with forged token.
```
- **Expected Result:** Application must fail to start in non-test profiles if JWT_SECRET is missing, or generate an ephemeral random startup secret.
- **Actual Result:** Application silently uses known public fallback key; attackers knowing the secret can forge valid admin tokens.
- **Evidence:** application-dev.yml: secret: ${JWT_SECRET:SporekartSecureJwtSecretKeyMustBeLongEnoughForHS256Algorithm2026}
- **Business Impact:** Complete authentication bypass and administrative privilege escalation if dev/test profile settings leak to staging/prod.
- **Exception-Handling Implications:** Signature validation succeeds for forged tokens, allowing malicious requests to bypass security filter chain.
- **Recommendation:** Remove static fallback from application-dev.yml. Fail application bootstrap with ApplicationContextException if JWT_SECRET is unset.
- **Future Regression Requirements:** Automated security test verifying application context failure when JWT_SECRET is empty in staging/production mode.

---

### DEF-004: Partial Failure & Financial Drift in Order Cancellation Wallet Refund
- **Severity:** `P1 High` | **Confidence:** `Confirmed` | **Status:** `Resolved / Hardened in Phase 8`
- **Affected Module:** Orders & Wallet Integration
- **Code Location:** `backend/src/main/java/com/sporekart/order/application/OrderService.java:lines 440-456, 458-470`
- **Reproduction Steps:**
```
1. Create and pay for an order worth INR 3,500.
2. Simulate transient failure in walletService.processRefundToWallet() (e.g. wallet lock timeout).
3. Trigger POST /api/v1/orders/{id}/cancel.
4. Observe OrderService catches and logs exception but continues execution, marking order CANCELLED.
```
- **Expected Result:** If wallet refund credit fails, the cancellation transaction must roll back or queue a resilient retry outbox event.
- **Actual Result:** Order is marked CANCELLED in database, but customer wallet is credited INR 0, stranding customer funds in limbo.
- **Evidence:** OrderService.java line 520: } catch (Exception e) { log.error("Error crediting wallet...", e); } order.setStatus(newStatus); orderRepository.save(order);
- **Business Impact:** Customer financial loss, unrecorded liability in ledger, reconciliation breakdown, customer support escalation.
- **Exception-Handling Implications:** Swallowing Exception prevents Spring transaction rollback, committing partial mutation to PostgreSQL.
- **Recommendation:** Rethrow custom OrderCancellationRefundException to force transaction rollback, or implement a transactional outbox pattern for refunds.
- **Future Regression Requirements:** Unit test verifying rollback when processRefundToWallet throws runtime exception during cancellation.

---

### DEF-005: JPA @Transactional Silent Rollback Violation in Webhook Handling
- **Severity:** `P1 High` | **Confidence:** `Confirmed` | **Status:** `Resolved / Hardened in Phase 9`
- **Affected Module:** Payments & Webhooks
- **Code Location:** `backend/src/main/java/com/sporekart/payment/application/PaymentService.java:lines 225, 236-240`
- **Reproduction Steps:**
```
1. Send duplicate Razorpay payment.captured webhook with same event_id concurrently.
2. Both threads enter @Transactional processWebhook.
3. Second thread hits DataIntegrityViolationException on paymentEventRepository.save(event).
4. Catch block catches exception and returns 200 message string.
5. Transaction commit fails with UnexpectedRollbackException, returning HTTP 500 to Razorpay.
```
- **Expected Result:** Duplicate webhook events must be ignored idempotently and return HTTP 200 OK without triggering transaction rollback.
- **Actual Result:** Hibernate marks session rollback-only upon constraint violation; commit triggers UnexpectedRollbackException, causing HTTP 500 and gateway retry storm.
- **Evidence:** PaymentService.java lines 236-239: catch (DataIntegrityViolationException dive) { log.warn(...); return "Webhook event already processed"; }
- **Business Impact:** Razorpay enters exponential retry backoff storm, overwhelming server with redundant webhook requests for 24 hours.
- **Exception-Handling Implications:** UnexpectedRollbackException bubbles to GlobalExceptionHandler, which returns generic HTTP 500 error envelope.
- **Recommendation:** Extract idempotency verification and event recording into separate service with @Transactional(propagation = Propagation.REQUIRES_NEW).
- **Future Regression Requirements:** Integration test sending identical concurrent webhook payloads and asserting HTTP 200 OK without rollback exceptions.

---

### DEF-006: Concurrency Race Condition on Masterclass Batch Capacity Reservation
- **Severity:** `P1 High` | **Confidence:** `Confirmed` | **Status:** `Resolved / Hardened in Phase 11`
- **Affected Module:** Training & Enrollment
- **Code Location:** `backend/src/main/java/com/sporekart/training/application/TrainingService.java:lines 175-195`
- **Reproduction Steps:**
```
1. Seed a batch with capacity = 10, enrolled_count = 9 (1 seat left).
2. Send 5 simultaneous POST /api/v1/training/enrollments requests from different users.
3. Observe enrolled_count increments beyond capacity to 14 without database lock rejection.
```
- **Expected Result:** Database must reject requests exceeding capacity using pessimistic locking or conditional UPDATE (WHERE enrolled_count < capacity).
- **Actual Result:** Enrolled count exceeds capacity, allowing oversubscription of physical workshop seats.
- **Evidence:** 12 training batches in staging database exhibited enrolled_count > capacity following synthetic concurrency tests (audit_output/check_catalog_and_batches.py).
- **Business Impact:** Physical workshop classroom overcrowding, logistical breakdown, refund liabilities, breach of customer trust.
- **Exception-Handling Implications:** BatchCapacityExceededException is only checked in memory before concurrent updates bypass the check.
- **Recommendation:** Use SELECT FOR UPDATE (PESSIMISTIC_WRITE) on Batch entity or execute atomic UPDATE batches SET enrolled_count = enrolled_count + 1 WHERE id = :id AND enrolled_count < capacity.
- **Future Regression Requirements:** Concurrent thread test booking last available seat across 20 threads, asserting exactly 1 success and 19 rejections.

---

### DEF-007: Inventory Stock Reservation Race Condition Under Concurrent Checkouts
- **Severity:** `P1 High` | **Confidence:** `Confirmed` | **Status:** `Resolved / Hardened in Phase 8`
- **Affected Module:** Catalog & Inventory
- **Code Location:** `backend/src/main/java/com/sporekart/order/application/OrderService.java & InventoryRepository.java`
- **Reproduction Steps:**
```
1. Set product variant stock to 1.
2. Trigger 10 concurrent checkout requests for that product variant.
3. Multiple checkouts pass available_quantity check before stock is decremented.
```
- **Expected Result:** Exactly 1 order placed; other 9 rejected with HTTP 409 Insufficient Stock.
- **Actual Result:** Race condition permits 2 or more orders to be placed against single stock unit prior to decrement.
- **Evidence:** Performance concurrency benchmark test results: 226 collision errors under concurrent thread bursts.
- **Business Impact:** Overselling physical stock, order fulfillment delays, negative customer reviews, cancellation costs.
- **Exception-Handling Implications:** OptimisticLockException or late stock validation throws after order is created, requiring manual cancellation.
- **Recommendation:** Use pessimistic locking on inventory rows during checkout stock reservation, or atomic database decrement queries.
- **Future Regression Requirements:** Concurrent stress test purchasing stock unit = 1 with 20 parallel threads.

---

### DEF-008: Database Schema Drift: V37 Flyway Migration Missing from Supabase Directory
- **Severity:** `P1 High` | **Confidence:** `Confirmed` | **Status:** `Resolved / Reconciled in Phase 5`
- **Affected Module:** Database & Migrations
- **Code Location:** `backend/supabase/migrations/ vs backend/src/main/resources/db/migration/`
- **Reproduction Steps:**
```
1. Compare directory contents between db/migration/ and supabase/migrations/.
2. Observe V37__deduplicate_and_unique_active_user_cart.sql existed in Spring Flyway directory but was absent in Supabase directory.
```
- **Expected Result:** All database migrations must be mirrored identically across Spring Boot Flyway and Supabase CLI directories.
- **Actual Result:** Direct Supabase CLI deployments (supabase db push) did not apply V37 partial unique index on active carts.
- **Evidence:** Diff between backend/src/main/resources/db/migration and backend/supabase/migrations revealed missing V37 and unapplied V39.
- **Business Impact:** Schema divergence between local development, Supabase staging, and production environments; duplicate active carts.
- **Exception-Handling Implications:** Missing database constraints allow duplicate cart insertion, corrupting user checkout sessions.
- **Recommendation:** Created 20261017000039_v39__reconcile_and_add_foreign_key_indexes.sql and mirrored V37 into supabase/migrations.
- **Future Regression Requirements:** CI pipeline check comparing file hashes between db/migration/ and supabase/migrations/.

---

### DEF-009: Missing Foreign Key Indexes on 9 High-Traffic Relational Tables
- **Severity:** `P1 High` | **Confidence:** `Confirmed` | **Status:** `Resolved / Reconciled in Phase 5`
- **Affected Module:** Database Performance
- **Code Location:** `backend/src/main/resources/db/migration/V39__reconcile_and_add_foreign_key_indexes.sql`
- **Reproduction Steps:**
```
1. Run PostgreSQL query inspecting pg_stat_user_tables and pg_indexes for foreign key columns.
2. Note unindexed foreign keys on cart_items.cart_id, order_items.order_id, wallet_transactions.wallet_id, etc.
```
- **Expected Result:** All foreign key columns must possess B-tree indexes to support fast joins and prevent full table locks on parent table deletes.
- **Actual Result:** PostgreSQL performed sequential table scans for foreign key constraint checks and relational joins.
- **Evidence:** Database integrity scan identified 9 unindexed foreign key relationships in public schema.
- **Business Impact:** Query latency degradation, CPU spikes, table locks during order/cart item deletions as dataset grows.
- **Exception-Handling Implications:** Query timeout exceptions (QueryTimeoutException / 504 Gateway Timeout) under high transaction volumes.
- **Recommendation:** Deployed Flyway migration V39 adding 14 targeted indexes covering all relational joins and filter paths.
- **Future Regression Requirements:** Automated SQL schema test verifying that 100% of foreign key constraints have matching indexes.

---

### DEF-010: Unbounded Heap Memory Consumption in AbandonedCartScheduler
- **Severity:** `P2 Medium` | **Confidence:** `Confirmed` | **Status:** `Open / Technical Debt`
- **Affected Module:** Notifications & Schedulers
- **Code Location:** `backend/src/main/java/com/sporekart/notification/application/AbandonedCartScheduler.java:lines 47-50`
- **Reproduction Steps:**
```
1. Inspect AbandonedCartScheduler.scanAbandonedCarts() source code.
2. Note cartRepository.findAll() loads every cart in the database into JVM memory.
3. Carts are filtered in memory via stream().filter(c -> c.getStatus() == CartStatus.ACTIVE).
```
- **Expected Result:** Scheduler should query only abandoned carts via indexed SQL query (e.g. findByStatusAndUpdatedAtBefore(ACTIVE, cutoff, Pageable)).
- **Actual Result:** Entire carts table is loaded into memory every 15 minutes, consuming O(N) memory and holding JDBC connection open.
- **Evidence:** AbandonedCartScheduler.java: List<Cart> activeCarts = cartRepository.findAll().stream().filter(...).collect(Collectors.toList());
- **Business Impact:** JVM OutOfMemoryError (OOM) and GC pause spikes as total historical carts exceed tens of thousands.
- **Exception-Handling Implications:** OOM in scheduler thread crashes background execution and degrades entire Spring Boot application responsiveness.
- **Recommendation:** Replace findAll().stream() with parameterized repository query using pagination: findAbandonedActiveCarts(cutoffTime, PageRequest.of(0, 50)).
- **Future Regression Requirements:** Static code analysis rule forbidding findAll() calls in scheduled service methods.

---

### DEF-011: Scheduled Daemons Lack Per-Item Exception Boundaries (Batch Failure Cascade)
- **Severity:** `P2 Medium` | **Confidence:** `Confirmed` | **Status:** `Open / Technical Debt`
- **Affected Module:** Background Workers & Schedulers
- **Code Location:** `backend/src/main/java/com/sporekart/notification/application/AbandonedCartScheduler.java & BlogContentService.java`
- **Reproduction Steps:**
```
1. Schedule 5 blog posts due for publishing.
2. Invalidate slug or title on post #2 to trigger validation failure on save.
3. Execute BlogContentService.processScheduledPosts().
4. Observe uncaught exception on post #2 rolls back entire transaction; posts 1, 3, 4, 5 are never published.
```
- **Expected Result:** Each scheduled item should be processed in its own try/catch block so a single bad record does not block remaining items.
- **Actual Result:** A single corrupt record aborts the loop, rolls back the transaction, and repeats the crash every minute.
- **Evidence:** BlogContentService.java: @Scheduled @Transactional public void processScheduledPosts() { for (BlogPost post : duePosts) { post.publish(); postRepository.save(post); } }
- **Business Impact:** Platform-wide publishing paralysis; automated cart abandonment emails completely halted.
- **Exception-Handling Implications:** Transactional rollback-only causes scheduled worker starvation.
- **Recommendation:** Wrap per-item logic in try/catch, log failures individually, and record item-level error status without aborting batch.
- **Future Regression Requirements:** Unit test simulating single-item failure in batch and asserting remaining items process successfully.

---

### DEF-012: Uncaught Asynchronous Exception Drop & Missing AsyncUncaughtExceptionHandler
- **Severity:** `P2 Medium` | **Confidence:** `Confirmed` | **Status:** `Resolved / Hardened in Phase 12`
- **Affected Module:** Analytics & Event Bus
- **Code Location:** `backend/src/main/java/com/sporekart/analytics/application/AnalyticsEventListener.java:lines 22-120`
- **Reproduction Steps:**
```
1. Trigger ProductViewed event with product title containing unescaped double quotes (e.g. 2.5" Mushroom Bag).
2. String.format creates invalid JSON in eventDataJson.
3. analyticsEventRepository.save(entity) throws database or JSON parsing exception in worker thread.
```
- **Expected Result:** Async exceptions should be captured by custom AsyncUncaughtExceptionHandler, logged with structured MDC, and routed to DLQ.
- **Actual Result:** Spring defaults to SimpleAsyncUncaughtExceptionHandler, printing a single unmonitored log line; event is silently dropped.
- **Evidence:** AnalyticsEventListener.java: All 8 listener methods are @Async public void without try/catch or custom exception handler.
- **Business Impact:** Silent loss of business analytics events, distorted conversion funnel metrics, untracked user behavior.
- **Exception-Handling Implications:** Calling thread is unaware of failure because void @Async methods return immediately without awaiting result.
- **Recommendation:** Implement AsyncConfigurer with custom AsyncUncaughtExceptionHandler and serialize JSON using Jackson ObjectMapper instead of String.format.
- **Future Regression Requirements:** Test publishing malformed event payload and asserting dead-letter queue or error metric increment.

---

### DEF-013: Systemic HTTP Status Mapping Inconsistency (404 Converted to 400 Bad Request)
- **Severity:** `P2 Medium` | **Confidence:** `Confirmed` | **Status:** `Resolved / Hardened in Phase 3`
- **Affected Module:** API & Exception Handling
- **Code Location:** `backend/src/main/java/com/sporekart/shared/application/GlobalExceptionHandler.java & 8 Domain Services`
- **Reproduction Steps:**
```
1. Send GET /api/v1/content/posts/non-existent-slug.
2. Observe service throws IllegalArgumentException("Blog post not found...").
3. GlobalExceptionHandler maps IllegalArgumentException to HTTP 400 BAD REQUEST.
```
- **Expected Result:** Missing resources should return HTTP 404 NOT FOUND with ResourceNotFoundException.
- **Actual Result:** HTTP 400 BAD REQUEST returned instead of 404 NOT FOUND.
- **Evidence:** audit_output/06_BACKEND_EXCEPTION_HANDLING_AUDIT.md: 28 occurrences across TrainingService, SupportApplicationService, ShippingService, etc.
- **Business Impact:** Frontend error handlers cannot distinguish client payload syntax errors from missing resources; SEO crawlers misindex dead links as client bugs.
- **Exception-Handling Implications:** API contract violation against REST standards (RFC 9110).
- **Recommendation:** Replace IllegalArgumentException with ResourceNotFoundException across entity lookup .orElseThrow() invocations.
- **Future Regression Requirements:** Automated API contract test asserting HTTP 404 for all non-existent entity IDs across all public and protected routes.

---

### DEF-014: Missing Framework Exception Handlers in GlobalExceptionHandler
- **Severity:** `P2 Medium` | **Confidence:** `Confirmed` | **Status:** `Resolved / Hardened in Phase 3`
- **Affected Module:** API & Error Handling
- **Code Location:** `backend/src/main/java/com/sporekart/shared/application/GlobalExceptionHandler.java:lines 18-106`
- **Reproduction Steps:**
```
1. Send POST /api/v1/cart/items with malformed JSON body: {"productId": "abc",}.
2. Spring throws HttpMessageNotReadableException.
3. Because handler is missing, exception falls through to @ExceptionHandler(Exception.class), returning HTTP 500.
```
- **Expected Result:** Malformed JSON syntax should return HTTP 400 Bad Request with code MALFORMED_JSON_REQUEST.
- **Actual Result:** HTTP 500 INTERNAL_SERVER_ERROR returned with generic server failure message.
- **Evidence:** GlobalExceptionHandler.java lacked explicit handlers for HttpMessageNotReadableException, MethodArgumentTypeMismatchException, etc.
- **Business Impact:** False-positive 500 alerts in production APM monitoring; poor developer/client integration experience.
- **Exception-Handling Implications:** Normal client-side input errors trigger high-severity server incident alerts.
- **Recommendation:** Add explicit handlers for HttpMessageNotReadableException, MethodArgumentTypeMismatchException, HttpRequestMethodNotSupportedException.
- **Future Regression Requirements:** Contract test verifying HTTP 400 on malformed JSON and HTTP 405 on unsupported HTTP methods.

---

### DEF-015: Code Clones & Duplication Between Checkout and Trainee Profile Forms
- **Severity:** `P2 Medium` | **Confidence:** `Confirmed` | **Status:** `Resolved in Phase 16`
- **Affected Module:** Frontend Architecture
- **Code Location:** `frontend/src/pages/CheckoutPage.jsx & frontend/src/components/TraineeProfileEnrollmentModal.jsx`
- **Reproduction Steps:**
```
1. Run jscpd linter on frontend/src.
2. Observe 99 code clones with 1,592 duplicated lines identified between CheckoutPage and TraineeProfileEnrollmentModal.
```
- **Expected Result:** Shared address form fields, state/city dropdowns, and PIN lookup logic should be abstracted into a single reusable component.
- **Actual Result:** Duplicated JSX form markup and validation logic led to inconsistent bug fixes across checkout and training enrollment.
- **Evidence:** jscpd-report/jscpd-report.json: 99 clones, 1,592 duplicate lines.
- **Business Impact:** High maintenance overhead; bug fixes applied to checkout address logic did not automatically propagate to training enrollment modal.
- **Exception-Handling Implications:** Form validation errors handled differently between checkout and training pages.
- **Recommendation:** Extracted shared IndianAddressForm component used uniformly across CheckoutPage, DashboardPage, and TraineeProfileEnrollmentModal.
- **Future Regression Requirements:** jscpd quality gate in package.json asserting clone percentage < 5%.

---

### DEF-016: Admin Order and Invoice Retrieval IDOR Restriction
- **Severity:** `P2 Medium` | **Confidence:** `Confirmed` | **Status:** `Resolved / Hardened in Phase 8`
- **Affected Module:** Orders & Support
- **Code Location:** `backend/src/main/java/com/sporekart/order/application/OrderService.java:lines 268-278`
- **Reproduction Steps:**
```
1. Authenticate as admin user (ROLE_ADMIN).
2. Request customer order details via GET /api/v1/orders/{orderId} or invoice via /orders/{orderId}/invoice.
3. OrderService checks order.getUserId().equals(currentUserId), rejecting admin with HTTP 403 Forbidden.
```
- **Expected Result:** Admin operators with ROLE_ADMIN should be authorized to inspect customer orders and generate invoices.
- **Actual Result:** Admins could only access orders via dedicated admin endpoint, breaking support deep-links and shared invoice links.
- **Evidence:** OrderService.java: if (!order.getUserId().equals(userId)) { throw new ForbiddenOperationException(...); } without checking role.
- **Business Impact:** Operational impediment for customer support agents trying to view invoices from support tickets.
- **Exception-Handling Implications:** ForbiddenOperationException thrown instead of allowing administrative privilege delegation.
- **Recommendation:** Update validateOrderAccess to permit access if order.getUserId().equals(userId) OR currentUser.hasRole('ROLE_ADMIN').
- **Future Regression Requirements:** Test asserting admin can view customer order invoice while customer cannot view other customers' orders.

---

### DEF-017: Phone Number Country Code Regex Collision in validateIndianPhone
- **Severity:** `P3 Low` | **Confidence:** `Confirmed` | **Status:** `Resolved & Verified in Phase 16`
- **Affected Module:** Frontend Validation
- **Code Location:** `frontend/src/utils/validation.js:validateIndianPhone`
- **Reproduction Steps:**
```
1. Enter valid 10-digit Indian phone number starting with '91' (e.g. 9111320655).
2. Regex cleaned.replace(/^(?:\+91|91|0)/, '') stripped leading '91', leaving 8 digits (11320655).
3. Validation returned 'Valid 10-digit Indian mobile number is required'.
```
- **Expected Result:** 10-digit numbers starting with 91 must not have 91 stripped; only 12-digit numbers starting with 91 should strip prefix.
- **Actual Result:** Legitimate phone numbers starting with 91 were rejected as invalid.
- **Evidence:** Playwright E2E checkout test failed when test phone number was 9111320655.
- **Business Impact:** Valid customers with phone numbers beginning with 91 were blocked from completing checkout and training enrollment.
- **Exception-Handling Implications:** Client-side form validation blocked submission before API call was made.
- **Recommendation:** Fixed regex in validation.js to check string length before stripping country code: if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = cleaned.slice(2).
- **Future Regression Requirements:** Unit test asserting validateIndianPhone('9111320655') returns null error.

---

### DEF-018: Jackson Boolean Property Getter Serialization Discrepancy
- **Severity:** `P3 Low` | **Confidence:** `Confirmed` | **Status:** `Resolved & Verified in Phase 16`
- **Affected Module:** Training API & DTOs
- **Code Location:** `backend/src/main/java/com/sporekart/training/api/TrainingDtos.java:BatchSlotResponse`
- **Reproduction Steps:**
```
1. Inspect serialized JSON response from GET /api/v1/training/courses.
2. Java boolean field isAvailable with getter isAvailable() serialized as JSON key 'available' by Jackson.
3. Frontend template checked slot.isAvailable, which evaluated to undefined.
```
- **Expected Result:** JSON key should match frontend expectations (isAvailable) or frontend should check both available and isAvailable.
- **Actual Result:** Available batch slots rendered as disabled/full in frontend masterclass catalog.
- **Evidence:** Playwright test 09_training_enrollment.spec.js timed out waiting for active batch slot buttons.
- **Business Impact:** Prospective trainees could not click 'Select Slot' on open courses with seats available.
- **Exception-Handling Implications:** No backend exception; purely silent API serialization contract mismatch.
- **Recommendation:** Annotated BatchSlotResponse.isAvailable with @JsonProperty("isAvailable") and added defensive frontend check (slot.isAvailable || slot.available).
- **Future Regression Requirements:** Integration test validating JSON key 'isAvailable' is present in BatchSlotResponse payload.

---

### DEF-019: Address Form State Synchronization Race Condition with Async PIN Code Lookup
- **Severity:** `P3 Low` | **Confidence:** `Confirmed` | **Status:** `Resolved & Verified in Phase 16`
- **Affected Module:** Frontend Components
- **Code Location:** `frontend/src/components/IndianAddressForm.jsx`
- **Reproduction Steps:**
```
1. Type PIN code 560001 (triggers async postal lookup).
2. Immediately begin typing phone number before lookup resolves.
3. When lookup resolves, updateForm({ state, city }) called with stale formData closure, wiping the phone number input.
```
- **Expected Result:** Asynchronous PIN lookup should merge into latest form state without overwriting concurrent inputs.
- **Actual Result:** Phone number field was wiped blank upon PIN lookup completion, causing form validation failure on submit.
- **Evidence:** Playwright test 09_training_enrollment snapshot showed focused, empty Primary Phone input despite fill action.
- **Business Impact:** Users had their phone numbers cleared unexpectedly when entering address details rapidly.
- **Exception-Handling Implications:** Form validation failed on client submit, preventing navigation to payment gateway.
- **Recommendation:** Updated IndianAddressForm to synchronously update formDataRef.current and dispatch functional state updates (onChange(prev => ({ ...prev, ...patch }))).
- **Future Regression Requirements:** E2E test rapidly typing PIN code and phone number, verifying both values are retained.

---

### DEF-020: SEO Meta Description Length Underflow on About and Contact Pages
- **Severity:** `P3 Low` | **Confidence:** `Confirmed` | **Status:** `Resolved & Verified in Phase 16`
- **Affected Module:** SEO & Metadata
- **Code Location:** `frontend/src/pages/AboutPage.jsx & frontend/src/pages/ContactPage.jsx`
- **Reproduction Steps:**
```
1. Run 'npm run seo:gate'.
2. Note description lengths for /about (61 chars) and /contact (58 chars) fell below the 70-character threshold.
```
- **Expected Result:** Meta descriptions must be between 70 and 160 characters for optimal search snippet display.
- **Actual Result:** SEO quality gate flagged warnings on meta description length underflow.
- **Evidence:** scripts/seo-quality-gate.js execution logs: /about meta description length 61 < 70.
- **Business Impact:** Search engine snippet truncation, reduced search engine click-through rates (CTR).
- **Exception-Handling Implications:** Build gate warning in CI.
- **Recommendation:** Expanded meta descriptions to comprehensive, keyword-rich summaries (> 120 characters).
- **Future Regression Requirements:** Automated SEO gate asserting 100% of routes meet 70-160 character description constraints.

---

### DEF-021: 306 Non-Fatal ESLint Warnings Across Frontend Modules
- **Severity:** `P4 Informational` | **Confidence:** `Confirmed` | **Status:** `Open / Technical Debt`
- **Affected Module:** Frontend Code Quality
- **Code Location:** `frontend/src/ (multiple files)`
- **Reproduction Steps:**
```
1. Run 'npm run lint'.
2. Observe 306 warnings for unused React imports and unused Lucide icon imports.
```
- **Expected Result:** Clean linter output with zero warnings and zero errors.
- **Actual Result:** 306 warnings reported; if --max-warnings 0 is enforced in package.json, CI build fails.
- **Evidence:** npm run lint output: 0 errors, 306 warnings.
- **Business Impact:** Code clutter, minor bundle bloat from unused imports (partially mitigated by Vite tree-shaking).
- **Exception-Handling Implications:** No runtime implications.
- **Recommendation:** Remove unused 'import React' declarations across JSX files and prune unused Lucide icon imports.
- **Future Regression Requirements:** Configure ESLint --max-warnings threshold to ratcheted target during refactoring sprints.

---

### DEF-022: Staging Fallbacks for Real External Delivery Channels (SMS & SMTP)
- **Severity:** `P4 Informational` | **Confidence:** `Confirmed` | **Status:** `Residual Staging Constraint`
- **Affected Module:** External Integrations
- **Code Location:** `backend/src/main/resources/application.yml & application-dev.yml`
- **Reproduction Steps:**
```
1. Inspect TwilioSmsService.java and NotificationWorker.java.
2. Note USE_REAL_TWILIO_SMS=false and SMTP fallback to application log sink in local staging.
```
- **Expected Result:** Production environment must connect to live authenticated Twilio and JavaMailSender SMTP gateways.
- **Actual Result:** Staging operates safely in mock/log mode to prevent accidental SMS billing or test email delivery to real recipients.
- **Evidence:** NotificationWorker log output: [NOTIFICATION DISPATCHED - LOG MODE] Event ID: ...
- **Business Impact:** Live external carrier deliverability (DLR receipt, spam score, inbox placement) cannot be verified in staging without real credentials.
- **Exception-Handling Implications:** Third-party network timeouts and carrier rate limits are bypassed in mock mode.
- **Recommendation:** Maintain mock mode for CI/staging. Require live credentials verification during production deployment sign-off.
- **Future Regression Requirements:** Dedicated smoke test in pre-production verifying live SMS dispatch to verified operator phone number.

---
