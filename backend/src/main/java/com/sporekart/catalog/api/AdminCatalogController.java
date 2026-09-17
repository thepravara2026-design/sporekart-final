package com.sporekart.catalog.api;

import com.sporekart.catalog.application.AdminCatalogService;
import com.sporekart.catalog.domain.*;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/catalog")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final AdminCatalogService adminCatalogService;

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Category>> createCategory(@Valid @RequestBody CatalogDtos.CreateCategoryRequest request) {
        Category category = adminCatalogService.createCategory(request);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<Product>> createProduct(@Valid @RequestBody CatalogDtos.CreateProductRequest request) {
        Product product = adminCatalogService.createProduct(request);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping("/products/{id}/variants")
    public ResponseEntity<ApiResponse<ProductVariant>> addVariant(
            @PathVariable("id") UUID productId,
            @Valid @RequestBody CatalogDtos.CreateVariantRequest request) {
        ProductVariant variant = adminCatalogService.addVariant(productId, request);
        return ResponseEntity.ok(ApiResponse.success(variant));
    }

    @PostMapping("/offers")
    public ResponseEntity<ApiResponse<ProductOffer>> createOffer(@Valid @RequestBody CatalogDtos.CreateOfferRequest request) {
        ProductOffer offer = adminCatalogService.createOffer(request);
        return ResponseEntity.ok(ApiResponse.success(offer));
    }

    @PostMapping("/media")
    public ResponseEntity<ApiResponse<ProductMedia>> addMedia(@Valid @RequestBody CatalogDtos.CreateMediaRequest request) {
        ProductMedia media = adminCatalogService.addMedia(request);
        return ResponseEntity.ok(ApiResponse.success(media));
    }
}
