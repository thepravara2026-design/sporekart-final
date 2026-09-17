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

## 2. Recommended Test Expansion Strategy & QA Roadmap

For full QA roadmap details and execution milestones, refer to [QA_ROADMAP.md](file:///f:/sporekart-v1/sporekart-final/docs/QA_ROADMAP.md).

### SEL-00 — Automation Architecture
- **Selenium 4 + TestNG + Maven + Page Object Model (POM)**:
  - Driver management (`ThreadLocal<WebDriver>`) for parallel execution safety.
  - Environment management (`ConfigReader` & `env.properties`).
  - Test data strategy (DataProviders & dynamic test data generation).
  - Failure screenshot strategy & ExtentReports HTML reporting.
  - Log4j2 structured logging & TestNG retry analyzer (`IRetryAnalyzer`).
  - CI execution pipeline with headless Chrome browser sessions.
  - **Exit Criteria**: Framework builds cleanly, TestNG executes suite, Chrome launches, first test passes, report generated.

### SEL-01 — Environment & Configuration
- **Multi-Environment Support & Zero Hardcoded Credentials**:
  - Environments: `local`, `dev`, `qa`, `staging`, `production`.
  - CLI parameterization via `-Denv=qa` / `-Denv=staging`.
  - Standardized parameter schema: `baseUrl`, `apiUrl`, `browser`, `headless`, `timeouts`, `testUser`, `testAdmin`.
  - Zero hardcoding policy: Secret injection via OS environment variables and GitHub Secrets in CI.
  - **Exit Criteria**: Config properties segregated, `-Denv` dynamically targets environment endpoints, credentials safely injected.

### SEL-02 — WebDriver Infrastructure
- **Browser Automation Infrastructure & Utilities**:
  - Factories: `DriverFactory` (`ThreadLocal<WebDriver>`), `BrowserFactory` (Chrome, Firefox, Edge support).
  - Utilities: `WaitUtils` (explicit waits), `ScreenshotUtils` (PNG/Base64 on failure), `JavaScriptUtils` (DOM scrolling & forced clicks), `WindowUtils` (multi-tab/window management), `CookieUtils` (session cookie management).
  - Headless support (`headless=true`) for CI pipeline execution.
  - **Exit Criteria**: `DriverFactory` thread safety verified, multi-browser & headless execution functional across Chrome/Firefox/Edge, utilities validated.

### SEL-03 — Page Object Architecture
- **Encapsulated POM & Strict Locator Separation**:
  - Prohibits raw `driver.findElement(...)` lookups in `@Test` methods.
  - Enforces 15 page object classes under `pages/`: `HomePage`, `LoginPage`, `ProductListingPage`, `ProductDetailsPage`, `CartPage`, `CheckoutPage`, `AddressPage`, `PaymentPage`, `OrderPage`, `TrainingPage`, `CoursePage`, `BatchPage`, `EnrollmentPage`, `BlogPage`, `AdminPage`.
  - Fluent business methods e.g., `loginPage.login(phone, otp)`.
  - **Exit Criteria**: Zero raw locators in tests, 15 Page classes extending `BasePage`, fluent action methods implemented.

### SEL-04 — Common Component Automation
- **Reusable UI Component Isolation**:
  - 15 component classes under `pages/components/`: `HeaderComponent`, `FooterComponent`, `NavigationComponent`, `SearchBarComponent`, `ProductCardComponent`, `ProductGridComponent`, `PaginationComponent`, `ModalComponent`, `ToastComponent`, `DropdownComponent`, `DatePickerComponent`, `AddressFormComponent`, `PaymentWidgetComponent`, `FileUploaderComponent`, `DataTableComponent`.
  - Eliminates locator & action duplication across parent Page Objects.
  - **Exit Criteria**: 15 component classes created, code duplication eliminated, async toast/modal waits integrated cleanly.

### SEL-05 — Authentication Automation
- **Customer Phone OTP & Google OAuth Automation**:
  - Customer Test Suite (`AUTH-UI-001` to `AUTH-UI-007`): Open login, request phone OTP, verify valid OTP, invalid OTP error handling, expired OTP, OTP resend retry, & logout session clearance.
  - Controlled QA OTP Mechanism: Zero SMS inbox dependency via `OtpFixtureHelper`, backend test API `/auth/test/latest-otp`, and Redis/DB test fixtures.
  - Google OAuth Suite: Redirect flow, callback processing, existing vs. new user provisioning, & identity linking.
  - **Exit Criteria**: All 7 OTP scenarios & Google OAuth flows automated without real SMS dependency.

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

### 2. Frontend End-to-End Tests (Playwright / Selenium)
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
  - Step 3: Run Selenium TestNG E2E test suite against spin-up Docker container.

