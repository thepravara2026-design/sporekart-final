# PRR-00: Production Readiness Review Baseline — Sporekart

**Date:** October 9, 2026  
**Review Board:** Independent Principal Engineering Review Board  
**Target Repository:** `f:\sporekart-v1\sporekart-final`  
**Git Branch:** `dev`  
**Commit Hash:** `7d9f1f6` (`fix(training): eliminate batch enrollment concurrency race condition, tighten transactional boundaries, and enforce webhook idempotency`)  
**Working Tree Status:** Clean (0 uncommitted changes)  

---

## 1. Repository & Technology Inventory

| Layer | Framework / Runtime | Dependency Manager | Primary Version | Key Libraries |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | Java 21 / Spring Boot | Apache Maven 3.9+ | `3.3.3` | Spring Data JPA, Spring Security, Flyway, JJWT 0.12.6, Razorpay SDK 1.4.6, ArchUnit 1.3.0, JaCoCo 0.8.12 |
| **Frontend** | React 18 / Vite | npm | React `18.3.1` / Vite `5.4.1` | React Router DOM `6.26.1`, TailwindCSS `3.4.10`, Framer Motion `11.3.28`, Supabase JS `2.117.3`, Axios `1.7.4` |
| **Database** | PostgreSQL / Supabase | Flyway / Supabase CLI | PostgreSQL 15+ | 31 Flyway SQL Migrations (`db/migration`), 30 Supabase Migrations (`supabase/migrations`) |
| **Integrations**| External SaaS Gateways | REST / Webhook | N/A | Razorpay (Payments), Twilio (SMS), Gmail SMTP (Email), Shiprocket (Logistics), Supabase Storage |

---

## 2. Environment & Mock Configurations Discovered

- **Profiles Discovered:** `dev` (default active), `prod`, `supabase`, `test`.
- **Active Feature & Mock Flags:**
  - `sporekart.mail.use-real-smtp`: Default `false` in `application.yml` (fallback log mode active in dev).
  - `sporekart.twilio.use-real-twilio`: Default `false` in `application.yml` (fallback log mode active in dev).
  - `SUPABASE_URL`: Defaults to `https://mock-supabase.sporekart.in` when unconfigured.
- **Database Drift Alert:**
  - `backend/src/main/resources/db/migration/` contains **31** migration scripts (`V1__init_schema.sql` through `V31__add_sms_notification_fields.sql`).
  - `backend/supabase/migrations/` contains **30** migration scripts (`20261008000001` through `20261008000030`), **missing** migration `V31__add_sms_notification_fields.sql`.

---

## 3. Empirical Baseline Verification Results

| Verification Suite | Target | Command Executed | Result | Duration | Key Observations / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend Compilation** | Backend Java | `mvn test-compile` | **PASS** | 3.81s | Zero compilation errors. |
| **Backend Unit & Integration Tests** | Backend Java | `mvn test` | **PASS** | 3m 46s | **1026 passed**, 0 failures, 0 errors, 1 skipped. |
| **Frontend Production Build** | Frontend React | `npm run build` | **PASS** | 26.56s | Vite production bundle generated successfully (`dist/` directory created). |
| **Frontend Unit & Component Tests** | Frontend React | `npm test` (Vitest) | **PASS** | 59.17s | **14 test files passed**, 75 tests executed cleanly. |
| **Frontend Static Analysis / Linting** | Frontend React | `npm run lint` | **FAIL** | 4.12s | Script failed: `eslint` package is missing in `devDependencies` and `eslint.config.*` file missing. |

---

## 4. Immediate Baseline Blockers & Findings

1. **[PRR-BASE-01] Missing Frontend Lint Configuration:** `npm run lint` fails out of the box because ESLint dependency is not declared in `package.json` devDependencies and ESLint configuration file is absent.
2. **[PRR-BASE-02] Schema Migration Divergence:** `V31__add_sms_notification_fields.sql` present in Flyway resources is missing from `backend/supabase/migrations/`, introducing schema drift between local Flyway execution and Supabase deployments.
3. **[PRR-BASE-03] Null Bean Warnings in Unit Log Outputs:** `WalletServiceTest` outputs errors `Cannot invoke "NotificationEventService.recordEvent(...)" because "this.notificationEventService" is null`, indicating unhandled mock/stub defaults in unit tests.
