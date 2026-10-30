# Sporekart Performance, Reliability & Scaling Audit Report
**Target System:** Sporekart E-Commerce & Agritech Masterclass Platform  
**Architecture:** Spring Boot 3.3.3 / Java 21 / PostgreSQL 17.6 (Supabase Tokyo PgBouncer) / React 18.3.1  
**Audit Scope:** 1. Database Indexing | 2. Caching Strategy | 3. Load Testing | 4. Horizontal & Vertical Scaling  
**Audit Mode:** Strict Read-Only Audit & Gap Analysis  
**Output Document:** `audit-reports/PERFORMANCE_SCALING_AUDIT_PLAN.md`  

---

## 1. Executive Summary & Assessment Matrix

This technical audit evaluates the performance, caching, load-testing, and scaling posture of the Sporekart production codebase. The audit was conducted strictly in **read-only mode**, inspecting all Flyway migrations (`V1` to `V44`), JPA entity definitions, Spring Data repositories, configuration manifests (`application*.yml`, `docker-compose.yml`, `railway.json`), container specifications, and test artifacts.

### Current State Assessment Matrix

| Pillar | Implementation Status | Coverage | Primary Risk / Bottleneck |
| :--- | :--- | :---: | :--- |
| **1. Database Indexing** | **Partially Implemented** | ~65% | Missing foreign key indexes (`product_offers`, `product_media`, `cart_items`), missing composite indexes (`batches`, `courses`), and no Trigram/GIN full-text search indexes (`LIKE %q%` table scans). |
| **2. Caching Strategy** | **Not Implemented** | 0% | No Spring Cache (`@EnableCaching` absent), no cache provider (Caffeine/Redis), no `@Cacheable` on catalog or training endpoints, no HTTP `ETag` or `Cache-Control` headers for public read APIs. |
| **3. Load Testing Harness** | **Partially Implemented** | ~25% | Ad-hoc Python script in `audit_output/` with hardcoded tokens; no automated, reproducible industry-standard framework (k6/Gatling) integrated into CI/CD quality gates. |
| **4. Scaling Architecture** | **Partially Implemented** | ~40% | Stateless JWT is sound, but **zero distributed locking (ShedLock)** exists for 7 `@Scheduled` tasks (causes duplicate emails and reconciliation races if scaled horizontally); in-memory rate limiting; untuned JVM container flags. |

---

## 2. Detailed Findings & Gap Analysis

### 2.1 Database Indexing

#### Strengths Identified
- Significant indexing optimizations were introduced in migrations `V21`, `V34`, `V37`, `V38`, `V39`, `V40`, `V41`, and `V42`.
- Primary transactional paths have strong coverage:
  - `orders(user_id, created_at DESC)` (`V34`)
  - `orders(status, created_at DESC)` (`V42`)
  - `orders(user_id, status)` (`V21`)
  - `order_items(order_id)` and `order_items(variant_id)` (`V39`)
  - `enrollments(user_id, enrolled_at DESC)` (`V34`) and `enrollments(course_id)` (`V39`)
  - `notification_events` has composite indexes for in-app feeds (`user_id, is_read, created_at DESC`) and status polling (`V35`).
  - `carts` has a partial unique index ensuring only one active cart per user: `uq_carts_user_active ON carts(user_id) WHERE user_id IS NOT NULL AND status = 'ACTIVE'` (`V37`).

#### Gaps & Bottlenecks Identified

1. **Unindexed Foreign Keys (Table Scan on Deletes/Joins):**
   - **`product_offers.product_id`:** `V39` indexed `variant_id`, but `product_id` remains unindexed. Deleting a product triggers sequential scans across `product_offers`.
   - **`product_media.product_id`:** `V39` indexed `variant_id`, but `product_id` remains unindexed.
   - **`cart_items.variant_id`:** Constraint `uk_cart_variant` is `(cart_id, variant_id)`. Searching or deleting a `variant_id` standalone requires a full table scan of `cart_items`.
   - **`blog_post_tags.tag_id`:** Primary key is `(post_id, tag_id)`. Querying blog posts by tag requires scanning the entire join table.
   - **`products.category_id`:** Covered only as the second column in `(product_type, category_id, is_active)`. Querying products solely by category cannot perform an efficient leading-edge index seek.

