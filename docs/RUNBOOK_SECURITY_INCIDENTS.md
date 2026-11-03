# SporeKart Security Incident Response & Backup Recovery Runbook

**Document Version:** 1.0.0  
**Target Systems:** SporeKart Backend (Spring Boot 3.3 / Railway), Frontend (Vite / React / Vercel), Data Store (Supabase PostgreSQL & Object Storage)  
**Classification:** Confidential – Operations & Security Staff Only  

---

## 1. Emergency Incident Response Overview

In the event of an active security compromise, credential leak, anomalous financial activity, or unauthorized database access:

1. **Declare Incident & Mobilize:**
   - Immediately notify the engineering lead and security administrator.
   - Designate an Incident Commander (IC).
   - Create a dedicated incident tracking channel (`#incident-<date>-security`).
2. **Containment Priority (Stop the Bleed):**
   - Isolate compromised API keys, database credentials, or tokens.
   - Do NOT restart containers before capturing volatile forensics logs if state inspection is required.
   - Terminate active compromised sessions by invalidating JWT secrets or revoking OAuth refresh grants.

---

## 2. Emergency Credential Rotation Procedures

### 2.1 JWT Signing Secret Rotation (`JWT_SECRET`)
*Severity: Critical. Rotate if the JWT secret is leaked, logged, committed, or if mass user session invalidation is required.*

1. **Generate a Cryptographically Secure 512-bit Secret:**
   ```bash
   openssl rand -base64 64
   ```
2. **Update Secrets in Railway:**
   - Navigate to **Railway Dashboard -> sporekart-backend -> Variables**.
   - Update `JWT_SECRET` with the newly generated value.
   - Note: The application will fail startup if `JWT_SECRET` is shorter than 256 bits or equals known defaults (enforced by `SecurityConfigValidator`).
3. **Redeploy Backend:**
   - Trigger deployment in Railway.
   - *Impact:* All currently issued user and admin JWT session tokens are immediately invalidated. Users must re-authenticate via Google OAuth.

---

### 2.2 Supabase Database Password & Connection Rotation
*Severity: Critical. Rotate if `SUPABASE_DB_PASSWORD` or database connection strings are exposed.*

