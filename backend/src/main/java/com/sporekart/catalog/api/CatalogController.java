package com.sporekart.catalog.api;

import com.sporekart.catalog.application.CatalogApplicationService;
import com.sporekart.catalog.domain.ProductType;
import com.sporekart.shared.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogApplicationService catalogService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @GetMapping({"/products", "/catalog/products"})
    public ResponseEntity<ApiResponse<List<CatalogDtos.ProductDto>>> getProducts(
            @RequestParam(required = false) ProductType type,
            @RequestParam(required = false) String category) {
        List<CatalogDtos.ProductDto> products = catalogService.getAllActiveProducts(type, category);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping({"/products/search", "/catalog/products/search"})
    public ResponseEntity<ApiResponse<Page<CatalogDtos.ProductDto>>> searchProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) ProductType type,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sortBy) {
        Page<CatalogDtos.ProductDto> pageResult = catalogService.searchProducts(category, type, q, page, size, sortBy);
        return ResponseEntity.ok(ApiResponse.success(pageResult));
    }

    @GetMapping({"/products/{slug}", "/catalog/products/{slug}"})
    public ResponseEntity<ApiResponse<CatalogDtos.ProductDto>> getProductBySlug(@PathVariable String slug) {
        CatalogDtos.ProductDto product = catalogService.getProductBySlug(slug);
        if (product != null) {
            eventPublisher.publishEvent(com.sporekart.analytics.domain.events.ProductViewedEvent.builder()
                    .productId(product.getId())
                    .productSlug(product.getSlug())
                    .productTitle(product.getTitle())
                    .build());
        }
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping({"/categories", "/catalog/categories"})
    public ResponseEntity<ApiResponse<List<CatalogDtos.CategoryDto>>> getCategories() {
        List<CatalogDtos.CategoryDto> categories = catalogService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }
}
