package com.sporekart.content.api;

import com.sporekart.content.application.BlogContentService;
import com.sporekart.content.domain.BlogAuthor;
import com.sporekart.content.domain.BlogCategory;
import com.sporekart.content.domain.BlogPost;
import com.sporekart.content.domain.BlogTag;
import com.sporekart.shared.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/content", "/content"})
@RequiredArgsConstructor
public class ContentController {

    private final BlogContentService blogService;

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<BlogDtos.BlogPostSummaryResponse>>> getPublishedPosts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        Page<BlogPost> postsPage = blogService.getPublishedPosts(category, tag, query, pageRequest);
        Page<BlogDtos.BlogPostSummaryResponse> responsePage = postsPage.map(this::mapToSummaryResponse);

        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    @GetMapping("/posts/{slug}")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> getPostBySlug(@PathVariable String slug) {
        BlogPost post = blogService.getPublishedPostBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found or not published: " + slug));
        return ResponseEntity.ok(ApiResponse.success(mapToDetailResponse(post)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<BlogDtos.BlogCategoryResponse>>> getCategories() {
        List<BlogCategory> categories = blogService.getAllCategories();
        List<BlogDtos.BlogCategoryResponse> response = categories.stream().map(this::mapCategory).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<List<BlogDtos.BlogTagResponse>>> getTags() {
        List<BlogTag> tags = blogService.getAllTags();
        List<BlogDtos.BlogTagResponse> response = tags.stream().map(this::mapTag).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/authors")
    public ResponseEntity<ApiResponse<List<BlogDtos.BlogAuthorResponse>>> getAuthors() {
        List<BlogAuthor> authors = blogService.getAllAuthors();
        List<BlogDtos.BlogAuthorResponse> response = authors.stream().map(this::mapAuthor).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private BlogDtos.BlogPostSummaryResponse mapToSummaryResponse(BlogPost post) {
        return BlogDtos.BlogPostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .summary(post.getSummary())
                .status(post.getStatus())
                .author(post.getAuthor() != null ? mapAuthor(post.getAuthor()) : null)
                .category(post.getCategory() != null ? mapCategory(post.getCategory()) : null)
                .tags(post.getTags().stream().map(this::mapTag).collect(Collectors.toSet()))
                .featuredMediaUrl(post.getFeaturedMediaUrl())
                .featuredMediaAltText(post.getFeaturedMediaAltText())
                .isIndexable(post.isIndexable())
                .readingTimeMinutes(post.getReadingTimeMinutes())
                .publishedAt(post.getPublishedAt())
                .scheduledPublishAt(post.getScheduledPublishAt())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private BlogDtos.BlogPostDetailResponse mapToDetailResponse(BlogPost post) {
        return BlogDtos.BlogPostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .summary(post.getSummary())
                .content(post.getContent())
                .status(post.getStatus())
                .author(post.getAuthor() != null ? mapAuthor(post.getAuthor()) : null)
                .category(post.getCategory() != null ? mapCategory(post.getCategory()) : null)
                .tags(post.getTags().stream().map(this::mapTag).collect(Collectors.toSet()))
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

    private BlogDtos.BlogCategoryResponse mapCategory(BlogCategory category) {
        return BlogDtos.BlogCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .build();
    }

    private BlogDtos.BlogAuthorResponse mapAuthor(BlogAuthor author) {
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

    private BlogDtos.BlogTagResponse mapTag(BlogTag tag) {
        return BlogDtos.BlogTagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .slug(tag.getSlug())
                .build();
    }
}
