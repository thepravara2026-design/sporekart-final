package com.sporekart.content.infrastructure;

import com.sporekart.content.domain.BlogAuthor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface BlogAuthorRepository extends JpaRepository<BlogAuthor, UUID> {
    Optional<BlogAuthor> findBySlug(String slug);
}
