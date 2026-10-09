package com.sporekart.catalog.api;

import com.sporekart.catalog.application.AdminCatalogService;
import com.sporekart.catalog.application.CatalogApplicationService;
import com.sporekart.catalog.domain.*;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/catalog")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final AdminCatalogService adminCatalogService;
    private final CatalogApplicationService catalogApplicationService;
    private final com.sporekart.catalog.application.InventoryService inventoryService;
    private final com.sporekart.admin.application.AdminApplicationService adminService;

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Category>> createCategory(
            @Valid @RequestBody CatalogDtos.CreateCategoryRequest request,
            org.springframework.security.core.Authentication authentication) {
        Category category = adminCatalogService.createCategory(request);
        adminService.logAction(getAdminUserId(authentication), "CREATE_CATEGORY", "Category", category.getId().toString(), null, category.getName(), "Created category: " + category.getName(), null);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @PathVariable("id") UUID categoryId,
            @RequestBody CatalogDtos.UpdateCategoryRequest request,
            org.springframework.security.core.Authentication authentication) {
        Category category = adminCatalogService.updateCategory(categoryId, request);
        adminService.logAction(getAdminUserId(authentication), "UPDATE_CATEGORY", "Category", category.getId().toString(), null, category.getName(), "Updated category: " + category.getName(), null);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<CatalogDtos.AdminProductDto>> createProduct(
            @Valid @RequestBody CatalogDtos.CreateProductRequest request,
            org.springframework.security.core.Authentication authentication) {
        Product product = adminCatalogService.createProduct(request);
        adminService.logAction(getAdminUserId(authentication), "CREATE_PRODUCT", "Product", product.getId().toString(), null, product.getStatus().name(), "Created product: " + product.getTitle(), null);
        return ResponseEntity.ok(ApiResponse.success(catalogApplicationService.mapToAdminProductDto(product)));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<CatalogDtos.AdminProductDto>> updateProduct(
            @PathVariable("id") UUID productId,
            @RequestBody CatalogDtos.UpdateProductRequest request,
            org.springframework.security.core.Authentication authentication) {
        Product product = adminCatalogService.updateProduct(productId, request);
        adminService.logAction(getAdminUserId(authentication), "UPDATE_PRODUCT", "Product", product.getId().toString(), null, product.getStatus().name(), "Updated product: " + product.getTitle(), null);
        return ResponseEntity.ok(ApiResponse.success(catalogApplicationService.mapToAdminProductDto(product)));
    }

    @PatchMapping("/products/{id}/status")
    public ResponseEntity<ApiResponse<CatalogDtos.AdminProductDto>> updateProductStatus(
            @PathVariable("id") UUID productId,
            @RequestBody CatalogDtos.UpdateProductStatusRequest request,
            org.springframework.security.core.Authentication authentication) {
        Product product = adminCatalogService.updateProductStatus(productId, request.getStatus(), request.getIsActive());
        adminService.logAction(getAdminUserId(authentication), "UPDATE_PRODUCT_STATUS", "Product", product.getId().toString(), null, product.getStatus().name(), "Updated product status: " + product.getTitle(), null);
        return ResponseEntity.ok(ApiResponse.success(catalogApplicationService.mapToAdminProductDto(product)));
    }

    @PostMapping("/products/{id}/information")
    public ResponseEntity<ApiResponse<ProductInformation>> updateProductInformation(
            @PathVariable("id") UUID productId,
            @RequestBody CatalogDtos.CreateProductInformationRequest request,
            org.springframework.security.core.Authentication authentication) {
        Product product = adminCatalogService.publishProduct(productId);
        ProductInformation info = adminCatalogService.saveOrUpdateProductInformation(product, request);
        adminService.logAction(getAdminUserId(authentication), "UPDATE_PRODUCT_INFO", "Product", productId.toString(), null, product.getTitle(), "Updated technical specifications for: " + product.getTitle(), null);
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    @PostMapping("/products/{id}/publish")
    public ResponseEntity<ApiResponse<CatalogDtos.AdminProductDto>> publishProduct(
            @PathVariable("id") UUID productId,
            org.springframework.security.core.Authentication authentication) {
        Product product = adminCatalogService.publishProduct(productId);
        adminService.logAction(getAdminUserId(authentication), "PUBLISH_PRODUCT", "Product", productId.toString(), "DRAFT", "ACTIVE", "Published product to active catalog: " + product.getTitle(), null);
        return ResponseEntity.ok(ApiResponse.success(catalogApplicationService.mapToAdminProductDto(product)));
    }

    @PostMapping("/products/{id}/variants")
    public ResponseEntity<ApiResponse<ProductVariant>> addVariant(
            @PathVariable("id") UUID productId,
            @Valid @RequestBody CatalogDtos.CreateVariantRequest request,
            org.springframework.security.core.Authentication authentication) {
        ProductVariant variant = adminCatalogService.addVariant(productId, request);
        adminService.logAction(getAdminUserId(authentication), "ADD_VARIANT", "ProductVariant", variant.getId().toString(), null, variant.getSku(), "Added variant '" + variant.getVariantName() + "' to product ID " + productId, null);
        return ResponseEntity.ok(ApiResponse.success(variant));
    }

    @PostMapping("/offers")
    public ResponseEntity<ApiResponse<ProductOffer>> createOffer(
            @Valid @RequestBody CatalogDtos.CreateOfferRequest request,
            org.springframework.security.core.Authentication authentication) {
        ProductOffer offer = adminCatalogService.createOffer(request);
        adminService.logAction(getAdminUserId(authentication), "CREATE_OFFER", "ProductOffer", offer.getId().toString(), null, offer.getOfferName(), "Created promotional offer: " + offer.getOfferName(), null);
        return ResponseEntity.ok(ApiResponse.success(offer));
    }

    private UUID getAdminUserId(org.springframework.security.core.Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        try {
            return UUID.fromString(auth.getName());
        } catch (Exception e) {
            return UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
    }

    @PostMapping("/media")
    public ResponseEntity<ApiResponse<ProductMedia>> addMedia(@Valid @RequestBody CatalogDtos.CreateMediaRequest request) {
        ProductMedia media = adminCatalogService.addMedia(request);
        return ResponseEntity.ok(ApiResponse.success(media));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<CatalogDtos.AdminProductDto>>> getAdminProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt_desc") String sortBy) {
        org.springframework.data.domain.Page<Product> productPage = adminCatalogService.getAdminProductsPaginated(category, status, search, page, size, sortBy);
        org.springframework.data.domain.Page<CatalogDtos.AdminProductDto> dtoPage = productPage.map(catalogApplicationService::mapToAdminProductDto);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    @PutMapping("/products/{id}/media/reorder")
    public ResponseEntity<ApiResponse<List<ProductMedia>>> reorderMedia(
            @PathVariable("id") UUID productId,
            @RequestBody CatalogDtos.UpdateMediaOrderRequest request) {
        List<ProductMedia> mediaList = adminCatalogService.updateMediaOrder(productId, request);
        return ResponseEntity.ok(ApiResponse.success(mediaList));
    }

    @PutMapping("/products/{id}/media")
    public ResponseEntity<ApiResponse<List<ProductMedia>>> syncProductMedia(
            @PathVariable("id") UUID productId,
            @RequestBody CatalogDtos.SyncMediaRequest request) {
        List<CatalogDtos.CreateMediaRequest> items = request != null && request.getItems() != null ? request.getItems() : java.util.Collections.emptyList();
        List<ProductMedia> mediaList = adminCatalogService.syncProductMedia(productId, items);
        return ResponseEntity.ok(ApiResponse.success(mediaList));
    }

    @PostMapping("/inventory/{variantId}/replenish")
    public ResponseEntity<ApiResponse<InventoryRecord>> replenishStock(
            @PathVariable("variantId") UUID variantId,
            @Valid @RequestBody CatalogDtos.ReplenishStockRequest request,
            org.springframework.security.core.Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        InventoryRecord record = inventoryService.replenishInventory(
                variantId,
                request.getQuantity(),
                request.getReason(),
                adminUser
        );
        adminService.logAction(null, "REPLENISH_STOCK", "ProductVariant", variantId.toString(), null, String.valueOf(request.getQuantity()), "Replenished inventory stock by +" + request.getQuantity() + " units", null);
        return ResponseEntity.ok(ApiResponse.success(record));
    }
}

