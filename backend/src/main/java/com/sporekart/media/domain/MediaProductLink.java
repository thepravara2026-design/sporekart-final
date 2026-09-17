package com.sporekart.media.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "media_product_links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaProductLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "media_id", nullable = false)
    private UUID mediaId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "variant_id")
    private UUID variantId;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