2. **Missing Composite Query Indexes:**
   - **`batches(course_id, status)`:** `BatchRepository.findByCourseIdAndStatus(...)` is called frequently during course enrollment and masterclass browsing. Only `idx_batches_course_id` exists.
   - **`batches(status, start_date)`:** Public schedules query upcoming batches ordered by start date.
   - **`courses(category_id, is_active)`:** `CourseRepository.findByCategoryIdAndIsActiveTrue(...)` is missing a composite index.
   - **`blog_posts(status, published_at DESC)`:** Public blog listings filter by `status = 'PUBLISHED'` and sort by publication date. Current indexes are single-column, forcing bitmap index joins and explicit disk/memory sorts.

3. **Full-Text / Trigram Search Deficiencies:**
   - `ProductRepository.searchProducts` executes:
     ```sql
     LOWER(p.title) LIKE LOWER(CONCAT('%', :searchQuery, '%')) 
     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
     ```
   - `CourseRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase` executes standard `ILIKE '%...%'`.
   - PostgreSQL standard B-Tree indexes **cannot** accelerate queries with leading wildcards (`%keyword%`). As the product and masterclass catalog grows, every search query forces a complete sequential table scan and high CPU load on Supabase.

---

### 2.2 Caching Strategy

#### Current Architecture
- `spring-boot-starter-cache` is **missing** from `backend/pom.xml`.
- No `@EnableCaching` configuration exists in `backend/src/main/java/com/sporekart/`.
- No caching provider (Caffeine, Redis, Hazelcast) is configured or instantiated.
- No `@Cacheable`, `@CacheEvict`, or `@CachePut` annotations exist across any service or repository.

#### Gaps & Bottlenecks Identified

1. **High-Frequency Read Endpoints Uncached:**
   - `GET /products` and `/catalog/products`: Retrieves all active products into memory, performs ranking calculations via `ProductRankingService`, and slices in-memory (`CatalogApplicationService.java#L60-L75`). Under concurrent traffic, this causes repetitive heavy CPU consumption and remote database calls to Tokyo.
   - `GET /training/courses`: Issues sequential queries across courses, batches, and schedules (`TrainingController.java#L28-L45`). Phase 15 benchmark measured this endpoint at ~5.7s aggregate response time over remote JDBC connection.
   - `GET /catalog/categories` and `GET /training/categories`: Extremely static data that changes less than once a month, yet queries the database on every visitor hit.
2. **Missing HTTP Cache Headers & ETags:**
   - No `ShallowEtagHeaderFilter` configured in Spring Boot.
   - No `Cache-Control: public, max-age=300, stale-while-revalidate=60` headers are emitted on public catalog or masterclass responses. Browsers and intermediate CDNs are forced to revalidate every request.
3. **Frontend Client-Side Query Caching Absent:**
   - `frontend/package.json` relies on raw `axios` calls without TanStack Query (React Query) or SWR.
   - Component remounts or tab switches re-fetch identical data from the backend, multiplying server load.

---

### 2.3 Load Testing Harness & Baseline

#### Current Architecture
- An ad-hoc benchmark script exists at `audit_output/run_phase15_performance_suite.py`.
- Empirical results from Phase 15 (`15_PERFORMANCE_AND_RELIABILITY_REPORT.md`):
  - 2,240 HTTP requests executed locally across concurrency tiers $C=1, 5, 10, 20$.
  - Customer Profile endpoint achieved 45.94 RPS ($C=20$, p50: 386 ms, 0% errors).
  - Admin analytics aggregation achieved 12.23 RPS ($C=20$, p50: 1421 ms, 0% errors).
  - Single-cart concurrent mutations correctly yielded HTTP 409 Conflicts due to optimistic concurrency.

