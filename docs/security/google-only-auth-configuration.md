# Sporekart Google-Only Auth Configuration Guide

## 1. Overview

This configuration guide outlines the environment parameters, frontend settings, backend properties, and SMTP email settings required for operating Sporekart with Google OAuth 2.0 as the sole authentication provider.

---

## 2. Environment Variables & Properties

### Backend Configuration (`application.yml` / `application-supabase.yml`)

```yaml
sporekart:
  security:
    google:
      client-id: ${GOOGLE_CLIENT_ID:mock-google-client-id}
    jwt:
      secret: ${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
      expiration-ms: 86400000 # 24 Hours

spring:
  mail:
    host: ${SPRING_MAIL_HOST:smtp.gmail.com}
    port: ${SPRING_MAIL_PORT:587}
    username: ${SPRING_MAIL_USERNAME:notifications@sporekart.com}
    password: ${SPRING_MAIL_PASSWORD:smtp-password-placeholder}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

### Frontend Environment Variables (`.env`)

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 3. Google OAuth 2.0 Console Setup

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add Authorized JavaScript origins:
   - `http://localhost:5173` (Development)
   - `https://app.sporekart.com` (Production)
4. Add Authorized Redirect URIs if using redirect-based OAuth flow.
5. Copy the Client ID into `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID`.

---

## 4. SMTP Transactional Email Preservation Verification

Ensure `spring.mail` properties remain configured in production. The following business events trigger SMTP transactional emails and must NOT be affected by auth migration:

1. **Order Confirmation**: Sent to customer upon successful order placement.
2. **Order Shipped / Tracking update**: Sent via `ShiprocketService` / `NotificationEventService`.
3. **Training Enrollment Confirmation**: Sent when a user completes training registration.
4. **Wallet Credit / Debit Receipts**: Sent on wallet top-up or refund credit.
