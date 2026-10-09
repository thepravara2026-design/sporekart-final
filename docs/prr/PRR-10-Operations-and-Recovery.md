# PRR-10: Operations & Incident Recovery — Sporekart

**Date:** October 9, 2026  
**Review Board:** Observability, Logging & Incident Response Specialist  
**Target Repository:** `f:\sporekart-v1\sporekart-final`  

---

## 1. Structured Logging & Correlation ID Assessment

- **Logging Framework:** Logback (`backend/src/main/resources/logback-spring.xml`).
- **Request Correlation ID:** Implemented via [`RequestIdFilter.java`](file:///f:/sporekart-v1/sporekart-final/backend/src/main/java/com/sporekart/shared/infrastructure/RequestIdFilter.java). Generates or extracts `X-Request-ID` HTTP header and injects into Logback MDC (`[reqId=%X{requestId:-system}]`).
- **Sensitive Data Redaction:** Passwords and JWT tokens are excluded from log outputs. Email and phone numbers are logged during notification dispatch (recommend masking to `u***@email.com` for strict PII compliance).

---

## 2. Health Monitoring & Observability Endpoints

- **Spring Boot Actuator:** Enabled in `pom.xml`.
- **Exposed Endpoints (`application.yml`):** `/actuator/health`, `/actuator/info`, `/actuator/metrics`.
- **Access Control:** Health details configured as `show-details: when-authorized`. Public endpoint `/actuator/health` returns basic status UP/DOWN.

---

## 3. Database Backup & Disaster Recovery Objectives

- **Recovery Point Objective (RPO):** < 1 Hour (Automated Supabase WAL continuous point-in-time recovery).
- **Recovery Time Objective (RTO):** < 30 Minutes (Automated container redeploy on Railway).
- **Audit Trails:** `admin_audit_logs`, `inventory_audit_events`, `wallet_transactions`, and `notification_events` record immutable operational event histories.
