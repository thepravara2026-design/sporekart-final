package com.sporekart.content.infrastructure;

import com.sporekart.content.domain.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ContentRepository extends JpaRepository<Article, UUID> {
    Optional<Article> findBySlug(String slug);
}