#### Gaps & Deficiencies Identified

1. **Absence of Standard Load-Testing Framework:**
   - The test was written as a custom Python thread script using `urllib` and `concurrent.futures`.
   - Lacks an industry-standard engine (such as **k6**, **Gatling**, or **Locust**) with declarative scenarios, virtual user (VU) ramps, stages, and metric aggregation.
2. **No Automated Performance Quality Gates in CI/CD:**
   - Performance tests are not part of automated build or pull request checks. Regressions in query execution or memory allocation can enter production unnoticed.
3. **Missing Critical Real-World Scenarios:**
   - **Flash-Sale / Course Drop Surge:** High-concurrency race condition testing on the last available seat in a `batch` (`incrementEnrolledCountIfCapacityAvailable`).
   - **Cart Checkout Spike:** Simulating concurrent payment webhook verifications (`/payments/razorpay-webhook`).
   - **Sustained Soak / Endurance Testing:** No long-running tests (1–4 hours) to identify JVM heap bloat, HikariCP connection leaks, or slow database connection degradation.
4. **Hardcoded Test Fixtures & Security Concerns:**
   - The script hardcoded base64 JWT secrets and existing staging UUIDs. Running it against staging repeatedly risks mutating or cluttering database state.

---

### 2.4 Scaling Architecture (Horizontal & Vertical)

#### Strengths Identified
- **Stateless Authentication:** Spring Security uses `SessionCreationPolicy.STATELESS` with JWT tokens validated cryptographically (`SecurityConfig.java#L60`).
- **Cart State Isolation:** Cart tracking uses `user_id` or explicit `session_id` stored in PostgreSQL `carts` table rather than servlet HTTP sessions.
- **PgBouncer Integration:** Database connections route through Supabase's transaction pooler on port 6543 with `prepareThreshold=0` and TCP keepalive enabled (`application-supabase.yml`).

#### Gaps & Critical Risks Identified

1. **CRITICAL: Scheduled Job Race Conditions Across Multiple Instances (Multi-Instance Cron Collision):**
   - The application has 7 `@Scheduled` tasks running inside the Spring Boot container:
     - `NotificationWorker.processOutboxQueue`: Every 10 seconds (`fixedDelay = 10000`).
     - `NotificationWorker.cleanupOldArchivedNotifications`: Daily at 3 AM.
     - `AbandonedCartScheduler.scanAbandonedCartsAndCheckouts`: Every 15 minutes.
     - `PaymentReconciliationService.reconcilePendingPayments`: Every 10 minutes.
     - `ShipmentTrackingSyncTask.syncPendingShipments`: Every 4 hours.
     - `BlogContentService.publishScheduledPosts`: Every 60 seconds.
     - `RateLimitingFilter.cleanup`: Every 60 seconds.
   - **Zero distributed locking (e.g., ShedLock or PostgreSQL Advisory Locks) is implemented.**
   - **Failure Mode under Horizontal Scaling:** If Sporekart is scaled to 2 or more replicas:
     - All instances will simultaneously query `notification_events` where `status = 'PENDING'`. Because the query does NOT use `FOR UPDATE SKIP LOCKED`, **multiple instances will process the same notification and send DUPLICATE emails/SMS to customers**.
     - Multiple instances will hit Shiprocket tracking APIs simultaneously, burning rate limits.
     - Multiple instances will run payment reconciliation and abandoned cart notifications simultaneously.
2. **In-Memory Rate Limiting:**
   - `RateLimitingFilter.java` stores request counters in a local `ConcurrentHashMap`.
   - When scaled behind a load balancer, each instance maintains independent counters. A client can distribute requests across $N$ instances and achieve $N \times$ the allowed rate limit.
