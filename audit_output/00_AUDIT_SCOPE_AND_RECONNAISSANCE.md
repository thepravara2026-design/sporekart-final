# Sporekart Quality Engineering Audit: Phase 0 — Scope & Repository Reconnaissance
**Document ID:** `00_AUDIT_SCOPE_AND_RECONNAISSANCE.md`  
**Classification:** Confidential — Internal Quality Engineering Artifact  
**Standard:** FAANG-Level Quality Architecture & Principal Systems Audit  
**Operating Mode:** AUDIT ONLY — Strict Zero-Mutation Policy (Read-Only Inspection & Reporting)  
**Date of Audit Execution:** October 17, 2026  
**Auditor Roles:** Principal QA Architect, Senior SDET, Backend Systems Engineer, Database Architect, Security Engineer, Payment Systems Specialist, Performance Engineer, DevOps Reviewer, Manual Exploratory Testing Specialist  

---

## 1. Executive Summary & Audit Mandate

### 1.1 Objective
The purpose of this comprehensive quality audit is to establish the true production readiness, security posture, functional completeness, transactional integrity, and performance resilience of the **Sporekart** application repository. Sporekart is an enterprise e-commerce and agritech platform designed for commercial mushroom growers, spawn purchasers, lab equipment buyers, and training course participants across India.

Under strict FAANG-grade quality principles:
> **Compilation, HTTP 200 responses, clean startup logs, and existing passing tests do NOT constitute correctness.** True quality requires rigorous structural validation, boundary exploration, transactional verification, concurrency audit, security threat modeling, and reproducible defect capture.

### 1.2 Mandatory Zero-Mutation Constraint
In accordance with **Section 2 of the Audit Mandate**, this engagement operates strictly in **AUDIT ONLY** mode. Under no circumstances will:
1. Application source code (`backend/src/main/java/**`, `frontend/src/**`) be altered or refactored.
2. Business logic, validations, null checks, or exception handlers be modified.
3. Database schemas, Flyway migrations, database records, or Supabase configurations be changed.
4. Production secrets, `.env` files, or deployment definitions be overwritten.
5. Real financial transactions (Razorpay) or real shipping dispatches (Shiprocket) be initiated.
6. Real customer emails (SMTP) or SMS messages (Twilio) be transmitted.
7. Any audit script or generated report overwrite existing repository files. All audit deliverables, test artifacts, and logs are strictly isolated within `audit_output/`.

---

## 2. Technology Stack & Architectural Blueprint

```
+----------------------------------------------------------------------------------------------------+
|                                    SPOREKART SYSTEM ARCHITECTURE                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ FRONTEND LAYER ]                                                                                |
|  React 18.3.1 (Vite 5.4.1 SPA) | TailwindCSS 3.4.10 | Lucide React | Framer Motion                 |
|  Axios Client (/api/v1) + LocalStorage Session/JWT Token Store                                      |
|  State: React Router DOM 6.26.1 | CartContext | Helmet Async                                        |
|                                                                                                    |
+--------------------------------------------------+-------------------------------------------------+
                                                   | HTTP / REST (JSON) + Bearer JWT + X-Session-ID
                                                   v
+----------------------------------------------------------------------------------------------------+
|  [ BACKEND LAYER - MODULAR MONOLITH ]                                                              |
|  Java 21 (Temurin LTS) | Spring Boot 3.3.3 | Embedded Tomcat (Port 8080, Context: /api/v1)         |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Modules:                                                                                      |  |
|  | - Identity & Auth (JWT, Google OAuth2, OTP)      - Notification (Outbox Worker, SMTP, SMS)   |  |
|  | - Catalog & Inventory (Pessimistic Locking)      - Shipping (Shiprocket Adapter, Tracking)    |  |
|  | - Cart & Checkout (Guest Session Merge, Promo)   - Training (Batches, Schedules, Attendance)  |  |
|  | - Order Processing (State Machine, PDF Invoice)  - Content & Blog (Scheduled Publishing)     |  |
|  | - Payment (Razorpay SDK 1.4.6, Webhooks, HMAC)   - Customer Profile & Capabilities            |  |
|  | - Wallet & Ledger (Pessimistic Balance Locking)  - Product & Training Reviews, Support CSAT   |  |
|  | - Media Management (Supabase Storage / S3 CDN)   - Analytics (Event Publisher, Metrics)       |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Cross-Cutting Infrastructure:                                                                     |
|  - SecurityConfig (Stateless JWT Filter Chain, CORS, BCrypt)                                       |
|  - RateLimitingFilter (In-memory Token Bucket)                                                     |
|  - RequestIdFilter (MDC X-Request-ID propagation)                                                  |
|  - GlobalExceptionHandler (@RestControllerAdvice, RFC 7807 structured error responses)             |
|                                                                                                    |
+--------------------------------------------------+-------------------------------------------------+
                                                   | JPA / Hibernate 6.5.2 + HikariCP
                                                   v
+----------------------------------------------------------------------------------------------------+
|  [ PERSISTENCE LAYER ]                                                                             |
|  - Production / Supabase: PostgreSQL 15+ (aws-0-ap-northeast-1 pooler, Port 6543)                  |
|  - Local Dev / Test: H2 Database 2.3+ (PostgreSQL Mode)                                            |
|  - Schema Versioning: Flyway 10.17.3 (38 SQL Migrations: V1 to V38)                               |
+----------------------------------------------------------------------------------------------------+
```

### 2.1 Architectural Specifications
| Dimension | Specification | Evidence / Implementation Source |
|---|---|---|
| **Backend Runtime** | OpenJDK 21.0.11 LTS (Temurin) | `backend/pom.xml`, `java -version` |
| **Backend Framework** | Spring Boot `3.3.3` | `backend/pom.xml:line 9` |
| **Persistence Engine** | Spring Data JPA / Hibernate `6.5.2` | `backend/pom.xml:line 33` |
| **Database Migrations** | Flyway Core `10.17.3` | `backend/pom.xml:line 66` (`db/migration/`) |
| **Security & Auth** | Spring Security 6.3.3 + JJWT `0.12.6` | `backend/pom.xml:lines 37, 76-91` |
| **Payment Gateway** | Razorpay Java SDK `1.4.6` | `backend/pom.xml:line 95` |
| **Frontend Framework** | React `18.3.1` + Vite `5.4.1` | `frontend/package.json:lines 20, 41` |
| **Frontend Styling** | TailwindCSS `3.4.10` + PostCSS | `frontend/tailwind.config.js`, `postcss.config.js` |
| **API Protocol** | RESTful JSON over HTTP, Context: `/api/v1` | `backend/src/main/resources/application.yml:line 66` |
| **Testing Tooling** | JUnit 5, Mockito, ArchUnit 1.3, JaCoCo, Vitest 1.6, Playwright 1.63 | Discovered across `backend/pom.xml` and `frontend/package.json` |

---

## 3. Tool Discovery & Assessment Matrix

In accordance with **Section 3 of the Quality Instructions**, all installed, accessible, and potential testing tools were audited on the target host.

