package com.sporekart.content.infrastructure;

import com.sporekart.content.domain.BlogPost;
import com.sporekart.content.domain.BlogPostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {

    Optional<BlogPost> findBySlug(String slug);

    @Query("SELECT p FROM BlogPost p WHERE p.slug = :slug AND p.status = 'PUBLISHED' AND (p.publishedAt IS NULL OR p.publishedAt <= :now)")
    Optional<BlogPost> findPublishedBySlug(@Param("slug") String slug, @Param("now") ZonedDateTime now);

    @Query("SELECT p FROM BlogPost p WHERE p.status = 'PUBLISHED' AND (p.publishedAt IS NULL OR p.publishedAt <= :now) " +
           "AND (:categorySlug IS NULL OR p.category.slug = :categorySlug) " +
           "AND (:tagSlug IS NULL OR EXISTS (SELECT t FROM p.tags t WHERE t.slug = :tagSlug)) " +
           "AND (:query IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.summary) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<BlogPost> findPublishedPosts(
            @Param("categorySlug") String categorySlug,
            @Param("tagSlug") String tagSlug,
            @Param("query") String query,
            @Param("now") ZonedDateTime now,
            Pageable pageable
    );

    @Query("SELECT p FROM BlogPost p WHERE p.status = 'SCHEDULED' AND p.scheduledPublishAt IS NOT NULL AND p.scheduledPublishAt <= :now")
    List<BlogPost> findDueScheduledPosts(@Param("now") ZonedDateTime now);

    Page<BlogPost> findByStatus(BlogPostStatus status, Pageable pageable);
}
