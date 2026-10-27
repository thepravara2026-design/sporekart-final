# EC20-05: Concurrency, Reliability, Failure Recovery & Backup Audit

**Execution Date:** 2026-10-27  
**Auditor Roles:** Principal Site Reliability Engineer, Database Reliability Engineer  
**Audit Phase:** EC-20 Master Release Readiness Audit  
**Target System:** Sporekart E-Commerce Platform (Pravara Media)  

---

## 1. Executive Summary

This audit assesses the system's resilience under critical concurrent operations, hardware and network failures, asynchronous worker fault-tolerance, and disaster recovery procedures.

### Summary of Findings:
1. **Concurrency Protection:** Inventory management uses pessimistic row-level locking (`SELECT ... FOR UPDATE`) in [InventoryService.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/service/InventoryService.java). Stock cannot be oversold under race conditions.
2. **Order Idempotency:** The order submission endpoint supports `Idempotency-Key` deduplication, preventing double-billing on network retries.
3. **Asynchronous Notification Fault-Tolerance:** Background email failures (such as Gmail sending quota limits `550-5.4.5`) are isolated in [NotificationWorker.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/worker/NotificationWorker.java). Critical customer transactions (orders, payments, cancellations) succeed regardless of third-party mail provider health.
4. **Disaster Recovery:** Primary database resides on Supabase PostgreSQL with continuous WAL archiving.

---

## 2. Concurrency & Transaction Integrity (EC20-16)

### 2.1 Pessimistic Stock Locking

In an e-commerce platform specializing in mushroom cultivation supplies and spawn seeds with limited batch shelf life, race conditions during flash sales or high-traffic periods present significant inventory overselling risks.

Sporekart mitigates this via database-level pessimistic locking in `InventoryRepository.java`:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT i FROM InventoryRecord i WHERE i.variantId = :variantId")
Optional<InventoryRecord> findByVariantIdWithLock(@Param("variantId") UUID variantId);
```
- **Execution Mechanism:** When an order attempts stock deduction, a `SELECT ... FOR UPDATE` lock is acquired on the variant's inventory record.
- **Race Condition Result:** Competing threads wait for the lock to release; if `availableQuantity < requestedQuantity`, an `InsufficientStockException` is thrown before order confirmation. Zero negative stock rows exist in the database (verified `EC20-PERF-DB-03`).

### 2.2 Idempotent Order Creation

To prevent duplicate charges when a customer clicks "Place Order" multiple times or when an unstable mobile network retries a POST request:
1. The frontend or API client attaches a unique `Idempotency-Key: <UUID>` header.
2. [OrderService.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/service/OrderService.java) records the key. If a request with an existing key is received within the expiration window, the previously created order record is returned without re-executing inventory deduction or gateway order generation.

---

## 3. Failure Handling and Fault Tolerance (EC20-17)

Controlled failure injections were evaluated to verify graceful error degradation:

| Test ID | Failure Scenario | Target / Mechanism | Expected Result | Actual Observed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EC20-REL-REC-01** | Non-existent Record UUID | `GET /api/v1/orders/{non-existent-uuid}` | HTTP 404 with structured JSON | HTTP 404 Not Found | **PASS** |
| **EC20-REL-REC-02** | Malformed UUID String | `GET /api/v1/orders/invalid-uuid-format` | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **EC20-REL-REC-03** | Background SMTP Failure | Simulated email quota limit in worker | Actuator health remains UP | Actuator returns UP (`200 OK`) | **PASS** |

### 3.1 Background Email Worker Isolation

During audit operations, the development Gmail SMTP account hit daily sending thresholds (`550-5.4.5 Daily user sending limit exceeded`).
- **Resilience Observation:**
  - The [NotificationWorker.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/worker/NotificationWorker.java) logs the error, marks the `notification_events` record with status `FAILED`, and backs off exponentially.
  - The customer's order placement, cancellation, or checkout flow **was never blocked or rolled back**.
  - Setting `management.health.mail.enabled: false` in [application.yml](file:///f:/sporekart-v1/sporekart-final/src/main/resources/application.yml#L76) ensures that external SMTP rate limits do not degrade the core application health check.

---

## 4. Observability and Monitoring (EC20-18)

| Capability | Configured Mechanism | Operational Status |
| :--- | :--- | :--- |
| **Health Check** | Spring Boot Actuator (`/actuator/health`) | Active. Reports component status for DB, Disk, and Ping. |
| **Request Correlation** | `X-Request-ID` header filter | Active. Injected into every response and MDC logger context. |
| **Structured Logging** | Logback Spring console + file appenders | Active. Logs timestamps, thread IDs, log levels, and request IDs. |
| **Secret Redaction** | Logging patterns exclude passwords & HMAC keys | Verified clean in audit inspection. |

---

## 5. Backup, Restore & Data Recovery (EC20-19)

### 5.1 Supabase Backup Architecture
- **Primary Database Engine:** Supabase PostgreSQL 15.6.
- **Automated Backups:** Daily physical backups maintained by Supabase infrastructure.
- **WAL Archiving:** Write-Ahead Logging allows Point-in-Time Recovery (PITR) for disaster recovery.

### 5.2 Recommended Production Backup Strategy
1. **Automated Logical Backups:** Implement a daily cron job executing `pg_dump -Fc` uploaded to an isolated AWS S3 bucket with Object Lock (WORM compliance).
2. **Target Objectives:**
   - **Recovery Point Objective (RPO):** $\le 1\text{ hour}$ (via WAL archiving).
   - **Recovery Time Objective (RTO):** $\le 30\text{ minutes}$ (spin up replacement database and execute `pg_restore`).
3. **Disaster Recovery Drill:** Schedule a quarterly non-production restore test to validate schema and constraint recreation.
