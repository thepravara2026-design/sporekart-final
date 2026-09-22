# UI/UX Baseline Audit - Sporekart Frontend

## 1. Executive Summary
This document establishes the design, architectural, and component baseline for Sporekart's customer-facing and administrative web applications. The goal of the upcoming transformation is to elevate Sporekart into a **modern, premium, trustworthy Indian mushroom & agritech brand** with a smooth, conversion-focused e-commerce experience while maintaining **100% regression-free functional compatibility with existing backend Spring Boot APIs, business logic, authorization, cart, checkout, payment, and data flows.**

---

## 2. Existing Frontend Architecture

### Core Stack
- **Framework**: React 18.3 + Vite 5.4
- **Routing**: `react-router-dom` v6.26
- **Styling**: Tailwind CSS 3.4 + Custom CSS Glassmorphic design tokens
- **Animations**: `framer-motion` 11.3 + CSS keyframes & transitions
- **Icons**: `lucide-react` 0.435
- **HTTP Client**: `axios` 1.7
- **SEO & Meta**: `react-helmet-async` 2.0

### Key Directories
- `src/api.js`: Centralized Axios client & API module definitions (`authApi`, `catalogApi`, `cartApi`, `customerApi`, `trainingApi`, `blogApi`, `shippingApi`, `adminApi`).
- `src/components/`: Modular UI elements (`Navbar`, `Footer`, `CartDrawer`, `Breadcrumbs`, `SeoHead`, `PageSkeleton`, `AeoFaqGraph`, `MediaImage`, `GoogleLoginButton`).
- `src/pages/`: Route handlers (`HomePage`, `CatalogPage`, `ProductDetailPage`, `CartPage`, `CheckoutPage`, `TrainingPage`, `CourseDetailPage`, `BlogIndexPage`, `BlogPostPage`, `SpawnGuidePage`, `CultivationGuidePage`, `AboutPage`, `ContactPage`, `DashboardPage`, `AdminDashboardPage`, `NotFoundPage`).

---

## 3. Existing Design System Audit

### Colors & Palette
- Primary Green Palette (`spore-50` through `spore-950`): Soft sage to deep forest green (`#111f12` to `#71a373`).
- Earth Accent Palette (`earth-50` through `earth-950`): Warm mushroom terracotta & beige tones (`#31211b` to `#c4a28c`).
- Background: Very dark charcoal `#090d09` with high-contrast text `#f1f5f9`.
- **Audit Finding**: Currently heavily dark-mode dominant with glassmorphism overlays (`glass-panel`, `glass-card`). To elevate to a modern, natural, premium e-commerce feel, we should refine the balance with rich natural tones, warm neutral surfaces, subtle borders, high contrast badges, and clean elevation levels without changing dark theme accessibility.

### Typography
- Primary Sans: `Inter`, system-ui
- Display Font: `Outfit`, sans-serif
- **Audit Finding**: Font scale hierarchy needs structured CSS utility tokens for Display, H1-H3, Body, Metadata, and Price tags to ensure consistent mobile legibility.

### Spacing & Radius
- Border Radius: Mix of `rounded-xl` (12px), `rounded-2xl` (16px), and `rounded-3xl` (24px).
- **Audit Finding**: Radii need standard tokens (compact for badges/inputs vs extra-large for product cards & modal drawers).

---

## 4. Route & Feature Baseline Matrix

| Route Path | Component | Purpose | Key Data Dependencies |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage.jsx` | Brand Hero, Category Cards, Featured Products, Agritech Training CTA, Blog highlights | `catalogApi.getProducts()`, `trainingApi.getCourses()` |
| `/products`, `/products/:category` | `CatalogPage.jsx` | Full catalog, category filtering, search, variant selector, availability badges | `catalogApi.getProducts()`, `catalogApi.getCategories()` |
| `/product/:slug` | `ProductDetailPage.jsx` | Multi-image gallery, variant price calculator, FSSAI compliance tabs, pincode serviceability, add-to-cart | `catalogApi.getProductBySlug()`, `shippingApi.checkPincode()` |
| `/cart` | `CartPage.jsx` | Dedicated cart view with item controls, subtotal, guest checkout prompt | `cartApi.getCart()`, `cartApi.updateItemQuantity()`, `cartApi.removeItem()` |
| `/checkout` | `CheckoutPage.jsx` | Multi-step shipping, OTP auth, address form, Razorpay payment gateway integration | `cartApi.getCart()`, `customerApi.getAddresses()`, `paymentApi` |
| `/training`, `/training/:id` | `TrainingPage.jsx`, `CourseDetailPage.jsx` | Certified grower workshops, batch schedules, enrollment flow | `trainingApi.getCourses()`, `trainingApi.getCourseById()` |
| `/blog`, `/blog/:slug` | `BlogIndexPage.jsx`, `BlogPostPage.jsx` | Mycological guides, AEO schema graphs, knowledge base | `blogApi.getPosts()`, `blogApi.getPostBySlug()` |
| `/dashboard` | `DashboardPage.jsx` | Customer profile, order history, certificate downloads | `customerApi.getProfile()`, `customerApi.getOrders()` |
| `/admin/*` | `AdminDashboardPage.jsx` | Tabbed catalog & order management, media upload, product publication validation | `adminApi.*` |

---

## 5. Critical Regression Prevention Guidelines

1. **Preserve `data-testid` Selectors**:
   - `product-detail`, `product-title`, `product-price`, `product-availability`
   - `product-gallery`, `product-primary-image`, `product-thumbnail`
   - `gallery-next`, `gallery-previous`, `gallery-counter`
   - `add-to-cart`, `checkout-button`, `cart-count`
   - `product-save`, `product-publish`, `product-information-form`
2. **Preserve Public Stock Availability Privacy**:
   - Never display raw integer stock counts in public views; evaluate `variant.availability.status` (`AVAILABLE`, `LIMITED_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).
3. **Preserve Dynamic Media Structure**:
   - Support `product.imageUrls` array and `product.media` array (`PRIMARY`, `GALLERY`, `PACKAGING`, `LIFESTYLE`, `INSTRUCTION`).
4. **Zero Backend Changes**:
   - Maintain exact API call signatures in `src/api.js`.

---

## 6. Targeted UI/UX Enhancements

1. **Design System & Tokens**: Add centralized animation utilities, elevation shadows, refined color tokens, skeleton shimmers, and reduced motion queries to `index.css`.
2. **Header & Navigation (`Navbar.jsx`)**: Sticky glass header, animated mobile navigation sheet, live search bar, and cart item count badge pulse.
3. **Product Listing & Cards (`CatalogPage.jsx`, `HomePage.jsx`)**: Micro-animations on hover, crisp stock availability badges, quick-add variant selector, subtle image scale.
4. **Product Detail Page (`ProductDetailPage.jsx`)**: Responsive thumbnail gallery with prev/next buttons and counter pill, smooth tabbed compliance view (FSSAI, Agritech, Storage), sticky mobile purchase bar.
5. **Cart Drawer & Cart Page (`CartDrawer.jsx`, `CartPage.jsx`)**: Animated quantity controls, item removal slide transitions, subtotal summary card.
6. **Checkout & Auth Flow (`CheckoutPage.jsx`, `GoogleLoginButton.jsx`)**: Trust indicators, step progress bar, OTP timer, Razorpay CTA focus.
7. **Loading & Skeleton States (`PageSkeleton.jsx`)**: Premium shimmer skeletons matching actual card & page layouts.
8. **Empty & Error States**: Polished illustrations with actionable recovery buttons.
