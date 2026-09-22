package com.sporekart.catalog.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_information")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductInformation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    // Basic Product & Trade Disclosures
    @Column(name = "brand_name")
    @Builder.Default
    private String brandName = "Sporekart Agritech";

    @Column(name = "country_of_origin")
    @Builder.Default
    private String countryOfOrigin = "India";

    @Column(name = "manufacturer_details", columnDefinition = "TEXT")
    private String manufacturerDetails;

    @Column(name = "packer_details", columnDefinition = "TEXT")
    private String packerDetails;

    @Column(name = "marketer_details", columnDefinition = "TEXT")
    private String marketerDetails;

    @Column(name = "customer_care_details", columnDefinition = "TEXT")
    private String customerCareDetails;

    @Column(name = "net_quantity")
    private String netQuantity;

    @Column(name = "unit_of_measure")
    private String unitOfMeasure;

    // Food & FSSAI Compliance
    @Column(name = "fssai_license_number")
    private String fssaiLicenseNumber;

    @Column(name = "food_category")
    private String foodCategory;

    @Column(name = "is_vegetarian", nullable = false)
    @Builder.Default
    private boolean isVegetarian = true;

    @Column(columnDefinition = "TEXT")
    private String ingredients;

    @Column(name = "allergen_info", columnDefinition = "TEXT")
    private String allergenInfo;

    @Column(name = "nutritional_info_json", columnDefinition = "TEXT")
    private String nutritionalInfoJson;

    @Column(name = "serving_size")
    private String servingSize;

    // Mushroom & Agritech Specific Disclosures
    @Column(name = "mushroom_species")
    private String mushroomSpecies;

    @Column(name = "cultivation_method", columnDefinition = "TEXT")
    private String cultivationMethod;

    @Column(name = "strain_variety")
    private String strainVariety;

    @Column(name = "recommended_substrate", columnDefinition = "TEXT")
    private String recommendedSubstrate;

    @Column(name = "inoculation_guidance", columnDefinition = "TEXT")
    private String inoculationGuidance;

    @Column(name = "kit_contents", columnDefinition = "TEXT")
    private String kitContents;

    @Column(name = "cultivation_cycle_days")
    private Integer cultivationCycleDays;

    @Column(name = "environment_requirements", columnDefinition = "TEXT")
    private String environmentRequirements;

    // Storage & Handling Instructions
    @Column(name = "storage_instructions", columnDefinition = "TEXT")
    private String storageInstructions;

    @Column(name = "storage_temperature_guidance")
    private String storageTemperatureGuidance;

    @Column(name = "shelf_life_guidance")
    private String shelfLifeGuidance;

    @Column(name = "handling_instructions", columnDefinition = "TEXT")
    private String handlingInstructions;

    @Column(name = "safety_warnings", columnDefinition = "TEXT")
    private String safetyWarnings;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
