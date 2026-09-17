package com.sporekart.media.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "media_assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "storage_provider", nullable = false)
    @Builder.Default
    private String storageProvider = "SUPABASE";

    @Column(nullable = false)
    @Builder.Default
    private String bucket = "sporekart-media";

    @Column(name = "storage_key", nullable = false, unique = true)
    private String storageKey;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    private Integer width;
    private Integer height;

    private String checksum;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false)
    @Builder.Default
    private MediaType mediaType = MediaType.IMAGE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MediaStatus status = MediaStatus.UPLOADING;

    @Column(name = "alt_text", columnDefinition = "TEXT")
    private String altText;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private boolean isPublic = true;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = MediaStatus.UPLOADING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getPublicUrl(String supabaseProjectUrl) {
        String baseUrl = (supabaseProjectUrl != null && !supabaseProjectUrl.isBlank())
                ? supabaseProjectUrl.replaceAll("/+$", "")
                : "https://mock-supabase.sporekart.in";
        return baseUrl + "/storage/v1/object/public/" + bucket + "/" + storageKey;
    }

    public String getThumbnailUrl(String supabaseProjectUrl) {
        String publicUrl = getPublicUrl(supabaseProjectUrl);
        return publicUrl.replace(".webp", "_thumb.webp");
    }

    public String getOptimizedWebpUrl(String supabaseProjectUrl) {
        return getPublicUrl(supabaseProjectUrl);
    }
}