3. **Container & JVM Resource Configuration Omissions:**
   - `backend/Dockerfile` and `backend/railway.json` execute `java -jar app.jar` without JVM container flags (`-XX:MaxRAMPercentage=75.0`, `-XX:InitialRAMPercentage=50.0`, `-XX:+UseG1GC`). In containerized environments with cgroup limits, OpenJDK can miscalculate available memory and trigger sudden `OOMKilled` container termination.
   - `Dockerfile` runs as `root` and lacks container `HEALTHCHECK`.
   - `docker-compose.yml` does not define CPU/memory limits or frontend service orchestration.
4. **Missing Graceful Shutdown & Thread Pool Tuning:**
   - `server.shutdown: graceful` is not set in `application.yml` (defaults to immediate termination). Scaling-in or redeploying abruptly drops active HTTP requests and database transactions.
   - Embedded Tomcat threads (`server.tomcat.threads.max`, `accept-count`) are left at unbounded framework defaults.

---

## 3. Prioritized Implementation Plan

This implementation plan is organized into three sequential phases for architectural review and approval. **No code has been altered yet.**

```
+---------------------------------------------------------------------------------+
|                                IMPLEMENTATION PHASES                            |
+---------------------------------------------------------------------------------+
|  PHASE 1: Quick Wins (Zero-Risk Performance Multipliers)                        |
|  - Flyway Migration V45 (Missing Foreign Keys & Composite Indexes)               |
|  - Enable Spring Cache + Caffeine (In-Memory for Catalog & Masterclasses)       |
|  - Enable Graceful Shutdown & JVM Container RAM Flags                           |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|  PHASE 2: Load Testing & Benchmarking Automation                                |
|  - Declarative k6 Load Testing Suite (Catalog, Training, Cart, Checkout)       |
|  - Realistic SLA Assertions (p95 < 400ms, Error Rate < 0.5%)                     |
|  - Automated Performance Baseline Script for CI/Staging                         |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|  PHASE 3: Horizontal Production Scaling & Distributed Coordination             |
|  - Distributed Scheduling Locking (ShedLock with PostgreSQL Provider)           |
|  - Outbox Locking (`FOR UPDATE SKIP LOCKED`) in NotificationWorker              |
|  - Distributed Rate Limiting & Multi-Node Redis Cache Layer                     |
|  - Production Dockerfile & Railway Manifest Hardening                           |
+---------------------------------------------------------------------------------+
```

---

### Phase 1: Quick Wins (Zero-Risk Performance Multipliers)

#### Task 1.1: Database Migration V45 — Secondary & Composite Indexes
Create Flyway migration `V45__add_missing_fk_and_query_performance_indexes.sql`:

```sql
-- Flyway Migration V45: Add missing foreign key indexes, composite query indexes, and search tuning
-- Bounded Contexts: Catalog, Training, Cart, Content

-- 1. Unindexed Foreign Keys (prevents full table scan on cascade / joins)
CREATE INDEX IF NOT EXISTS idx_product_offers_product_id ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- 2. Training Masterclass Composite Query Indexes
CREATE INDEX IF NOT EXISTS idx_batches_course_status ON batches(course_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_status_start_date ON batches(status, start_date ASC);
CREATE INDEX IF NOT EXISTS idx_courses_category_active ON courses(category_id, is_active);

-- 3. Catalog & Content High-Speed Composite Indexes
CREATE INDEX IF NOT EXISTS idx_products_status_active ON products(status, is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active ON product_variants(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);

-- 4. Trigram Extension and GIN Index for Catalog & Masterclass Search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm ON courses USING gin (title gin_trgm_ops);
```

#### Task 1.2: Enable Spring Cache with Caffeine (Single-Node In-Memory Caching)
1. Add dependencies to `backend/pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>
```

