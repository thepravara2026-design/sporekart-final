# Sporekart Product Display & Information Model — Audit Baseline

**Date**: September 19, 2026  
**Module**: Catalog, Inventory, Media, Admin, Frontend Product Experience  
**Status**: Baseline Audit Completed  

---

## 1. Executive Summary

This document establishes the authoritative baseline for the existing Sporekart codebase prior to implementing the enhanced Product Display, Stock Availability Messaging, Product Information Model, and Multi-Image Product Gallery requirements.

---

## 2. Current Architecture & Domain Models

### A. Current Product Model (`com.sporekart.catalog.domain.Product`)
* **Table**: `products`
* **Fields**: `id` (UUID), `category` (ManyToOne -> Category), `title` (String), `slug` (String, UNIQUE), `description` (TEXT), `productType` (Enum: FRESH_MUSHROOM, DRY_MUSHROOM, SPAWN_SEED, GROWING_KIT), `status` (Enum: DRAFT, ACTIVE, ARCHIVED), `hsnCode` (String), `gstRatePercent` (BigDecimal), `metaTitle` (String), `metaDescription` (TEXT), `canonicalUrl` (String), `isActive` (boolean), `createdAt`, `updatedAt`.
* **Relationships**:
  * `variants`: List<ProductVariant> (OneToMany, orphanRemoval = true)
  * `media`: List<ProductMedia> (OneToMany, orphanRemoval = true)
  * `offers`: List<ProductOffer> (OneToMany, orphanRemoval = true)

### B. Current ProductVariant Model (`com.sporekart.catalog.domain.ProductVariant`)
* **Table**: `product_variants`
* **Fields**: `id` (UUID), `product` (ManyToOne -> Product), `variantName` (String), `sku` (String, UNIQUE), `priceInr` (BigDecimal), `compareAtPriceInr` (BigDecimal), `stockQuantity` (int), `isActive` (boolean), `createdAt`.
* **Note**: `stockQuantity` is currently stored directly on the variant AND synced with `inventory_records`.

### C. Current Inventory Model (`com.sporekart.catalog.domain.InventoryRecord`)
* **Table**: `inventory_records`
* **Fields**: `id` (UUID), `variantId` (UUID, UNIQUE), `availableQuantity` (int), `reservedQuantity` (int), `soldQuantity` (int), `version` (BIGINT).
* **Audit Table**: `inventory_audit_events` tracking adjustments, reservations, releases, and sales.

### D. Current Media Model (`com.sporekart.catalog.domain.ProductMedia` & `com.sporekart.media.domain.MediaAsset`)
* **Tables**:
  * `product_media`: `id`, `product_id`, `variant_id`, `media_url`, `media_type` (IMAGE, VIDEO), `is_primary`, `display_order`, `created_at`.
  * `media_assets`: `id`, `storage_provider` (SUPABASE), `bucket`, `storage_key`, `original_filename`, `mime_type`, `size_bytes`, `width`, `height`, `checksum`, `media_type`, `status`, `alt_text`, `is_public`, `is_deleted`.
  * `media_product_links`: `id`, `media_id`, `product_id`, `variant_id`, `is_primary`, `display_order`, `created_at`.

---

## 3. Current API Contracts