| Tool Name & Version | Category | Purpose | Status | Execution Procedure / Command | Mode | Execution Result | Known Limitations / Caveats |
|---|---|---|---|---|---|---|---|
| **OpenJDK 21.0.11+10** | Runtime | Java Backend Execution | Available | `java -version` | Read-Only | Exit 0: Temurin-21.0.11 LTS amd64 | None. Fully compatible with Spring Boot 3.3.3. |
| **Apache Maven 3.9.16** | Build & Test | Backend compilation & testing | Available | `mvn test -Dtest=...` | Read-Only | Exit 0: Maven build & test execution verified | Needs Windows path resolution. |
| **Node.js v24.16.0** | Runtime | Frontend runtime & testing | Available | `node -v` | Read-Only | Exit 0: v24.16.0 | Node 24 is bleeding-edge; causes `tinypool` fork deadlock with Vitest 1.6 unless `--pool=threads` is enforced. |
| **npm 11.13.0** | Package Mgr | Frontend scripts | Available | `npm -v` | Read-Only | Exit 0: 11.13.0 | None. |
| **Git 2.54.0.windows.1** | VCS | Repository tracking & status | Available | `git status` | Read-Only | Exit 0: Branch `dev` (uncommitted work tree modifications detected) | Preserved without mutation. |
| **Docker** | Container | Testcontainers execution | **NOT INSTALLED** | `docker --version` | N/A | Exit 1: Command not recognized | Testcontainers disabled automatically via `@Testcontainers(disabledWithoutDocker=true)`; tests fall back to H2. |
| **ArchUnit 1.3.0** | Static Architecture | Hexagonal / Modular Monolith boundary verification | Available | `mvn test -Dtest=ArchitectureTest` | Read-Only | **PASS: 4/4 rules passed (10.43s)** | Validates controller and repository package isolation. |
| **JaCoCo 0.8.12** | Test Coverage | Backend code coverage instrumentation | Available | Integrated via `jacoco-maven-plugin` | Read-Only | Generates `target/jacoco.exec` and HTML reports | Coverage warning on class mismatch if classes modified without full recompile. |
| **ESLint 8.57.0** | Linter / SAST | Frontend code quality & syntax inspection | Available | `npm run lint` | Read-Only | **FAIL: 335 problems (26 errors, 309 warnings)** | Breaks CI/CD builds configured with `--max-warnings 0`. |
| **jscpd 5.4.1** | Duplication | Code clone detection across Java & JSX | Available (npx) | `npx jscpd backend/src/main/java frontend/src` | Read-Only | **Discovered 99 clones (1,592 duplicate lines, 2.79%)** | Report generated to `audit_output/jscpd-report/`. |
| **npm audit** | SCA Security | Frontend dependency vulnerability scan | Available | `npm audit` | Read-Only | **Discovered 15 vulnerabilities (2 critical, 7 high, 6 moderate)** | Critical RCE in `tinypool <= 2.1.1` and high DoS in `source-map-js`. |
| **Vitest 1.6.1** | Unit Testing | Frontend React component testing | Available | `npx vitest run --pool=threads` | Read-Only | **PASS: Verified on sustainability-page.test.jsx (5/5 passed)** | Default `pool: 'forks'` hangs on Node 24 Windows; `--pool=threads` required. |
| **Playwright 1.63.0** | E2E Testing | Browser end-to-end journey execution | Available | `npx playwright test` | Read-Only | Version 1.63.0 verified | Requires running dev server (`http://localhost:3000`) and mock backend. |

---

## 4. Comprehensive Module Inventory & Dependency Graph

### 4.1 Backend Module Breakdown (`backend/src/main/java/com/sporekart`)
Total Java Source Files: **272** across 18 functional modules.

| Module | Files | Controllers | Entities | Key Repositories | Core Application Services | Primary Business Responsibilities |
|---|---|---|---|---|---|---|
| **`admin`** | 4 | `AdminController` | `AdminAuditLog` | `AdminAuditLogRepository` | `AdminApplicationService` | Administrative audit logging, role inspection, operator activity tracking. |
| **`analytics`** | 14 | `AnalyticsController` | `AnalyticsEvent` | `AnalyticsEventRepository` | `AnalyticsService`, `AnalyticsEventListener` | User event tracking, conversion funnel, revenue KPIs, product view counters. |
| **`cart`** | 12 | `CartController` | `Cart`, `CartItem` | `CartRepository`, `CartItemRepository` | `CartService`, `CartApplicationService` | Guest & user cart lifecycle, item add/update, promo application, session merge. |
| **`catalog`** | 33 | `CatalogController`, `AdminCatalogController`, `GlobalSearchController` | `Product`, `Category`, `ProductVariant`, `InventoryRecord`, `InventoryAuditEvent`, `ProductInformation`, `ProductOffer`, `ProductMedia` | `ProductRepository`, `CategoryRepository`, `ProductVariantRepository`, `InventoryRecordRepository`, `InventoryAuditEventRepository` | `CatalogApplicationService`, `InventoryService`, `ProductInformationService` | E-commerce catalog, variant SKU management, stock reservations with pessimistic locking, search. |
| **`content`** | 16 | `ContentController`, `AdminContentController` | `BlogPost`, `BlogCategory`, `BlogAuthor`, `BlogTag`, `Article` | `BlogPostRepository`, `BlogCategoryRepository`, `BlogAuthorRepository`, `ArticleRepository` | `BlogContentService` | SEO knowledge base, mushroom cultivation guides, scheduled article publishing. |
| **`customer`** | 11 | `CustomerController`, `AdminCustomerController` | `CustomerProfile`, `CustomerAddress` | `CustomerProfileRepository`, `CustomerAddressRepository` | `CustomerService`, `TrainingCapabilityEventListener` | Customer profiles, multi-address book, GSTIN validation, commercial capabilities. |
| **`identity`** | 16 | `AuthController`, `AdminAuthController` | `User`, `Otp`, `CustomerIdentity` | `UserRepository`, `OtpRepository`, `CustomerIdentityRepository` | `AuthService`, `OtpService`, `GoogleAuthService` | JWT authentication, OTP SMS delivery, Google OAuth2 token verification, RBAC (`ROLE_CUSTOMER`, `ROLE_ADMIN`). |
| **`media`** | 12 | `MediaController` | `MediaAsset`, `MediaProductLink`, `MediaCourseLink` | `MediaAssetRepository`, `MediaProductLinkRepository` | `MediaService`, `SupabaseStorageService` | Media asset uploads, pre-signed upload URLs, image entity linking, CDN management. |
| **`notification`** | 12 | `CustomerNotificationController`, `AdminNotificationController` | `NotificationEvent` | `NotificationEventRepository` | `NotificationEventService`, `NotificationWorker`, `AbandonedCartScheduler` | Asynchronous transactional outbox pattern, HTML email rendering, Twilio SMS, in-app notifications. |
| **`order`** | 17 | `OrderController`, `AdminOrderController` | `Order`, `OrderItem`, `OrderEvent` | `OrderRepository`, `OrderItemRepository`, `OrderEventRepository` | `OrderService` | Order placement, address snapshotting, inventory confirmation, status state machine, PDF invoice generation. |
| **`payment`** | 11 | `PaymentController`, `PaymentWebhookController` | `Payment`, `PaymentEvent` | `PaymentRepository`, `PaymentEventRepository` | `PaymentService`, `RazorpayPaymentGateway`, `PaymentGateway` | Razorpay order creation, client HMAC verification, webhook idempotent processing, automated wallet refund dispatch. |
| **`promotion`** | 11 | `CustomerPromotionController`, `AdminPromotionController` | `Promotion`, `PromotionUsage` | `PromotionRepository`, `PromotionUsageRepository` | `PromotionService` | Discount coupons, minimum order limits, category/batch targeting, usage counters. |
| **`review`** | 13 | `CustomerReviewController`, `AdminReviewController`, `PublicReviewController` | `ProductReview`, `ProductReviewImage`, `ReviewInvitationState` | `ProductReviewRepository`, `ReviewInvitationStateRepository` | `ProductReviewService` | Post-delivery review invitations, ratings, photo uploads, admin moderation workflow. |
| **`shared`** | 18 | `SeoController` | None (Infrastructure) | None | `SecurityConfig`, `DataInitializer`, `RateLimitingFilter`, `JwtTokenProvider`, `GlobalExceptionHandler` | Cross-cutting infrastructure: security filter chain, rate limiting, OpenAPI, sitemap/robots generation. |
| **`shipping`** | 16 | `ShippingController`, `ShippingWebhookController` | `Shipment`, `ShipmentTracking` | `ShipmentRepository`, `ShipmentTrackingRepository` | `ShippingApplicationService`, `ShiprocketAdapter`, `ShiprocketRestClient` | Courier dispatch, Shiprocket API integration, AWB generation, real-time tracking webhooks. |
| **`support`** | 10 | `SupportController`, `AdminSupportController` | `SupportTicket`, `TicketMessage` | `SupportTicketRepository`, `TicketMessageRepository` | `SupportApplicationService` | Customer helpdesk, threaded messaging, ticket status updates, CSAT ratings. |
| **`training`** | 28 | `TrainingController`, `AdminTrainingController` | `Course`, `CourseCategory`, `Batch`, `BatchSchedule`, `Enrollment`, `Attendance`, `Completion`, `Certificate`, `TrainingReview`, `TrainingGlimpse` | `CourseRepository`, `BatchRepository`, `EnrollmentRepository`, `AttendanceRepository`, `CertificateRepository`, `TrainingReviewRepository` | `TrainingService` | Mushroom cultivation masterclasses, batch capacity reservations, attendance tracking, auto-certification. |
| **`wallet`** | 17 | `WalletController`, `AdminFinanceController` | `Wallet`, `WalletTransaction`, `WalletWithdrawal`, `WalletTopupIntent` | `WalletRepository`, `WalletTransactionRepository`, `WalletWithdrawalRepository`, `WalletTopupIntentRepository` | `WalletService` | Platform wallet, pessimistic balance locking, Razorpay topup, checkout payment, admin manual adjustments, refund credits. |

