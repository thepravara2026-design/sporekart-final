# Sporekart Architecture Audit & Baseline Report

## Executive Summary
This document provides a comprehensive architectural audit of the Sporekart repository, evaluating its compliance with Modular Monolith standards, domain ownership, package structure, and system scalability.

---

## 1. System Overview & Monolith Structure
- **Backend Framework**: Java 21 + Spring Boot 3.3.3.
- **Frontend Framework**: React 18 + Vite + TailwindCSS.
- **Database Layer**: Supabase PostgreSQL managed strictly via Flyway migrations (`db/migration/V1__init_schema.sql`).
- **Module Breakdown**:
  - `com.sporekart.common`: Core abstractions, exception handlers, security filter chain, JWT utilities.
  - `com.sporekart.identity`: User authentication, phone/email OTP verification, RBAC roles (`ROLE_CUSTOMER`, `ROLE_TRAINEE`, `ROLE_ADMIN`).
  - `com.sporekart.catalog`: Product management (Fresh, Dry, Seeds, Kits), categories, variants, and stock tracking.
  - `com.sporekart.training`: Cultivation & spawn production courses, syllabus, and slot booking.
  - `com.sporekart.order`: Server-authoritative order creation, price calculation, and order state machine.
  - `com.sporekart.payment`: Razorpay integration, order payment initiation, signature verification.
  - `com.sporekart.shipping`: Shiprocket PIN Code serviceability & estimated delivery times.

---

## 2. Module Boundary Analysis
### Strengths:
1. **No Cross-Module Repository Access**: The `order` module never directly accesses `ProductVariantRepository` or `ProductRepository`. It delegates stock and price verification to `CatalogApplicationService.validateAndGetVariant()`.
2. **Server-Authoritative Pricing**: Prices supplied by the frontend are ignored during order placement. The server queries `CatalogApplicationService` for the true unit price.
3. **Decoupled Security**: Authentication relies on stateless JWTs issued by `AuthService` and validated via `JwtAuthenticationFilter`.

### Architectural Risks & Recommended Improvements:
1. **Direct Synchronous Service Invocations**:
   - `PaymentApplicationService` directly invokes `OrderApplicationService.updateOrderStatus()`.
   - *Recommendation*: Transition to Spring `ApplicationEventPublisher` (Domain Events e.g., `PaymentCompletedEvent`) to decouple payment processing from order status updates.
2. **Data Seeding in Core Application**:
   - `DataInitializer.java` in `com.sporekart.common` seeds products and courses on startup if repositories are empty.
   - *Recommendation*: Move data seeding logic into dedicated Flyway repeat-migrations (`R__seed_data.sql`) or separate `@Profile("dev")` configuration.

---

## 3. Frontend Architecture Audit
- **Routing**: Client-side single page app routing via `react-router-dom` (`/`, `/catalog`, `/training`, `/dashboard`).
- **State Management**: React `useState` at the `App.jsx` level for cart state and current user profile, passed via props to components (`Navbar`, `CartDrawer`).
- **API Layer**: Centralized Axios instance (`api.js`) configured with request interceptors for automatic JWT header injection (`Authorization: Bearer <token>`).
- **Loading & Error States**: Components implement local `loading` and `error` state banners.

---

## 4. Exit Criteria & Verdict
The repository clean baseline successfully upholds the non-negotiable architecture contract:
- No microservices or distributed RPC overhead.
- No global repository/controller anti-patterns.
- Domain boundaries strictly defined by business context.
