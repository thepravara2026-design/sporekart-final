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
import java.util.Optional;
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
    private final com.sporekart.promotion.infrastructure.PromotionRepository promotionRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@sporekart.in").isEmpty()) {
            userRepository.save(User.builder()
                    .email("admin@sporekart.in")
                    .phone("+919876543210")
                    .firstName("Sporekart")
                    .lastName("Admin")
                    .fullName("Sporekart Admin")
                    .role(UserRole.ROLE_ADMIN)
                    .isVerified(true)
                    .isEmailVerified(true)
                    .isPhoneVerified(true)
                    .build());
        }

        if (productRepository.count() < 30) {
            initCatalogData();
        }
        if (courseRepository.count() == 0) {
            initTrainingData();
        }
        if (blogPostRepository.count() == 0) {
            initBlogContentData();
        }
        if (promotionRepository.count() == 0) {
            initPromotionsData();
        }
    }

    private void initPromotionsData() {
        promotionRepository.save(com.sporekart.promotion.domain.Promotion.builder()
                .name("Welcome Harvest 10% Off")
                .code("SPORE10")
                .description("Get 10% off on all fresh mushroom & spawn produce")
                .type(com.sporekart.promotion.domain.PromotionType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .maximumDiscount(new BigDecimal("200.00"))
                .minimumOrderValue(new BigDecimal("299.00"))
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.CUSTOMER)
                .status(com.sporekart.promotion.domain.PromotionStatus.ACTIVE)
                .usageLimit(500)
                .perCustomerLimit(3)
                .usageCount(14)
                .build());

        promotionRepository.save(com.sporekart.promotion.domain.Promotion.builder()
                .name("Flat ₹100 Off Festive Special")
                .code("FLAT100")
                .description("Flat ₹100 instant discount on orders above ₹799")
                .type(com.sporekart.promotion.domain.PromotionType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("100.00"))
                .minimumOrderValue(new BigDecimal("799.00"))
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.CUSTOMER)
                .status(com.sporekart.promotion.domain.PromotionStatus.ACTIVE)
                .usageLimit(200)
                .perCustomerLimit(1)
                .usageCount(28)
                .build());

        promotionRepository.save(com.sporekart.promotion.domain.Promotion.builder()
                .name("Free Delivery Express")
                .code("FREESHIP")
                .description("Complimentary temperature-controlled cold chain delivery")
                .type(com.sporekart.promotion.domain.PromotionType.FREE_SHIPPING)
                .minimumOrderValue(new BigDecimal("499.00"))
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.CUSTOMER)
                .status(com.sporekart.promotion.domain.PromotionStatus.ACTIVE)
                .usageLimit(1000)
                .perCustomerLimit(5)
                .usageCount(62)
                .build());

        promotionRepository.save(com.sporekart.promotion.domain.Promotion.builder()
                .name("Mushroom Cultivation 10% Off")
                .code("MUSHROOM10")
                .description("10% discount dedicated for training masterclass batches")
                .type(com.sporekart.promotion.domain.PromotionType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .maximumDiscount(new BigDecimal("500.00"))
                .minimumOrderValue(new BigDecimal("500.00"))
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.TRAINEE)
                .status(com.sporekart.promotion.domain.PromotionStatus.ACTIVE)
                .usageLimit(500)
                .perCustomerLimit(3)
                .usageCount(8)
                .build());

        promotionRepository.save(com.sporekart.promotion.domain.Promotion.builder()
                .name("Universal Fungi Offer 15% Off")
                .code("GLOBAL15")
                .description("15% discount eligible on both product purchases and training courses")
                .type(com.sporekart.promotion.domain.PromotionType.PERCENTAGE)
                .discountValue(new BigDecimal("15.00"))
                .maximumDiscount(new BigDecimal("400.00"))
                .minimumOrderValue(new BigDecimal("350.00"))
                .targetAudience(com.sporekart.promotion.domain.PromotionTargetAudience.BOTH)
                .status(com.sporekart.promotion.domain.PromotionStatus.ACTIVE)
                .usageLimit(1000)
                .perCustomerLimit(2)
                .usageCount(19)
                .build());
    }


    private Category getOrCreateCategory(String name, String slug, String description, String imageUrl) {
        Optional<Category> opt = categoryRepository.findBySlug(slug);
        if (opt.isPresent()) {
            Category cat = opt.get();
            if (imageUrl != null && !imageUrl.equals(cat.getImageUrl())) {
                cat.setImageUrl(imageUrl);
                return categoryRepository.save(cat);
            }
            return cat;
        }
        return categoryRepository.save(Category.builder()
                .name(name)
                .slug(slug)
                .description(description)
                .imageUrl(imageUrl)
                .build());
    }

    private ProductVariant v(String variantName, String sku, String price, String comparePrice, int stock) {
        return ProductVariant.builder()
                .variantName(variantName)
                .sku(sku)
                .priceInr(new BigDecimal(price))
                .compareAtPriceInr(comparePrice != null ? new BigDecimal(comparePrice) : null)
                .stockQuantity(stock)
                .build();
    }

    private void createProduct(
            Category category,
            String title,
            String slug,
            String description,
            ProductType productType,
            String hsnCode,
            BigDecimal gstRate,
            String imageUrl,
            List<ProductVariant> variants
    ) {
        Optional<Product> existingOpt = productRepository.findBySlug(slug);
        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();
            existing.setCategory(category);
            existing.setProductType(productType);
            productRepository.save(existing);
            return;
        }

        Product p = Product.builder()
                .category(category)
                .title(title)
                .slug(slug)
                .description(description)
                .productType(productType)
                .status(ProductStatus.ACTIVE)
                .hsnCode(hsnCode)
                .gstRatePercent(gstRate)
                .metaTitle("Buy " + title + " Online | Sporekart")
                .metaDescription(description)
                .canonicalUrl("https://sporekart.in/product/" + slug)
                .isActive(true)
                .build();

        for (ProductVariant v : variants) {
            v.setProduct(p);
        }
        p.setVariants(variants);

        ProductMedia m1 = ProductMedia.builder()
                .product(p)
                .mediaUrl(imageUrl)
                .mediaType(MediaType.IMAGE)
                .role(ProductMediaRole.PRIMARY)
                .isPrimary(true)
                .displayOrder(1)
                .build();
        p.setMedia(List.of(m1));

        ProductInformation info = ProductInformation.builder()
                .product(p)
                .brandName("Sporekart Agritech")
                .countryOfOrigin("India")
                .fssaiLicenseNumber("11522014000389")
                .foodCategory(category.getName())
                .isVegetarian(true)
                .storageInstructions("Store in cool, dry place or refrigerate as applicable.")
                .shelfLifeGuidance("7 to 365 Days depending on category")
                .build();
        p.setProductInformation(info);

        productRepository.save(p);
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

        Category equipCategory = getOrCreateCategory(
                "Cultivation Equipment & Supplies",
                "equipment-supplies",
                "Professional mycology gear, filter patch bags, liquid cultures, and climate controls.",
                "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
        );

        // --- Category 1: Fresh Mushrooms (9 Products) ---
        createProduct(freshCategory, "Organic Fresh Button Mushrooms", "organic-fresh-button-mushrooms",
                "Handpicked daily from our climate-controlled indoor farm. High in protein, Vitamin D & minerals.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80",
                List.of(v("200g Pack", "FBM-200G", "75.00", "90.00", 150),
                        v("500g Pack", "FBM-500G", "160.00", "190.00", 40),
                        v("1kg Bulk Pack", "FBM-1KG", "290.00", "340.00", 15)));

        createProduct(freshCategory, "Gourmet Pink Oyster Mushrooms", "gourmet-pink-oyster-mushrooms",
                "Vibrant pink tropical oyster mushrooms with a rich savory umami flavor profile.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
                List.of(v("250g Gourmet Pack", "POM-250G", "140.00", "180.00", 25),
                        v("500g Chef Pack", "POM-500G", "260.00", "320.00", 45)));

        createProduct(freshCategory, "Fresh White Oyster Mushrooms", "fresh-white-oyster-mushrooms",
                "Delicate texture and subtle woody aroma. Perfect for stir-fries, soups, and curries.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
                List.of(v("250g Pack", "WOM-250G", "110.00", "130.00", 60),
                        v("1kg Commercial Pack", "WOM-1KG", "380.00", "450.00", 20)));

        createProduct(freshCategory, "Fresh King Oyster Mushrooms (Eringi)", "fresh-king-oyster-mushrooms",
                "Thick, meaty stems with an incredible steak-like chew. Highly popular in Asian gastronomy.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                List.of(v("300g Premium Pack", "KOM-300G", "220.00", "260.00", 30),
                        v("1kg Box", "KOM-1KG", "650.00", "750.00", 10)));

        createProduct(freshCategory, "Fresh Shiitake Mushrooms", "fresh-shiitake-mushrooms",
                "Plump, dark caps packed with natural lentinan and deep savory taste.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
                List.of(v("200g Gourmet Tray", "FSM-200G", "280.00", "340.00", 18),
                        v("500g Chef Pack", "FSM-500G", "620.00", "720.00", 8)));

        createProduct(freshCategory, "Fresh Milky Mushrooms (Calocybe Indica)", "fresh-milky-mushrooms",
                "Long shelf-life tropical mushroom with robust texture and velvety white appearance.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80",
                List.of(v("250g Pack", "FMM-250G", "95.00", "115.00", 80),
                        v("1kg Farm Pack", "FMM-1KG", "340.00", "390.00", 25)));

        createProduct(freshCategory, "Fresh Enoki Mushrooms", "fresh-enoki-mushrooms",
                "Crisp, slender golden-needle mushrooms ideal for hot pots, ramen, and fresh salads.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
                List.of(v("150g Vacuum Pack", "FEM-150G", "160.00", "190.00", 45),
                        v("300g Twin Pack", "FEM-300G", "295.00", "350.00", 30)));

        createProduct(freshCategory, "Fresh Lion's Mane Mushrooms (Hericium)", "fresh-lions-mane-mushrooms",
                "Rare brain-boosting culinary fungus with lobster-like seafood flavor profile.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
                List.of(v("200g Specialty Box", "FLM-200G", "350.00", "420.00", 12),
                        v("400g Premium Box", "FLM-400G", "650.00", "780.00", 5)));

        createProduct(freshCategory, "Fresh Portobello Mushrooms", "fresh-portobello-mushrooms",
                "Fully mature button mushrooms with wide, dense caps perfect for grilling and roasting.",
                ProductType.FRESH_MUSHROOM, "07095900", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                List.of(v("200g Grill Pack", "FPM-200G", "190.00", "230.00", 35),
                        v("500g Jumbo Pack", "FPM-500G", "420.00", "490.00", 14)));


        // --- Category 2: Dry Mushrooms (6 Products) ---
        createProduct(dryCategory, "Sun-Dried Gourmet Shiitake Slices", "sun-dried-gourmet-shiitake-slices",
                "Concentrated umami shiitake slices perfect for soups, broths, and stir-fries.",
                ProductType.DRY_MUSHROOM, "07123900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
                List.of(v("100g Pouch", "SHI-100G", "350.00", "420.00", 80),
                        v("250g Jar", "SHI-250G", "820.00", "950.00", 25)));

        createProduct(dryCategory, "Dehydrated Black Morels (Guchi)", "dehydrated-black-morels",
                "Wild harvested Himalayan black morels known for supreme earthy complexity.",
                ProductType.DRY_MUSHROOM, "07123900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                List.of(v("50g Luxury Pack", "MOR-50G", "2450.00", "2850.00", 15),
                        v("100g Collector Pack", "MOR-100G", "4600.00", "5200.00", 6)));

        createProduct(dryCategory, "Dried Oyster Mushroom Flakes", "dried-oyster-mushroom-flakes",
                "Coarsely flaked dried oysters ready for rapid rehydration and instant cooking.",
                ProductType.DRY_MUSHROOM, "07123900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80",
                List.of(v("100g Pantry Pouch", "DOF-100G", "180.00", "220.00", 90),
                        v("500g Commercial Bag", "DOF-500G", "750.00", "890.00", 30)));

        createProduct(dryCategory, "Dehydrated Lion's Mane Powder", "dehydrated-lions-mane-powder",
                "Micro-milled 100% pure fruiting body powder for smoothies, tea, and culinary enrichment.",
                ProductType.DRY_MUSHROOM, "07123900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
                List.of(v("100g Glass Jar", "LMP-100G", "590.00", "690.00", 50),
                        v("250g Bulk Pouch", "LMP-250G", "1250.00", "1450.00", 20)));

        createProduct(dryCategory, "Dried Porcini Mushrooms (Boletus Edulis)", "dried-porcini-mushrooms",
                "European grade wild porcini slices offering rich nutty notes for risottos.",
                ProductType.DRY_MUSHROOM, "07123900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
                List.of(v("75g Gourmet Pouch", "POR-75G", "490.00", "580.00", 40),
                        v("200g Reserve Box", "POR-200G", "1190.00", "1390.00", 15)));

        createProduct(dryCategory, "Dehydrated Wood Ear Fungus (Black Fungus)", "dehydrated-wood-ear-fungus",
                "Crisp textured dehydrated wood ear strips used in Asian broths and stir-fries.",
                ProductType.DRY_MUSHROOM, "07123900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
                List.of(v("100g Pack", "WEF-100G", "210.00", "250.00", 70),
                        v("250g Pack", "WEF-250G", "460.00", "550.00", 35)));


        // --- Category 3: Mushroom Spawn Seeds (7 Products) ---
        createProduct(spawnCategory, "Lab Certified Milky Grain Spawn", "lab-certified-milky-grain-spawn",
                "First-generation pure mother wheat grain spawn for high-yield summer cultivation.",
                ProductType.SPAWN_SEED, "07095900", BigDecimal.ZERO,
                "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
                List.of(v("1kg Master Bag", "MMS-1KG", "120.00", "150.00", 300),
                        v("5kg Commercial Bag", "MMS-5KG", "550.00", "650.00", 50)));

        createProduct(spawnCategory, "Florida White Oyster Grain Spawn", "florida-white-oyster-grain-spawn",
                "High vigor G1 grain spawn of Pleurotus florida suitable for year-round cropping.",
                ProductType.SPAWN_SEED, "07095900", BigDecimal.ZERO,
                "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
                List.of(v("1kg Spawn Bag", "FWO-1KG", "110.00", "140.00", 250),
                        v("5kg Grower Pack", "FWO-5KG", "490.00", "590.00", 60)));

        createProduct(spawnCategory, "Hybrid Button Mushroom Grain Spawn (A-15)", "hybrid-button-mushroom-grain-spawn",
                "Lab cloned A-15 strain grain spawn producing dense, heavy button caps.",
                ProductType.SPAWN_SEED, "07095900", BigDecimal.ZERO,
                "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80",
                List.of(v("1kg Sterilized Bag", "BMS-1KG", "140.00", "170.00", 200),
                        v("10kg Commercial Crate", "BMS-10KG", "1250.00", "1500.00", 30)));

        createProduct(spawnCategory, "Pink Oyster Mother Grain Spawn G1", "pink-oyster-mother-grain-spawn-g1",
                "Vibrant tropical strain G1 grain spawn with rapid substrate colonization rate.",
                ProductType.SPAWN_SEED, "07095900", BigDecimal.ZERO,
                "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
                List.of(v("1kg G1 Master Bag", "POS-1KG", "160.00", "190.00", 180),
                        v("5kg Farm Pack", "POS-5KG", "720.00", "850.00", 40)));

        createProduct(spawnCategory, "King Oyster Grain Spawn (Eringi Strain)", "king-oyster-grain-spawn",
                "Cold-tolerant commercial strain optimized for thick stem development.",
                ProductType.SPAWN_SEED, "07095900", BigDecimal.ZERO,
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                List.of(v("1kg High Viability Bag", "KOS-1KG", "180.00", "220.00", 140),
                        v("5kg Bulk Pack", "KOS-5KG", "800.00", "950.00", 35)));

        createProduct(spawnCategory, "Shiitake Sawdust & Grain Hybrid Spawn", "shiitake-sawdust-grain-spawn",
                "Specially formulated oak sawdust and rye grain spawn for log and bag inoculation.",
                ProductType.SPAWN_SEED, "07095900", BigDecimal.ZERO,
                "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
                List.of(v("1kg Bag", "SGS-1KG", "220.00", "260.00", 110),
                        v("5kg Commercial Sack", "SGS-5KG", "950.00", "1150.00", 25)));

        createProduct(spawnCategory, "Ganoderma Reishi Medicinal Grain Spawn", "ganoderma-reishi-grain-spawn",
                "Pure culture Ganoderma lucidum grain spawn for medicinal tea cultivation.",
                ProductType.SPAWN_SEED, "07095900", BigDecimal.ZERO,
                "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
                List.of(v("1kg Lab Sealed Bag", "GRS-1KG", "290.00", "350.00", 90),
                        v("5kg Master Sack", "GRS-5KG", "1350.00", "1600.00", 18)));


        // --- Category 4: Mushroom Growing Kits (5 Products) ---
        createProduct(kitCategory, "All-In-One Oyster DIY Growing Kit", "all-in-one-oyster-diy-growing-kit",
                "Complete home kit! Just spray water twice daily and harvest fresh mushrooms in 10 days.",
                ProductType.GROWING_KIT, "07095900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
                List.of(v("Standard Kit (1.5 kg Block)", "OMG-KIT-STD", "499.00", "699.00", 200),
                        v("Deluxe Twin Pack", "OMG-KIT-DLX", "899.00", "1199.00", 75)));

        createProduct(kitCategory, "Pink Tropical Oyster Fruiting Box Kit", "pink-tropical-oyster-fruiting-box",
                "Eye-catching pink mushrooms grown directly inside a designer windows box.",
                ProductType.GROWING_KIT, "07095900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80",
                List.of(v("Single Fruiting Box", "POK-BOX", "549.00", "749.00", 150),
                        v("Family Combo Pack", "POK-CMB", "999.00", "1399.00", 50)));

        createProduct(kitCategory, "Lion's Mane Brain-Boost Growing Kit", "lions-mane-growing-kit",
                "Grow your own cognitive wellness mushrooms right on your kitchen counter.",
                ProductType.GROWING_KIT, "07095900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
                List.of(v("2kg Ready-to-Fruit Block", "LMK-2KG", "799.00", "999.00", 85),
                        v("Starter Bundle with Humidity Tent", "LMK-BND", "1199.00", "1499.00", 40)));

        createProduct(kitCategory, "Shiitake Log-Style Desktop Grow Kit", "shiitake-desktop-grow-kit",
                "High density sawdust block formulated to simulate natural hardwood log fruiting.",
                ProductType.GROWING_KIT, "07095900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
                List.of(v("1.8kg Substrate Block", "SDK-18KG", "699.00", "899.00", 95),
                        v("Dual Harvest Kit", "SDK-DUAL", "1299.00", "1599.00", 30)));

        createProduct(kitCategory, "Yellow Golden Oyster Home Farm Kit", "yellow-golden-oyster-home-kit",
                "Vibrant golden yellow cluster mushrooms that pop up in massive flushes.",
                ProductType.GROWING_KIT, "07095900", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                List.of(v("Starter Kit 1.2kg", "GOK-12KG", "479.00", "649.00", 110),
                        v("Master Kit with Spray Bottle", "GOK-MST", "799.00", "999.00", 45)));


        // --- Category 5: Cultivation Equipment & Supplies (5 Products) ---
        createProduct(equipCategory, "Autoclavable PP Substrate Bags with Filter Patch", "autoclavable-pp-substrate-bags",
                "Heavy duty 3 mil polypropylene grow bags withstand 121°C sterilization with 0.2 micron breathable patch.",
                ProductType.EQUIPMENT_SUPPLIES, "39232990", new BigDecimal("18.00"),
                "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
                List.of(v("Pack of 50 Bags (0.2 micron)", "PPB-50P", "390.00", "490.00", 250),
                        v("Pack of 200 Bulk", "PPB-200P", "1350.00", "1650.00", 80)));

        createProduct(equipCategory, "Mycology Liquid Culture Syringe Kit (Sterile)", "mycology-liquid-culture-syringe-kit",
                "10ml nutrient enriched liquid culture pre-loaded with isolated high-performance mycelium.",
                ProductType.EQUIPMENT_SUPPLIES, "30029090", new BigDecimal("12.00"),
                "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
                List.of(v("10ml Oyster LC Syringe", "LCS-OYS", "320.00", "390.00", 160),
                        v("10ml Lion's Mane LC Syringe", "LCS-LMN", "450.00", "550.00", 90)));

        createProduct(equipCategory, "Substrate pH Adjuster & Calcium Carbonate", "substrate-ph-adjuster-calcium-carbonate",
                "Pure agricultural hydrated lime and chalk powder to optimize substrate alkalinity (pH 7.5-8.0).",
                ProductType.EQUIPMENT_SUPPLIES, "25221000", new BigDecimal("5.00"),
                "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
                List.of(v("2kg Agriculture Lime", "PHA-2KG", "180.00", "220.00", 300),
                        v("5kg Commercial Pack", "PHA-5KG", "390.00", "480.00", 120)));

        createProduct(equipCategory, "Digital Thermo-Hygrometer for Mushroom Rooms", "digital-thermo-hygrometer-mushroom-rooms",
                "High precision sensor measuring temperature and humidity with min/max memory tracking.",
                ProductType.EQUIPMENT_SUPPLIES, "90258010", new BigDecimal("18.00"),
                "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
                List.of(v("Standard Sensor Model", "DTH-STD", "450.00", "590.00", 140),
                        v("Dual Probe Pro Model", "DTH-PRO", "850.00", "1050.00", 60)));

        createProduct(equipCategory, "High-Pressure Micro Mist Spray Nozzle System", "micro-mist-spray-nozzle-system",
                "Brass ultra-fine mist nozzles to maintain 85-95% humidity in growing rooms without wetting substrate.",
                ProductType.EQUIPMENT_SUPPLIES, "84248990", new BigDecimal("18.00"),
                "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
                List.of(v("10-Nozzle Starter Kit", "MNS-10N", "890.00", "1100.00", 75),
                        v("30-Nozzle Farm Kit", "MNS-30N", "2250.00", "2750.00", 25)));
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
