package com.sporekart.content.api;

import com.sporekart.content.application.BlogContentService;
import com.sporekart.content.application.BlogMapper;
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
        Page<BlogDtos.BlogPostSummaryResponse> response = posts.map(BlogMapper::toSummaryResponse);
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
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toDetailResponse(post)));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> getPostById(@PathVariable UUID id) {
        BlogPost post = blogService.getPostByIdForAdmin(id)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toDetailResponse(post)));
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> updatePost(
            @PathVariable UUID id,
            @Valid @RequestBody BlogDtos.UpdatePostRequest request
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
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toDetailResponse(post)));
    }

    @PostMapping("/posts/{id}/publish")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> publishPost(@PathVariable UUID id) {
        BlogPost post = blogService.publishPost(id);
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toDetailResponse(post)));
    }

    @PostMapping("/posts/{id}/schedule")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> schedulePost(
            @PathVariable UUID id,
            @Valid @RequestBody BlogDtos.SchedulePostRequest request
    ) {
        BlogPost post = blogService.schedulePost(id, request.getScheduledPublishAt());
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toDetailResponse(post)));
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
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toCategoryResponse(category)));
    }

    @PostMapping("/authors")
    public ResponseEntity<ApiResponse<BlogDtos.BlogAuthorResponse>> createAuthor(
            @Valid @RequestBody BlogDtos.CreateAuthorRequest request
    ) {
        BlogAuthor author = blogService.createAuthor(request.getName(), request.getSlug(), request.getBio(), request.getAvatarUrl(), request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toAuthorResponse(author)));
    }

    @PostMapping("/tags")
    public ResponseEntity<ApiResponse<BlogDtos.BlogTagResponse>> createTag(
            @Valid @RequestBody BlogDtos.CreateTagRequest request
    ) {
        BlogTag tag = blogService.createTag(request.getName(), request.getSlug());
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toTagResponse(tag)));
    }
}
