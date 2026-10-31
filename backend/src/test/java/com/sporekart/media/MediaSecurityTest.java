package com.sporekart.media;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.media.api.MediaDtos;
import com.sporekart.media.domain.MediaAsset;
import com.sporekart.media.domain.MediaStatus;
import com.sporekart.media.domain.MediaType;
import com.sporekart.media.infrastructure.MediaAssetRepository;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class MediaSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MediaAssetRepository mediaAssetRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("SEC-MED-01: Private media signed URL is forbidden for unauthenticated callers")
    void testPrivateMedia_unauthenticated_forbidden() throws Exception {
        UUID ownerId = UUID.randomUUID();
        MediaAsset privateAsset = createMediaAsset(ownerId, false);

        mockMvc.perform(get("/media/" + privateAsset.getId() + "/signed-url"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-MED-02: Private media signed URL is forbidden for mismatched user")
    void testPrivateMedia_mismatchedUser_forbidden() throws Exception {
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        String attackerToken = tokenProvider.generateToken(attackerId, "attacker@example.com", "ROLE_CUSTOMER");

        MediaAsset privateAsset = createMediaAsset(ownerId, false);

        mockMvc.perform(get("/media/" + privateAsset.getId() + "/signed-url")
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-MED-03: Private media signed URL succeeds for owner and admin")
    void testPrivateMedia_ownerAndAdmin_success() throws Exception {
        UUID ownerId = UUID.randomUUID();
        String ownerToken = tokenProvider.generateToken(ownerId, "owner@example.com", "ROLE_CUSTOMER");

        UUID adminId = UUID.randomUUID();
        String adminToken = tokenProvider.generateToken(adminId, "admin@example.com", "ROLE_ADMIN");

        MediaAsset privateAsset = createMediaAsset(ownerId, false);

        // Owner access
        mockMvc.perform(get("/media/" + privateAsset.getId() + "/signed-url")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Admin access
        mockMvc.perform(get("/media/" + privateAsset.getId() + "/signed-url")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("SEC-MED-04: Public media signed URL is accessible publicly")
    void testPublicMedia_accessiblePublicly() throws Exception {
        UUID ownerId = UUID.randomUUID();
        MediaAsset publicAsset = createMediaAsset(ownerId, true);

        mockMvc.perform(get("/media/" + publicAsset.getId() + "/signed-url"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("SEC-MED-05: Complete upload requires ownership or admin privileges")
    void testCompleteUpload_ownershipEnforced() throws Exception {
        UUID ownerId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        String attackerToken = tokenProvider.generateToken(attackerId, "attacker@example.com", "ROLE_CUSTOMER");
        String ownerToken = tokenProvider.generateToken(ownerId, "owner@example.com", "ROLE_CUSTOMER");

        MediaAsset asset = createMediaAsset(ownerId, true);

        MediaDtos.CompleteUploadRequest request = MediaDtos.CompleteUploadRequest.builder()
                .mediaId(asset.getId())
                .width(1080)
                .height(720)
                .checksum("sha256-mockchecksum")
                .build();

        // Attacker attempting to complete upload -> 403 Forbidden
        mockMvc.perform(post("/media/upload/complete")
                        .header("Authorization", "Bearer " + attackerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        // Legitimate owner completing upload -> 200 OK
        mockMvc.perform(post("/media/upload/complete")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("SEC-ANL-01: Analytics funnel and events require ROLE_ADMIN")
    void testAnalyticsEndpoints_adminRequired() throws Exception {
        UUID customerId = UUID.randomUUID();
        String customerToken = tokenProvider.generateToken(customerId, "customer@example.com", "ROLE_CUSTOMER");

        UUID adminId = UUID.randomUUID();
        String adminToken = tokenProvider.generateToken(adminId, "admin@example.com", "ROLE_ADMIN");

        // Customer calling funnel -> 403
        mockMvc.perform(get("/analytics/funnel")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Admin calling funnel -> 200
        mockMvc.perform(get("/analytics/funnel")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Customer calling events -> 403
        mockMvc.perform(get("/analytics/events")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Admin calling events -> 200
        mockMvc.perform(get("/analytics/events")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    private MediaAsset createMediaAsset(UUID createdBy, boolean isPublic) {
        MediaAsset asset = MediaAsset.builder()
                .storageProvider("SUPABASE")
                .bucket("sporekart-media")
                .storageKey("test/" + UUID.randomUUID() + ".png")
                .originalFilename("test_asset.png")
                .mimeType("image/png")
                .sizeBytes(1024L)
                .mediaType(MediaType.IMAGE)
                .status(MediaStatus.UPLOADING)
                .isPublic(isPublic)
                .createdBy(createdBy)
                .build();
        return mediaAssetRepository.save(asset);
    }
}

