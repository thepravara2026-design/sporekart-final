# Sporekart Testing & Quality Assurance Audit

## Executive Summary
This document outlines the testing strategy, test coverage, test environment configuration, and quality assurance recommendations for Sporekart.

---

## 1. Unit & Integration Test Architecture

### 1. Backend Integration Tests (Testcontainers + PostgreSQL)
- **File**: `src/test/java/com/sporekart/SporekartIntegrationTest.java`
- **Dialect Parity**: Uses Testcontainers (`postgres:16-alpine`), matching the production database engine rather than relying on in-memory H2.
- **Flyway Verification**: Automatically validates that Flyway migrations execute cleanly from scratch on a clean PostgreSQL instance.
- **Transactional Tests**:
  - `contextLoadsAndCatalogSeeded`: Verifies catalog data seeding and variant retrieval.
  - `testServerSideAuthoritativeOrderCreation`: Verifies server-side authoritative order calculation, variant validation, and order number generation.

---

## 2. Recommended Test Expansion Strategy

### 1. Service-Level Unit Tests (JUnit 5 + Mockito)
- **`AuthServiceTest.java`**:
  - Test OTP expiration handling.
  - Test user creation on verified OTP.
  - Test invalid OTP rejection.
- **`OrderApplicationServiceTest.java`**:
  - Test stock availability checks (attempting to order more quantity than available in stock).
  - Test shipping fee rule logic (free shipping for orders ≥ ₹999; ₹70 for orders < ₹999).
- **`PaymentApplicationServiceTest.java`**:
  - Test Razorpay order initiation payload formatting.
  - Test payment signature verification failure logic.

### 2. Frontend End-to-End Tests (Playwright)
- **Checkout E2E Flow**:
  - Navigate to `/catalog`.
  - Select size variant and add product to cart.
  - Open cart drawer, fill shipping address, submit order.
  - Verify redirection to payment flow and order confirmation.
- **Training Booking Flow**:
  - Navigate to `/training`.
  - Expand module syllabus.
  - Select active batch slot and confirm enrollment.

---

## 3. CI/CD Integration Plan
- **GitHub Actions Configuration**:
  - Step 1: Run Maven integration test suite (`mvn test`).
  - Step 2: Run frontend build check (`npm run build`).
  - Step 3: Run Playwright E2E test suite against spin-up Docker container.
