package com.sporekart.content;

import com.sporekart.content.application.BlogContentService;
import com.sporekart.content.domain.*;
import com.sporekart.content.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class BlogContentModuleTest {

    @Autowired
    private BlogContentService blogService;

    @Autowired
    private BlogPostRepository postRepository;

    @Autowired
    private BlogCategoryRepository categoryRepository;

    @Autowired
    private BlogAuthorRepository authorRepository;

    @Autowired
    private BlogTagRepository tagRepository;

    private BlogCategory testCategory;
    private BlogAuthor testAuthor;
    private BlogTag testTag;

    @BeforeEach
    void setUp() {
        postRepository.deleteAll();
        categoryRepository.deleteAll();
        authorRepository.deleteAll();
        tagRepository.deleteAll();

        testCategory = blogService.createCategory("Cultivation Guides", "cultivation-guides", "Mushroom growing tutorials");
        testAuthor = blogService.createAuthor("Dr. Mycologist", "dr-mycologist", "Expert mycologist", "https://example.com/avatar.jpg", "dr@sporekart.in");
        testTag = blogService.createTag("Oyster Mushrooms", "oyster-mushrooms");
    }

    @Test
    @Transactional
    void testCreateDraftAndNonIndexability() {
        BlogPost draft = blogService.createPostDraft(
                "Draft Mushroom Guide",
                "draft-mushroom-guide",
                "Summary of draft guide",
                "Draft content body text...",
                testAuthor.getId(),
                testCategory.getId(),
                Set.of(testTag.getId()),
                "https://example.com/image.jpg",
                "Alt text",
                "Draft Meta Title",
                "Draft Meta Description",
                "https://sporekart.com/blog/draft-mushroom-guide"
        );

        assertNotNull(draft);
        assertNotNull(draft.getId());
        assertEquals(BlogPostStatus.DRAFT, draft.getStatus());
        assertFalse(draft.isIndexable());
        assertNull(draft.getPublishedAt());

        // Verify draft post is NOT returned in public published search
        Page<BlogPost> publicPosts = blogService.getPublishedPosts(null, null, null, PageRequest.of(0, 10));
        assertEquals(0, publicPosts.getTotalElements());

        Optional<BlogPost> publicSinglePost = blogService.getPublishedPostBySlug("draft-mushroom-guide");
        assertTrue(publicSinglePost.isEmpty());
    }

    @Test
    @Transactional
    void testPublishPostAndSEOStructuredData() {
        BlogPost draft = blogService.createPostDraft(
                "Mastering Milky Mushrooms",
                "mastering-milky-mushrooms",
                "Complete guide to growing milky mushrooms in warm climates.",
                "Milky mushrooms (Calocybe indica) thrive in high temperatures between 30°C and 38°C...",
                testAuthor.getId(),
                testCategory.getId(),
                Set.of(testTag.getId()),
                "https://sporekart.com/assets/milky.jpg",
                "Milky Mushrooms",
                "Mastering Milky Mushrooms Cultivation",
                "Learn how to grow milky mushrooms in warm climates.",
                "https://sporekart.com/blog/mastering-milky-mushrooms"
        );

        BlogPost published = blogService.publishPost(draft.getId());
        assertEquals(BlogPostStatus.PUBLISHED, published.getStatus());
        assertTrue(published.isIndexable());
        assertNotNull(published.getPublishedAt());

        // Verify returned in public search query
        Page<BlogPost> publicPosts = blogService.getPublishedPosts("cultivation-guides", "oyster-mushrooms", "Milky", PageRequest.of(0, 10));
        assertEquals(1, publicPosts.getTotalElements());
        assertEquals("Mastering Milky Mushrooms", publicPosts.getContent().get(0).getTitle());

        // Verify JSON-LD Article and Breadcrumb structured data generation
        String articleJsonLd = published.generateArticleStructuredData();
        assertNotNull(articleJsonLd);
        assertTrue(articleJsonLd.contains("\"@type\": \"BlogPosting\""));
        assertTrue(articleJsonLd.contains("\"headline\": \"Mastering Milky Mushrooms\""));
        assertTrue(articleJsonLd.contains("\"name\": \"Dr. Mycologist\""));

        String breadcrumbJsonLd = published.generateBreadcrumbStructuredData();
        assertNotNull(breadcrumbJsonLd);
        assertTrue(breadcrumbJsonLd.contains("\"@type\": \"BreadcrumbList\""));
        assertTrue(breadcrumbJsonLd.contains("\"name\": \"Cultivation Guides\""));
        assertTrue(breadcrumbJsonLd.contains("\"name\": \"Mastering Milky Mushrooms\""));
    }

    @Test
    @Transactional
    void testScheduledPostPublishingWorkflow() {
        BlogPost post = blogService.createPostDraft(
                "Future Spawn Storage Tips",
                "future-spawn-storage-tips",
                "How to store spawn seeds long term",
                "Content about spawn seed refrigeration...",
                testAuthor.getId(),
                testCategory.getId(),
                Set.of(testTag.getId()),
                null, null, null, null, null
        );

        // Verify scheduling in past throws exception
        assertThrows(IllegalArgumentException.class, () -> {
            blogService.schedulePost(post.getId(), ZonedDateTime.now().minusHours(1));
        });

        // Schedule for future
        ZonedDateTime futureSchedule = ZonedDateTime.now().plusSeconds(5);
        BlogPost scheduled = blogService.schedulePost(post.getId(), futureSchedule);
        assertEquals(BlogPostStatus.SCHEDULED, scheduled.getStatus());
        assertFalse(scheduled.isIndexable());

        // Before background runner executes, public endpoint returns empty
        Optional<BlogPost> beforeProcess = blogService.getPublishedPostBySlug("future-spawn-storage-tips");
        assertTrue(beforeProcess.isEmpty());

        // Simulate time passing by updating scheduledPublishAt to past
        scheduled.setScheduledPublishAt(ZonedDateTime.now().minusMinutes(1));
        postRepository.save(scheduled);

        // Run automated scheduled publisher
        blogService.processScheduledPosts();

        // Verify post is now PUBLISHED and indexable
        BlogPost afterProcess = blogService.getPostByIdForAdmin(post.getId()).orElseThrow();
        assertEquals(BlogPostStatus.PUBLISHED, afterProcess.getStatus());
        assertTrue(afterProcess.isIndexable());

        Optional<BlogPost> publicPost = blogService.getPublishedPostBySlug("future-spawn-storage-tips");
        assertTrue(publicPost.isPresent());
    }
}