### 4.2 Frontend Module Breakdown (`frontend/src`)
Total Files: **104** (59 Components, 22 Pages, 21 Unit Tests, 22 E2E Specs).

| Frontend Module | Primary Files / Components | Route Mappings | Responsibilities |
|---|---|---|---|
| **Catalog & Storefront** | `HomePage.jsx`, `CatalogPage.jsx`, `ProductDetailPage.jsx`, `ProductCard.jsx`, `ProductGrid.jsx`, `CategoryCarousel.jsx` | `/`, `/products`, `/products/:categorySlug`, `/product/:slug` | Hero merchandising, category browsing, variant selection, stock badges, live search. |
| **Cart & Promotions** | `CartPage.jsx`, `CartDrawer.jsx`, `ProductAddedPopupDrawer.jsx`, `PromoCodeSection.jsx`, `CartContext.jsx` | `/cart` | Slide-out cart drawer, quantity increments, promo code verification, guest cart persistence. |
| **Checkout & Order Flow** | `CheckoutPage.jsx`, `PaymentPage.jsx`, `OrderConfirmationPage.jsx`, `IndianAddressForm.jsx` | `/checkout`, `/payment`, `/order-confirmation/:id` | Address capture (state/pincode validation), Razorpay / wallet payment trigger, invoice download. |
| **Training & Masterclasses** | `TrainingPage.jsx`, `CourseDetailPage.jsx`, `TraineeProfileEnrollmentModal.jsx`, `TrainingConfirmationPage.jsx` | `/training`, `/training/:courseSlug`, `/training/confirmation/:id` | Offline & online batch calendar, slot booking modal, syllabus display, trainee onboarding. |
| **Customer Dashboard** | `DashboardPage.jsx`, `MyReviewsTab.jsx`, `NotificationCenter.jsx` | `/dashboard` (Tabs: Orders, Training, Wallet, Addresses, Support, Reviews) | Consolidated customer control plane: tracking orders, wallet topups, support tickets, reviews. |
| **Admin Operations** | `AdminDashboardPage.jsx` (~444 KB), `AdminLoginPage.jsx`, `AdminReviewsManager.jsx`, `AdminTrainingGalleryManager.jsx` | `/admin/*` (Products, Orders, Finance, Shipping, Reviews, Training, Blogs, Support) | Monolithic operations cockpit: catalog management, refund approvals, dispatch triggers, CSAT analytics. |
| **Content & Knowledge** | `BlogIndexPage.jsx`, `BlogPostPage.jsx`, `CultivationGuidePage.jsx`, `SpawnGuidePage.jsx`, `SustainabilityPage.jsx` | `/blog`, `/blog/:slug`, `/mushroom-cultivation-guide`, `/sustainability` | Agronomy articles, guides, farm ROI calculators, trust building sections. |

### 4.3 Architecture Boundary Compliance
Verification via ArchUnit (`ArchitectureTest.java`) confirmed:
- Controllers are strictly isolated in `..api..` packages and annotated with `@RestController`.
- Repositories reside exclusively in `..infrastructure..` packages.
- Domain entities are strictly bound within `..domain..` packages.
- Cross-module repository direct coupling from `order` to `catalog.infrastructure` is zero (loose coupling maintained via `InventoryService` interface).

---

## 5. Comprehensive API Inventory

The Sporekart backend exposes **33 REST Controllers** encompassing **108 distinct API endpoints**.

### 5.1 Identity & Authentication (`/api/v1/auth`, `/api/v1/admin/auth`)
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `POST` | `/auth/otp/request` | Public | `OtpRequest` (phone) | `ApiResponse<OtpResponse>` | Triggers 6-digit OTP delivery via SMS or mock. |
| `POST` | `/auth/otp/verify` | Public | `OtpVerifyRequest` (phone, otp) | `ApiResponse<AuthResponse>` | Verifies OTP; returns JWT bearer token + user profile. |
| `POST` | `/auth/oauth/google` | Public | `GoogleAuthRequest` (idToken) | `ApiResponse<AuthResponse>` | Exchanges Google ID Token; creates or links user account. |
| `GET` | `/auth/me` | Authenticated | None | `ApiResponse<UserDto>` | Fetches authenticated user's profile and roles. |
| `POST` | `/admin/auth/otp/request` | Public | `AdminOtpRequest` (email/phone) | `ApiResponse<OtpResponse>` | Requests OTP for administrator login. |
| `POST` | `/admin/auth/otp/verify` | Public | `AdminOtpVerifyRequest` | `ApiResponse<AuthResponse>` | Validates admin OTP and issues JWT with `ROLE_ADMIN`. |

