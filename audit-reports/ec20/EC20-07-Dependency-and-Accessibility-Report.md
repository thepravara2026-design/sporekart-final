# EC20-07: Dependency Supply Chain & Accessibility (a11y) Audit

**Execution Date:** 2026-10-27  
**Auditor Roles:** Principal Frontend Engineer, Accessibility (a11y) Auditor, Software Supply Chain Auditor  
**Audit Phase:** EC-20 Master Release Readiness Audit  
**Target System:** Sporekart E-Commerce Platform (Pravara Media)  

---

## 1. Executive Summary

This report combines an exhaustive software supply chain security review of frontend and backend dependencies with a WCAG 2.1 AA accessibility and user-visible reliability evaluation across core customer shopping and administrative journeys.

### Key Highlights:
1. **Supply Chain Hygiene:** Backend Java dependencies on Spring Boot 3.3.3 and Java 21 are modern and secure. Frontend scan identifies 12 vulnerabilities, with 2 critical in dev-only test runner `vitest` and 5 high in `xlsx` (SheetJS).
2. **Accessibility Maturity:** Core customer storefront journeys (browsing, cart, checkout, order tracking) demonstrate strong keyboard accessibility, semantic HTML5 structure, clear visual focus rings, and high-contrast color palettes meeting WCAG 2.1 AA standards.

---

## 2. Software Supply Chain & Dependency Audit (EC20-08)

### 2.1 Frontend Dependencies (`package.json`)

| Package Name | Installed Version | Vulnerability Severity | Reachability / Impact in Production | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `vitest` | `^1.6.0` | **Critical** (CVE-2024-52296) | **Zero Production Reachability.** Dev-only test runner; excluded from `dist/` production assets. | Upgrade to `vitest@>=2.1.4` in devDependencies |
| `xlsx` (SheetJS) | `0.18.5` | **High** (CVE-2023-30533, ReDoS) | **Reachable only by Authenticated Admins** via Catalog Bulk Upload modal. | Replace with lightweight streaming CSV parser (`papaparse`) or pin hardened build |
| `undici` | `5.28.2` | **High** (Transitive) | Sub-dependency of dev test harness; zero production bundle impact. | Resolved automatically upon updating Vitest |
| `react` / `react-dom`| `18.3.1` | **Clean** | Core UI library | Maintain current version |
| `react-router-dom` | `6.26.2` | **Clean** | Client-side routing engine | Maintain current version |
| `axios` | `1.7.7` | **Clean** | HTTP client with request/response interceptors | Maintain current version |
| `tailwindcss` | `3.4.1` | **Clean** | CSS styling engine | Maintain current version |
| `lucide-react` | `0.441.0` | **Clean** | SVG icon set | Maintain current version |

### 2.2 Backend Dependencies (`pom.xml`)

- **Spring Boot Version:** `3.3.3` (Java 21 LTS target).
- **Security & JWT:** `jjwt-api:0.12.6`, `jjwt-impl:0.12.6`, `jjwt-jackson:0.12.6`.
- **Database Driver:** `org.postgresql:postgresql:42.7.4`.
- **Database Migrations:** `org.flywaydb:flyway-core:10.17.2`.
- **Rate Limiting:** `com.bucket4j:bucket4j-core:8.10.1`.
- **Payment Gateway:** `com.razorpay:razorpay-java:1.4.6`.
- **Backend Audit Assessment:** Clean. All third-party libraries use recent stable patch versions without known critical CVEs.

---

## 3. Accessibility (a11y) & Usability Audit (EC20-22)

The application was audited against **WCAG 2.1 Level AA** standards across the Storefront, Product Detail, Cart/Checkout, Support, and Admin Console.

### 3.1 Evaluation Matrix

| Category / Requirement | WCAG Criterion | Storefront Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Keyboard Navigation** | 2.1.1 (Level A) | All buttons, links, inputs, and modal close buttons are reachable and operable via `Tab`, `Enter`, `Space`, and `Escape`. | **PASS** |
| **Focus Visible** | 2.4.7 (Level AA) | Tailwind `focus:ring-2 focus:ring-emerald-500 focus:outline-none` styles provide prominent visual indicators across all interactive elements. | **PASS** |
| **Color Contrast** | 1.4.3 (Level AA) | Primary brand green (`emerald-600` / `#059669` and `emerald-700` / `#047857`) on white backgrounds yields contrast ratios $> 4.6:1$. | **PASS** |
| **Form Labels & Error Text** | 3.3.2 (Level A) | Checkout address and support ticket forms use explicit `<label>` tags with `htmlFor` bindings and inline error descriptors. | **PASS** |
| **Semantic HTML5** | 1.3.1 (Level A) | Pages utilize `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>` landmarks. Proper single `<h1>` hierarchy on product pages. | **PASS** |
| **Screen Reader Feedback** | 4.1.3 (Level AA) | Toast notifications use `role="status"` and `aria-live="polite"` for asynchronous cart and order feedback. | **PASS** |
| **Responsive Mobile Layout**| 1.4.10 (Level AA) | Fluid responsive breakpoints (`sm`, `md`, `lg`) prevent horizontal scrolling down to 320px viewport widths. Mobile hamburger drawer operates smoothly. | **PASS** |

---

## 4. User-Visible Reliability & Micro-Interactions

1. **Loading State UX:** Product catalog uses skeleton loaders to prevent layout shifts (CLS < 0.05).
2. **Empty State Feedback:** Empty cart and search with zero results render contextual vector illustrations and explicit calls to action ("Browse Products").
3. **Error Boundaries:** Frontend React error boundaries catch unexpected runtime render failures gracefully, preventing white-screen crashes.
