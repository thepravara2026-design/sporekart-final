package com.sporekart.content.api;

import com.sporekart.content.application.BlogContentService;
import com.sporekart.content.domain.*;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/content")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminContentController {

    private final BlogContentService blogService;

    // --- Post Management ---
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<BlogDtos.BlogPostSummaryResponse>>> getAllPosts(
            @RequestParam(required = false) BlogPostStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        Page<BlogPost> posts = blogService.getAllPostsForAdmin(status, pageRequest);
        Page<BlogDtos.BlogPostSummaryResponse> response = posts.map(this::mapToSummaryResponse);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> createPostDraft(
            @Valid @RequestBody BlogDtos.CreatePostRequest request
    ) {
        BlogPost post = blogService.createPostDraft(
                request.getTitle(),
                request.getSlug(),
                request.getSummary(),
                request.getContent(),
                request.getAuthorId(),
                request.getCategoryId(),
                request.getTagIds(),
                request.getFeaturedMediaUrl(),
                request.getFeaturedMediaAltText(),
                request.getMetaTitle(),
                request.getMetaDescription(),
                request.getCanonicalUrl()
        );
        return ResponseEntity.ok(ApiResponse.success(mapToDetailResponse(post)));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> getPostById(@PathVariable UUID id) {
        BlogPost post = blogService.getPostByIdForAdmin(id)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(mapToDetailResponse(post)));
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> updatePost(
            @PathVariable UUID id,
            @RequestBody BlogDtos.UpdatePostRequest request
    ) {
        BlogPost post = blogService.updatePost(
                id,
                request.getTitle(),
                request.getSlug(),
                request.getSummary(),
                request.getContent(),
                request.getAuthorId(),
                request.getCategoryId(),
                request.getTagIds(),
                request.getFeaturedMediaUrl(),
                request.getFeaturedMediaAltText(),
                request.getMetaTitle(),
                request.getMetaDescription(),
                request.getCanonicalUrl()
        );
        return ResponseEntity.ok(ApiResponse.success(mapToDetailResponse(post)));
    }

    @PostMapping("/posts/{id}/publish")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> publishPost(@PathVariable UUID id) {
        BlogPost post = blogService.publishPost(id);
        return ResponseEntity.ok(ApiResponse.success(mapToDetailResponse(post)));
    }

    @PostMapping("/posts/{id}/schedule")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> schedulePost(
            @PathVariable UUID id,
            @RequestBody BlogDtos.SchedulePostRequest request
    ) {
        BlogPost post = blogService.schedulePost(id, request.getScheduledPublishAt());
        return ResponseEntity.ok(ApiResponse.success(mapToDetailResponse(post)));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<String>> deletePost(@PathVariable UUID id) {
        blogService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Blog post deleted successfully"));
    }

    // --- Taxonomy Management ---
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<BlogDtos.BlogCategoryResponse>> createCategory(
            @Valid @RequestBody BlogDtos.CreateCategoryRequest request
    ) {
        BlogCategory category = blogService.createCategory(request.getName(), request.getSlug(), request.getDescription());
        return ResponseEntity.ok(ApiResponse.success(mapCategory(category)));
    }

    @PostMapping("/authors")
    public ResponseEntity<ApiResponse<BlogDtos.BlogAuthorResponse>> createAuthor(
            @Valid @RequestBody BlogDtos.CreateAuthorRequest request
    ) {
        BlogAuthor author = blogService.createAuthor(request.getName(), request.getSlug(), request.getBio(), request.getAvatarUrl(), request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(mapAuthor(author)));
    }

    @PostMapping("/tags")
    public ResponseEntity<ApiResponse<BlogDtos.BlogTagResponse>> createTag(
            @Valid @RequestBody BlogDtos.CreateTagRequest request
    ) {
        BlogTag tag = blogService.createTag(request.getName(), request.getSlug());
        return ResponseEntity.ok(ApiResponse.success(mapTag(tag)));
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