1. **Rotate Database Password in Supabase Dashboard:**
   - Log in to [Supabase Console](https://supabase.com/dashboard/project/_/settings/database).
   - Navigate to **Project Settings -> Database -> Database password**.
   - Click **Reset database password** and enter a newly generated, high-entropy password (minimum 32 characters, mix of symbols, digits, uppercase, lowercase).
2. **Update Environment Variable in Railway:**
   - In Railway, update `SUPABASE_DB_PASSWORD` under Environment Variables.
   - Update `SUPABASE_DB_URL` if direct or pooler connection strings changed (e.g. `aws-0-ap-south-1.pooler.supabase.com:6543/postgres`).
3. **Verify Connection & Post-Rotation Health:**
   - Trigger Railway redeploy.
   - Check application startup logs:
     ```
     [INFO] HikariPool-1 - Added connection org.postgresql.jdbc.PgConnection
     [INFO] Flyway Community Edition ... schema "public" is up to date
     ```
   - Verify `SecurityConfigValidator` confirms all database credentials pass validation without using fallbacks.

---

### 2.3 Razorpay Payment Gateway Secret Rotation
*Severity: Critical. Rotate if `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` is compromised.*

1. **Generate New API Secret in Razorpay Dashboard:**
   - Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/#/app/keys).
   - Navigate to **Settings -> API Keys**.
   - Click **Regenerate Key Secret**. Razorpay allows an overlap window (up to 24 hours) where both old and new secrets are accepted. Choose an appropriate grace period (e.g., 2 hours).
2. **Generate New Webhook Secret:**
   - Navigate to **Settings -> Webhooks**.
   - Select the SporeKart webhook URL (`https://<railway-domain>/payment/webhook` and `/api/payment/webhook`).
   - Click **Edit Webhook** and generate a new `Secret`.
3. **Deploy Updated Secrets:**
   - In Railway, set:
     - `RAZORPAY_KEY_SECRET=<new_key_secret>`
     - `RAZORPAY_WEBHOOK_SECRET=<new_webhook_secret>`
   - Redeploy the backend immediately.
4. **Deactivate Old Razorpay Key:**
   - After confirming successful test payments in production, deactivate the legacy key in Razorpay dashboard.

---

### 2.4 Supabase Service Role Key Rotation
*Severity: High. Rotate if `SUPABASE_SERVICE_KEY` or `SUPABASE_ANON_KEY` is exposed.*

1. **In Supabase Dashboard:**
   - Navigate to **Settings -> API -> Project API Keys**.
   - Click **Rotate Service Role Key** (and `anon` key if applicable).
2. **Deploy to Railway and Vercel:**
   - Railway: Update `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_KEY`.
   - Vercel: Update `VITE_SUPABASE_ANON_KEY` in Vercel project environment variables and trigger frontend redeployment.

---

### 2.5 Shiprocket Webhook Token Rotation
*Severity: Medium. Rotate if `SHIPROCKET_WEBHOOK_TOKEN` is compromised.*

1. **Generate High-Entropy Token:**
   ```bash
   openssl rand -hex 32
   ```
2. **Update Railway Environment Variables:**
   - Update `SHIPROCKET_WEBHOOK_TOKEN` in Railway.
3. **Update Shiprocket Webhook Configuration:**
   - Log in to [Shiprocket Console](https://app.shiprocket.in/).
   - Navigate to **Settings -> API -> Webhooks**.
   - Update the header token / secret matching the newly deployed value.
4. **Redeploy Backend:**
   - Verify subsequent webhook deliveries respond with HTTP 200 OK.

---

## 3. Database Backup & Disaster Recovery Procedures

SporeKart operates on Supabase PostgreSQL with daily automated backups, WAL archiving (Point-In-Time Recovery), and logical dumps.

### 3.1 Point-In-Time Recovery (PITR) via Supabase
*Use PITR when data corruption, accidental drop/truncate, or ransomware occurs at an exact known timestamp.*

1. **Determine Target Recovery Time (RTO / RPO):**
   - Identify the exact UTC timestamp immediately prior to the incident (e.g. `2026-10-31 14:15:00 UTC`).
2. **Trigger PITR in Supabase Dashboard:**
   - Navigate to **Project Settings -> Database -> Backups**.
   - Select **Point in Time Recovery (PITR)**.
   - Enter the target UTC timestamp.
   - Click **Restore to this point**.
   - *Note:* Supabase creates a new restored database instance or replaces the current database state based on configuration.
3. **Point Railway Backend to Restored Instance:**
   - If restored to a new project/instance, update `SUPABASE_DB_URL` and `SUPABASE_DB_PASSWORD` in Railway.
   - Restart the Railway deployment.
4. **Execute Post-Restore Smoke Verification:**
   - Run verification queries to ensure recent orders, catalog items, and user accounts are consistent.

---

### 3.2 Manual Logical Backup (`pg_dump`)
*Perform before executing major schema migrations or destructive maintenance.*

```bash
# Set database connection parameters
export PGPASSWORD="${SUPABASE_DB_PASSWORD}"
export PGHOST="aws-0-ap-south-1.pooler.supabase.com"
export PGPORT="6543"
export PGUSER="postgres.<project-ref>"
export PGDATABASE="postgres"

# Execute compressed custom-format pg_dump
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
        --format=custom \
        --no-owner \
        --no-privileges \
        --file=sporekart_backup_$(date +%Y%m%d_%H%M%S).dump

# Calculate and store SHA-256 checksum
sha256sum sporekart_backup_*.dump > sporekart_backup.dump.sha256
```

---

### 3.3 Logical Restore (`pg_restore`)
*Restore from logical dump into a staging or clean recovery database.*

```bash
export PGPASSWORD="${SUPABASE_DB_PASSWORD}"
export PGHOST="aws-0-ap-south-1.pooler.supabase.com"
export PGPORT="6543"
export PGUSER="postgres.<project-ref>"
export PGDATABASE="postgres"

# Verify dump checksum
sha256sum -c sporekart_backup.dump.sha256

# Restore schema and data
pg_restore -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
           --clean \
           --if-exists \
           --no-owner \
           --no-privileges \
           sporekart_backup_*.dump
```

---

## 4. Security Metrics & Alerting Runbook

SporeKart emits structured audit log lines with prefix `[SECURITY_AUDIT]` and exports Micrometer metrics registered under `security.audit.events`.

| Metric Name / Tag | Log Pattern | Critical Threshold | Incident Action |
|:---|:---|:---|:---|
| `security.audit.events{event=failed_login}` | `[SECURITY_AUDIT] event=FAILED_LOGIN` | > 20 events in 5m | Credential stuffing or OAuth brute force. Investigate client IPs and block at Cloudflare / Railway WAF. |
| `security.audit.events{event=admin_login_success}` | `[SECURITY_AUDIT] event=ADMIN_LOGIN_SUCCESS` | Unexpected geo/IP | Verify with authorized administrator. If unrecognized, rotate `JWT_SECRET` and update `ADMIN_EMAILS`. |
| `security.audit.events{event=role_change}` | `[SECURITY_AUDIT] event=ROLE_CHANGE` | Any unexpected occurrence | Audit user role elevations. Confirm target email is listed in `ADMIN_EMAILS`. |
| `security.audit.events{event=payment_failure}` | `[SECURITY_AUDIT] event=PAYMENT_FAILURE` | > 5 events in 5m | Potential payment signature tampering or card testing attack. Inspect Razorpay Dashboard and correlate order IDs. |
| `security.audit.events{event=suspicious_webhook}` | `[SECURITY_AUDIT] event=SUSPICIOUS_WEBHOOK` | > 3 events in 15m | Spoofed webhook attempt. Confirm webhook token matches provider configuration. |
| `security.audit.events{event=rate_limit_tripped}` | `[SECURITY_AUDIT] event=RATE_LIMIT_TRIPPED` | > 50 events in 5m | Layer 7 DDoS or scraping attempt. Check IP in logs and apply IP firewall ban at reverse proxy / Cloudflare. |
| `security.audit.events{event=csrf_rejected}` | `[SECURITY_AUDIT] event=CSRF_REJECTED` | > 5 events in 5m | Cross-Site Request Forgery attempt. Verify originating domain and inspect malicious referrers. |

---

## 5. Security Contacts & Escalation Matrix

- **Primary Security Administrator:** `admin@sporekart.in`
- **Lead DevOps Engineer:** `thepravara2026@gmail.com`
- **Payment Gateway Escalation:** [Razorpay Merchant Support](https://razorpay.com/support/)
- **Infrastructure Escalation:** [Railway Platform Status](https://status.railway.app/) | [Supabase Support](https://supabase.com/dashboard/support)