### 5.2 Catalog, Search & Media (`/api/v1/catalog`, `/api/v1/search`, `/api/v1/media`)
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `GET` | `/catalog/categories` | Public | None | `ApiResponse<List<CategoryDto>>` | Fetches active product categories. |
| `GET` | `/catalog/products` | Public | `type`, `category`, `page`, `size` | `ApiResponse<Page<ProductDto>>` | Paginated product catalog with variant price ranges. |
| `GET` | `/catalog/products/{slug}` | Public | Path: `slug` | `ApiResponse<ProductDetailDto>` | Detailed product view, images, variants, stock status. |
| `GET` | `/products/popular` | Public | `category`, `limit` | `ApiResponse<List<ProductDto>>` | Top rated / popular products for home page. |
| `GET` | `/products/bestsellers` | Public | `category`, `limit` | `ApiResponse<List<ProductDto>>` | High-volume sales products. |
| `GET` | `/search` | Public | `q` (query string) | `ApiResponse<GlobalSearchResponse>` | Unified full-text search across products, courses, blogs. |
| `POST` | `/media/upload/initiate` | Authenticated | `MediaUploadInitiateRequest` | `ApiResponse<SignedUrlResponse>` | Generates signed URL for direct client storage upload. |
| `POST` | `/media/upload/complete` | Authenticated | `MediaUploadCompleteRequest` | `ApiResponse<MediaAssetDto>` | Confirms upload and creates `MediaAsset` record. |
| `GET` | `/media/{id}/signed-url` | Authenticated | Path: `id` | `ApiResponse<String>` | Generates temporary viewing pre-signed URL. |

### 5.3 Cart & Promotions (`/api/v1/cart`, `/api/v1/promotions`)
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `GET` | `/cart` | Public (Session/JWT) | None | `ApiResponse<CartResponse>` | Retrieves active cart for current user or guest session. |
| `POST` | `/cart/items` | Public (Session/JWT) | `AddToCartRequest` (variantId, qty) | `ApiResponse<CartResponse>` | Adds product variant to cart; validates active stock. |
| `PUT` | `/cart/items/{variantId}` | Public (Session/JWT) | `UpdateCartItemRequest` (quantity) | `ApiResponse<CartResponse>` | Updates item quantity or removes if quantity is zero. |
| `DELETE` | `/cart/items/{variantId}` | Public (Session/JWT) | Path: `variantId` | `ApiResponse<CartResponse>` | Removes specific item from cart. |
| `DELETE` | `/cart` | Public (Session/JWT) | None | `ApiResponse<Void>` | Clears all items in active cart. |
| `POST` | `/cart/merge` | Authenticated | `X-Session-ID` Header | `ApiResponse<CartResponse>` | Merges anonymous guest session cart into logged-in user cart. |
| `POST` | `/cart/validate` | Public (Session/JWT) | None | `ApiResponse<CartValidationDto>` | Checks stock availability and price changes for cart items. |
| `POST` | `/cart/apply-promotion` | Public (Session/JWT) | `ApplyPromoRequest` (code) | `ApiResponse<CartResponse>` | Validates and applies discount coupon to cart. |
| `DELETE` | `/cart/remove-promotion` | Public (Session/JWT) | None | `ApiResponse<CartResponse>` | Detaches applied promotion from active cart. |
| `GET` | `/promotions/available` | Public | `audience` (CUSTOMER/TRAINEE) | `ApiResponse<List<PromoDto>>` | Lists currently active public promotions. |
| `POST` | `/promotions/validate-batch` | Public | `ValidateBatchPromoRequest` | `ApiResponse<PromoValidationDto>`| Validates coupon eligibility for training courses. |

### 5.4 Order & Invoice Management (`/api/v1/orders`)
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `POST` | `/orders` | Public (Session/JWT) | `CreateOrderRequest` | `ApiResponse<OrderResponse>` | Creates order from cart; reserves inventory; snapshots address. |
| `GET` | `/orders` | Authenticated/Session | None | `ApiResponse<List<OrderResponse>>` | Returns customer's past order history. |
| `GET` | `/orders/{id}` | Access Controlled | Path: `id` | `ApiResponse<OrderResponse>` | Order details (validated against user ID or session ID). |
| `GET` | `/orders/{id}/invoice` | Access Controlled | Path: `id` | `byte[]` (PDF application/pdf) | Generates dynamic GST-compliant PDF invoice download. |
| `POST` | `/orders/{id}/cancel` | Access Controlled | `reason` (query param) | `ApiResponse<OrderResponse>` | Cancels order prior to shipment; releases stock; credits wallet. |
| `PUT` | `/orders/admin/{id}/status`| `ROLE_ADMIN` | `UpdateOrderStatusRequest` | `ApiResponse<OrderResponse>` | Admin state machine transition (with terminal check rules). |

### 5.5 Payment Processing & Webhooks (`/api/v1/payment`)
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `POST` | `/payment/initiate` | Public | `InitiatePaymentRequest` (orderId) | `ApiResponse<InitiatePaymentResponse>` | Creates Razorpay order for an e-commerce order. |
| `POST` | `/payment/initiate-enrollment` | Authenticated | `InitiateEnrollmentRequest` (id) | `ApiResponse<InitiatePaymentResponse>` | Creates Razorpay order for masterclass enrollment. |
| `POST` | `/payment/verify` | Public | `VerifyPaymentRequest` (HMAC sig) | `ApiResponse<VerifyPaymentResponse>` | Validates Razorpay client HMAC; updates order to PAID; confirms inventory. |
| `POST` | `/payment/verify-enrollment` | Authenticated | `VerifyEnrollmentRequest` | `ApiResponse<VerifyPaymentResponse>` | Confirms payment for training seat; increments batch count. |
| `GET` | `/payment/summary` | Public | `type`, `id` | `ApiResponse<PaymentSummaryDto>` | Payment gateway summary for checkout display. |
| `POST` | `/payment/webhook` | Public (Signature Verified)| Raw Razorpay Webhook JSON payload | `String` (acknowledgment) | Asynchronous webhook: `payment.captured`, `order.paid`, `refund.processed`. |

### 5.6 Platform Wallet & Ledger (`/api/v1/wallet`, `/api/v1/admin/finance`)
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `GET` | `/wallet` | Authenticated | None | `ApiResponse<WalletResponse>` | Fetches user wallet balance (available, pending, withdrawable). |
| `GET` | `/wallet/balance` | Authenticated | None | `ApiResponse<BigDecimal>` | Quick wallet balance check for checkout toggle. |
| `GET` | `/wallet/transactions` | Authenticated | `page`, `size` | `ApiResponse<Page<WalletTransaction>>` | Paginated double-entry audit ledger entries. |
| `POST` | `/wallet/add-money` | Authenticated | `AddMoneyRequest` (amount) | `ApiResponse<AddMoneyResponse>` | Creates `WalletTopupIntent` and Razorpay payment order. |
| `POST` | `/wallet/verify-add-money` | Authenticated | `VerifyTopupRequest` (signature) | `ApiResponse<WalletTransaction>` | Verifies topup signature; executes pessimistic wallet credit. |
| `POST` | `/wallet/checkout-pay` | Authenticated | `WalletCheckoutRequest` (orderId) | `ApiResponse<OrderResponse>` | Debits wallet directly for order payment; sets status to PAID. |
| `POST` | `/wallet/withdraw` | Authenticated | `WithdrawalRequest` (bank details) | `ApiResponse<WalletWithdrawal>` | Submits customer wallet withdrawal request. |
| `GET` | `/wallet/withdrawals` | Authenticated | None | `ApiResponse<List<WalletWithdrawal>>` | User withdrawal request status list. |
| `GET` | `/admin/finance/overview`| `ROLE_ADMIN` | None | `ApiResponse<FinanceOverviewDto>` | Platform liquidity, total wallet balance, liability KPIs. |
| `POST` | `/admin/finance/withdrawals/{id}/approve` | `ROLE_ADMIN` | `ApproveWithdrawalRequest` | `ApiResponse<WalletWithdrawal>` | Approves customer payout and settles withdrawal. |
| `POST` | `/admin/finance/withdrawals/{id}/reject` | `ROLE_ADMIN` | `RejectWithdrawalRequest` | `ApiResponse<WalletWithdrawal>` | Rejects withdrawal and refunds amount back to wallet. |
| `POST` | `/admin/finance/manual-adjustment` | `ROLE_ADMIN` | `ManualAdjustmentRequest` | `ApiResponse<Void>` | Administrative credit or debit ledger adjustment. |

