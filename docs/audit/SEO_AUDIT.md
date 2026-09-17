# Sporekart Technical SEO, AEO & GEO Audit

## Executive Summary
Sporekart is an India-first e-commerce and cultivation training platform. Search engine visibility (Technical SEO), Answer Engine Optimization (AEO for Perplexity, ChatGPT, Gemini), and Generative Engine Optimization (GEO for Google SGE) are vital business requirements. This audit evaluates current SEO infrastructure and highlights areas for enhancement.

---

## 1. Technical SEO Audit

### Strengths:
1. **Semantic HTML5 Layout**:
   - `index.html` and component hierarchy utilize proper HTML5 elements (`<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<h1>`).
2. **Meta Description & Title Tags**:
   - Primary `index.html` includes meta title ("Sporekart — India's Premier Mushroom E-Commerce & Cultivation Training Platform"), description, keywords, and author tags.
3. **OpenGraph & Twitter Card Metadata**:
   - `og:title`, `og:description`, `og:image`, `og:url`, and `twitter:card` tags pre-configured in `index.html` for rich social preview rendering across WhatsApp, Twitter, and LinkedIn.

### Missing & Recommended Technical SEO Enhancements:
1. **Dynamic Dynamic Page Head Management**:
   - Currently, navigating from `/` to `/catalog` or `/catalog/organic-fresh-button-mushrooms` does not dynamically update document `<title>` or meta tags on the client side.
   - *Fix Needed*: Integrate `react-helmet-async` to dynamically push product-specific titles (e.g., "Buy Organic Fresh Button Mushrooms 200g in India | Sporekart") and meta descriptions.
2. **Server-Side Rendering (SSR) / Pre-rendering for Public Pages**:
   - Single Page App (SPA) relies on client-side JS rendering.
   - *Fix Needed*: Add Vite pre-rendering or static HTML generation (`vite-plugin-prerender` / SSG) for public routes (`/`, `/catalog`, `/training`) to ensure zero-JS search crawlers index full content instantly.
3. **Sitemap.xml & Robots.txt**:
   - `/public/sitemap.xml` and `/public/robots.txt` are currently missing from the frontend static build folder.

---

## 2. AEO (Answer Engine Optimization) & GEO (Generative Engine Optimization) Audit

### Implemented JSON-LD Schemas:
The baseline `index.html` includes a structured JSON-LD `Store` schema detailing company contact info, address in Pune, price ranges in INR, and core catalog offerings:
```json
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Sporekart",
  "url": "https://sporekart.in",
  "telephone": "+91-9876543210",
  "priceRange": "₹75 - ₹4999"
}
```

### Required JSON-LD Extensions for AI Search Engines:
1. **`Product` Schema per Product Page**:
   - Each product detail view must output schema with `name`, `image`, `description`, `sku`, `offers` (`price`, `priceCurrency: INR`, `availability`).
2. **`Course` Schema for Training Workshops**:
   - Each workshop must output `Course` schema with `provider`, `hasCourseInstance`, `courseMode` (`Online` / `Offline`), and `offers`.
3. **`FAQPage` Schema for India Agritech Search Intent**:
   - Add structured FAQ schema answering common queries ("How long does oyster mushroom spawn take to yield?", "What humidity level is needed for button mushrooms in India?").

---

## 3. Core Web Vitals & Performance Audit
- **Typography**: Google Fonts loaded via preconnected CDN links with `font-display: swap`.
- **CSS Overhead**: TailwindCSS 3 compiled via PostCSS; bundle size is minimal (~28 KB compiled CSS).
- **Image Optimization**: WebP image formatting and `loading="lazy"` attribute needed on product grids to ensure low LCP (Largest Contentful Paint) scores.
