# PRR-09: Deployment & Configuration Review — Sporekart

**Date:** October 9, 2026  
**Review Board:** DevOps & Release Engineering Specialist  
**Target Repository:** `f:\sporekart-v1\sporekart-final`  

---

## 1. Hosting Architecture & Infrastructure Topology

- **Frontend Target:** Vercel Static Hosting (`frontend/vercel.json`).
  - Rewrites `/api/v1/*` to Railway backend target `https://${RAILWAY_BACKEND_HOST}/api/v1/*`.
  - Security headers enforced: `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`.
- **Backend Target:** Railway / Docker Container (`backend/Dockerfile`, `backend/railway.json`).
  - Multi-stage Docker build: `maven:3.9.8-eclipse-temurin-21` (Build) -> `eclipse-temurin:21-jre-alpine` (Runtime).
  - Port EXPOSE: `8080`.
- **Database Target:** Supabase PostgreSQL Managed Database.

---

## 2. Configuration & Profile Security Assessment

| Environment Variable | Production Requirement | Default Fallback in Config | Risk / Action |
| :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` | `dev` | **PASS**: Configured via Railway runtime env |
| `JWT_SECRET` | 256-bit Random Secret | None | **FAIL**: Must fail startup if empty in prod |
| `RAZORPAY_KEY_SECRET` | Production Webhook Secret | Empty | Required for payment verification |
| `CORS_ALLOWED_ORIGINS` | White-listed frontend domain | Default `*` in dev | Must restrict strictly to Vercel production domain |

---

## 3. Database Migration Deployment Order Strategy

1. **Pre-Deploy:** Run Flyway / Supabase migrations BEFORE deploying new backend JAR (`flyway.enabled=true`).
2. **Zero-Downtime Migration Rule:** Ensure all new columns are nullable or have default values (e.g. `V31__add_sms_notification_fields.sql`).
