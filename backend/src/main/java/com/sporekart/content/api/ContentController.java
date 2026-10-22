package com.sporekart.content.api;

import com.sporekart.content.application.BlogContentService;
import com.sporekart.content.application.BlogMapper;
import com.sporekart.content.domain.BlogAuthor;
import com.sporekart.content.domain.BlogCategory;
import com.sporekart.content.domain.BlogPost;
import com.sporekart.content.domain.BlogTag;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shared.application.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/content")
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
        Page<BlogDtos.BlogPostSummaryResponse> responsePage = postsPage.map(BlogMapper::toSummaryResponse);

        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    @GetMapping("/posts/{slug}")
    public ResponseEntity<ApiResponse<BlogDtos.BlogPostDetailResponse>> getPostBySlug(@PathVariable String slug) {
        BlogPost post = blogService.getPublishedPostBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found or not published: " + slug));
        return ResponseEntity.ok(ApiResponse.success(BlogMapper.toDetailResponse(post)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<BlogDtos.BlogCategoryResponse>>> getCategories() {
        List<BlogCategory> categories = blogService.getAllCategories();
        List<BlogDtos.BlogCategoryResponse> response = categories.stream().map(BlogMapper::toCategoryResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<List<BlogDtos.BlogTagResponse>>> getTags() {
        List<BlogTag> tags = blogService.getAllTags();
        List<BlogDtos.BlogTagResponse> response = tags.stream().map(BlogMapper::toTagResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/authors")
    public ResponseEntity<ApiResponse<List<BlogDtos.BlogAuthorResponse>>> getAuthors() {
        List<BlogAuthor> authors = blogService.getAllAuthors();
        List<BlogDtos.BlogAuthorResponse> response = authors.stream().map(BlogMapper::toAuthorResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
