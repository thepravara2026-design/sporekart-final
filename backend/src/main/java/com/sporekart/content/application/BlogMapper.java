package com.sporekart.content.application;

import com.sporekart.content.api.BlogDtos;
import com.sporekart.content.domain.BlogAuthor;
import com.sporekart.content.domain.BlogCategory;
import com.sporekart.content.domain.BlogPost;
import com.sporekart.content.domain.BlogTag;

import java.util.Collections;
import java.util.stream.Collectors;

public final class BlogMapper {

    private BlogMapper() {
        // Utility class
    }

    public static BlogDtos.BlogPostSummaryResponse toSummaryResponse(BlogPost post) {
        if (post == null) {
            return null;
        }
        return BlogDtos.BlogPostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .summary(post.getSummary())
                .status(post.getStatus())
                .author(post.getAuthor() != null ? toAuthorResponse(post.getAuthor()) : null)
                .category(post.getCategory() != null ? toCategoryResponse(post.getCategory()) : null)
                .tags(post.getTags() != null ? post.getTags().stream().map(BlogMapper::toTagResponse).collect(Collectors.toSet()) : Collections.emptySet())
                .featuredMediaUrl(post.getFeaturedMediaUrl())
                .featuredMediaAltText(post.getFeaturedMediaAltText())
                .isIndexable(post.isIndexable())
                .readingTimeMinutes(post.getReadingTimeMinutes())
                .publishedAt(post.getPublishedAt())
                .scheduledPublishAt(post.getScheduledPublishAt())
                .createdAt(post.getCreatedAt())
                .build();
    }

    public static BlogDtos.BlogPostDetailResponse toDetailResponse(BlogPost post) {
        if (post == null) {
            return null;
        }
        return BlogDtos.BlogPostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .summary(post.getSummary())
                .content(post.getContent())
                .status(post.getStatus())
                .author(post.getAuthor() != null ? toAuthorResponse(post.getAuthor()) : null)
                .category(post.getCategory() != null ? toCategoryResponse(post.getCategory()) : null)
                .tags(post.getTags() != null ? post.getTags().stream().map(BlogMapper::toTagResponse).collect(Collectors.toSet()) : Collections.emptySet())
                .featuredMediaUrl(post.getFeaturedMediaUrl())
                .featuredMediaAltText(post.getFeaturedMediaAltText())
                .metaTitle(post.getMetaTitle())
                .metaDescription(post.getMetaDescription())
                .canonicalUrl(post.getCanonicalUrl())
                .isIndexable(post.isIndexable())
                .readingTimeMinutes(post.getReadingTimeMinutes())
                .publishedAt(post.getPublishedAt())
                .scheduledPublishAt(post.getScheduledPublishAt())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .articleJsonLd(post.generateArticleStructuredData())
                .breadcrumbJsonLd(post.generateBreadcrumbStructuredData())
                .build();
    }

    public static BlogDtos.BlogCategoryResponse toCategoryResponse(BlogCategory category) {
        if (category == null) {
            return null;
        }
        return BlogDtos.BlogCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .build();
    }

    public static BlogDtos.BlogAuthorResponse toAuthorResponse(BlogAuthor author) {
        if (author == null) {
            return null;
        }
        return BlogDtos.BlogAuthorResponse.builder()
                .id(author.getId())
                .name(author.getName())
                .slug(author.getSlug())
                .bio(author.getBio())
                .avatarUrl(author.getAvatarUrl())
                .email(author.getEmail())
                .createdAt(author.getCreatedAt())
                .build();
    }

    public static BlogDtos.BlogTagResponse toTagResponse(BlogTag tag) {
        if (tag == null) {
            return null;
        }
        return BlogDtos.BlogTagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .slug(tag.getSlug())
                .build();
    }
}