2. Add Cache Configuration class `com.sporekart.shared.infrastructure.CacheConfig.java`:
```java
package com.sporekart.shared.infrastructure;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_PRODUCTS = "products";
    public static final String CACHE_COURSES = "courses";
    public static final String CACHE_CATEGORIES = "categories";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheNames(List.of(CACHE_PRODUCTS, CACHE_COURSES, CACHE_CATEGORIES));
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .initialCapacity(100)
                .maximumSize(1000)
                .expireAfterWrite(Duration.ofMinutes(10))
                .recordStats());
        return cacheManager;
    }
}
```

3. Annotate Read & Eviction points in `TrainingService.java` and `CatalogApplicationService.java`:
- `@Cacheable(value = CacheConfig.CACHE_COURSES, key = "'allActive'")` on `getAllActiveCourses()`
- `@CacheEvict(value = CacheConfig.CACHE_COURSES, allEntries = true)` on `createCourse`, `updateCourse`, `deleteCourse`
- `@Cacheable(value = CacheConfig.CACHE_CATEGORIES, key = "'allCatalogCategories'")` on `getAllCategories()`
- `@Cacheable(value = CacheConfig.CACHE_PRODUCTS, key = "#typeFilter + '-' + #categorySlug + '-' + #page + '-' + #size")` on `getAllActiveProducts(...)`
- `@CacheEvict(value = CacheConfig.CACHE_PRODUCTS, allEntries = true)` on product mutations in `AdminCatalogController`

#### Task 1.3: Enable Graceful Shutdown & HTTP ETags
Update `backend/src/main/resources/application.yml`:
```yaml
server:
  shutdown: graceful
  tomcat:
    threads:
      max: 200
      min-spare: 20
    accept-count: 100
    max-connections: 8192

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

Register Shallow ETag filter in `WebMvcConfig.java`:
```java
@Bean
public FilterRegistrationBean<ShallowEtagHeaderFilter> shallowEtagHeaderFilter() {
    FilterRegistrationBean<ShallowEtagHeaderFilter> filter = new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
    filter.addUrlPatterns("/api/v1/catalog/*", "/api/v1/training/*", "/api/v1/content/*");
    return filter;
}
```

---

### Phase 2: Load Testing & Benchmarking Automation

#### Task 2.1: Implement Declarative k6 Load Test Suite
Create `tests/load/k6-performance-suite.js`:

```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const catalogLatency = new Trend('catalog_duration');
const trainingLatency = new Trend('training_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up to 10 VUs
    { duration: '1m',  target: 25 },  // Peak traffic 25 VUs
    { duration: '30s', target: 50 },  // Stress spike to 50 VUs
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1200'], // 95% of requests under 500ms
    'error_rate': ['rate<0.01'],                       // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';

export default function () {
  group('1. Public Browsing Flow', function () {
    // 1.1 Catalog Listing
    let resCatalog = http.get(`${BASE_URL}/products?page=0&size=12`);
    catalogLatency.add(resCatalog.timings.duration);
    let checkCatalog = check(resCatalog, {
      'catalog status is 200': (r) => r.status === 200,
      'catalog has data': (r) => JSON.parse(r.body).data !== undefined,
    });
    errorRate.add(!checkCatalog);

    // 1.2 Categories Listing
    let resCategories = http.get(`${BASE_URL}/categories`);
    check(resCategories, { 'categories status 200': (r) => r.status === 200 });

    // 1.3 Masterclasses Listing
    let resCourses = http.get(`${BASE_URL}/training/courses`);
    trainingLatency.add(resCourses.timings.duration);
    let checkCourses = check(resCourses, {
      'courses status is 200': (r) => r.status === 200,
    });
    errorRate.add(!checkCourses);

    sleep(1);
  });

  group('2. Search & Filter Flow', function () {
    let resSearch = http.get(`${BASE_URL}/products/search?q=oyster&page=0&size=10`);
    check(resSearch, {
      'search status 200': (r) => r.status === 200,
    });
    sleep(1);
  });
}
```

#### Task 2.2: Add Concurrency Stress Test for Inventory & Masterclass Slots
Create `tests/load/k6-concurrency-race.js` to assert optimistic and pessimistic lock behavior under rapid simultaneous booking attempts:
- Scenario: 20 concurrent VUs attempting to book the last remaining 2 seats in a batch.
- Expected assertion: Exactly 2 succeed (HTTP 200/201), 18 gracefully fail with capacity limit error (HTTP 400/409), with 0 database deadlocks or negative seat counts.

---

### Phase 3: Horizontal Production Scaling & Distributed Coordination

#### Task 3.1: Distributed Task Scheduling with ShedLock (PostgreSQL Provider)
Eliminates multi-instance cron execution collisions without requiring extra infrastructure.

1. Add dependencies to `backend/pom.xml`:
```xml
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-spring</artifactId>
    <version>5.13.0</version>
</dependency>
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-provider-jdbc-template</artifactId>
    <version>5.13.0</version>
</dependency>
```

2. Create Flyway migration `V46__create_shedlock_table.sql`:
```sql
CREATE TABLE IF NOT EXISTS shedlock (
    name VARCHAR(64) NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP WITH TIME ZONE NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    locked_by VARCHAR(255) NOT NULL
);
```

3. Configure ShedLock and annotate all 7 `@Scheduled` tasks:
```java
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class SchedulerLockConfig {
    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
            JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .usingDbTime()
                .build()
        );
    }
}
```

Annotate scheduled workers:
```java
// In NotificationWorker.java:
@Scheduled(fixedDelay = 10000)
@SchedulerLock(name = "NotificationWorker_processOutbox", lockAtMostFor = "8s", lockAtLeastFor = "3s")
public void processOutboxQueue() { ... }

