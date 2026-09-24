package com.sporekart.media;

import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.domain.ProductStatus;
import com.sporekart.catalog.domain.ProductType;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.media.api.MediaDtos;
import com.sporekart.media.application.MediaService;
import com.sporekart.media.domain.MediaAsset;
import com.sporekart.media.domain.MediaStatus;
import com.sporekart.media.domain.MediaType;
import com.sporekart.media.infrastructure.MediaAssetRepository;
import com.sporekart.media.infrastructure.MediaProductLinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MediaModuleTest {

    @Autowired
    private MediaService mediaService;

    @Autowired
    private MediaAssetRepository mediaAssetRepository;

    @Autowired
    private MediaProductLinkRepository productLinkRepository;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void setUp() {
        productLinkRepository.deleteAll();
        mediaAssetRepository.deleteAll();
        productRepository.deleteAll();
    }

    @Test
    void testGeneratedStorageKeysNotOriginalFilename() {
        String rawFilename = "my_original_farm_photo.jpg";
        MediaDtos.InitiateUploadRequest req = new MediaDtos.InitiateUploadRequest(rawFilename, "image/jpeg", 2048500L, MediaType.IMAGE, "Farm harvest", true);

        MediaDtos.InitiateUploadResponse response = mediaService.initiateUpload(req, UUID.randomUUID());

        assertNotNull(response);
        assertNotNull(response.getStorageKey());
        assertNotEquals(rawFilename, response.getStorageKey(), "Storage key must be a generated path, not raw filename");
        assertTrue(response.getStorageKey().contains("image/"), "Storage key should include media type category directory");
    }

    @Test
    void testStatusLifecycle() {
        MediaDtos.InitiateUploadRequest req = new MediaDtos.InitiateUploadRequest("spawn_lab_spec.pdf", "application/pdf", 102400L, MediaType.PDF, "Lab Spec", false);
        MediaDtos.InitiateUploadResponse initRes = mediaService.initiateUpload(req, UUID.randomUUID());

        MediaAsset initialAsset = mediaAssetRepository.findById(initRes.getMediaId()).orElseThrow();
        assertEquals(MediaStatus.UPLOADING, initialAsset.getStatus());

        // Complete upload
        MediaDtos.CompleteUploadRequest completeReq = new MediaDtos.CompleteUploadRequest(initRes.getMediaId(), 1920, 1080, "sha256checksumhash");
        MediaDtos.MediaAssetDto completedAsset = mediaService.completeUpload(completeReq);

        assertEquals(MediaStatus.ACTIVE, completedAsset.getStatus());
        assertEquals(1920, completedAsset.getWidth());
    }

    @Test
    void testSignedUrlGeneration() {
        MediaDtos.InitiateUploadRequest req = new MediaDtos.InitiateUploadRequest("certificate.pdf", "application/pdf", 512000L, MediaType.CERTIFICATE, "Course Certificate", false);
        MediaDtos.InitiateUploadResponse initRes = mediaService.initiateUpload(req, UUID.randomUUID());

        String signedUrl = mediaService.getSignedUrl(initRes.getMediaId(), 3600);

        assertNotNull(signedUrl);
        assertTrue(signedUrl.contains("/storage/v1/object/sign/"), "Signed URL must use signature endpoint");
        assertTrue(signedUrl.contains("token="), "Signed URL must contain security token");
    }

    @Test
    void testSoftDeletion() {
        MediaDtos.InitiateUploadRequest req = new MediaDtos.InitiateUploadRequest("oyster_bag.png", "image/png", 50000L, MediaType.IMAGE, "Oyster Bag", true);
        MediaDtos.InitiateUploadResponse initRes = mediaService.initiateUpload(req, UUID.randomUUID());

        mediaService.softDeleteMediaAsset(initRes.getMediaId());

        MediaAsset asset = mediaAssetRepository.findById(initRes.getMediaId()).orElseThrow();
        assertTrue(asset.isDeleted());
        assertEquals(MediaStatus.ARCHIVED, asset.getStatus());
        assertNotNull(asset.getDeletedAt());

        Exception ex = assertThrows(IllegalArgumentException.class, () -> mediaService.getMediaAsset(initRes.getMediaId()));
        assertTrue(ex.getMessage().contains("deleted"));
    }

    @Test
    void testEntityLinking() {
        Product product = Product.builder()
                .title("Button Mushroom")
                .slug("button-mushroom-link-test")
                .productType(ProductType.FRESH_MUSHROOM)
                .status(ProductStatus.ACTIVE)
                .gstRatePercent(BigDecimal.ZERO)
                .isActive(true)
                .build();
        Product savedProduct = productRepository.save(product);

        MediaDtos.InitiateUploadRequest req = new MediaDtos.InitiateUploadRequest("button_photo.jpg", "image/jpeg", 120000L, MediaType.IMAGE, "Button Photo", true);
        MediaDtos.InitiateUploadResponse initRes = mediaService.initiateUpload(req, UUID.randomUUID());

        MediaDtos.LinkMediaRequest linkReq = new MediaDtos.LinkMediaRequest(initRes.getMediaId(), savedProduct.getId(), null, null, null, true, 1);
        mediaService.linkMediaToEntity(linkReq);

        var links = productLinkRepository.findByProductIdOrderByDisplayOrderAsc(savedProduct.getId());
        assertEquals(1, links.size());
        assertEquals(initRes.getMediaId(), links.get(0).getMediaId());
        assertTrue(links.get(0).isPrimary());
    }

    @Test
    void testDisallowedExtensionRejection() {
        UUID userId = UUID.randomUUID();

        // 1. .svg should be rejected
        MediaDtos.InitiateUploadRequest svgReq = new MediaDtos.InitiateUploadRequest("logo.svg", "image/svg+xml", 1024L, MediaType.IMAGE, "Logo", true);
        Exception ex1 = assertThrows(IllegalArgumentException.class, () -> mediaService.initiateUpload(svgReq, userId));
        assertTrue(ex1.getMessage().contains("File extension not allowed"));

        // 2. .html should be rejected
        MediaDtos.InitiateUploadRequest htmlReq = new MediaDtos.InitiateUploadRequest("page.html", "text/html", 1024L, MediaType.IMAGE, "Page", true);
        Exception ex2 = assertThrows(IllegalArgumentException.class, () -> mediaService.initiateUpload(htmlReq, userId));
        assertTrue(ex2.getMessage().contains("File extension not allowed"));

        // 3. .exe should be rejected
        MediaDtos.InitiateUploadRequest exeReq = new MediaDtos.InitiateUploadRequest("malware.exe", "application/octet-stream", 1024L, MediaType.IMAGE, "Exe", true);
        Exception ex3 = assertThrows(IllegalArgumentException.class, () -> mediaService.initiateUpload(exeReq, userId));
        assertTrue(ex3.getMessage().contains("File extension not allowed"));

        // 4. Allowed extensions (.png, .jpg, .pdf, .mp4, .webp, .gif, .mov) should succeed
        MediaDtos.InitiateUploadRequest pngReq = new MediaDtos.InitiateUploadRequest("photo.png", "image/png", 1024L, MediaType.IMAGE, "Photo", true);
        assertNotNull(mediaService.initiateUpload(pngReq, userId));
    }
}