### 5.7 Logistics & Shipping (`/api/v1/shipping`)
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `GET` | `/shipping/check-pincode/{pincode}` | Public | Path: `pincode` | `ApiResponse<PincodeServiceabilityDto>` | Real-time courier serviceability and estimated delivery days. |
| `POST` | `/shipping/create` | `ROLE_ADMIN` | `CreateShipmentRequest` (orderId) | `ApiResponse<ShipmentDto>` | Dispatches order via Shiprocket; obtains AWB code. |
| `GET` | `/shipping/order/{orderId}` | Authenticated | Path: `orderId` | `ApiResponse<ShipmentDto>` | Retrieves courier tracking details for customer order. |
| `GET` | `/shipping/track/{shipmentId}` | Authenticated | Path: `shipmentId` | `ApiResponse<ShipmentTrackingDto>`| Polls latest courier checkpoint updates. |
| `POST` | `/shipping/cancel/{shipmentId}` | `ROLE_ADMIN` | Path: `shipmentId` | `ApiResponse<Void>` | Cancels courier pickup with logistics provider. |
| `POST` | `/shipping/simulate-event/{id}` | `ROLE_ADMIN` | `SimulateTrackingRequest` | `ApiResponse<Void>` | Testing utility: simulates courier transit/delivery events. |
| `POST` | `/shipping/webhook` | Public (Token Verified) | Raw Shiprocket Webhook JSON | `String` | Shiprocket webhook callback: updates shipment & order delivery. |

### 5.8 Masterclass Training & Academics (`/api/v1/training`, `/api/v1/admin/training`)
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `GET` | `/training/courses` | Public | `category` (optional) | `ApiResponse<List<CourseDto>>` | Catalogs active courses (Cultivation, Spawn Production). |
| `GET` | `/training/courses/{slug}` | Public | Path: `slug` | `ApiResponse<CourseDetailDto>` | Detailed syllabus, batch schedules, fees. |
| `GET` | `/training/courses/{id}/batches` | Public | Path: `id` | `ApiResponse<List<BatchDto>>` | Available upcoming batch dates with real-time seat counts. |
| `POST` | `/training/enroll` | Authenticated | `EnrollRequest` (batchId, promo) | `ApiResponse<EnrollmentDto>` | Reserves batch seat; applies coupon; initiates booking. |
| `GET` | `/training/my-bookings` | Authenticated | None | `ApiResponse<List<EnrollmentDto>>` | Trainee's registered masterclasses and certificates. |
| `POST` | `/training/enrollments/{id}/cancel` | Authenticated | Path: `id`, `reason` | `ApiResponse<EnrollmentDto>` | Cancels training seat; decrements batch; triggers wallet refund. |
| `GET` | `/training/certificate/{enrollmentId}` | Authenticated | Path: `enrollmentId` | `ApiResponse<CertificateDto>` | Retrieves verifiable training certificate. |
| `GET` | `/training/glimpses` | Public | None | `ApiResponse<List<TrainingGlimpseDto>>` | Public gallery of past masterclass sessions. |
| `POST` | `/admin/training/courses` | `ROLE_ADMIN` | `CreateCourseRequest` | `ApiResponse<CourseDto>` | Admin course creation. |
| `POST` | `/admin/training/batches` | `ROLE_ADMIN` | `CreateBatchRequest` | `ApiResponse<BatchDto>` | Schedules new training batch with capacity cap. |
| `POST` | `/admin/training/attendance` | `ROLE_ADMIN` | `MarkAttendanceRequest` | `ApiResponse<Void>` | Records trainee attendance for classroom sessions. |
| `POST` | `/admin/training/complete-course` | `ROLE_ADMIN` | `CompleteCourseRequest` | `ApiResponse<CertificateDto>` | Issues digital completion certificate. |

### 5.9 Customer Support, Reviews & In-App Notifications
| Method | Endpoint | Auth Required | Request DTO | Response DTO | Business Function |
|---|---|---|---|---|---|
| `POST` | `/support/tickets` | Authenticated | `CreateTicketRequest` | `ApiResponse<SupportTicketDto>` | Raises customer support ticket. |
| `GET` | `/support/tickets` | Authenticated | None | `ApiResponse<List<SupportTicketDto>>` | Fetches customer's open and resolved tickets. |
| `POST` | `/support/tickets/{id}/messages` | Authenticated | `TicketMessageRequest` | `ApiResponse<SupportTicketDto>` | Adds customer reply to support thread. |
| `POST` | `/support/tickets/{id}/close` | Authenticated | `CloseTicketRequest` (CSAT rating)| `ApiResponse<SupportTicketDto>` | Closes ticket and captures CSAT feedback (1-5 stars). |
| `POST` | `/customer/reviews` | Authenticated | `CreateProductReviewRequest` | `ApiResponse<ProductReviewDto>`| Submits verified purchase product review with photos. |
| `GET` | `/customer/reviews/pending` | Authenticated | None | `ApiResponse<List<ReviewInvitationDto>>`| Identifies delivered order items awaiting reviews. |
| `PATCH`| `/admin/reviews/{id}/status` | `ROLE_ADMIN` | `ReviewModerationRequest` | `ApiResponse<ProductReviewDto>`| Moderates review (`PUBLISHED`, `REJECTED`, `FLAGGED`). |
| `GET` | `/notifications` | Authenticated | `page`, `size` | `ApiResponse<Page<NotificationDto>>` | Retrieves customer in-app notifications. |
| `GET` | `/notifications/unread-count` | Authenticated | None | `ApiResponse<Long>` | Unread notification badge count. |
| `PATCH`| `/notifications/{id}/read` | Authenticated | Path: `id` | `ApiResponse<Void>` | Marks notification as read. |
| `PATCH`| `/notifications/read-all` | Authenticated | None | `ApiResponse<Void>` | Marks all customer notifications as read. |

---

## 6. Comprehensive Database Inventory

### 6.1 Database Engine & Migration Architecture
- **Production Engine:** PostgreSQL 15+ (Hosted on Supabase Pooler: `aws-0-ap-northeast-1.pooler.supabase.com:6543`)
- **Development/Test Engine:** H2 Database in PostgreSQL Compatibility Mode (`DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE`)
- **Schema Management:** Flyway 10.17.3 executing against `classpath:db/migration/`
- **Migration Count:** **38 SQL migration files** (`V1__init_schema.sql` through `V38__create_wallet_topup_intents.sql`).

