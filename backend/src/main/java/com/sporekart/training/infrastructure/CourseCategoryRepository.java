package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseCategoryRepository extends JpaRepository<CourseCategory, UUID> {
    Optional<CourseCategory> findBySlug(String slug);
}
