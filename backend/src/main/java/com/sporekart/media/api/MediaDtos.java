package com.sporekart.media.api;

import com.sporekart.media.domain.MediaStatus;
import com.sporekart.media.domain.MediaType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class MediaDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitiateUploadRequest {
        @NotBlank(message = "Original filename is required")
        private String originalFilename;
        @NotBlank(message = "MIME type is required")
        private String mimeType;
        @Min(value = 1, message = "File size must be greater than zero")
        private long sizeBytes;
        private MediaType mediaType = MediaType.IMAGE;
        private String altText;
        private boolean isPublic = true;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitiateUploadResponse {
        private UUID mediaId;
        private String storageKey;
        private String presignedUploadUrl;
        private String mimeType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompleteUploadRequest {
        @NotNull(message = "Media ID is required")
        private UUID mediaId;
        private Integer width;
        private Integer height;
        private String checksum;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkMediaRequest {
        @NotNull(message = "Media ID is required")
        private UUID mediaId;
        private UUID productId;
        private UUID variantId;
        private UUID courseId;
        private String blogSlug;
        private boolean isPrimary;
        private int displayOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaAssetDto {
        private UUID id;
        private String storageProvider;
        private String bucket;
        private String storageKey;
        private String originalFilename;
        private String mimeType;
        private long sizeBytes;
        private Integer width;
        private Integer height;
        private MediaType mediaType;
        private MediaStatus status;
        private String altText;
        private boolean isPublic;
        private String publicUrl;
        private String thumbnailUrl;
        private String optimizedWebpUrl;
    }
}
