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
        UUID userId = authentication != null ? UUID.fromString(authentication.getName()) : null;
        MediaDtos.InitiateUploadResponse response = mediaService.initiateUpload(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/upload/complete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MediaDtos.MediaAssetDto>> completeUpload(
            @Valid @RequestBody MediaDtos.CompleteUploadRequest request) {
        MediaDtos.MediaAssetDto response = mediaService.completeUpload(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaDtos.MediaAssetDto>> getMediaAsset(@PathVariable("id") UUID id) {
        MediaDtos.MediaAssetDto asset = mediaService.getMediaAsset(id);
        return ResponseEntity.ok(ApiResponse.success(asset));
    }

    @GetMapping("/{id}/signed-url")
    public ResponseEntity<ApiResponse<String>> getSignedUrl(
            @PathVariable("id") UUID id,
            @RequestParam(defaultValue = "3600") int expirationSeconds) {
        String signedUrl = mediaService.getSignedUrl(id, expirationSeconds);
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
}
