# Sporekart Critical Production Remediation: Production Configuration Report
**Document ID:** `SPOREKART-REMED-05`  
**Execution Date:** 2026-11-13  
**Status:** COMPLETE & VERIFIED  
**Engineering Leads:** DevOps Engineer, Application Security Engineer  

---

## 1. Executive Summary

This report specifies the mandatory configuration requirements, environment variables, startup fail-fast validations, and secrets hygiene standards for deploying the Sporekart backend into production (e.g. Railway, AWS ECS, or Kubernetes).

Prior to this remediation, incomplete configurations or missing credentials could silently downgrade the application into mock mode in production. Following this remediation, **the application will fail-fast and refuse to start** if any production requirement is omitted, with clear diagnostics that never expose credentials in logs or exceptions.

---

## 2. Mandatory Production Configuration Matrix

The following environment variables must be configured in the production runtime container:

| Environment Variable | Target Spring Property | Constraints / Validation Rules | Purpose |
| :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `spring.profiles.active` | Must be `prod` or `production` | Activates production security rules |
| **Razorpay Settings** | | | |
| `APP_RAZORPAY_MOCK_MODE` | `app.razorpay.mock-mode` | **MUST be `false`** (rejected if `true`) | Prevents simulated payments |
| `APP_RAZORPAY_KEY_ID` | `app.razorpay.key-id` | **MUST start with `rzp_live_`** (rejected if starts with `rzp_test_` or blank) | Production gateway public key |
| `APP_RAZORPAY_KEY_SECRET` | `app.razorpay.key-secret` | Must be non-blank (minimum 16 chars) | Production HMAC signature secret |
| `APP_RAZORPAY_WEBHOOK_SECRET` | `app.razorpay.webhook-secret` | Must be non-blank | Validates Razorpay webhook callbacks |
| **Shiprocket Settings** | | | |
| `SPOREKART_SHIPROCKET_USE_REAL` | `sporekart.shiprocket.use-real-shiprocket` | **MUST be `true`** | Enforces live carrier dispatch |
| `SPOREKART_SHIPROCKET_EMAIL` | `sporekart.shiprocket.email` | Valid email, non-blank | Shiprocket API account login |
| `SPOREKART_SHIPROCKET_PASSWORD` | `sporekart.shiprocket.password` | Non-blank | Shiprocket account password |
| `SPOREKART_SHIPROCKET_PICKUP_LOCATION` | `sporekart.shiprocket.pickup-location` | Non-blank (e.g. `Primary` or `Warehouse1`) | Configured pickup hub name |
| `SPOREKART_SHIPROCKET_PICKUP_PINCODE` | `sporekart.shiprocket.pickup-pincode` | **Valid 6-digit code** (`^[1-9][0-9]{5}$`) | Origin dispatch postal pincode |
| `SPOREKART_SHIPROCKET_WEBHOOK_TOKEN` | `sporekart.shiprocket.webhook-token` | Non-blank | Secures inbound tracking webhooks |
| **Database & Security** | | | |
| `SPRING_DATASOURCE_URL` | `spring.datasource.url` | Direct PostgreSQL JDBC connection | Database connectivity |
| `SPRING_DATASOURCE_USERNAME` | `spring.datasource.username` | Table owner / service_role user | Direct JDBC credentials |
| `SPRING_DATASOURCE_PASSWORD` | `spring.datasource.password` | Non-blank secure database password | Database authentication |
| `APP_JWT_SECRET` | `app.jwt.secret` | **Minimum 32 characters (256 bits)** | Signs customer & admin JWTs |
| `APP_ADMIN_SECRET_KEY` | `app.admin.secret-key` | Minimum 16 characters | Secures admin invitation endpoints |
| `APP_CORS_ALLOWED_ORIGINS` | `app.cors.allowed-origins` | Comma-separated list (e.g. `https://sporekart.com`) | Restricts browser cross-origin requests |

---

## 3. Startup Fail-Fast Security Validation Rules

Implemented in `backend/src/main/java/com/sporekart/shared/infrastructure/SecurityConfigValidator.java`:

### 3.1 Profile Detection
Validation executes automatically upon Spring application readiness (`ApplicationReadyEvent`) whenever the active profile contains `prod`, `production`, or `railway`.

### 3.2 Razorpay Fail-Fast Rules
1. **Mock Mode Forbidden:** If `app.razorpay.mock-mode` is `true`, startup terminates immediately:
   > `FATAL CONFIGURATION ERROR: app.razorpay.mock-mode must be false in production!`
2. **Test Key Rejection:** If `app.razorpay.key-id` starts with `rzp_test_`, startup terminates immediately:
   > `FATAL CONFIGURATION ERROR: Razorpay test key detected in production profile! Only rzp_live_ keys are permitted.`
3. **Live Key Requirement:** If `app.razorpay.key-id` does not start with `rzp_live_` or is blank, startup terminates immediately:
   > `FATAL CONFIGURATION ERROR: Valid Razorpay live key (starting with rzp_live_) is required in production!`
4. **Secret Presence:** If `app.razorpay.key-secret` is blank, startup terminates immediately:
   > `FATAL CONFIGURATION ERROR: Razorpay key secret is required in production!`

### 3.3 Shiprocket Fail-Fast Rules
1. **Real Integration Required:** If `sporekart.shiprocket.use-real-shiprocket` is not `true`, startup terminates immediately:
   > `FATAL CONFIGURATION ERROR: sporekart.shiprocket.use-real-shiprocket must be true in production!`
2. **Credentials Verification:** If `email` or `password` is missing, startup terminates immediately:
   > `FATAL CONFIGURATION ERROR: Shiprocket email and password are required in production profile!`
3. **Pickup Configuration:** If `pickup-location` is missing or `pickup-pincode` does not match `^[1-9][0-9]{5}$`, startup terminates immediately:
   > `FATAL CONFIGURATION ERROR: Valid Shiprocket pickup location and 6-digit pickup pincode are required in production!`
4. **Webhook Token:** If `webhook-token` is missing or blank, startup terminates immediately:
   > `FATAL CONFIGURATION ERROR: Shiprocket webhook token is required in production profile to authenticate tracking updates!`

---

## 4. Secrets Hygiene & Actuator Health Reporting

### 4.1 Zero Secret Exposure in Logs and Exceptions
- Exception messages generated by `SecurityConfigValidator`, `ShiprocketAdapter`, `ShiprocketLiveAdapter`, and `PaymentService` provide exact missing field identifiers without logging credentials.
- Order numbers and customer names are masked (`OR***01`, `SK***99`) in standard info-level logs.
- Full API headers containing Shiprocket bearer tokens or Razorpay HTTP basic auth credentials are never printed to stdout.

### 4.2 Safe Production Health Indicator (`ShippingHealthIndicator`)
Spring Boot Actuator exposes shipping integration health at `/actuator/health` without exposing sensitive data:

**Sample Health Payload:**
```json
{
  "status": "UP",
  "components": {
    "shipping": {
      "status": "UP",
      "details": {
        "provider": "Shiprocket",
        "activeMode": "LIVE",
        "authReadiness": "READY",
        "apiConnectivity": "AVAILABLE",
        "lastSuccessfulCheck": "2026-11-13T10:09:48.966Z"
      }
    }
  }
}
```
**Forbidden in Health Check:**
- Password
- Bearer token / auth token
- Webhook secret
- Raw carrier API response headers

