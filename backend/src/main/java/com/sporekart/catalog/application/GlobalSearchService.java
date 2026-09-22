package com.sporekart.catalog.application;

import com.sporekart.catalog.api.dto.GlobalSearchResponse;
import com.sporekart.catalog.domain.Category;
import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.infrastructure.CategoryRepository;
import com.sporekart.catalog.infrastructure.ProductMediaRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.content.domain.BlogPost;
import com.sporekart.content.infrastructure.BlogPostRepository;
import com.sporekart.training.domain.Course;
import com.sporekart.training.infrastructure.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GlobalSearchService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final BlogPostRepository blogPostRepository;
    private final ProductMediaRepository productMediaRepository;

    @Transactional(readOnly = true)
    public GlobalSearchResponse search(String query) {
        if (query == null || query.trim().length() < 2) {
            return GlobalSearchResponse.builder()
                    .products(List.of())
                    .categories(List.of())
                    .training(List.of())
                    .blogs(List.of())
                    .build();
        }

        String q = query.trim();

        // 1. Products Search
        List<GlobalSearchResponse.SearchResultItem> products = productRepository
                .searchProducts(null, null, q, PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent()
                .stream()
                .map(this::mapProduct)
                .collect(Collectors.toList());

        // 2. Categories Search
        List<GlobalSearchResponse.SearchResultItem> categories = categoryRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(q, q)
                .stream()
                .filter(Category::isActive)
                .limit(5)
                .map(c -> GlobalSearchResponse.SearchResultItem.builder()
                        .id(c.getId() != null ? c.getId().toString() : null)
                        .title(c.getName())
                        .subtitle(c.getDescription())
                        .slug(c.getSlug())
                        .type("CATEGORY")
                        .url("/products/" + c.getSlug())
                        .imageUrl(c.getImageUrl())
                        .build())
                .collect(Collectors.toList());

        // 3. Training Courses Search
        List<GlobalSearchResponse.SearchResultItem> training = courseRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(q, q)
                .stream()
                .filter(Course::isActive)
                .limit(5)
                .map(c -> GlobalSearchResponse.SearchResultItem.builder()
                        .id(c.getId() != null ? c.getId().toString() : null)
                        .title(c.getTitle())
                        .subtitle(c.getDescription())
                        .slug(c.getSlug())
                        .type("TRAINING")
                        .url("/training/" + c.getSlug())
                        .priceInr(c.getFeeInr() != null ? c.getFeeInr().toString() : null)
                        .build())
                .collect(Collectors.toList());

        // 4. Blog Posts Search
        List<GlobalSearchResponse.SearchResultItem> blogs = blogPostRepository
                .findPublishedPosts(null, null, q, ZonedDateTime.now(), PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "publishedAt")))
                .getContent()
                .stream()
                .map(b -> GlobalSearchResponse.SearchResultItem.builder()
                        .id(b.getId() != null ? b.getId().toString() : null)
                        .title(b.getTitle())
                        .subtitle(b.getSummary())
                        .slug(b.getSlug())
                        .type("BLOG")
                        .url("/blog/" + b.getSlug())
                        .imageUrl(b.getFeaturedMediaUrl())
                        .build())
                .collect(Collectors.toList());

        return GlobalSearchResponse.builder()
                .products(products)
                .categories(categories)
                .training(training)
                .blogs(blogs)
                .build();
    }

    private GlobalSearchResponse.SearchResultItem mapProduct(Product p) {
        String img = null;
        var mediaList = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(p.getId());
        if (!mediaList.isEmpty()) {
            img = mediaList.get(0).getMediaUrl();
        }

        String priceStr = null;
        if (p.getVariants() != null && !p.getVariants().isEmpty()) {
            priceStr = p.getVariants().get(0).getPriceInr().toString();
        }

        return GlobalSearchResponse.SearchResultItem.builder()
                .id(p.getId() != null ? p.getId().toString() : null)
                .title(p.getTitle())
                .subtitle(p.getDescription())
                .slug(p.getSlug())
                .type("PRODUCT")
                .url("/product/" + p.getSlug())
                .imageUrl(img)
                .priceInr(priceStr)
                .build();
    }
}
