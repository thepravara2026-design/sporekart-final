# Sporekart Google-Only Auth Deployment & Rollback Guide

## 1. Zero-Downtime Deployment Strategy

### Deployment Steps
1. **Pre-Deployment Checklist**:
   - Verify `VITE_GOOGLE_CLIENT_ID` is set in frontend build environment.
   - Verify `GOOGLE_CLIENT_ID` matches Google Cloud Console credentials.
   - Run backend test suite: `mvn test`.
   - Run frontend build: `npm run build` in `frontend/`.
2. **Database Migration Status**:
   - Zero DDL migrations are required for this update.
   - `users`, `customer_identities`, and `otps` tables remain intact.
3. **Application Deployment**:
   - Deploy backend artifact (`sporekart-backend-1.0.0-SNAPSHOT.jar`).
   - Deploy frontend bundle (`dist/`).

---

## 2. Verification Protocol Post-Deployment

1. **Test Google Customer Login**:
   - Click "Sign in with Google" on customer login modal.
   - Verify successful JWT generation and redirection to user dashboard.
2. **Test Google Admin Login**:
   - Access `/admin/login`.
   - Click "Sign in with Google" using an existing admin email.
   - Verify admin access and role `ROLE_ADMIN`.
3. **Verify Retired Endpoints**:
   - Issue `POST /api/v1/auth/otp/request`.
   - Expect `HTTP 410 GONE` with error message `"OTP authentication has been retired. Please sign in using Google Auth."`.
4. **Verify Business Transactional Emails**:
   - Place a test order or initiate a training enrollment.
   - Verify SMTP transactional email delivery.

---

## 3. Rollback Procedure

If emergency rollback is required:

1. **Code Reversion**:
   - Revert Git commit to previous tag/release.
2. **Database Integrity**:
   - Because no database columns or tables were dropped during this migration, the existing database schema is 100% compatible with the prior application version.
   - No database restore or rollback script is required.
3. **Service Restart**:
   - Redeploy previous backend JAR and frontend build assets.
