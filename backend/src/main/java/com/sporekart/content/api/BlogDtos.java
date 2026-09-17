package com.sporekart.content.api;

import com.sporekart.content.domain.BlogPostStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Set;
import java.util.UUID;

public class BlogDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCategoryRequest {
        @NotBlank(message = "Category name is required")
        private String name;
        @NotBlank(message = "Category slug is required")
        private String slug;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAuthorRequest {
        @NotBlank(message = "Author name is required")
        private String name;
        @NotBlank(message = "Author slug is required")
        private String slug;
        private String bio;
        private String avatarUrl;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTagRequest {
        @NotBlank(message = "Tag name is required")
        private String name;
        @NotBlank(message = "Tag slug is required")
        private String slug;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePostRequest {
        @NotBlank(message = "Title is required")
        private String title;
        @NotBlank(message = "Slug is required")
        private String slug;
        private String summary;
        @NotBlank(message = "Content is required")
        private String content;
        private UUID authorId;
        private UUID categoryId;
        private Set<UUID> tagIds;
        private String featuredMediaUrl;
        private String featuredMediaAltText;
        private String metaTitle;
        private String metaDescription;
        private String canonicalUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePostRequest {
        private String title;
        private String slug;
        private String summary;
        private String content;
        private UUID authorId;
        private UUID categoryId;
        private Set<UUID> tagIds;
        private String featuredMediaUrl;
        private String featuredMediaAltText;
        private String metaTitle;
        private String metaDescription;
        private String canonicalUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchedulePostRequest {
        private ZonedDateTime scheduledPublishAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogCategoryResponse {
        private UUID id;
        private String name;
        private String slug;
        private String description;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogAuthorResponse {
        private UUID id;
        private String name;
        private String slug;
        private String bio;
        private String avatarUrl;
        private String email;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogTagResponse {
        private UUID id;
        private String name;
        private String slug;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogPostSummaryResponse {
        private UUID id;
        private String title;
        private String slug;
        private String summary;
        private BlogPostStatus status;
        private BlogAuthorResponse author;
        private BlogCategoryResponse category;
        private Set<BlogTagResponse> tags;
        private String featuredMediaUrl;
        private String featuredMediaAltText;
        private boolean isIndexable;
        private Integer readingTimeMinutes;
        private ZonedDateTime publishedAt;
        private ZonedDateTime scheduledPublishAt;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogPostDetailResponse {
        private UUID id;
        private String title;
        private String slug;
        private String summary;
        private String content;
        private BlogPostStatus status;
        private BlogAuthorResponse author;
        private BlogCategoryResponse category;
        private Set<BlogTagResponse> tags;
        private String featuredMediaUrl;
        private String featuredMediaAltText;
        private String metaTitle;
        private String metaDescription;
        private String canonicalUrl;
        private boolean isIndexable;
        private Integer readingTimeMinutes;
        private ZonedDateTime publishedAt;
        private ZonedDateTime scheduledPublishAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String articleJsonLd;
        private String breadcrumbJsonLd;
    }
}
