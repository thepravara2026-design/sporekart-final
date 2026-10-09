 # PRR-08: Performance & Resilience Audit — Sporekart

**Date:** October 9, 2026  
**Review Board:** Performance & Scalability Engineer / SRE Specialist  
**Target Repository:** `f:\sporekart-v1\sporekart-final`  

---

## 1. Frontend Performance & Bundle Size Breakdown

- **Total Production Build Size:** `dist/` total ~1.2 MB uncompressed.
- **Top 3 Largest JS Chunks:**
  1. `AdminDashboardPage.js`: **262.78 kB** (gzip: 48.03 kB) — *High code bloat, needs code splitting*
  2. `vendor-react.js`: **178.14 kB** (gzip: 58.39 kB) — *React runtime vendor bundle*
  3. `index-A-UjbkEp.js`: **116.16 kB** (gzip: 29.35 kB) — *Core application code*
- **Caching Headers:** `vercel.json` applies `Cache-Control: public, max-age=31536000, immutable` on static assets under `/assets/*` (Excellent).

---

## 2. Backend Latency, Connection Pool & Resource Limits

| Component | Default Configuration | Target Launch Metric | Risk / Recommendation |
| :--- | :--- | :--- | :--- |
| **HikariCP DB Connection Pool** | Default (Max 10 connections) | p95 Latency < 100ms | Increase `maximum-pool-size: 25` for production workload in `application-prod.yml`. |
| **Java Virtual Machine (JVM)** | JDK 21 Alpine Container | Heap Limit: 512 MB - 1 GB | Explicitly configure `-XX:+UseG1GC -Xms512m -Xmx1024m` in Docker Entrypoint. |
| **Async Task Thread Pool** | `@EnableAsync` default pool | Concurrent Webhooks < 50 | Configure `ThreadPoolTaskExecutor` bean with bounded queue to avoid thread exhaustion. |
| **Database Indexing** | Primary & Foreign Keys indexed | Query execution plan | Added composite index `orders(user_id, created_at DESC)` needed for fast pagination. |

---

## 3. Resilience, Retries & Circuit Breaking

- **SaaS Dependency Timeouts:** REST integrations with Razorpay and Shiprocket use standard Axios / RestTemplate clients. Explicit HTTP connection & read timeouts (`connectTimeout=5s`, `readTimeout=10s`) must be configured on RestTemplate beans.
- **Fallback Modes:** Gmail SMTP and Twilio SMS fall back to console log mode when disabled (`USE_REAL_SMTP=false`), preventing application crash if credentials expire during development.
