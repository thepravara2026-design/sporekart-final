# Product Display & Detail Experience Enhancement - Technical Documentation

## Executive Summary
This document records the end-to-end implementation details for enhancing Sporekart's Product Display and Product Detail experience across database schema, Spring Boot domain logic, REST API contracts, Admin UI, Public Consumer UI, and end-to-end testing capabilities.

---

## Key Feature Architecture

### 1. Buyer Stock Privacy & Availability Messaging
- **Motivation**: Prevent competitors or public visitors from scraping raw inventory counts while providing clear urgency signals for purchasing decisions.
- **Rules Engine**: `com.sporekart.catalog.domain.StockAvailability`
  - `OUT_OF_STOCK`: $0$ units
  - `LOW_STOCK`: $1 - 5$ units
  - `LIMITED_STOCK`: $6 - 20$ units
  - `AVAILABLE`: $> 20$ units
- **Public API Privacy**: `VariantDto` exposes only `AvailabilityDto` (`state`, `badgeText`, `badgeColor`, `isPurchaseable`, `scarcityMessage`), stripping raw `stockQuantity`.
- **Admin API**: `AdminVariantDto` retains `stockQuantity` for operational management.
- **Backend Authority**: `CartService` and `OrderService` enforce authoritative integer stock validation during cart additions and checkout.

---

## 2. Product Compliance & Information Model
- **Database Table**: `product_information` (Linked 1-to-1 with `products`)
- **Fields & Classifications**:
  - **FSSAI / Food Safety**: `fssaiLicenseNumber`, `isVeg`, `nutritionalInfoJson`, `ingredientsList`
  - **Agri / Cultivation**: `mushroomType`, `substrateType`, `yieldExpectation`, `cultivationDifficulty`, `flushNumber`
  - **Storage & Care**: `shelfLifeDays`, `storageTemperature`, `humidityRequirement`
  - **Trade & Logistics**: `countryOfOrigin`, `hsnCode`, `netQuantityGrams`
- **Validation**:
  - Optional during `DRAFT` state save.
  - Strict publication validation (`AdminCatalogService.validateProductForPublication`) enforced before transitioning to `ACTIVE`.

---

## 3. Multi-Image Product Gallery
- **Database Schema**: Updated `product_media` and `media_product_links` with `role` column (`PRIMARY`, `GALLERY`, `PACKAGING`, `LIFESTYLE`, `INSTRUCTION`).
- **Consumer UI**:
  - Multi-thumbnail selector bar with `aria-label="View product image N"`.
  - Next (`gallery-next`) and Previous (`gallery-previous`) controls.
  - Image counter pill (`gallery-counter`, e.g., `Image 1 of 4`).
- **Admin UI**:
  - Multi-image selection & upload.
  - Drag/order adjustment buttons (`Shift Left`, `Shift Right`).
  - Primary image tag setting.

---

## Test Verification Matrix
1. **Stock Availability Unit Tests**: `StockAvailabilityTest.java` (8 test cases covering boundaries 0, 1, 5, 6, 20, 21).
2. **Catalog Domain & Validation Tests**: `CatalogModuleTest.java` (Stock privacy, admin stock access, publication validation).
3. **Playwright E2E Spec**: `frontend/e2e/02_product_details.spec.js` (Automated UI coverage for gallery navigation, stock badges, and compliance tabs).
