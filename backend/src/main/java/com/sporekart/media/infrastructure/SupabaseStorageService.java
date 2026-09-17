package com.sporekart.media.infrastructure;

import com.sporekart.media.domain.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class SupabaseStorageService {

    @Value("${app.supabase.url:https://mock-supabase.sporekart.in}")
    private String supabaseUrl;

    @Value("${app.supabase.bucket:sporekart-media}")
    private String defaultBucket;

    public String generateStorageKey(String originalFilename, MediaType mediaType) {
        LocalDate now = LocalDate.now();
        String year = String.valueOf(now.getYear());
        String month = String.format("%02d", now.getMonthValue());

        String extension = "webp";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        String uniqueId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String categoryFolder = mediaType != null ? mediaType.name().toLowerCase() : "general";

        return String.format("%s/%s/%s/%s.%s", categoryFolder, year, month, uniqueId, extension);
    }

    public String getPublicUrl(String bucket, String storageKey) {
        String targetBucket = (bucket != null && !bucket.isBlank()) ? bucket : defaultBucket;
        String baseUrl = supabaseUrl.replaceAll("/+$", "");
        return baseUrl + "/storage/v1/object/public/" + targetBucket + "/" + storageKey;
    }

    public String generatePresignedUploadUrl(String bucket, String storageKey) {
        String targetBucket = (bucket != null && !bucket.isBlank()) ? bucket : defaultBucket;
        String baseUrl = supabaseUrl.replaceAll("/+$", "");
        return baseUrl + "/storage/v1/object/" + targetBucket + "/" + storageKey;
    }

    public String generateSignedDownloadUrl(String bucket, String storageKey, int expirationSeconds) {
        String targetBucket = (bucket != null && !bucket.isBlank()) ? bucket : defaultBucket;
        String baseUrl = supabaseUrl.replaceAll("/+$", "");
        String token = UUID.randomUUID().toString().replace("-", "");
        return baseUrl + "/storage/v1/object/sign/" + targetBucket + "/" + storageKey + "?token=" + token
                + "&expiresIn=" + expirationSeconds;
    }
}
