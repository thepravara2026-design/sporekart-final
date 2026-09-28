package com.sporekart.content.application;

import com.sporekart.content.domain.*;
import com.sporekart.content.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.ZonedDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlogContentServiceUnitTest {

    @Mock
    private BlogCategoryRepository categoryRepository;
    @Mock
    private BlogAuthorRepository authorRepository;
    @Mock
    private BlogTagRepository tagRepository;
    @Mock
    private BlogPostRepository postRepository;

    @InjectMocks
    private BlogContentService blogContentService;

    private UUID postId;
    private BlogPost testPost;

    @BeforeEach
    void setUp() {
        postId = UUID.randomUUID();

        testPost = BlogPost.builder()
                .id(postId)
                .title("Mushroom Cultivation Guide")
                .slug("mushroom-cultivation-guide")
                .summary("Learn how to grow oyster mushrooms at home.")
                .content("<p>Content here...</p>")
                .status(BlogPostStatus.DRAFT)
                .build();
    }

    @Test
    @DisplayName("CNT-1: Create category returns existing or saves new category")
    void CNT_1_createCategory() {
        when(categoryRepository.findBySlug("cultivation")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(i -> i.getArgument(0));

        BlogCategory cat = blogContentService.createCategory("Cultivation", "cultivation", "Description");

        assertNotNull(cat);
        assertEquals("Cultivation", cat.getName());
    }

    @Test
    @DisplayName("CNT-2: Create post draft initializes DRAFT status and saves entity")
    void CNT_2_createPostDraft() {
        when(postRepository.save(any(BlogPost.class))).thenAnswer(i -> i.getArgument(0));

        BlogPost post = blogContentService.createPostDraft(
                "Oyster Mushroom Growing", "oyster-growing", "Summary", "Content",
                null, null, null, null, null, null, null, null
        );

        assertNotNull(post);
        assertEquals(BlogPostStatus.DRAFT, post.getStatus());
        verify(postRepository).save(any(BlogPost.class));
    }

    @Test
    @DisplayName("CNT-3: Publish post changes status to PUBLISHED")
    void CNT_3_publishPost() {
        when(postRepository.findById(postId)).thenReturn(Optional.of(testPost));
        when(postRepository.save(any(BlogPost.class))).thenAnswer(i -> i.getArgument(0));

        BlogPost published = blogContentService.publishPost(postId);

        assertEquals(BlogPostStatus.PUBLISHED, published.getStatus());
        assertNotNull(published.getPublishedAt());
    }

    @Test
    @DisplayName("CNT-4: Schedule post fails if scheduled time is in the past")
    void CNT_4_schedulePost_pastDateFails() {
        when(postRepository.findById(postId)).thenReturn(Optional.of(testPost));

        ZonedDateTime pastDate = ZonedDateTime.now().minusHours(1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                blogContentService.schedulePost(postId, pastDate)
        );
        assertTrue(ex.getMessage().contains("Scheduled publish time must be in the future"));
    }

    @Test
    @DisplayName("CNT-5: Process scheduled posts publishes due posts")
    void CNT_5_processScheduledPosts() {
        BlogPost scheduledPost = BlogPost.builder()
                .id(UUID.randomUUID())
                .title("Scheduled Post")
                .status(BlogPostStatus.SCHEDULED)
                .scheduledPublishAt(ZonedDateTime.now().minusMinutes(5))
                .build();

        when(postRepository.findDueScheduledPosts(any())).thenReturn(List.of(scheduledPost));
        when(postRepository.save(any(BlogPost.class))).thenAnswer(i -> i.getArgument(0));

        blogContentService.processScheduledPosts();

        assertEquals(BlogPostStatus.PUBLISHED, scheduledPost.getStatus());
        verify(postRepository).save(scheduledPost);
    }

    @Test
    @DisplayName("CNT-6: Get published posts returns paginated published blog posts")
    void CNT_6_getPublishedPosts() {
        Page<BlogPost> page = new PageImpl<>(List.of(testPost));
        when(postRepository.findPublishedPosts(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        Page<BlogPost> result = blogContentService.getPublishedPosts(null, null, null, Pageable.unpaged());

        assertEquals(1, result.getTotalElements());
    }
}
