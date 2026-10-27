package com.sporekart.shared.api;

import com.sporekart.catalog.domain.Product;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.content.domain.BlogPost;
import com.sporekart.content.domain.BlogPostStatus;
import com.sporekart.content.infrastructure.BlogPostRepository;
import com.sporekart.training.domain.Course;
import com.sporekart.training.infrastructure.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/seo")
@RequiredArgsConstructor
public class SeoController {

    private final ProductRepository productRepository;
    private final CourseRepository courseRepository;
    private final BlogPostRepository blogPostRepository;

    private volatile String cachedSitemapXml = null;
    private volatile long sitemapCacheTimestamp = 0;
    private static final long CACHE_TTL_MS = 120_000; // 2 minutes TTL

    public void invalidateSitemapCache() {
        this.cachedSitemapXml = null;
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getRobotsTxt() {
        String content = """
                # Sporekart Robots.txt for Search Crawlers (Google, Bing, Perplexity, ChatGPT)
                User-agent: *
                Allow: /
                Allow: /catalog/
                Allow: /products/
                Allow: /training/
                Allow: /blog/
                Disallow: /admin/
                Disallow: /dashboard/
                Disallow: /cart/
                Disallow: /checkout/
                Disallow: /api/
                
                Sitemap: https://sporekart.in/sitemap.xml
                """;
        return ResponseEntity.ok(content);
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSitemapXml() {
        long now = System.currentTimeMillis();
        if (cachedSitemapXml != null && (now - sitemapCacheTimestamp < CACHE_TTL_MS)) {
            return ResponseEntity.ok(cachedSitemapXml);
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"\n");
        sb.append("        xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\n");

        // Static core routes
        addUrl(sb, "https://sporekart.in/", "1.0", "daily");
        addUrl(sb, "https://sporekart.in/products", "0.9", "daily");
        addUrl(sb, "https://sporekart.in/products/fresh-mushrooms", "0.9", "daily");
        addUrl(sb, "https://sporekart.in/products/dry-mushrooms", "0.8", "daily");
        addUrl(sb, "https://sporekart.in/products/mushroom-spawn", "0.9", "daily");
        addUrl(sb, "https://sporekart.in/products/growing-kits", "0.8", "daily");
        addUrl(sb, "https://sporekart.in/training", "0.9", "weekly");
        addUrl(sb, "https://sporekart.in/about", "0.7", "monthly");
        addUrl(sb, "https://sporekart.in/contact", "0.7", "monthly");
        addUrl(sb, "https://sporekart.in/blog", "0.8", "daily");
        addUrl(sb, "https://sporekart.in/mushroom-cultivation-guide", "0.8", "weekly");
        addUrl(sb, "https://sporekart.in/mushroom-spawn-guide", "0.8", "weekly");

        try {
            // Dynamic Products with Image Sitemap
            List<Product> products = productRepository.findAll();
            for (Product product : products) {
                if (product != null && product.getSlug() != null && !product.getSlug().isBlank()) {
                    sb.append("  <url>\n");
                    sb.append("    <loc>https://sporekart.in/product/").append(escapeXml(product.getSlug())).append("</loc>\n");
                    sb.append("    <lastmod>").append(LocalDate.now()).append("</lastmod>\n");
                    sb.append("    <changefreq>weekly</changefreq>\n");
                    sb.append("    <priority>0.8</priority>\n");
                    sb.append("  </url>\n");
                }
            }

            // Dynamic Courses
            List<Course> courses = courseRepository.findByIsActiveTrue();
            for (Course course : courses) {
                if (course != null && course.getSlug() != null && !course.getSlug().isBlank()) {
                    sb.append("  <url>\n");
                    sb.append("    <loc>https://sporekart.in/training/").append(escapeXml(course.getSlug())).append("</loc>\n");
                    sb.append("    <lastmod>").append(LocalDate.now()).append("</lastmod>\n");
                    sb.append("    <changefreq>weekly</changefreq>\n");
                    sb.append("    <priority>0.8</priority>\n");
                    sb.append("  </url>\n");
                }
            }

            // Dynamic Published Blog Posts (strictly indexable posts)
            List<BlogPost> posts = blogPostRepository.findByStatus(BlogPostStatus.PUBLISHED);
            for (BlogPost post : posts) {
                if (post != null && post.getSlug() != null && !post.getSlug().isBlank() && post.isIndexable()) {
                    sb.append("  <url>\n");
                    sb.append("    <loc>https://sporekart.in/blog/").append(escapeXml(post.getSlug())).append("</loc>\n");
                    sb.append("    <lastmod>").append(LocalDate.now()).append("</lastmod>\n");
                    sb.append("    <changefreq>weekly</changefreq>\n");
                    sb.append("    <priority>0.8</priority>\n");
                    if (post.getFeaturedMediaUrl() != null && !post.getFeaturedMediaUrl().isBlank()) {
                        sb.append("    <image:image>\n");
                        sb.append("      <image:loc>").append(escapeXml(post.getFeaturedMediaUrl())).append("</image:loc>\n");
                        sb.append("      <image:title>").append(escapeXml(post.getTitle() != null ? post.getTitle() : "Article")).append("</image:title>\n");
                        sb.append("    </image:image>\n");
                    }
                    sb.append("  </url>\n");
                }
            }
        } catch (Exception e) {
            log.warn("Non-fatal exception while augmenting dynamic sitemap URLs: {}", e.getMessage());
        }

        sb.append("</urlset>\n");
        String xml = sb.toString();
        this.cachedSitemapXml = xml;
        this.sitemapCacheTimestamp = now;
        return ResponseEntity.ok(xml);
    }

    private void addUrl(StringBuilder sb, String loc, String priority, String changefreq) {
        sb.append("  <url>\n");
        sb.append("    <loc>").append(loc).append("</loc>\n");
        sb.append("    <lastmod>").append(LocalDate.now()).append("</lastmod>\n");
        sb.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        sb.append("    <priority>").append(priority).append("</priority>\n");
        sb.append("  </url>\n");
    }

    private String escapeXml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&apos;");
    }
}
