# PRR-06: API Contract & Integration Review — Sporekart

**Date:** October 9, 2026  
**Review Board:** Senior Backend Engineer & Integration Specialist  
**Target Repository:** `f:\sporekart-v1\sporekart-final`  

---

## 1. REST API Contract & Endpoint Inventory

| HTTP Method | API Endpoint Path | Auth Required | Required Role | Controller Class | Validation / DB Effects | Contract Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/otp/request` | No | Public | `AuthController` | Validates phone/email format; inserts into `otps` | **PASS** |
| `POST` | `/api/v1/auth/otp/verify` | No | Public | `AuthController` | Verifies OTP code, returns JWT bearer token | **PASS** |
| `GET` | `/api/v1/catalog/products` | No | Public | `CatalogController` | Query filters `products`, returns paginated DTO | **PASS** |
| `GET` | `/api/v1/catalog/products/{slug}` | No | Public | `CatalogController` | Fetches product, variants, images by slug | **PASS** |
| `POST` | `/api/v1/cart/items` | Optional | Guest / Customer | `CartController` | Validates stock, inserts `cart_items` | **PASS** |
| `POST` | `/api/v1/orders` | Optional | Guest / Customer | `OrderController` | Reserves inventory, creates `orders` record | **PASS** |
| `GET` | `/api/v1/orders/{id}` | **Missing Auth**| **Public (BOLA Risk)**| `OrderController` | Fetches order by ID or order_number | **FAIL (SEC-01)** |
| `GET` | `/api/v1/orders/{id}/invoice` | **Missing Auth**| **Public (BOLA Risk)**| `OrderController` | Generates invoice DTO for order | **FAIL (SEC-01)** |
| `POST` | `/api/v1/payment/razorpay/order`| Yes | Customer | `PaymentController` | Calls Razorpay SDK to create Razorpay Order | **PASS** |
| `POST` | `/api/v1/payment/webhook` | Gateway Signature | Public / Razorpay | `PaymentWebhookController` | Validates HMAC SHA256 signature, updates order to PAID | **PASS** |
| `POST` | `/api/v1/enrollments` | Yes | Trainee | `TrainingController` | Checks batch capacity, locks slot, confirms booking | **PASS** |
| `GET` | `/api/v1/wallet/me` | Yes | Customer / Trainee | `WalletController` | Returns available & pending balance | **PASS** |
| `POST` | `/api/v1/admin/products` | Yes | `ROLE_ADMIN` | `AdminCatalogController` | Creates product, variant, uploads primary image | **PASS** |

---

## 2. External Integration Matrix

| External SaaS Gateway | Integration Type | Auth Credential Env Var | Resilience & Fallback Mechanism | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| **Razorpay** | REST SDK & Webhooks | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Webhook signature verification; transaction retry | **PASS** |
| **Shiprocket** | REST API | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` | Token caching; manual fallback in admin dashboard | **PASS** |
| **Gmail SMTP** | JavaMail / SMTP | `SMTP_USERNAME`, `SMTP_PASSWORD` | Fallback log mode when `USE_REAL_SMTP=false` | **PASS (Mock fallback active)** |
| **Twilio SMS** | REST SDK / HTTP | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Fallback log mode when `USE_REAL_TWILIO_SMS=false` | **PASS (Mock fallback active)** |
| **Supabase Storage**| Storage REST SDK | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Public bucket URL resolution with image default fallbacks | **PASS** |
