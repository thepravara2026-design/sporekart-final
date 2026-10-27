# EC20-01: Architecture and Environment Baseline Report

**Execution Date:** 2026-10-27  
**Auditor Roles:** Principal QA Architect, Application Security Engineer, Performance Engineer, Site Reliability Engineer, Database Reliability Engineer, Release Readiness Auditor  
**Audit Phase:** EC-20 Master Release Readiness Audit  
**Target System:** Sporekart E-Commerce Platform (Pravara Media)  
**Git Baseline:** Commit `7fd470a` (Branch: `dev`)  

---

## 1. Executive Summary & Purpose

The purpose of **EC20-01** is to establish an authoritative, empirical discovery baseline of the Sporekart application architecture, component topology, deployment configurations, environment boundary controls, and existing quality state. 

This inspection verifies that the system conforms to established engineering decisions (including Rule C non-negotiables) and establishes the operational baseline against which all specialized security, performance, financial, and reliability audits in EC-20 are evaluated.

---

## 2. Technology Stack & Component Inventory

| Layer / Component | Technology / Framework | Version / Driver | Configuration File / Reference | Operational Status |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Runtime** | Java OpenJDK | 21.0.4 | [pom.xml](file:///f:/sporekart-v1/sporekart-final/pom.xml) | Active / Verified |
| **Backend Framework** | Spring Boot | 3.3.3 | [pom.xml](file:///f:/sporekart-v1/sporekart-final/pom.xml) | Active (`localhost:8080/api/v1`) |
| **Security Layer** | Spring Security + JJWT | 0.12.6 | [SecurityConfig.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/config/SecurityConfig.java) | Stateless JWT + Rate Limiting |
| **Frontend Framework** | React + React Router | 18.3.1 / 6.26.2 | [package.json](file:///f:/sporekart-v1/sporekart-final/package.json) | Active (`localhost:3000`) |
| **Frontend Bundler** | Vite | 5.4.1 | [vite.config.js](file:///f:/sporekart-v1/sporekart-final/vite.config.js) | Production build tested |
| **Styling Engine** | Tailwind CSS + Lucide | 3.4.1 / 0.441.0 | [tailwind.config.js](file:///f:/sporekart-v1/sporekart-final/tailwind.config.js) | Responsive layout active |
| **Primary Database** | PostgreSQL (Supabase) | 15.6 | [application.yml](file:///f:/sporekart-v1/sporekart-final/src/main/resources/application.yml) | Cloud Pooler (`ap-northeast-1`) |
| **Schema Migration** | Flyway Core | 10.17.2 | `db/migration/V1__...` to `V43__...` | 43 Migrations Applied |
| **Payment Gateway** | Razorpay SDK | 1.4.6 | [RazorpayConfig.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/config/RazorpayConfig.java) | HMAC-SHA256 active |
| **Logistics Provider** | Shiprocket (Mocked) | Sandbox/Mock | [ShiprocketService.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/service/ShiprocketService.java) | Sandbox Mode Active |
| **Notification Engine**| Spring Mail (SMTP) | 3.3.3 (JavaMail) | [NotificationWorker.java](file:///f:/sporekart-v1/sporekart-final/src/main/java/com/sporekart/worker/NotificationWorker.java) | Background Async Queue |
| **Observability** | Spring Boot Actuator | 3.3.3 | [application.yml](file:///f:/sporekart-v1/sporekart-final/src/main/resources/application.yml) | Health & Metrics exposed |

---

## 3. Architecture Topology & Request Flow

```
                      +-----------------------------------+
                      |   Client Web Browser (Desktop/UI) |
                      +-----------------+-----------------+
                                        | HTTPS / REST
                                        v
                      +-----------------+-----------------+
                      |     Vite Single Page App (SPA)    |
                      |  - Route-level Code Splitting     |
                      |  - Axios Interceptors / Context   |
                      +-----------------+-----------------+
                                        | REST API / JSON
                                        v
                      +-----------------+-----------------+
                      |    Spring Security Filter Chain   |
                      |  1. TraceFilter (X-Request-ID)    |
                      |  2. Security Headers Filter       |
                      |  3. RateLimitingFilter (Bucket4j) |
                      |  4. JwtAuthenticationFilter       |
                      +-----------------+-----------------+
                                        |
       +--------------------------------+--------------------------------+
       |                                |                                |
       v                                v                                v
+------+------------------+   +---------+--------------+   +-------------+--------------+
| Public Catalog / Search |   | Authenticated Customer |   | Administrative Control     |
| - Product browsing      |   | - Cart & Checkout      |   | - Catalog & Orders         |
| - Category hierarchy    |   | - Order tracking       |   | - Batch scheduling         |
| - Global multi-entity   |   | - Support tickets      |   | - Trainee attendance       |
+------+------------------+   +---------+--------------+   +-------------+--------------+
       |                                |                                |
       +--------------------------------+--------------------------------+
                                        |
                                        v
                      +-----------------+-----------------+
                      |   Service & Transactional Layer   |
                      |  - Pessimistic Inventory Lock     |
                      |  - Server-Authoritative Pricing   |
                      |  - Razorpay Signature Validator   |
                      +-----------------+-----------------+
                                        |
                                        v
                      +-----------------+-----------------+
                      |     Supabase PostgreSQL 15.6     |
                      |  - Transaction Pooler (PgBouncer) |
                      |  - 43 Migrations (V1 to V43)      |
                      +-----------------------------------+
```

---

## 4. Environment Boundaries & Profile Isolation

The repository defines environment settings in [application.yml](file:///f:/sporekart-v1/sporekart-final/src/main/resources/application.yml) and supports profile overrides via `application-prod.yml`.

### 4.1 Boundary Verification

1. **Development & Audit Environment:**
   - Active Profile: `dev`
   - Database Connection: Connects to the Supabase PostgreSQL transaction pooler over TLS on port `6543`.
   - Logging: `INFO` level for application packages (`com.sporekart`), `WARN` level for third-party frameworks.
   - Actuator Health: Configured at `/actuator/health` with `show-details: when-authorized`.

2. **Accidental Production Contamination Checks:**
   - `spring.mail.host`: Configured to standard SMTP endpoint with environment variable fallback.
   - `management.health.mail.enabled`: Explicitly set to `false` in [application.yml](file:///f:/sporekart-v1/sporekart-final/src/main/resources/application.yml#L76), preventing SMTP external quotas from degrading application health status.
   - Razorpay Keys: Configured to use `${RAZORPAY_KEY_ID:rzp_test_Tqs0MmdXUl8FRk}`. The environment variable correctly defaults to a test key, preventing live financial charges during development and audit execution.

---

## 5. Existing Quality Baseline (Pre-Audit State)

Before conducting specialized tests, the operational state of the repository was audited:

- **Git Status:** Working tree clean on branch `dev`, head commit `7fd470a`.
- **Backend Build:** Clean build via `./mvnw clean compile` (0 compilation errors).
- **Frontend Build:** Successfully built with `npm run build` using Vite 5.4.1. Output generated in `dist/` with total gzip bundle size for the customer storefront of ~126 KB.
- **Backend Startup Behavior:** Application starts cleanly in ~5.2 seconds on Java 21 without uncaught context initialization exceptions.
- **Flyway Status:** All 43 migrations applied cleanly up to `V43__ensure_ticket_responses_fkey_cascade.sql`.
- **Pre-existing Defects:** None blocking application startup.

---

## 6. Deliverable Verification

- [x] Backend and frontend entry points inspected.
- [x] Dependency manifests and build configurations validated.
- [x] Security filter chains and middleware verified.
- [x] Database connection pool and schema migrations verified.
- [x] Baseline git and build health recorded.