### 6.2 Complete Table Inventory (54 JPA Entities / Database Tables)
| Migration | Table Name | Primary Key | Key Foreign Keys & Constraints | Primary Business Purpose |
|---|---|---|---|---|
| `V1` | `users` | `id UUID` | Unique: `email`, `phone` | User authentication records and credentials. |
| `V1` | `otps` | `id UUID` | FK: `users(id)` | Temporary one-time password tokens. |
| `V1` | `categories` | `id UUID` | Unique: `slug` | Product catalog taxonomies. |
| `V1` | `products` | `id UUID` | FK: `categories(id)`, Unique: `slug` | Core e-commerce product entities. |
| `V1` | `product_variants` | `id UUID` | FK: `products(id)`, Unique: `sku` | Sellable SKUs, packaging sizes (e.g. 500g, 1kg). |
| `V1` | `product_images` | `id UUID` | FK: `products(id)` | Legacy image associations. |
| `V1` / `V10` / `V30` | `courses` | `id UUID` | FK: `course_categories(id)`, Unique: `slug` | Masterclass and training course definitions. |
| `V1` | `training_slots` | `id UUID` | FK: `courses(id)` | Legacy slot management (superseded by batches). |
| `V1` | `training_bookings`| `id UUID` | FK: `users(id)`, `training_slots(id)` | Legacy booking records (superseded by enrollments). |
| `V1` | `orders` | `id UUID` | FK: `users(id)`, Unique: `order_number` | Master order tracking entity. |
| `V1` | `order_items` | `id UUID` | FK: `orders(id)`, `product_variants(id)` | Individual line items within an order. |
| `V1` / `V33` | `payments` | `id UUID` | FK: `orders(id)` (nullable in V33) | Razorpay transaction records. |
| `V1` / `V9` | `shipments` | `id UUID` | FK: `orders(id)` | Courier delivery and dispatch details. |
| `V2` | `customer_identities`| `id UUID` | FK: `users(id)`, Unique: `provider_user_id` | Social OAuth linkages (Google ID). |
| `V2` / `V29` | `customer_addresses` | `id UUID` | FK: `users(id)` | Shipping address book with alternate phone. |
| `V2` / `V10` | `customer_profiles` | `id UUID` | FK: `users(id)` (Unique) | GSTIN, farm size, training capabilities. |
| `V3` | `product_offers` | `id UUID` | FK: `products(id)` | Limited time discounts and promotional banners. |
| `V3` | `product_media` | `id UUID` | FK: `products(id)` | High-resolution gallery and instructional videos. |
| `V4` | `media_assets` | `id UUID` | Check: `file_size_bytes > 0` | Master digital asset catalog (Supabase S3 storage). |
| `V4` | `media_product_links`| `id UUID` | FK: `media_assets(id)`, `products(id)` | Product media gallery mapping. |
| `V4` | `media_course_links` | `id UUID` | FK: `media_assets(id)`, `courses(id)` | Training course syllabus media mapping. |
| `V5` | `inventory_records` | `id UUID` | FK: `product_variants(id)` (Unique) | Real-time stock counts: `available_qty`, `reserved_qty`. |
| `V5` | `inventory_audit_events`| `id UUID`| FK: `inventory_records(id)` | Immutable ledger for stock adjustments and deductions. |
| `V6` / `V37` | `carts` | `id UUID` | Partial Unique Index on `(user_id)` WHERE ACTIVE | User and guest shopping carts. |
| `V6` | `cart_items` | `id UUID` | FK: `carts(id)`, `product_variants(id)` | Items inside shopping cart. |
| `V7` | `order_events` | `id UUID` | FK: `orders(id)` | Order state machine transition history. |
| `V8` | `payment_events` | `id UUID` | FK: `payments(id)` | Webhook and gateway callback audit log. |
| `V9` | `shipment_trackings`| `id UUID` | FK: `shipments(id)` | Individual courier transit checkpoints. |
| `V10` | `course_categories` | `id UUID` | Unique: `slug` | Academic disciplines (Spawn, Cultivation, Lab). |
| `V10` | `batches` | `id UUID` | FK: `courses(id)`, Unique: `batch_code` | Classroom cohorts with date range & seat capacity. |
| `V10` | `batch_schedules` | `id UUID` | FK: `batches(id)` | Day-wise training syllabus timetable. |
| `V10` | `enrollments` | `id UUID` | FK: `batches(id)`, `users(id)` | Trainee enrollment contracts. |
| `V10` | `attendances` | `id UUID` | FK: `enrollments(id)`, `batch_schedules(id)`| Daily classroom attendance records. |
| `V10` | `completions` | `id UUID` | FK: `enrollments(id)` (Unique) | Course completion assessments. |
| `V10` | `certificates` | `id UUID` | FK: `completions(id)`, Unique: `cert_number`| Verifiable academic certificates. |
| `V11` | `customer_capabilities`| `id UUID`| FK: `users(id)` | Special commercial & wholesale permissions. |
| `V12` | `blog_categories` | `id UUID` | Unique: `slug` | Agronomy blog taxonomy. |
| `V12` | `blog_authors` | `id UUID` | Unique: `slug` | Mycologist and agronomist author profiles. |
| `V12` | `blog_tags` | `id UUID` | Unique: `slug` | Keyword indexing tags for articles. |
| `V12` | `blog_posts` | `id UUID` | FK: `blog_authors(id)`, `blog_categories(id)`| Published and scheduled agronomy articles. |
| `V12` | `blog_post_tags` | `id UUID` | FK: `blog_posts(id)`, `blog_tags(id)` | Post-tag many-to-many join table. |
| `V12` | `content_articles`| `id UUID` | Unique: `slug` | Knowledge base guides (Spawn guide, ROI guide). |
| `V13` | `admin_audit_logs` | `id UUID` | FK: `users(id)` | Operator action audit log (IP address, payload). |
| `V14` / `V27` | `support_tickets` | `id UUID` | FK: `users(id)`, Unique: `ticket_number` | Helpdesk tickets with CSAT ratings. |
| `V14` | `ticket_messages` | `id UUID` | FK: `support_tickets(id)` | Threaded communication history. |
| `V15` | `analytics_events` | `id UUID` | Index: `event_name`, `created_at` | Raw telemetry event stream. |
| `V15` | `analytics_metrics`| `id UUID` | Composite Unique: `(metric_name, date)` | Pre-aggregated daily conversion metrics. |
| `V16` | `product_information`| `id UUID`| FK: `products(id)` (Unique) | Agronomy specifications, substrate requirements, yields. |
| `V18` / `V32` | `wallets` | `id UUID` | FK: `users(id)` (Unique), Check: `balance >= 0`| Customer financial balances. |
| `V18` | `wallet_transactions`| `id UUID`| FK: `wallets(id)`, Unique: `reference` | Double-entry financial audit journal. |
| `V18` | `wallet_withdrawals`| `id UUID` | FK: `wallets(id)` | Bank payout requests. |
| `V20` / `V22` / `V23` | `promotions` | `id UUID` | Unique: `code` | Coupon configurations and audience rules. |
| `V20` | `promotion_usages` | `id UUID` | FK: `promotions(id)` | Historical coupon redemptions. |
| `V24` | `product_reviews` | `id UUID` | FK: `products(id)`, `users(id)` | Verified purchaser ratings and reviews. |
| `V24` | `product_review_images`| `id UUID`| FK: `product_reviews(id)` | User uploaded product photos. |
| `V24` | `review_invitation_states`| `id UUID`| FK: `orders(id)`, `order_items(id)` | Automated post-delivery review prompt state. |
| `V25` | `training_reviews` | `id UUID` | FK: `courses(id)`, `users(id)` | Trainee course evaluations. |
| `V26` | `training_glimpses`| `id UUID` | Check: `media_url IS NOT NULL` | Masterclass photo showcase items. |
| `V28` / `V31` / `V35` | `notification_events`| `id UUID`| Index: `status`, `attempt_count` | Outbox queue for email, SMS, and in-app alerts. |
| `V38` | `wallet_topup_intents`| `id UUID`| FK: `users(id)`, Unique: `razorpay_order_id`| Pending wallet balance recharges. |

