# EC20-06: Deployment, Environment & Configuration Audit

**Execution Date:** 2026-10-27  
**Auditor Roles:** Principal Release Readiness Auditor, DevOps & Cloud Infrastructure Engineer  
**Audit Phase:** EC-20 Master Release Readiness Audit  
**Target System:** Sporekart E-Commerce Platform (Pravara Media)  

---

## 1. Executive Summary

This report evaluates the deployment architecture, configuration hygiene, environment variable bindings, Flyway schema migration strategy, and production release safety.

### Key Deployment Findings:
1. **Flyway Migration Chain:** 43 migrations (V1 to V43) have been applied cleanly without out-of-order errors or checksum mismatches.
2. **CORS Configuration Risk (P2):** [application.yml](file:///f:/sporekart-v1/sporekart-final/src/main/resources/application.yml#L28) specifies `app.cors.allowed-origins: ${CORS_ALLOWED_ORIGINS:*}`. The fallback wildcard `*` permits arbitrary origins if `CORS_ALLOWED_ORIGINS` is omitted in production.
3. **Razorpay Key Fallback (P2):** Development test keys default as fallback in `application.yml`. Production must mandate injection of live credentials.
4. **JWT Secret Fallback (P2):** Development secret fallback present. Production deployment must mandate high-entropy environment injection.
5. **Frontend API Binding:** Single-entry API proxy configured in [vite.config.js](file:///f:/sporekart-v1/sporekart-final/vite.config.js) and [api.js](file:///f:/sporekart-v1/sporekart-final/src/services/api.js) supporting `VITE_API_BASE_URL`.

---

## 2. Environment Configuration Matrix

| Environment Variable | Configured Default in `application.yml` | Required Production Value | Risk if Unset | Finding Severity |
| :--- | :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | `prod` | Debug / dev defaults active | **P1 (Operational)** |
| `CORS_ALLOWED_ORIGINS` | `*` | `https://sporekart.in,https://admin.sporekart.in` | Cross-origin request forgery | **P2 (Configuration)** |
| `RAZORPAY_KEY_ID` | `rzp_test_Tqs0MmdXUl8FRk` | Live Merchant Key `rzp_live_...` | Transactions run in test mode | **P2 (Financial)** |
| `RAZORPAY_KEY_SECRET` | Dev test secret | Live Merchant Secret | Signature verification failure | **P2 (Financial)** |
| `JWT_SECRET` | Dev test key | 256-bit cryptographically secure key | Predictable auth tokens | **P2 (Security)** |
| `DB_HOST`, `DB_PASSWORD` | Supabase pooler credentials | Production Supabase pooler credentials | Startup failure | **P1 (Operational)** |
| `SPRING_MAIL_USERNAME` | `praveenkodekal8@gmail.com` | Production transactional mail account | Email delivery failure | **P3 (Operational)** |

---

## 3. Flyway Migration Lifecycle & Release Safety (EC20-21)

### 3.1 Migration Audit
- **Total Migrations:** 43 Versioned SQL files (`db/migration/V1__...` through `V43__...`).
- **Execution Mode:** Flyway runs automatically on application startup (`spring.flyway.enabled: true`).
- **Non-Destructive DDL Strategy:**
  - In `V41__retire_wallet_tables.sql`, the legacy `wallets` table was preserved and flagged as `ARCHIVED` rather than issuing an irreversible `DROP TABLE`, preserving historical data integrity.
  - In `V43__ensure_ticket_responses_fkey_cascade.sql`, foreign key constraints were updated cleanly to prevent orphaned support tickets.

### 3.2 Rollback and Deployment Safety
- **Forward-Only Strategy:** All schema changes are additive or use non-destructive column deprecation, permitting zero-downtime rolling deployments.
- **Pre-Deployment Validation:** Prior to production deployments, run `./mvnw flyway:info` to verify checksum alignments.

---

## 4. Hosting & Infrastructure Architecture

```
                      +-----------------------------+
                      |       Cloudflare CDN        |
                      | - SSL / TLS Termination     |
                      | - DDoS & WAF Protection     |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+--------------+--------------+             +--------------+--------------+
|     Vercel / Cloudflare     |             |      Railway / AWS ECS      |
|  Frontend Static Hosting    |             |  Backend Spring Boot Container
|  - HTML, JS, CSS, Assets    |             |  - OpenJDK 21 Runtime       |
|  - Sub-100ms Global Edge    |             |  - Actuator Health Checks   |
+-----------------------------+             +--------------+--------------+
                                                           |
                                                           v
                                            +--------------+--------------+
                                            |   Supabase PostgreSQL 15.6  |
                                            |  - Transaction Pooler 6543  |
                                            |  - Automated WAL Archiving  |
                                            +-----------------------------+
```

---

## 5. Deployment Pre-Flight Checklist

Before approving production release deployment:

- [ ] Set `SPRING_PROFILES_ACTIVE=prod`.
- [ ] Set `CORS_ALLOWED_ORIGINS=https://sporekart.in,https://admin.sporekart.in`.
- [ ] Inject production `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- [ ] Inject 256-bit high-entropy `JWT_SECRET`.
- [ ] Inject production transactional SMTP credentials (SendGrid, Postmark, or AWS SES recommended over personal Gmail).
- [ ] Verify `GET /api/v1/actuator/health` returns `{"status":"UP"}` post-deployment.
- [ ] Confirm no default test fallbacks are active in environment inspection.
