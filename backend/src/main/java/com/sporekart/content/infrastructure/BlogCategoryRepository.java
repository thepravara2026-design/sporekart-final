package com.sporekart.content.infrastructure;

import com.sporekart.content.domain.BlogCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface BlogCategoryRepository extends JpaRepository<BlogCategory, UUID> {
    Optional<BlogCategory> findBySlug(String slug);
}