### 6.3 Critical Database Schema Discrepancy (Migration Drift)
- **Finding:** Migration file `V37__deduplicate_and_unique_active_user_cart.sql` (which enforces a partial unique index on `carts(user_id)` where `status = 'ACTIVE'`) is present in `backend/src/main/resources/db/migration/` but **missing from `backend/supabase/migrations/`**.
- **Impact:** Any database spun up via the Supabase CLI will omit the unique active cart constraint, permitting race conditions and duplicate cart creation, while environments provisioned via Flyway enforce the constraint.

---

## 7. State Machine & State Transition Matrix

### 7.1 Order Lifecycle (`OrderStatus`)
```
[PENDING_PAYMENT] ---------> [PAID] --------------> [PROCESSING] ---------> [SHIPPED] -----------> [DELIVERED]
       |                       |                          |                    |                      |
       | (Timeout/Cancel)      | (Cancel before ship)     | (Cancel packed)    |                      |
       v                       v                          v                    |                      |
  [CANCELLED]             [REFUNDED]                 [REFUNDED]                |                      |
  (No payment)        (Direct to Wallet)         (Direct to Wallet)            v                      v
                                                                          (Terminal)             (Terminal)
                                                                       Courier updates        Courier webhook
```
**State Transition Rules Verified in `OrderService.java`:**
1. `CANCELLED` and `REFUNDED` are immutable terminal states; any attempt to transition out of them throws an `IllegalStateException`.
2. Manual admin transitions from `SHIPPED` directly to `DELIVERED` are rejected; delivery transitions must be driven by courier updates or carrier webhooks (`ShipmentStatus`).
3. Cancelling a `PAID`, `CONFIRMED`, or `PROCESSING` order automatically transitions it to `REFUNDED` and initiates an immediate credit to the customer's Sporekart Wallet.
4. Stock reserved at checkout is released back to `available_qty` when an order transitions to `CANCELLED` or `REFUNDED`.

### 7.2 Payment Lifecycle (`PaymentStatus`)
```
[INITIATED] -------------> [CAPTURED] -------------> [REFUNDED]
     |                           |
     | (Gateway failure)         | (Webhook duplicate)
     v                           v
  [FAILED]               (Idempotent Ignore)
```

### 7.3 Training Enrollment Lifecycle (`EnrollmentStatus`)
```
[PENDING_PAYMENT] ---------> [CONFIRMED] ---------> [ATTENDED] ---------> [COMPLETED]
       |                          |                                             |
       | (Cancel/Timeout)         | (Cancel before start)                       v
       v                          v                                     [CERTIFICATE_ISSUED]
  [CANCELLED]                 [REFUNDED]
```

### 7.4 Shipment Lifecycle (`ShipmentStatus`)
```
[CREATED] ----> [AWB_ASSIGNED] ----> [PICKUP_SCHEDULED] ----> [IN_TRANSIT] ----> [OUT_FOR_DELIVERY] ----> [DELIVERED]
    |                  |                     |                      |
    +------------------+---------------------+----------------------+-----> [CANCELLED] / [RTO_INITIATED]
```

---

## 8. External Integrations & Adapter Architecture

| Integration | Implementation Adapter | Configuration Keys | Live vs Mock Strategy | Evidence / Implementation Details |
|---|---|---|---|---|
| **Razorpay (Payments & Refunds)** | `RazorpayPaymentGateway.java` wrapping `com.razorpay.RazorpayClient` | `app.razorpay.key-id`, `key-secret`, `webhook-secret`, `mock-mode` | Configurable via `RAZORPAY_MOCK_MODE`. In mock mode, generates `order_mock_` tokens and skips remote API. | Uses `com.razorpay.Utils.verifyPaymentSignature` and `Utils.verifyWebhookSignature`. Handles `payment.captured` and `refund.processed` idempotently. |
| **Shiprocket (Logistics & Couriers)** | `ShiprocketAdapter.java` + `ShiprocketRestClient.java` | `sporekart.shiprocket.email`, `password`, `api-url`, `use-real-shiprocket` | Defaults to mock mode (`use-real-shiprocket: false`). | Authenticates via `/auth/login`; caches bearer token; generates AWB codes; maps pickup pincode (`411001`). |
| **Twilio SMS (OTP & Order Alerts)** | `TwilioSmsService.java` | `sporekart.twilio.account-sid`, `auth-token`, `from-phone-number`, `use-real-twilio` | Defaults to mock mode (`use-real-twilio: false`). | Validates Indian E.164 phone formats (`+91...`); logs dispatched SMS payloads when mock mode is enabled. |
| **SMTP / JavaMail (Email Engine)** | `NotificationWorker.java` + `JavaMailSender` | `spring.mail.host`, `port`, `username`, `password`, `sporekart.mail.use-real-smtp` | Defaults to mock mode in dev/test (`use-real-smtp: false`). | Processes outbox queue every 10 seconds; renders HTML email templates; records attempt counters up to 5 retries. |
| **Google Identity (OAuth2)** | `GoogleAuthService.java` | `spring.security.oauth2.client.registration.google.client-id` | Token verification via Google API client. | Verifies audience signature; creates or merges customer identity; resolves duplicate phone conflicts. |
| **Supabase Storage (Media CDN)** | `SupabaseStorageService.java` | `app.supabase.url`, `bucket`, `anon-key`, `service-role-key` | REST API over HTTPS to Supabase Storage endpoint. | Generates presigned URLs for client browser direct upload; manages media ACLs. |

---

## 9. Background Processing, Schedulers & Asynchronous Architecture

