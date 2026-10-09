# PRR-02: Frontend Peer Review — Sporekart

**Date:** October 9, 2026  
**Review Board:** Senior Frontend Engineer & Accessibility Reviewer  
**Target Repository:** `f:\sporekart-v1\sporekart-final\frontend`  

---

## 1. Route & Page Inventory Summary

| Route Path | Page Component | File Size | Access Level | Primary Actions | State & API Integration | Findings |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `HomePage.jsx` | 14.1 KB | Public | Hero, Glimpse Carousel, Featured Products | Axios `/api/v1/products`, `/api/v1/training/glimpses` | Clean animations, optimized image fallbacks. |
| `/catalog` | `CatalogPage.jsx` | 15.7 KB | Public | Category Filter, Sort, Price Filter | Axios `/api/v1/products` | Synchronous state filtering; client pagination needed for large sets. |
| `/products/:slug` | `ProductDetailPage.jsx` | 36.7 KB | Public | Variant selection, Gallery, Review submission | Axios `/api/v1/products/{slug}`, `/api/v1/reviews/product/{id}` | Monolithic detail component; review section embedded. |
| `/cart` | `CartPage.jsx` | 9.9 KB | Public / Customer | Quantity +/- , Coupon code, Checkout link | CartContext + localStorage sync | Popup drawer state synchronization validated. |
| `/checkout` | `CheckoutPage.jsx` | 22.5 KB | Customer | Address selector, Wallet toggle, Payment launch | Axios `/api/v1/orders`, Razorpay SDK script injection | Clean validation; wallet discount calculation verified. |
| `/payment` | `PaymentPage.jsx` | 21.7 KB | Customer | Razorpay Checkout Modal, Callback handler | Razorpay Webhook & REST Verification | Client-side verify request handled cleanly. |
| `/order-confirmation/:id` | `OrderConfirmationPage.jsx` | 11.3 KB | Customer | Summary, Line items, Invoice PDF download | Axios `/api/v1/orders/{id}`, HTML2Canvas / jsPDF | Invoice PDF rendering verified in Vitest suite. |
| `/training` | `TrainingPage.jsx` | 14.1 KB | Public | Course discovery, Batch filter | Axios `/api/v1/courses` | Includes auto-sliding glimpse carousel. |
| `/training/:slug` | `CourseDetailPage.jsx` | 11.3 KB | Public / Trainee | Batch selection, Slot capacity check, Enrollment | Axios `/api/v1/enrollments` | Batch slot capacity check verified before modal pop. |
| `/dashboard` | `DashboardPage.jsx` | **123.0 KB** | Customer / Trainee | Orders, Enrollments, Wallet, Profile, Support | Axios `/api/v1/customer/*`, `/api/v1/wallet/*` | **SEVERE BLOAT**: 3,000 lines of JSX in single file. |
| `/admin` | `AdminDashboardPage.jsx` | **340.9 KB** | Admin | Full E-Commerce & Training Management | Axios `/api/v1/admin/*` | **CRITICAL BLOAT**: ~8,500 lines of monolithic JSX. |

---

## 2. Key Frontend Defect Findings

### 2.1 Monolithic Component File Size
- **Finding ID:** `FE-DEF-01` (P2)
- **Files:** `AdminDashboardPage.jsx` (340.9 KB), `DashboardPage.jsx` (123.0 KB).
- **Description:** Single-file monolithic architecture hinders maintenance, slows IDE performance, and risks unintended re-render cascades across un-related UI tabs.

### 2.2 Unhandled Supabase Direct Client Import
- **Finding ID:** `FE-DEF-02` (P1)
- **Files:** `frontend/src/lib/supabase.js`
- **Description:** Supabase client is initialized in browser. If direct database calls are executed via Supabase client, backend business rules are bypassed.

### 2.3 React Router v7 Future Flag Warnings
- **Finding ID:** `FE-DEF-03` (P3)
- **Location:** Console warnings during test execution (`v7_startTransition`, `v7_relativeSplatPath`).
- **Description:** React Router v6 future flags are unconfigured in `App.jsx`, preparing for v7 migration deprecations.
