package com.sporekart.media;

import com.sporekart.media.api.MediaDtos;
import com.sporekart.media.application.MediaService;
import com.sporekart.review.application.ProductReviewService;
import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileUploadSecurityTest {

    @Test
    void testMagicBytesCorrectlyIdentified() {
        // Valid PNG header (8 bytes)
        byte[] pngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00};
        assertEquals("image/png", MediaService.detectMimeTypeFromMagicBytes(pngHeader));

        // Valid JPEG header (3 bytes)
        byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        assertEquals("image/jpeg", MediaService.detectMimeTypeFromMagicBytes(jpegHeader));

        // Valid PDF header (%PDF)
        byte[] pdfHeader = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
        assertEquals("application/pdf", MediaService.detectMimeTypeFromMagicBytes(pdfHeader));
    }

    @Test
    void testMagicBytesMimeSpoofingRejected() {
        // Attacker sends a text/bash script declared as image/jpeg
        byte[] fakeJpeg = "#!/bin/bash\nrm -rf /".getBytes();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                MediaService.validateMagicBytes(fakeJpeg, "image/jpeg"));
        assertTrue(ex.getMessage().contains("Unrecognized or disallowed file format"));

        // Attacker sends PNG bytes declared as image/jpeg
        byte[] pngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00};
        IllegalArgumentException spoofEx = assertThrows(IllegalArgumentException.class, () ->
                MediaService.validateMagicBytes(pngHeader, "image/jpeg"));
        assertTrue(spoofEx.getMessage().contains("MIME type spoofing detected"));
    }

    @Test
    void testMaxFileSizeEnforcedAt25MB() {
        MediaService mediaService = new MediaService(null, null, null, null);

        // 26 MB request
        long overLimitBytes = 26 * 1024 * 1024L;
        MediaDtos.InitiateUploadRequest request = new MediaDtos.InitiateUploadRequest(
                "large-photo.jpg",
                "image/jpeg",
                overLimitBytes,
                null,
                null,
                true,
                null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                mediaService.initiateUpload(request, UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("exceeds maximum allowed limit of 25MB"));
    }

    @Test
    void testUploadWithValidMagicBytesSampleSucceeds() {
        MediaService mediaService = new MediaService(null, null, null, null);

        byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        String base64Jpeg = Base64.getEncoder().encodeToString(jpegHeader);

        // Malicious sample matching mismatching declared mime
        MediaDtos.InitiateUploadRequest badRequest = new MediaDtos.InitiateUploadRequest(
                "sample.png",
                "image/png",
                1024L,
                null,
                null,
                true,
                base64Jpeg // sends jpeg bytes while declaring image/png
        );

        assertThrows(IllegalArgumentException.class, () ->
                mediaService.initiateUpload(badRequest, UUID.randomUUID()));
    }

    @Test
    void testReviewImageDomainAllowlistPreventsSsrf() {
        ProductReviewService reviewService = new ProductReviewService(null, null, null, null, null, null, null);

        // SSRF Attacks must be rejected
        assertFalse(reviewService.isValidReviewImageUrl("http://169.254.169.254/latest/meta-data/"));
        assertFalse(reviewService.isValidReviewImageUrl("https://169.254.169.254/latest/meta-data/"));
        assertFalse(reviewService.isValidReviewImageUrl("http://localhost:8080/admin/users"));
        assertFalse(reviewService.isValidReviewImageUrl("https://localhost:8443/admin"));
        assertFalse(reviewService.isValidReviewImageUrl("http://127.0.0.1:8080/actuator"));
        assertFalse(reviewService.isValidReviewImageUrl("https://10.0.0.1/internal-database"));
        assertFalse(reviewService.isValidReviewImageUrl("https://192.168.1.1/router"));
        assertFalse(reviewService.isValidReviewImageUrl("https://attacker-domain.com/malicious.jpg"));
        assertFalse(reviewService.isValidReviewImageUrl("file:///etc/passwd"));
        assertFalse(reviewService.isValidReviewImageUrl("javascript:alert(1)"));

        // Trusted Storage & CDN domains must be accepted
        assertTrue(reviewService.isValidReviewImageUrl("https://my-project.supabase.co/storage/v1/object/public/reviews/photo.jpg"));
        assertTrue(reviewService.isValidReviewImageUrl("https://media.sporekart.in/reviews/photo.jpg"));
        assertTrue(reviewService.isValidReviewImageUrl("https://sporekart.com/uploads/harvest.png"));
        assertTrue(reviewService.isValidReviewImageUrl("https://sporekart.vercel.app/images/mushroom.jpg"));
        assertTrue(reviewService.isValidReviewImageUrl("https://images.unsplash.com/photo-1543362906-acfc16c67564"));
    }
}