| Component | Class Path | Trigger Mechanism | Frequency / Cadence | Transactional Boundary | Performance & Reliability Risk Identified |
|---|---|---|---|---|---|
| **Notification Outbox Worker** | `com.sporekart.notification.application.NotificationWorker` | `@Scheduled(fixedDelay = 10000)` | Every 10 seconds | Batch of 20 records (`findTop20ByStatusIn...`) | Low risk. Retries up to 5 times before marking `DEAD_LETTER`. |
| **Abandoned Cart Scanner** | `com.sporekart.notification.application.AbandonedCartScheduler` | `@Scheduled(cron = "0 */15 * * * *")` | Every 15 minutes | `@Transactional` | **HIGH RISK:** Executes `cartRepository.findAll().stream().filter(...)`. In a production database, loading all carts into JVM heap causes CPU spikes, GC pauses, and OutOfMemoryError. |
| **Blog Post Scheduler** | `com.sporekart.content.application.BlogContentService` | `@Scheduled(cron = "0 */5 * * * *")` | Every 5 minutes | `@Transactional` | Scans for articles where `scheduledPublishTime <= NOW()` and sets status to `PUBLISHED`. |
| **Rate Limiter Eviction** | `com.sporekart.shared.infrastructure.RateLimitingFilter` | `@Scheduled(fixedDelay = 300000)` | Every 5 minutes | In-memory `ConcurrentHashMap` | Evicts stale client IP token buckets to prevent memory leaks. |
| **Analytics Event Dispatch** | `com.sporekart.analytics.application.AnalyticsEventListener` | `@EventListener` / `ApplicationEventPublisher` | Synchronous / Decoupled in-JVM events | `@Transactional(propagation = REQUIRES_NEW)` | Listens for `OrderCreatedEvent`, `OrderDeliveredEvent` to update revenue and customer metrics. |

---

## 10. Security Reconnaissance & Vulnerability Assessment

### 10.1 Exposed Secrets in Repository Configuration
- **CRITICAL:** `backend/src/main/resources/application-supabase.yml` contains hardcoded database credentials:
  - Database Host: `aws-0-ap-northeast-1.pooler.supabase.com:6543`
  - Username: `postgres.irwiiyowpppdynbmwwuz`
  - Password: `MyDbSporekart@123#`
- **HIGH:** `backend/src/main/resources/application-dev.yml` contains a static base64 JWT secret fallback:
  - `dGVzdF9kZXZfc2VjcmV0X2tleV9mb3JfbG9jYWxfZGV2ZWxvcG1lbnRfb25seV8zMmJ5dGVz`
- **HIGH:** `backend/src/main/resources/application-test.yml` contains a static hex JWT secret fallback:
  - `404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971`

### 10.2 Authorization Model & IDOR Inspection
- **PermitAll Endpoints in SecurityConfig:**
  - `GET /orders/*` and `GET /orders/*/invoice`: While declared `permitAll()` in `SecurityConfig.java:lines 83-84`, the internal service layer (`OrderService.java:lines 268-278`) enforces `validateOrderAccess(order, userId, sessionId)`. Unauthenticated users without the matching session ID receive HTTP 403 Forbidden.
  - **Edge Case Identified:** An administrator authenticated with `ROLE_ADMIN` cannot access customer order details via `/orders/{id}` or invoice download via `/orders/{id}/invoice` because `validateOrderAccess` strictly checks `order.getUserId().equals(userId)`. Administrators must use `/admin/orders/{id}`.
- **Cart Access Controls:**
  - `/cart/**` is completely `permitAll()`. Session hijacking or collision is possible if predictable session IDs are accepted.

### 10.3 Frontend Vulnerabilities (npm audit)
- **CRITICAL:** `tinypool <= 2.1.1` — Prototype pollution leading to Remote Code Execution (`GHSA-5gmw-xhrv-c9v3`, `GHSA-85c8-ppgw-ccpr`).
- **HIGH:** `source-map-js` — Event-loop denial of service (`GHSA-68fv-2mgg-jv7q`).
- **HIGH:** `braces` — Stack exhaustion denial of service (`GHSA-vfj7-8cjw-p6xm`).
- **MODERATE:** `react-router` — Open redirect via backslash bypass (`CVE-2025-68470`, `GHSA-wrjc-x8rr-h8h6`).

---

## 11. Environment Boundaries & Safe Test Data Protocol

To comply strictly with the **AUDIT ONLY** mandate and prevent accidental mutations:

```
+----------------------------------------------------------------------------------------------------+
|                                    SAFE AUDIT ISOLATION ENVELOPE                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   Audit Configuration Flags (Zero-Mutation Mode):                                                  |
|   - SPRING_PROFILES_ACTIVE=test                                                                    |
|   - SPRING_DATASOURCE_URL=jdbc:h2:mem:testdb;MODE=PostgreSQL                                       |
|   - SPOREKART_MAIL_USE_REAL_SMTP=false                                                             |
|   - SPOREKART_TWILIO_USE_REAL_TWILIO=false                                                         |
|   - SPOREKART_SHIPROCKET_USE_REAL_SHIPROCKET=false                                                 |
|   - APP_RAZORPAY_MOCK_MODE=true                                                                    |
|                                                                                                    |
|   Audit Output Directory:                                                                          |
|   - All reports, test artifacts, traces, and metrics strictly isolated in:                         |
|     `./audit_output/`                                                                              |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 11.1 Safety Rules Enforced During Testing
1. **Financial Safeguard:** Razorpay mock mode (`mock-mode: true`) is mandatory. No live API calls will be made to Razorpay endpoints.
2. **Logistics Safeguard:** Shiprocket integration will run with `use-real-shiprocket: false`. All shipment generation will use synthetic AWB allocations (`AWB-897...`).
3. **Notification Safeguard:** Email and SMS engines will run with `use-real-smtp: false` and `use-real-twilio: false`. Dispatch events will be validated solely via the in-memory outbox table (`notification_events`).
4. **Data Isolation:** All database tests will run against disposable in-memory H2 instances or isolated non-production schemas. Production Supabase tables (`postgres.irwiiyowpppdynbmwwuz`) will NEVER be altered or seeded with test data.

---

## 12. Scope, Exclusions & Missing Prerequisites

### 12.1 Audit Scope
The complete quality audit covers:
- [x] Full Static Code Analysis & Linting (Java Compiler, ESLint, jscpd, ArchUnit)
- [x] Security Scanning (npm audit, hardcoded secret reconnaissance, authorization review)
- [x] Backend Unit & Integration Tests (Architecture rules, Controller/Service unit tests)
- [x] Frontend Component & Hook Tests (Vitest under `--pool=threads`)
- [x] API Contract & Validation Testing (Null checks, duplicate keys, boundary data types)
- [x] State Machine & Concurrency Audits (Inventory pessimistic locking, wallet balance race conditions)
- [x] End-to-End User Journey Audit (Playwright specs: Guest browsing, cart merge, payment, tracking, admin)

### 12.2 Explicit Exclusions
- Modifications, patches, or direct refactoring of application code (strictly prohibited by audit mandate).
- Real financial charges against customer credit cards or UPI accounts.
- Dispatch of physical couriers via Blue Dart, Delhivery, or Shiprocket.
- Real SMS delivery to cellular network subscribers.

### 12.3 Missing Prerequisites & Environmental Constraints
1. **Docker Daemon:** Docker is not running or installed on the host system. Backend integration tests requiring `org.testcontainers.containers.PostgreSQLContainer` must run with H2 fallback or in-memory emulation.
2. **ESLint Cleanliness:** Frontend has 335 lint issues preventing clean CI gate execution.
3. **Vitest Worker Pool:** Running Vitest with the default `pool: 'forks'` on Windows Node 24 hangs indefinitely; `--pool=threads` must be passed explicitly in all audit invocations.

---

## 13. Reconnaissance Conclusion & Next Steps

This reconnaissance establishes the baseline architecture, complete inventories, execution boundaries, and safety constraints of the Sporekart platform. With the operational boundaries confirmed, Phase 1 testing and deep functional verification can proceed safely within the isolated `audit_output/` environment.