// In AbandonedCartScheduler.java:
@Scheduled(cron = "0 */15 * * * *")
@SchedulerLock(name = "AbandonedCartScheduler_scan", lockAtMostFor = "14m", lockAtLeastFor = "2m")
public void scanAbandonedCartsAndCheckouts() { ... }
```

#### Task 3.2: Implement `SKIP LOCKED` Outbox Processing
Update `NotificationEventRepository.java` to support parallel instance workers safely:
```java
@Query(value = """
    SELECT * FROM notification_events 
    WHERE status IN ('PENDING', 'RETRY_SCHEDULED') 
      AND attempt_count < :maxAttempts 
    ORDER BY created_at ASC 
    LIMIT 20 
    FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
List<NotificationEvent> findPendingEventsForProcessing(@Param("maxAttempts") int maxAttempts);
```
*Impact:* Guarantees that even if two nodes run concurrently, each node acquires a mutually exclusive set of pending rows, completely preventing duplicate customer emails.

#### Task 3.3: JVM Container & Railway Deployment Hardening
1. Update `backend/Dockerfile` with container-aware JVM flags and non-root execution:
```dockerfile
# Step 1: Build stage
FROM maven:3.9.8-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Step 2: Production Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /app/target/sporekart-backend-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
```

2. Update `backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/api/v1/actuator/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

---

## 4. Verification & Validation Protocol

Before promoting changes to staging or production, execute the following verification checklist:

1. **Index Performance Verification:**
   - Run `EXPLAIN (ANALYZE, BUFFERS)` on `products` search, `courses` listing, and `order_items` queries before and after `V45` migration to verify index scans replacing sequential scans.
2. **Cache Hit-Rate Verification:**
   - Query `/api/v1/actuator/metrics/cache.gets?tag=result:hit` and `cache.gets?tag=result:miss` after running synthetic catalog browsing. Hit ratio should exceed 85%.
3. **k6 Load Baseline Comparison:**
   - Execute `k6 run tests/load/k6-performance-suite.js` against staging. Compare against Phase 15 baseline (target: p95 latency reduction from ~5.7s to < 350ms on masterclasses).
4. **Multi-Instance Scheduler Verification:**
   - Spin up two local backend containers (`docker-compose up --scale backend=2`). Inspect logs to verify that only one node acquires the ShedLock for `AbandonedCartScheduler` and no duplicate outbox notifications are triggered.
