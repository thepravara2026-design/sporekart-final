package com.sporekart.shared.infrastructure;

import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.*;
import com.sporekart.content.application.BlogContentService;
import com.sporekart.content.domain.*;
import com.sporekart.content.infrastructure.BlogPostRepository;
import com.sporekart.training.application.TrainingService;
import com.sporekart.training.domain.*;
import com.sporekart.training.infrastructure.CourseRepository;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;

@Component
@Profile({"dev", "test"})
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CourseRepository courseRepository;
    private final TrainingService trainingService;
    private final BlogContentService blogContentService;
    private final BlogPostRepository blogPostRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@sporekart.in").isEmpty()) {
            userRepository.save(User.builder()
                    .email("admin@sporekart.in")
                    .phone("+919999999999")
                    .firstName("Sporekart")
                    .lastName("Admin")
                    .fullName("Sporekart Admin")
                    .role(UserRole.ROLE_ADMIN)
                    .isVerified(true)
                    .isEmailVerified(true)
                    .isPhoneVerified(true)
                    .build());
        }

        if (categoryRepository.count() == 0 || productRepository.count() == 0) {
            initCatalogData();
        }
        if (courseRepository.count() == 0) {
            initTrainingData();
        }
        if (blogPostRepository.count() == 0) {
            initBlogContentData();
        }
    }

    private Category getOrCreateCategory(String name, String slug, String description, String imageUrl) {
        return categoryRepository.findBySlug(slug)
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(name)
                        .slug(slug)
                        .description(description)
                        .imageUrl(imageUrl)
                        .build()));
    }

    private void initCatalogData() {
        Category freshCategory = getOrCreateCategory(
                "Fresh Mushrooms",
                "fresh-mushrooms",
                "Farm-fresh, organically grown premium mushrooms harvested daily.",
                "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80"
        );

        Category dryCategory = getOrCreateCategory(
                "Dry Mushrooms",
                "dry-mushrooms",
                "Dehydrated gourmet mushrooms rich in natural umami & long shelf-life.",
                "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80"
        );

        Category spawnCategory = getOrCreateCategory(
                "Mushroom Spawn Seeds",
                "spawn-seeds",
                "High-yield, lab-certified pure grain spawn seeds for commercial growers.",
                "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80"
        );

        Category kitCategory = getOrCreateCategory(
                "Mushroom Growing Kits",
                "growing-kits",
                "Ready-to-grow indoor mushroom cultivation kits for homes & classrooms.",
                "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
        );

        // Product 1: Organic Fresh Button Mushrooms
        Product p1 = Product.builder()
                .category(freshCategory)
                .title("Organic Fresh Button Mushrooms")
                .slug("organic-fresh-button-mushrooms")
                .description("Handpicked daily from our climate-controlled indoor farm. High in protein, Vitamin D & minerals.")
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
                .product(p1).variantName("200g Pack").sku("FBM-200G")
                .priceInr(new BigDecimal("75.00")).compareAtPriceInr(new BigDecimal("90.00")).stockQuantity(150).build();
        ProductVariant v1_2 = ProductVariant.builder()
                .product(p1).variantName("500g Pack").sku("FBM-500G")
                .priceInr(new BigDecimal("160.00")).compareAtPriceInr(new BigDecimal("190.00")).stockQuantity(4).build();
        ProductVariant v1_3 = ProductVariant.builder()
                .product(p1).variantName("1kg Bulk Pack").sku("FBM-1KG")
                .priceInr(new BigDecimal("290.00")).compareAtPriceInr(new BigDecimal("340.00")).stockQuantity(0).build();

        ProductMedia m1_1 = ProductMedia.builder().product(p1)
                .mediaUrl("https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.PRIMARY).isPrimary(true).displayOrder(1).build();
        ProductMedia m1_2 = ProductMedia.builder().product(p1)
                .mediaUrl("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.GALLERY).isPrimary(false).displayOrder(2).build();
        ProductMedia m1_3 = ProductMedia.builder().product(p1)
                .mediaUrl("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.PACKAGING).isPrimary(false).displayOrder(3).build();
        ProductMedia m1_4 = ProductMedia.builder().product(p1)
                .mediaUrl("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.LIFESTYLE).isPrimary(false).displayOrder(4).build();

        ProductInformation info1 = ProductInformation.builder()
                .product(p1).brandName("Sporekart Agritech").countryOfOrigin("India")
                .manufacturerDetails("Sporekart Bio-Agri Labs Pvt Ltd, Plot 42, Biotech Park, Pune, MH 411057")
                .packerDetails("Sporekart Cold Storage Hub, Sector 18, Gurugram, HR 122015")
                .marketerDetails("Sporekart India Agritech Pvt Ltd, Bangalore, KA")
                .customerCareDetails("care@sporekart.in | Toll-Free: 1800-123-77673")
                .netQuantity("200g / 500g / 1kg").unitOfMeasure("Grams")
                .fssaiLicenseNumber("11522014000389").foodCategory("Fresh Fungi / Edible Mushrooms")
                .isVegetarian(true).ingredients("100% Organically Grown Fresh Button Mushrooms (Agaricus bisporus)")
                .allergenInfo("None. Handled in sterile certified organic environment.")
                .nutritionalInfoJson("{\"calories\":\"22 kcal\",\"protein\":\"3.1g\",\"carbohydrates\":\"3.3g\",\"fat\":\"0.3g\",\"dietary_fiber\":\"1.0g\",\"vitamin_d\":\"33% DV\"}")
                .servingSize("100g").mushroomSpecies("Agaricus bisporus").cultivationMethod("Indoor Climate-Controlled Vertical Racks")
                .strainVariety("A-15 High Yield Hybrid").recommendedSubstrate("Pasteurized Wheat Straw Compost")
                .inoculationGuidance("Lab Inoculated").kitContents("Fresh produce ready to cook")
                .cultivationCycleDays(35).environmentRequirements("Temperature: 16°C - 20°C | RH: 85-90%")
                .storageInstructions("Refrigerate between 2°C and 5°C in breathable paper wrap. Do not freeze.")
                .storageTemperatureGuidance("2°C to 5°C Refrigerated").shelfLifeGuidance("7 Days from Harvest")
                .handlingInstructions("Wipe gently with damp cloth or rinse immediately before cooking.")
                .safetyWarnings("Consume only after thorough cooking.").build();

        if (!productRepository.existsBySlug(p1.getSlug())) {
            p1.setVariants(List.of(v1_1, v1_2, v1_3));
            p1.setMedia(List.of(m1_1, m1_2, m1_3, m1_4));
            p1.setProductInformation(info1);
            productRepository.save(p1);
        }

        // Product 2: Gourmet Pink Oyster Mushrooms
        Product p2 = Product.builder()
                .category(freshCategory)
                .title("Gourmet Pink Oyster Mushrooms")
                .slug("gourmet-pink-oyster-mushrooms")
                .description("Vibrant pink tropical oyster mushrooms with a rich savory umami flavor profile.")
                .productType(ProductType.FRESH_MUSHROOM)
                .status(ProductStatus.ACTIVE)
                .hsnCode("07095900")
                .gstRatePercent(new BigDecimal("5.00"))
                .metaTitle("Buy Fresh Pink Oyster Mushrooms | Sporekart")
                .metaDescription("Exotic pink oyster mushrooms grown organically and delivered fresh.")
                .canonicalUrl("https://sporekart.in/product/gourmet-pink-oyster-mushrooms")
                .isActive(true)
                .build();

        ProductVariant v2_1 = ProductVariant.builder()
                .product(p2).variantName("250g Gourmet Pack").sku("POM-250G")
                .priceInr(new BigDecimal("140.00")).compareAtPriceInr(new BigDecimal("180.00")).stockQuantity(12).build();
        ProductVariant v2_2 = ProductVariant.builder()
                .product(p2).variantName("500g Chef Pack").sku("POM-500G")
                .priceInr(new BigDecimal("260.00")).compareAtPriceInr(new BigDecimal("320.00")).stockQuantity(45).build();

        ProductMedia m2_1 = ProductMedia.builder().product(p2)
                .mediaUrl("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.PRIMARY).isPrimary(true).displayOrder(1).build();
        ProductMedia m2_2 = ProductMedia.builder().product(p2)
                .mediaUrl("https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.GALLERY).isPrimary(false).displayOrder(2).build();
        ProductMedia m2_3 = ProductMedia.builder().product(p2)
                .mediaUrl("https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.LIFESTYLE).isPrimary(false).displayOrder(3).build();

        ProductInformation info2 = ProductInformation.builder()
                .product(p2).brandName("Sporekart Gourmet").countryOfOrigin("India")
                .fssaiLicenseNumber("11522014000389").foodCategory("Fresh Exotic Fungi")
                .isVegetarian(true).ingredients("100% Fresh Pleurotus djamor (Pink Oyster)")
                .mushroomSpecies("Pleurotus djamor").cultivationMethod("Aerobic Bag Culture")
                .storageInstructions("Refrigerate at 4°C. Consume within 5 days.").shelfLifeGuidance("5 Days").build();

        if (!productRepository.existsBySlug(p2.getSlug())) {
            p2.setVariants(List.of(v2_1, v2_2));
            p2.setMedia(List.of(m2_1, m2_2, m2_3));
            p2.setProductInformation(info2);
            productRepository.save(p2);
        }

        // Product 3: Sun-Dried Gourmet Shiitake Slices
        Product p3 = Product.builder()
                .category(dryCategory)
                .title("Sun-Dried Gourmet Shiitake Slices")
                .slug("sun-dried-gourmet-shiitake-slices")
                .description("Concentrated umami shiitake slices perfect for soups, broths, and stir-fries.")
                .productType(ProductType.DRY_MUSHROOM)
                .status(ProductStatus.ACTIVE)
                .hsnCode("07123900")
                .gstRatePercent(new BigDecimal("12.00"))
                .metaTitle("Dried Shiitake Mushrooms Online | Sporekart")
                .metaDescription("Buy premium dehydrated shiitake mushroom slices with 12 months shelf life.")
                .canonicalUrl("https://sporekart.in/product/sun-dried-gourmet-shiitake-slices")
                .isActive(true)
                .build();

        ProductVariant v3_1 = ProductVariant.builder()
                .product(p3).variantName("100g Pouch").sku("SHI-100G")
                .priceInr(new BigDecimal("350.00")).compareAtPriceInr(new BigDecimal("420.00")).stockQuantity(80).build();
        ProductVariant v3_2 = ProductVariant.builder()
                .product(p3).variantName("250g Jar").sku("SHI-250G")
                .priceInr(new BigDecimal("820.00")).compareAtPriceInr(new BigDecimal("950.00")).stockQuantity(8).build();

        ProductMedia m3_1 = ProductMedia.builder().product(p3)
                .mediaUrl("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.PRIMARY).isPrimary(true).displayOrder(1).build();
        ProductMedia m3_2 = ProductMedia.builder().product(p3)
                .mediaUrl("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.GALLERY).isPrimary(false).displayOrder(2).build();
        ProductMedia m3_3 = ProductMedia.builder().product(p3)
                .mediaUrl("https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.PACKAGING).isPrimary(false).displayOrder(3).build();

        ProductInformation info3 = ProductInformation.builder()
                .product(p3).brandName("Sporekart Reserve").countryOfOrigin("India")
                .fssaiLicenseNumber("11522014000389").foodCategory("Dehydrated Edible Mushrooms")
                .isVegetarian(true).ingredients("100% Dehydrated Lentinula edodes")
                .storageInstructions("Store in cool, dry place away from moisture.").shelfLifeGuidance("12 Months").build();

        if (!productRepository.existsBySlug(p3.getSlug())) {
            p3.setVariants(List.of(v3_1, v3_2));
            p3.setMedia(List.of(m3_1, m3_2, m3_3));
            p3.setProductInformation(info3);
            productRepository.save(p3);
        }

        // Product 4: Lab Certified Milky Grain Spawn
        Product p4 = Product.builder()
                .category(spawnCategory)
                .title("Lab Certified Milky Grain Spawn")
                .slug("lab-certified-milky-grain-spawn")
                .description("First-generation pure mother wheat grain spawn for high-yield summer cultivation.")
                .productType(ProductType.SPAWN_SEED)
                .status(ProductStatus.ACTIVE)
                .hsnCode("07095900")
                .gstRatePercent(BigDecimal.ZERO)
                .metaTitle("Pure Milky Mushroom Grain Spawn Seeds | Sporekart")
                .metaDescription("High vitality G1 grain spawn for commercial Calocybe indica farming.")
                .canonicalUrl("https://sporekart.in/product/lab-certified-milky-grain-spawn")
                .isActive(true)
                .build();

        ProductVariant v4_1 = ProductVariant.builder()
                .product(p4).variantName("1kg Master Bag").sku("MMS-1KG")
                .priceInr(new BigDecimal("120.00")).compareAtPriceInr(new BigDecimal("150.00")).stockQuantity(300).build();
        ProductVariant v4_2 = ProductVariant.builder()
                .product(p4).variantName("5kg Commercial Bag").sku("MMS-5KG")
                .priceInr(new BigDecimal("550.00")).compareAtPriceInr(new BigDecimal("650.00")).stockQuantity(50).build();

        ProductMedia m4_1 = ProductMedia.builder().product(p4)
                .mediaUrl("https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.PRIMARY).isPrimary(true).displayOrder(1).build();
        ProductMedia m4_2 = ProductMedia.builder().product(p4)
                .mediaUrl("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.GALLERY).isPrimary(false).displayOrder(2).build();
        ProductMedia m4_3 = ProductMedia.builder().product(p4)
                .mediaUrl("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.INSTRUCTION).isPrimary(false).displayOrder(3).build();

        ProductInformation info4 = ProductInformation.builder()
                .product(p4).brandName("Sporekart Labs").countryOfOrigin("India")
                .mushroomSpecies("Calocybe indica").strainVariety("APK-2 Thermal Tolerant Strain")
                .recommendedSubstrate("Paddy Straw / Wheat Straw").cultivationCycleDays(40)
                .environmentRequirements("Temp: 28°C - 35°C | RH: 80%").shelfLifeGuidance("30 Days").build();

        if (!productRepository.existsBySlug(p4.getSlug())) {
            p4.setVariants(List.of(v4_1, v4_2));
            p4.setMedia(List.of(m4_1, m4_2, m4_3));
            p4.setProductInformation(info4);
            productRepository.save(p4);
        }

        // Product 5: All-In-One Oyster DIY Growing Kit
        Product p5 = Product.builder()
                .category(kitCategory)
                .title("All-In-One Oyster DIY Growing Kit")
                .slug("all-in-one-oyster-diy-growing-kit")
                .description("Complete home kit! Just spray water twice daily and harvest fresh mushrooms in 10 days.")
                .productType(ProductType.GROWING_KIT)
                .status(ProductStatus.ACTIVE)
                .hsnCode("07095900")
                .gstRatePercent(new BigDecimal("12.00"))
                .metaTitle("DIY Oyster Mushroom Growing Kit | Sporekart")
                .metaDescription("Ready to grow indoor mushroom kit with spray bottle and step-by-step manual.")
                .canonicalUrl("https://sporekart.in/product/all-in-one-oyster-diy-growing-kit")
                .isActive(true)
                .build();

        ProductVariant v5_1 = ProductVariant.builder()
                .product(p5).variantName("Standard Kit (1.5 kg Block)").sku("OMG-KIT-STD")
                .priceInr(new BigDecimal("499.00")).compareAtPriceInr(new BigDecimal("699.00")).stockQuantity(200).build();
        ProductVariant v5_2 = ProductVariant.builder()
                .product(p5).variantName("Deluxe Twin Pack").sku("OMG-KIT-DLX")
                .priceInr(new BigDecimal("899.00")).compareAtPriceInr(new BigDecimal("1199.00")).stockQuantity(15).build();

        ProductMedia m5_1 = ProductMedia.builder().product(p5)
                .mediaUrl("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.PRIMARY).isPrimary(true).displayOrder(1).build();
        ProductMedia m5_2 = ProductMedia.builder().product(p5)
                .mediaUrl("https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.GALLERY).isPrimary(false).displayOrder(2).build();
        ProductMedia m5_3 = ProductMedia.builder().product(p5)
                .mediaUrl("https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.LIFESTYLE).isPrimary(false).displayOrder(3).build();
        ProductMedia m5_4 = ProductMedia.builder().product(p5)
                .mediaUrl("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80")
                .mediaType(MediaType.IMAGE).role(ProductMediaRole.INSTRUCTION).isPrimary(false).displayOrder(4).build();

        ProductInformation info5 = ProductInformation.builder()
                .product(p5).brandName("Sporekart Home Farms").countryOfOrigin("India")
                .kitContents("Pre-inoculated Substrate Block, Fine Mist Spray Bottle, Humidity Tent, Instruction Guide")
                .cultivationCycleDays(10).environmentRequirements("Indirect Sunlight | Ambient Humidity")
                .shelfLifeGuidance("45 Days before opening").build();

        if (!productRepository.existsBySlug(p5.getSlug())) {
            p5.setVariants(List.of(v5_1, v5_2));
            p5.setMedia(List.of(m5_1, m5_2, m5_3, m5_4));
            p5.setProductInformation(info5);
            productRepository.save(p5);
        }
    }

    private void initTrainingData() {
        CourseCategory category = trainingService.createCategory("Cultivation", "cultivation", "Mushroom Cultivation Courses");
        CourseCategory labCategory = trainingService.createCategory("Lab & Spawn Production", "lab-spawn-production", "Grain Spawn & Tissue Culture Courses");

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

        Course c2 = trainingService.createCourse(
                labCategory.getId(),
                "Lab-Certified Pure Grain Spawn Production & Tissue Culture",
                "spawn-production-tissue-culture-masterclass",
                "Master laminar flow hood protocols, mother grain spawn preparation, strain selection, and sterile tissue cloning.",
                10,
                new BigDecimal("2999.00")
        );

        Batch b2 = trainingService.createBatch(
                c2.getId(),
                "BATCH-LAB-2026-01",
                LocalDate.now().plusDays(8),
                LocalDate.now().plusDays(18),
                30
        );

        trainingService.addBatchSchedule(
                b2.getId(),
                "Sterile Tissue Culture & Laminar Isolation",
                ZonedDateTime.now().plusDays(8),
                180,
                "https://zoom.us/j/sporekart-lab-batch1"
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
