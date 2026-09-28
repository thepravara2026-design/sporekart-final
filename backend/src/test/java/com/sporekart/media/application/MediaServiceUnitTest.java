package com.sporekart.media.application;

import com.sporekart.media.api.MediaDtos;
import com.sporekart.media.domain.*;
import com.sporekart.media.infrastructure.MediaAssetRepository;
import com.sporekart.media.infrastructure.MediaCourseLinkRepository;
import com.sporekart.media.infrastructure.MediaProductLinkRepository;
import com.sporekart.media.infrastructure.SupabaseStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaServiceUnitTest {

    @Mock
    private MediaAssetRepository mediaAssetRepository;
    @Mock
    private MediaProductLinkRepository productLinkRepository;
    @Mock
    private MediaCourseLinkRepository courseLinkRepository;
    @Mock
    private SupabaseStorageService supabaseStorageService;

    @InjectMocks
    private MediaService mediaService;

    private UUID userId;
    private UUID mediaId;
    private MediaAsset testAsset;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        mediaId = UUID.randomUUID();

        ReflectionTestUtils.setField(mediaService, "supabaseUrl", "https://mock-supabase.sporekart.in");
        ReflectionTestUtils.setField(mediaService, "defaultBucket", "sporekart-media");

        testAsset = MediaAsset.builder()
                .id(mediaId)
                .storageProvider("SUPABASE")
                .bucket("sporekart-media")
                .storageKey("images/oyster.jpg")
                .originalFilename("oyster.jpg")
                .mimeType("image/jpeg")
                .sizeBytes(1024L)
                .mediaType(MediaType.IMAGE)
                .status(MediaStatus.ACTIVE)
                .isPublic(true)
                .createdBy(userId)
                .isDeleted(false)
                .build();
    }

    @Test
    @DisplayName("MED-1: Initiate upload creates asset and returns presigned URL")
    void MED_1_initiateUpload_success() {
        when(supabaseStorageService.generateStorageKey(anyString(), any())).thenReturn("images/oyster.jpg");
        when(supabaseStorageService.generatePresignedUploadUrl(anyString(), anyString())).thenReturn("https://presigned.url");
        when(mediaAssetRepository.save(any(MediaAsset.class))).thenAnswer(i -> {
            MediaAsset a = i.getArgument(0);
            a.setId(mediaId);
            return a;
        });

        MediaDtos.InitiateUploadRequest request = new MediaDtos.InitiateUploadRequest();
        request.setOriginalFilename("oyster.jpg");
        request.setMimeType("image/jpeg");
        request.setSizeBytes(1024L);
        request.setMediaType(MediaType.IMAGE);

        MediaDtos.InitiateUploadResponse response = mediaService.initiateUpload(request, userId);

        assertNotNull(response);
        assertEquals(mediaId, response.getMediaId());
        assertEquals("https://presigned.url", response.getPresignedUploadUrl());
    }

    @Test
    @DisplayName("MED-2: Initiate upload fails when file size exceeds 25MB limit")
    void MED_2_initiateUpload_sizeLimitExceeded() {
        MediaDtos.InitiateUploadRequest request = new MediaDtos.InitiateUploadRequest();
        request.setOriginalFilename("large.jpg");
        request.setSizeBytes(30 * 1024 * 1024L); // 30 MB

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                mediaService.initiateUpload(request, userId)
        );
        assertTrue(ex.getMessage().contains("exceeds maximum allowed limit"));
    }

    @Test
    @DisplayName("MED-3: Complete upload sets status ACTIVE and updates metadata")
    void MED_3_completeUpload_success() {
        when(mediaAssetRepository.findById(mediaId)).thenReturn(Optional.of(testAsset));
        when(mediaAssetRepository.save(any(MediaAsset.class))).thenAnswer(i -> i.getArgument(0));

        MediaDtos.CompleteUploadRequest request = new MediaDtos.CompleteUploadRequest();
        request.setMediaId(mediaId);
        request.setWidth(800);
        request.setHeight(600);
        request.setChecksum("sha256-hash");

        MediaDtos.MediaAssetDto dto = mediaService.completeUpload(request);

        assertNotNull(dto);
        assertEquals(MediaStatus.ACTIVE, dto.getStatus());
        assertEquals(800, dto.getWidth());
    }

    @Test
    @DisplayName("MED-4: Get signed URL generates download URL with expiration")
    void MED_4_getSignedUrl_success() {
        when(mediaAssetRepository.findByIdAndIsDeletedFalse(mediaId)).thenReturn(Optional.of(testAsset));
        when(supabaseStorageService.generateSignedDownloadUrl(anyString(), anyString(), eq(3600)))
                .thenReturn("https://signed.download.url");

        String url = mediaService.getSignedUrl(mediaId, 3600);

        assertEquals("https://signed.download.url", url);
    }

    @Test
    @DisplayName("MED-5: Soft delete media asset sets isDeleted flag and ARCHIVED status")
    void MED_5_softDeleteMediaAsset_success() {
        when(mediaAssetRepository.findById(mediaId)).thenReturn(Optional.of(testAsset));

        mediaService.softDeleteMediaAsset(mediaId);

        assertTrue(testAsset.isDeleted());
        assertEquals(MediaStatus.ARCHIVED, testAsset.getStatus());
        verify(mediaAssetRepository).save(testAsset);
    }

    @Test
    @DisplayName("MED-6: Link media to product creates MediaProductLink entity")
    void MED_6_linkMediaToEntity_productLink() {
        when(mediaAssetRepository.findByIdAndIsDeletedFalse(mediaId)).thenReturn(Optional.of(testAsset));

        UUID productId = UUID.randomUUID();
        MediaDtos.LinkMediaRequest request = new MediaDtos.LinkMediaRequest();
        request.setMediaId(mediaId);
        request.setProductId(productId);
        request.setPrimary(true);

        mediaService.linkMediaToEntity(request);

        verify(productLinkRepository).save(any(MediaProductLink.class));
    }
}
