package com.sporekart.media.api;

import com.sporekart.media.application.MediaService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/upload/initiate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MediaDtos.InitiateUploadResponse>> initiateUpload(
            Authentication authentication,
            @Valid @RequestBody MediaDtos.InitiateUploadRequest request) {
        UUID userId = extractUserId(authentication);
        MediaDtos.InitiateUploadResponse response = mediaService.initiateUpload(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/upload/complete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MediaDtos.MediaAssetDto>> completeUpload(
            Authentication authentication,
            @Valid @RequestBody MediaDtos.CompleteUploadRequest request) {
        UUID userId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);
        MediaDtos.MediaAssetDto response = mediaService.completeUpload(request, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaDtos.MediaAssetDto>> getMediaAsset(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);
        MediaDtos.MediaAssetDto asset = mediaService.getMediaAsset(id, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(asset));
    }

    @GetMapping("/{id}/signed-url")
    public ResponseEntity<ApiResponse<String>> getSignedUrl(
            @PathVariable("id") UUID id,
            @RequestParam(defaultValue = "3600") int expirationSeconds,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);
        String signedUrl = mediaService.getSignedUrl(id, expirationSeconds, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(signedUrl));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteMediaAsset(@PathVariable("id") UUID id) {
        mediaService.softDeleteMediaAsset(id);
        return ResponseEntity.ok(ApiResponse.success("Media asset deleted successfully"));
    }

    @PostMapping("/link")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> linkMediaToEntity(@Valid @RequestBody MediaDtos.LinkMediaRequest request) {
        mediaService.linkMediaToEntity(request);
        return ResponseEntity.ok(ApiResponse.success("Media linked successfully"));
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                return UUID.fromString(authentication.getName());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ADMIN".equals(a.getAuthority()));
    }
}
