# Sporekart Technical Debt & Refactoring Inventory

## Overview
This document categorizes technical debt, code smells, missing validations, and potential performance bottlenecks discovered across the Sporekart backend and frontend codebases.

---

## 1. Backend Technical Debt

### High Priority
1. **Mock Fallback Logic in Production Services**:
   - `PaymentApplicationService.java` contains fallback code generating `order_mock_` when `app.razorpay.key-id` starts with `rzp_test_mock`.
   - `ShippingApplicationService.java` contains mock pincode checking logic simulating deliverability without invoking Shiprocket HTTP API endpoints.
   - *Fix Needed*: Abstract external payment & shipping providers into interface adapters (`RazorpayPaymentGateway`, `ShiprocketShippingCarrier`) with separate production and mock implementations configured via Spring `@Profile`.
2. **Hardcoded Standard Dev OTP**:
   - `AuthService.java` permits `"123456"` as a valid OTP code for any user verification.
   - *Fix Needed*: Restrict dev OTP bypass strictly to `@Profile("dev")` or test environments.

### Medium Priority
1. **JSON String Storage in Text Columns**:
   - `Order.java` stores `shippingAddressJson` as a plain `TEXT` column instead of PostgreSQL `jsonb` or structured embedded value objects.
   - `Course.java` stores `syllabusJson` as plain `TEXT`.
   - *Fix Needed*: Convert database columns to `jsonb` or map using Jackson `@Convert` converters for stronger typing.
2. **Missing Database Indexes**:
   - `orders` table lacks explicit secondary indexes on `user_id` and `status`.
   - `product_variants` lacks index on `product_id`.

---

## 2. Frontend Technical Debt

### High Priority
1. **Global Cart State via Prop Drilling**:
   - Cart state and handlers are maintained in `App.jsx` and manually passed down through `Navbar`, `HomePage`, `CatalogPage`, and `CartDrawer`.
   - *Fix Needed*: Refactor to React Context API (`CartContext`) or lightweight state management (`Zustand`) to avoid prop-drilling across pages.
2. **Static Unsplash Fallback Image URLs**:
   - Components use hardcoded Unsplash image URLs as fallbacks when `product.imageUrls` is empty.
   - *Fix Needed*: Replace all static third-party URLs with dynamic Supabase Storage CDN URLs served from backend metadata.

### Medium Priority
1. **Pincode Format Validation**:
   - Pincode checking in `Navbar.jsx` checks character length but lacks client-side regex enforcement before triggering API calls.
2. **Global Axios Interceptor Token Invalidation**:
   - `api.js` automatically attaches tokens, but does not intercept `401 Unauthorized` responses to automatically clear expired tokens from `localStorage` and trigger re-authentication.

---

## 3. Summary Matrix

| Area | Issue Description | Impact | Proposed Resolution |
| :--- | :--- | :--- | :--- |
| **Payment** | Inlined mock Razorpay logic in core service | Maintainability | Extract `PaymentGatewayAdapter` interface |
| **Shipping** | Simulated Shiprocket pincode checker | Functionality | Implement live Shiprocket REST API client |
| **Auth** | Hardcoded `"123456"` OTP fallback | Security | Restrict to `@Profile("dev")` |
| **Frontend** | Prop-drilled Cart & Auth state | Architecture | Introduce `CartContext` & `AuthContext` |
| **Database** | Plain `TEXT` for JSON fields | Data Integrity | Upgrade to PostgreSQL `jsonb` |
