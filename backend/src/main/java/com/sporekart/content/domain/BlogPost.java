package com.sporekart.content.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "blog_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogPost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BlogPostStatus status = BlogPostStatus.DRAFT;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id")
    private BlogAuthor author;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private BlogCategory category;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "blog_post_tags",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<BlogTag> tags = new HashSet<>();

    @Column(name = "featured_media_url")
    private String featuredMediaUrl;

    @Column(name = "featured_media_alt_text")
    private String featuredMediaAltText;

    @Column(name = "meta_title")
    private String metaTitle;

    @Column(name = "meta_description", columnDefinition = "TEXT")
    private String metaDescription;

    @Column(name = "canonical_url")
    private String canonicalUrl;

    @Column(name = "is_indexable", nullable = false)
    @Builder.Default
    private boolean isIndexable = false;

    @Column(name = "reading_time_minutes")
    @Builder.Default
    private Integer readingTimeMinutes = 5;

    @Column(name = "published_at")
    private ZonedDateTime publishedAt;

    @Column(name = "scheduled_publish_at")
    private ZonedDateTime scheduledPublishAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (canonicalUrl == null && slug != null) {
            canonicalUrl = "https://sporekart.com/blog/" + slug;
        }
        if (metaTitle == null) {
            metaTitle = title;
        }
        if (metaDescription == null) {
            metaDescription = summary != null ? summary : (title + " - Read on Sporekart Blog.");
        }
        calculateReadingTime();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateReadingTime();
    }

    public void calculateReadingTime() {
        if (content != null && !content.isBlank()) {
            int wordCount = content.split("\\s+").length;
            this.readingTimeMinutes = Math.max(1, (int) Math.ceil(wordCount / 200.0));
        }
    }

    public void publish() {
        this.status = BlogPostStatus.PUBLISHED;
        this.isIndexable = true;
        if (this.publishedAt == null) {
            this.publishedAt = ZonedDateTime.now();
        }
    }

    public void schedule(ZonedDateTime publishAt) {
        this.status = BlogPostStatus.SCHEDULED;
        this.isIndexable = false;
        this.scheduledPublishAt = publishAt;
    }

    public String generateArticleStructuredData() {
        String siteUrl = "https://sporekart.com";
        String postUrl = canonicalUrl != null ? canonicalUrl : siteUrl + "/blog/" + slug;
        String pubDate = publishedAt != null ? publishedAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String authorName = author != null ? author.getName() : "Sporekart Editorial Team";
        String imageUrl = featuredMediaUrl != null ? featuredMediaUrl : siteUrl + "/assets/default-blog-hero.jpg";

        return "{\n" +
                "  \"@context\": \"https://schema.org\",\n" +
                "  \"@type\": \"BlogPosting\",\n" +
                "  \"mainEntityOfPage\": {\n" +
                "    \"@type\": \"WebPage\",\n" +
                "    \"@id\": \"" + escapeJson(postUrl) + "\"\n" +
                "  },\n" +
                "  \"headline\": \"" + escapeJson(title) + "\",\n" +
                "  \"description\": \"" + escapeJson(metaDescription != null ? metaDescription : summary) + "\",\n" +
                "  \"image\": [\"" + escapeJson(imageUrl) + "\"],\n" +
                "  \"datePublished\": \"" + pubDate + "\",\n" +
                "  \"dateModified\": \"" + (updatedAt != null ? updatedAt.atZone(java.time.ZoneId.systemDefault()).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : pubDate) + "\",\n" +
                "  \"author\": {\n" +
                "    \"@type\": \"Person\",\n" +
                "    \"name\": \"" + escapeJson(authorName) + "\"\n" +
                "  },\n" +
                "  \"publisher\": {\n" +
                "    \"@type\": \"Organization\",\n" +
                "    \"name\": \"Sporekart\",\n" +
                "    \"logo\": {\n" +
                "      \"@type\": \"ImageObject\",\n" +
                "      \"url\": \"" + siteUrl + "/logo.png\"\n" +
                "    }\n" +
                "  }\n" +
                "}";
    }

    public String generateBreadcrumbStructuredData() {
        String siteUrl = "https://sporekart.com";
        String categoryName = category != null ? category.getName() : "General";
        String categorySlug = category != null ? category.getSlug() : "general";

        return "{\n" +
                "  \"@context\": \"https://schema.org\",\n" +
                "  \"@type\": \"BreadcrumbList\",\n" +
                "  \"itemListElement\": [\n" +
                "    {\n" +
                "      \"@type\": \"ListItem\",\n" +
                "      \"position\": 1,\n" +
                "      \"name\": \"Home\",\n" +
                "      \"item\": \"" + siteUrl + "\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"@type\": \"ListItem\",\n" +
                "      \"position\": 2,\n" +
                "      \"name\": \"Blog\",\n" +
                "      \"item\": \"" + siteUrl + "/blog\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"@type\": \"ListItem\",\n" +
                "      \"position\": 3,\n" +
                "      \"name\": \"" + escapeJson(categoryName) + "\",\n" +
                "      \"item\": \"" + siteUrl + "/blog/category/" + escapeJson(categorySlug) + "\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"@type\": \"ListItem\",\n" +
                "      \"position\": 4,\n" +
                "      \"name\": \"" + escapeJson(title) + "\",\n" +
                "      \"item\": \"" + escapeJson(canonicalUrl != null ? canonicalUrl : siteUrl + "/blog/" + slug) + "\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
