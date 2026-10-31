package com.sporekart.media.application;

import com.sporekart.media.api.MediaDtos;
import com.sporekart.media.domain.*;
import com.sporekart.media.infrastructure.*;
import com.sporekart.shared.application.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Set;
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

    public static final long MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024L; // 25 MB max
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "pdf"
    );

    public static String detectMimeTypeFromMagicBytes(byte[] bytes) {
        if (bytes == null || bytes.length < 3) {
            throw new IllegalArgumentException("File content is too small or missing to verify magic bytes");
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes.length >= 8 &&
                (bytes[0] & 0xFF) == 0x89 && (bytes[1] & 0xFF) == 0x50 && (bytes[2] & 0xFF) == 0x4E && (bytes[3] & 0xFF) == 0x47 &&
                (bytes[4] & 0xFF) == 0x0D && (bytes[5] & 0xFF) == 0x0A && (bytes[6] & 0xFF) == 0x1A && (bytes[7] & 0xFF) == 0x0A) {
            return "image/png";
        }

        // JPEG: FF D8 FF
        if (bytes.length >= 3 &&
                (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }

        // PDF: %PDF (25 50 44 46)
        if (bytes.length >= 4 &&
                bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46) {
            return "application/pdf";
        }

        // GIF: GIF87a or GIF89a (47 49 46 38 37 61 or 47 49 46 38 39 61)
        if (bytes.length >= 6 &&
                bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x38 &&
                (bytes[4] == 0x37 || bytes[4] == 0x39) && bytes[5] == 0x61) {
            return "image/gif";
        }

        // WEBP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
        if (bytes.length >= 12 &&
                bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
                bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50) {
            return "image/webp";
        }

        throw new IllegalArgumentException("Unrecognized or disallowed file format based on magic bytes");
    }

    public static void validateMagicBytes(byte[] bytes, String declaredMimeType) {
        String detected = detectMimeTypeFromMagicBytes(bytes);
        if (declaredMimeType != null && !declaredMimeType.isBlank()) {
            String normDeclared = declaredMimeType.trim().toLowerCase();
            if (normDeclared.equals("image/jpg")) {
                normDeclared = "image/jpeg";
            }
            if (!detected.equalsIgnoreCase(normDeclared)) {
                throw new IllegalArgumentException("MIME type spoofing detected: Declared " + declaredMimeType + " but magic bytes indicate " + detected);
            }
        }
    }

    public void validateDirectUpload(byte[] fileBytes, String declaredMimeType, long sizeBytes) {
        if (sizeBytes > MAX_FILE_SIZE_BYTES || (fileBytes != null && fileBytes.length > MAX_FILE_SIZE_BYTES)) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 25MB");
        }
        if (fileBytes != null) {
            validateMagicBytes(fileBytes, declaredMimeType);
        }
    }

    @Transactional
    public MediaDtos.InitiateUploadResponse initiateUpload(MediaDtos.InitiateUploadRequest request, UUID userId) {
        if (request.getSizeBytes() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 25MB");
        }

        if (request.getMagicBytesSample() != null && !request.getMagicBytesSample().isBlank()) {
            try {
                byte[] sample = Base64.getDecoder().decode(request.getMagicBytesSample().trim());
                validateMagicBytes(sample, request.getMimeType());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid file magic bytes: " + e.getMessage());
            }
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
    public MediaDtos.MediaAssetDto completeUpload(MediaDtos.CompleteUploadRequest request, UUID userId, boolean isAdmin) {
        MediaAsset asset = mediaAssetRepository.findById(request.getMediaId())
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found: " + request.getMediaId()));

        // Verification: User must own the media row or be an ADMIN
        if (!isAdmin && (userId == null || asset.getCreatedBy() == null || !asset.getCreatedBy().equals(userId))) {
            throw new com.sporekart.shared.application.ForbiddenOperationException("You do not have permission to modify this media asset");
        }

        if (request.getWidth() != null) asset.setWidth(request.getWidth());
        if (request.getHeight() != null) asset.setHeight(request.getHeight());
        if (request.getChecksum() != null) asset.setChecksum(request.getChecksum());

        asset.setStatus(MediaStatus.ACTIVE);
        MediaAsset updated = mediaAssetRepository.save(asset);

        return mapToDto(updated);
    }

    @Transactional
    public MediaDtos.MediaAssetDto completeUpload(MediaDtos.CompleteUploadRequest request) {
        return completeUpload(request, null, true);
    }

    @Transactional(readOnly = true)
    public MediaDtos.MediaAssetDto getMediaAsset(UUID mediaId, UUID userId, boolean isAdmin) {
        MediaAsset asset = mediaAssetRepository.findByIdAndIsDeletedFalse(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found or deleted: " + mediaId));

        if (!asset.isPublic()) {
            if (!isAdmin && (userId == null || asset.getCreatedBy() == null || !asset.getCreatedBy().equals(userId))) {
                throw new com.sporekart.shared.application.ForbiddenOperationException("Access denied: Private media asset requires ownership or administrator privileges");
            }
        }

        return mapToDto(asset);
    }

    @Transactional(readOnly = true)
    public MediaDtos.MediaAssetDto getMediaAsset(UUID mediaId) {
        return getMediaAsset(mediaId, null, true);
    }

    @Transactional(readOnly = true)
    public String getSignedUrl(UUID mediaId, int expirationSeconds, UUID userId, boolean isAdmin) {
        MediaAsset asset = mediaAssetRepository.findByIdAndIsDeletedFalse(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found or deleted: " + mediaId));

        // Honour isPublic and require ownership or admin for private assets
        if (!asset.isPublic()) {
            if (!isAdmin && (userId == null || asset.getCreatedBy() == null || !asset.getCreatedBy().equals(userId))) {
                throw new com.sporekart.shared.application.ForbiddenOperationException("Access denied: Private media asset requires ownership or administrator privileges");
            }
        }

        int exp = expirationSeconds > 0 ? expirationSeconds : 3600; // default 1 hour
        return supabaseStorageService.generateSignedDownloadUrl(asset.getBucket(), asset.getStorageKey(), exp);
    }

    @Transactional(readOnly = true)
    public String getSignedUrl(UUID mediaId, int expirationSeconds) {
        return getSignedUrl(mediaId, expirationSeconds, null, true);
    }

    @Transactional
    public void softDeleteMediaAsset(UUID mediaId) {
        MediaAsset asset = mediaAssetRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found: " + mediaId));

        asset.setDeleted(true);
        asset.setDeletedAt(LocalDateTime.now());
        asset.setStatus(MediaStatus.ARCHIVED);
        mediaAssetRepository.save(asset);
    }

    @Transactional
    public void linkMediaToEntity(MediaDtos.LinkMediaRequest request) {
        MediaAsset asset = mediaAssetRepository.findByIdAndIsDeletedFalse(request.getMediaId())
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found: " + request.getMediaId()));

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
