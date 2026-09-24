package com.sporekart.media.application;

import com.sporekart.media.api.MediaDtos;
import com.sporekart.media.domain.*;
import com.sporekart.media.infrastructure.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaAssetRepository mediaAssetRepository;
    private final MediaProductLinkRepository productLinkRepository;
    private final MediaCourseLinkRepository courseLinkRepository;
    private final SupabaseStorageService supabaseStorageService;

    @Value("${app.supabase.url:https://mock-supabase.sporekart.in}")
    private String supabaseUrl;

    @Value("${app.supabase.bucket:sporekart-media}")
    private String defaultBucket;

    private static final long MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024L; // 25 MB max
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
            "jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "pdf"
    );

    @Transactional
    public MediaDtos.InitiateUploadResponse initiateUpload(MediaDtos.InitiateUploadRequest request, UUID userId) {
        if (request.getSizeBytes() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 25MB");
        }

        String filename = request.getOriginalFilename() != null ? request.getOriginalFilename().toLowerCase() : "";
        String ext = "";
        if (filename.contains(".")) {
            ext = filename.substring(filename.lastIndexOf(".") + 1);
        }
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("File extension not allowed: ." + ext);
        }

        String storageKey = supabaseStorageService.generateStorageKey(request.getOriginalFilename(), request.getMediaType());

        MediaAsset asset = MediaAsset.builder()
                .storageProvider("SUPABASE")
                .bucket(defaultBucket)
                .storageKey(storageKey)
                .originalFilename(request.getOriginalFilename())
                .mimeType(request.getMimeType())
                .sizeBytes(request.getSizeBytes())
                .mediaType(request.getMediaType() != null ? request.getMediaType() : MediaType.IMAGE)
                .status(MediaStatus.UPLOADING)
                .altText(request.getAltText())
                .isPublic(request.isPublic())
                .createdBy(userId)
                .build();

        MediaAsset saved = mediaAssetRepository.save(asset);
        String presignedUrl = supabaseStorageService.generatePresignedUploadUrl(defaultBucket, storageKey);

        return MediaDtos.InitiateUploadResponse.builder()
                .mediaId(saved.getId())
                .storageKey(storageKey)
                .presignedUploadUrl(presignedUrl)
                .mimeType(saved.getMimeType())
                .build();
    }

    @Transactional
    public MediaDtos.MediaAssetDto completeUpload(MediaDtos.CompleteUploadRequest request) {
        MediaAsset asset = mediaAssetRepository.findById(request.getMediaId())
                .orElseThrow(() -> new IllegalArgumentException("Media asset not found: " + request.getMediaId()));

        if (request.getWidth() != null) asset.setWidth(request.getWidth());
        if (request.getHeight() != null) asset.setHeight(request.getHeight());
        if (request.getChecksum() != null) asset.setChecksum(request.getChecksum());

        asset.setStatus(MediaStatus.ACTIVE);
        MediaAsset updated = mediaAssetRepository.save(asset);

        return mapToDto(updated);
    }

    @Transactional(readOnly = true)
    public MediaDtos.MediaAssetDto getMediaAsset(UUID mediaId) {
        MediaAsset asset = mediaAssetRepository.findByIdAndIsDeletedFalse(mediaId)
                .orElseThrow(() -> new IllegalArgumentException("Media asset not found or deleted: " + mediaId));
        return mapToDto(asset);
    }

    @Transactional(readOnly = true)
    public String getSignedUrl(UUID mediaId, int expirationSeconds) {
        MediaAsset asset = mediaAssetRepository.findByIdAndIsDeletedFalse(mediaId)
                .orElseThrow(() -> new IllegalArgumentException("Media asset not found or deleted: " + mediaId));

        int exp = expirationSeconds > 0 ? expirationSeconds : 3600; // default 1 hour
        return supabaseStorageService.generateSignedDownloadUrl(asset.getBucket(), asset.getStorageKey(), exp);
    }

    @Transactional
    public void softDeleteMediaAsset(UUID mediaId) {
        MediaAsset asset = mediaAssetRepository.findById(mediaId)
                .orElseThrow(() -> new IllegalArgumentException("Media asset not found: " + mediaId));

        asset.setDeleted(true);
        asset.setDeletedAt(LocalDateTime.now());
        asset.setStatus(MediaStatus.ARCHIVED);
        mediaAssetRepository.save(asset);
    }

    @Transactional
    public void linkMediaToEntity(MediaDtos.LinkMediaRequest request) {
        MediaAsset asset = mediaAssetRepository.findByIdAndIsDeletedFalse(request.getMediaId())
                .orElseThrow(() -> new IllegalArgumentException("Media asset not found: " + request.getMediaId()));

        if (request.getProductId() != null) {
            MediaProductLink productLink = MediaProductLink.builder()
                    .mediaId(asset.getId())
                    .productId(request.getProductId())
                    .variantId(request.getVariantId())
                    .isPrimary(request.isPrimary())
                    .displayOrder(request.getDisplayOrder())
                    .build();
            productLinkRepository.save(productLink);
        }

        if (request.getCourseId() != null) {
            MediaCourseLink courseLink = MediaCourseLink.builder()
                    .mediaId(asset.getId())
                    .courseId(request.getCourseId())
                    .build();
            courseLinkRepository.save(courseLink);
        }
    }

    public MediaDtos.MediaAssetDto mapToDto(MediaAsset asset) {
        String publicUrl = asset.getPublicUrl(supabaseUrl);
        String thumbUrl = asset.getThumbnailUrl(supabaseUrl);
        String webpUrl = asset.getOptimizedWebpUrl(supabaseUrl);

        return MediaDtos.MediaAssetDto.builder()
                .id(asset.getId())
                .storageProvider(asset.getStorageProvider())
                .bucket(asset.getBucket())
                .storageKey(asset.getStorageKey())
                .originalFilename(asset.getOriginalFilename())
                .mimeType(asset.getMimeType())
                .sizeBytes(asset.getSizeBytes())
                .width(asset.getWidth())
                .height(asset.getHeight())
                .mediaType(asset.getMediaType())
                .status(asset.getStatus())
                .altText(asset.getAltText())
                .isPublic(asset.isPublic())
                .publicUrl(publicUrl)
                .thumbnailUrl(thumbUrl)
                .optimizedWebpUrl(webpUrl)
                .build();
    }
}
