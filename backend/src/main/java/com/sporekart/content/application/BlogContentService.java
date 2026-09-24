package com.sporekart.content.application;

import com.sporekart.content.domain.*;
import com.sporekart.content.infrastructure.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogContentService {

    private final BlogCategoryRepository categoryRepository;
    private final BlogAuthorRepository authorRepository;
    private final BlogTagRepository tagRepository;
    private final BlogPostRepository postRepository;

    // --- Category Management ---
    @Transactional
    public BlogCategory createCategory(String name, String slug, String description) {
        return categoryRepository.findBySlug(slug)
                .orElseGet(() -> categoryRepository.save(BlogCategory.builder()
                        .name(name)
                        .slug(slug)
                        .description(description)
                        .build()));
    }

    @Transactional(readOnly = true)
    public List<BlogCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<BlogCategory> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }

    // --- Author Management ---
    @Transactional
    public BlogAuthor createAuthor(String name, String slug, String bio, String avatarUrl, String email) {
        return authorRepository.findBySlug(slug)
                .orElseGet(() -> authorRepository.save(BlogAuthor.builder()
                        .name(name)
                        .slug(slug)
                        .bio(bio)
                        .avatarUrl(avatarUrl)
                        .email(email)
                        .build()));
    }

    @Transactional(readOnly = true)
    public List<BlogAuthor> getAllAuthors() {
        return authorRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<BlogAuthor> getAuthorBySlug(String slug) {
        return authorRepository.findBySlug(slug);
    }

    // --- Tag Management ---
    @Transactional
    public BlogTag createTag(String name, String slug) {
        return tagRepository.findBySlug(slug)
                .orElseGet(() -> tagRepository.save(BlogTag.builder()
                        .name(name)
                        .slug(slug)
                        .build()));
    }

    @Transactional(readOnly = true)
    public List<BlogTag> getAllTags() {
        return tagRepository.findAll();
    }

    // --- Post Management ---
    @Transactional
    public BlogPost createPostDraft(
            String title,
            String slug,
            String summary,
            String content,
            UUID authorId,
            UUID categoryId,
            Set<UUID> tagIds,
            String featuredMediaUrl,
            String featuredMediaAltText,
            String metaTitle,
            String metaDescription,
            String canonicalUrl
    ) {
        BlogAuthor author = authorId != null ? authorRepository.findById(authorId).orElse(null) : null;
        BlogCategory category = categoryId != null ? categoryRepository.findById(categoryId).orElse(null) : null;
        Set<BlogTag> tags = tagIds != null && !tagIds.isEmpty() ? new HashSet<>(tagRepository.findAllById(tagIds)) : new HashSet<>();

        BlogPost post = BlogPost.builder()
                .title(title)
                .slug(slug)
                .summary(summary)
                .content(content)
                .status(BlogPostStatus.DRAFT)
                .author(author)
                .category(category)
                .tags(tags)
                .featuredMediaUrl(featuredMediaUrl)
                .featuredMediaAltText(featuredMediaAltText)
                .metaTitle(metaTitle != null ? metaTitle : title)
                .metaDescription(metaDescription != null ? metaDescription : summary)
                .canonicalUrl(canonicalUrl)
                .isIndexable(false)
                .build();

        return postRepository.save(post);
    }

    @Transactional
    public BlogPost updatePost(
            UUID postId,
            String title,
            String slug,
            String summary,
            String content,
            UUID authorId,
            UUID categoryId,
            Set<UUID> tagIds,
            String featuredMediaUrl,
            String featuredMediaAltText,
            String metaTitle,
            String metaDescription,
            String canonicalUrl
    ) {
        BlogPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found: " + postId));

        if (title != null) post.setTitle(title);
        if (slug != null) post.setSlug(slug);
        if (summary != null) post.setSummary(summary);
        if (content != null) post.setContent(content);
        if (featuredMediaUrl != null) post.setFeaturedMediaUrl(featuredMediaUrl);
        if (featuredMediaAltText != null) post.setFeaturedMediaAltText(featuredMediaAltText);
        if (metaTitle != null) post.setMetaTitle(metaTitle);
        if (metaDescription != null) post.setMetaDescription(metaDescription);
        if (canonicalUrl != null) post.setCanonicalUrl(canonicalUrl);

        if (authorId != null) {
            post.setAuthor(authorRepository.findById(authorId).orElse(null));
        }
        if (categoryId != null) {
            post.setCategory(categoryRepository.findById(categoryId).orElse(null));
        }
        if (tagIds != null) {
            post.setTags(new HashSet<>(tagRepository.findAllById(tagIds)));
        }

        return postRepository.save(post);
    }

    @Transactional
    public BlogPost publishPost(UUID postId) {
        BlogPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found: " + postId));
        post.publish();
        log.info("Published blog post: {} (slug: {})", post.getTitle(), post.getSlug());
        return postRepository.save(post);
    }

    @Transactional
    public BlogPost schedulePost(UUID postId, ZonedDateTime scheduledPublishAt) {
        BlogPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found: " + postId));
        if (scheduledPublishAt == null || scheduledPublishAt.isBefore(ZonedDateTime.now())) {
            throw new IllegalArgumentException("Scheduled publish time must be in the future");
        }
        post.schedule(scheduledPublishAt);
        log.info("Scheduled blog post '{}' for publishing at {}", post.getTitle(), scheduledPublishAt);
        return postRepository.save(post);
    }

    @Transactional
    public void deletePost(UUID postId) {
        postRepository.deleteById(postId);
    }

    // Scheduled Publisher background runner
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processScheduledPosts() {
        ZonedDateTime now = ZonedDateTime.now();
        List<BlogPost> duePosts = postRepository.findDueScheduledPosts(now);
        for (BlogPost post : duePosts) {
            post.publish();
            postRepository.save(post);
            log.info("Automated Scheduled Publisher: Published due post ID: {}, Title: {}", post.getId(), post.getTitle());
        }
    }

    // --- Public Content Discovery ---
    @Transactional(readOnly = true)
    public Page<BlogPost> getPublishedPosts(String categorySlug, String tagSlug, String query, Pageable pageable) {
        return postRepository.findPublishedPosts(categorySlug, tagSlug, query, ZonedDateTime.now().plusSeconds(5), pageable);
    }

    @Transactional(readOnly = true)
    public Optional<BlogPost> getPublishedPostBySlug(String slug) {
        return postRepository.findPublishedBySlug(slug, ZonedDateTime.now().plusSeconds(5));
    }

    // --- Admin Content Discovery ---
    @Transactional(readOnly = true)
    public Page<BlogPost> getAllPostsForAdmin(BlogPostStatus status, Pageable pageable) {
        if (status != null) {
            return postRepository.findByStatus(status, pageable);
        }
        return postRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Optional<BlogPost> getPostByIdForAdmin(UUID postId) {
        return postRepository.findById(postId);
    }
}
