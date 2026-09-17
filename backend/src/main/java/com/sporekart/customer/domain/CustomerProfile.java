package com.sporekart.customer.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "customer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "gstin")
    private String gstin;

    @Column(name = "farm_size_sqft")
    private Integer farmSizeSqft;

    @Column(name = "has_training_capability", nullable = false)
    @Builder.Default
    private boolean hasTrainingCapability = false;

    @Column(name = "training_capability_granted_at")
    private java.time.ZonedDateTime trainingCapabilityGrantedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "customer_capabilities", joinColumns = @JoinColumn(name = "customer_profile_id"))
    @Column(name = "capability")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private java.util.Set<CustomerCapability> capabilities = new java.util.HashSet<>(java.util.Set.of(
            CustomerCapability.SHOP, CustomerCapability.ORDER, CustomerCapability.SUPPORT
    ));

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (capabilities == null || capabilities.isEmpty()) {
            capabilities = new java.util.HashSet<>(java.util.Set.of(
                    CustomerCapability.SHOP, CustomerCapability.ORDER, CustomerCapability.SUPPORT
            ));
        }
    }

    public void addCapability(CustomerCapability capability) {
        if (capabilities == null) {
            capabilities = new java.util.HashSet<>();
        }
        capabilities.add(capability);
    }
}
