package com.sporekart.shared.infrastructure;

import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.*;
import com.sporekart.content.application.BlogContentService;
import com.sporekart.content.domain.*;
import com.sporekart.content.infrastructure.BlogPostRepository;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import com.sporekart.training.infrastructure.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CourseRepository courseRepository;
    private final TrainingService trainingService;
    private final BlogContentService blogContentService;
    private final BlogPostRepository blogPostRepository;

    @Override
    public void run(String... args) throws Exception {
        if (categoryRepository.count() == 0) {
            initCatalogData();
        }
        if (courseRepository.count() == 0) {
            initTrainingData();
        }
        if (blogPostRepository.count() == 0) {
            initBlogContentData();
        }
    }

    private void initCatalogData() {
        Category freshCategory = categoryRepository.save(Category.builder()
                .name("Fresh Mushrooms")
                .slug("fresh-mushrooms")
                .description("Farm-fresh, organically grown premium mushrooms harvested daily.")
                .imageUrl("https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80")
                .build());

        Category dryCategory = categoryRepository.save(Category.builder()
                .name("Dry Mushrooms")
                .slug("dry-mushrooms")
                .description("Dehydrated gourmet mushrooms rich in natural umami & long shelf-life.")
                .imageUrl("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80")
                .build());

        Category spawnCategory = categoryRepository.save(Category.builder()
                .name("Mushroom Spawn Seeds")
                .slug("spawn-seeds")
                .description("High-yield, lab-certified pure grain spawn seeds for commercial growers.")
                .imageUrl("https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80")
                .build());

        Category kitCategory = categoryRepository.save(Category.builder()
                .name("Mushroom Growing Kits")
                .slug("growing-kits")
                .description("Ready-to-grow indoor mushroom cultivation kits for homes & classrooms.")
                .imageUrl("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80")
                .build());

        // Product 1: Fresh Button Mushrooms
        Product p1 = Product.builder()
                .category(freshCategory)
                .title("Organic Fresh Button Mushrooms")
                .slug("organic-fresh-button-mushrooms")
                .description("Handpicked daily from our climate-controlled indoor farm. High in protein & Vitamin D.")
                .productType(ProductType.FRESH_MUSHROOM)
                .status(ProductStatus.ACTIVE)
                .hsnCode("07095900")
                .gstRatePercent(new BigDecimal("5.00"))
                .metaTitle("Buy Organic Fresh Button Mushrooms Online | Sporekart")
                .metaDescription("Order farm fresh organic button mushrooms online across India with temperature controlled delivery.")
                .canonicalUrl("https://sporekart.in/product/organic-fresh-button-mushrooms")
                .isActive(true)
                .build();

        ProductVariant v1_1 = ProductVariant.builder()
                .product(p1)
                .variantName("200g Pack")
                .sku("FBM-200G")
                .priceInr(new BigDecimal("75.00"))
                .compareAtPriceInr(new BigDecimal("90.00"))
                .stockQuantity(150)
                .build();

        ProductVariant v1_2 = ProductVariant.builder()
                .product(p1)
                .variantName("500g Pack")
                .sku("FBM-500G")
                .priceInr(new BigDecimal("160.00"))
                .compareAtPriceInr(new BigDecimal("190.00"))
                .stockQuantity(80)
                .build();

        ProductMedia m1 = ProductMedia.builder()
                .product(p1)
                .mediaUrl("https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE)
                .isPrimary(true)
                .displayOrder(1)
                .build();

        p1.setVariants(List.of(v1_1, v1_2));
        p1.setMedia(List.of(m1));
        productRepository.save(p1);

        // Product 2: Milky Mushroom Spawn Seeds
        Product p2 = Product.builder()
                .category(spawnCategory)
                .title("Premium Milky Mushroom Grain Spawn")
                .slug("milky-mushroom-grain-spawn")
                .description("Lab-cultured first-generation wheat grain spawn for tropical heat-tolerant cultivation.")
                .productType(ProductType.SPAWN_SEED)
                .status(ProductStatus.ACTIVE)
                .hsnCode("07095900")
                .gstRatePercent(BigDecimal.ZERO)
                .metaTitle("Buy Pure Milky Mushroom Grain Spawn Seeds | Sporekart")
                .metaDescription("Order high yield lab mother grain spawn seeds for Calocybe indica cultivation.")
                .canonicalUrl("https://sporekart.in/product/milky-mushroom-grain-spawn")
                .isActive(true)
                .build();

        ProductVariant v2_1 = ProductVariant.builder()
                .product(p2)
                .variantName("1 kg Master Bag")
                .sku("MMS-1KG")
                .priceInr(new BigDecimal("120.00"))
                .compareAtPriceInr(new BigDecimal("150.00"))
                .stockQuantity(300)
                .build();

        ProductVariant v2_2 = ProductVariant.builder()
                .product(p2)
                .variantName("5 kg Pack")
                .sku("MMS-5KG")
                .priceInr(new BigDecimal("550.00"))
                .compareAtPriceInr(new BigDecimal("650.00"))
                .stockQuantity(100)
                .build();

        ProductMedia m2 = ProductMedia.builder()
                .product(p2)
                .mediaUrl("https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE)
                .isPrimary(true)
                .displayOrder(1)
                .build();

        p2.setVariants(List.of(v2_1, v2_2));
        p2.setMedia(List.of(m2));
        productRepository.save(p2);

        // Product 3: Oyster Mushroom DIY Growing Kit
        Product p3 = Product.builder()
                .category(kitCategory)
                .title("Oyster Mushroom All-In-One Growing Kit")
                .slug("oyster-mushroom-growing-kit")
                .description("Harvest your first batch of delicious Pink & Pearl Oyster mushrooms in just 10 days! Spray bottle included.")
                .productType(ProductType.GROWING_KIT)
                .status(ProductStatus.ACTIVE)
                .hsnCode("07095900")
                .gstRatePercent(new BigDecimal("12.00"))
                .metaTitle("DIY Oyster Mushroom Growing Kit | Sporekart")
                .metaDescription("Indoor ready-to-grow mushroom farm kit for home & school projects.")
                .canonicalUrl("https://sporekart.in/product/oyster-mushroom-growing-kit")
                .isActive(true)
                .build();

        ProductVariant v3_1 = ProductVariant.builder()
                .product(p3)
                .variantName("Standard Kit (1.5 kg Block)")
                .sku("OMG-KIT-STD")
                .priceInr(new BigDecimal("499.00"))
                .compareAtPriceInr(new BigDecimal("699.00"))
                .stockQuantity(200)
                .build();

        ProductMedia m3 = ProductMedia.builder()
                .product(p3)
                .mediaUrl("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE)
                .isPrimary(true)
                .displayOrder(1)
                .build();

        p3.setVariants(List.of(v3_1));
        p3.setMedia(List.of(m3));
        productRepository.save(p3);
    }

    private void initTrainingData() {
        CourseCategory category = trainingService.createCategory("Cultivation", "cultivation", "Mushroom Cultivation Courses");
        Course c1 = trainingService.createCourse(
                category.getId(),
                "Commercial Oyster & Milky Mushroom Cultivation Masterclass",
                "commercial-mushroom-cultivation-masterclass",
                "Comprehensive hands-on training covering substrate preparation, sterilization, incubation, harvesting, and market linkage.",
                7,
                new BigDecimal("1499.00")
        );

        Batch b1 = trainingService.createBatch(
                c1.getId(),
                "BATCH-COMM-2026-01",
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(12),
                50
        );

        trainingService.addBatchSchedule(
                b1.getId(),
                "Substrate Chemistry & Climate Control",
                ZonedDateTime.now().plusDays(5),
                120,
                "https://zoom.us/j/sporekart-training-batch1"
        );
    }

    private void initBlogContentData() {
        BlogAuthor author = blogContentService.createAuthor(
                "Dr. Ramesh Prajapati",
                "dr-ramesh-prajapati",
                "Senior Mycologist & Agronomist specializing in tropical mushroom cultivation techniques.",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                "ramesh@sporekart.in"
        );

        BlogCategory category = blogContentService.createCategory(
                "Cultivation Guides",
                "cultivation-guides",
                "Step-by-step guides for commercial and home mushroom cultivation."
        );

        BlogTag tag1 = blogContentService.createTag("Oyster Mushrooms", "oyster-mushrooms");
        BlogTag tag2 = blogContentService.createTag("Substrate Preparation", "substrate-preparation");

        BlogPost post = blogContentService.createPostDraft(
                "Complete Guide to Growing Oyster Mushrooms at Home",
                "complete-guide-to-growing-oyster-mushrooms-at-home",
                "Learn step-by-step how to cultivate high-yield fresh oyster mushrooms at home using wheat straw substrate and pure grain spawn.",
                "# Complete Guide to Growing Oyster Mushrooms at Home\n\nOyster mushrooms (*Pleurotus ostreatus*) are among the easiest and most rewarding mushrooms to grow. This comprehensive guide covers everything from substrate pasteurization to harvesting multi-flush yields.\n\n## 1. Materials Needed\n- Premium Sporekart Wheat Straw Substrate\n- Lab-certified Oyster Mushroom Spawn\n- Polypropylene Grow Bags with Filter Patches\n\n## 2. Substrate Pasteurization\nHot water pasteurization at 65°C-70°C for 90 minutes kills competing mold spores while preserving beneficial thermophilic microorganisms.\n\n## 3. Inoculation & Incubation\nInoculate spawn at 10% weight ratio in clean grow bags. Keep in total darkness at 24°C for 14-18 days until mycelium fully colonizes the substrate.\n\n## 4. Fruiting & Harvesting\nIntroduce fresh air, high humidity (85-90%), and indirect light to trigger pinhead formation.",
                author.getId(),
                category.getId(),
                Set.of(tag1.getId(), tag2.getId()),
                "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80",
                "Fresh Oyster Mushrooms Growing on Substrate Bag",
                "Complete Guide to Growing Oyster Mushrooms at Home | Sporekart",
                "Master home oyster mushroom cultivation with our step-by-step expert guide covering straw pasteurization, spawning, incubation, and high-yield harvesting.",
                "https://sporekart.com/blog/complete-guide-to-growing-oyster-mushrooms-at-home"
        );

        blogContentService.publishPost(post.getId());
    }
}