### A. Public Product API (`GET /api/v1/catalog/products/{slug}`)
* **Current Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "title": "Button Mushroom 200g",
      "slug": "button-mushroom-200g",
      "description": "...",
      "productType": "FRESH_MUSHROOM",
      "status": "ACTIVE",
      "categoryName": "Fresh Mushrooms",
      "categorySlug": "fresh-mushrooms",
      "hsnCode": "07095900",
      "gstRatePercent": 5.00,
      "variants": [
        {
          "id": "uuid",
          "variantName": "200g Pack",
          "sku": "SKU-BM-200G",
          "priceInr": 80.00,
          "compareAtPriceInr": 100.00,
          "calculatedFinalPriceInr": 84.00,
          "calculatedGstAmountInr": 4.00,
          "stockQuantity": 17,
          "isActive": true
        }
      ],
      "media": [...],
      "imageUrls": ["https://..."]
    }
  }
  ```
* **Security & Privacy Issue**: `stockQuantity` (e.g. `17`) is directly exposed to public buyers in `VariantDto`.

### B. Admin Product API (`POST /api/v1/admin/catalog/products`, `POST /admin/catalog/products/{id}/variants`)
* Accepts basic title, slug, type, description, HSN code, GST rate, meta info.
* Lacks structured consumer compliance, origin, storage, shelf life, or agricultural fields.

---

## 4. Current Frontend & UI Implementation

* **Product Detail Page (`frontend/src/pages/ProductDetailPage.jsx`)**:
  * Displays single large primary image with horizontal scrollable thumbnails if multiple URLs exist.
  * Stock Badge currently renders: `In Stock (17 available)` or `Out of Stock`.
  * Hardcoded technical specifications section (hardcoded HSN, GST, 30 days refrigerated shelf life).
  * Hardcoded FAQ array.
* **Admin Dashboard (`frontend/src/pages/AdminDashboardPage.jsx`)**:
  * Product creation form contains only title, slug, type, description.
  * No tabs/accordion organization for structured compliance, storage, agri metadata, or image gallery management.

---

## 5. Existing Migrations & Schema State

Flyway migrations V1 through V15 are present:
* `V1__init_schema.sql` (core tables: products, product_variants, product_images)
* `V3__create_catalog_enhancements.sql` (products status, HSN/GST, SEO, product_media, product_offers)
* `V4__create_media_management_tables.sql` (media_assets, media_product_links)
* `V5__create_inventory_tables.sql` (inventory_records, inventory_audit_events)
* `V15__create_analytics_events_tables.sql` (latest)

**Next Migration Version**: `V16__create_product_information_and_gallery_enhancements.sql`

---

## 6. Existing Test Suite

* **Backend Unit & Integration Tests**:
  * `com.sporekart.catalog.CatalogModuleTest`
  * `com.sporekart.catalog.InventoryConcurrencyTest`
  * `com.sporekart.ArchitectureTest`
  * `com.sporekart.SporekartIntegrationTest`
* **Frontend E2E Tests (Playwright)**:
  * `frontend/e2e/01_guest_browsing.spec.js`
  * `frontend/e2e/02_product_details.spec.js`
  * `frontend/e2e/10_admin_product_creation.spec.js`
  * `frontend/e2e/13_seo_automated_testing.spec.js`

---

## 7. Target Impact & Backward Compatibility Analysis

| Component | Files To Modify / Create | Risk / Backwards Compatibility Mitigation |
| :--- | :--- | :--- |
| **Database** | `V16__create_product_information_and_gallery_enhancements.sql` | Use nullable columns or 1:1 table `product_information` with foreign key; safe fallback for existing products. |
| **Domain** | `Product.java`, `ProductInformation.java` (NEW), `StockAvailability.java` (NEW), `ProductMediaRole.java` (NEW) | Keep existing fields; wrap stock calculation cleanly in domain value object. |
| **DTOs** | `CatalogDtos.java` | Add `AvailabilityDto` to `VariantDto` & remove `stockQuantity` from public `VariantDto`. Create `AdminVariantDto` for admin API. |
| **Services** | `CatalogApplicationService.java`, `AdminCatalogService.java`, `InventoryService.java` | Ensure `validateAndGetVariant` still checks exact internal stock without exposing quantity in public endpoints. |
| **API Controllers** | `CatalogController.java`, `AdminCatalogController.java` | Separate public DTO mapping from admin DTO mapping. |
| **Frontend UI** | `ProductDetailPage.jsx`, `AdminDashboardPage.jsx`, `MediaImage.jsx` | Add structured information sections, multi-image gallery with carousel, and tabbed admin form. Safe default rendering when optional info is absent. |
| **Tests** | `CatalogModuleTest.java`, `02_product_details.spec.js`, `10_admin_product_creation.spec.js` | Update assertions to check stock availability labels instead of raw quantities. Add stable `data-testid` selectors. |
