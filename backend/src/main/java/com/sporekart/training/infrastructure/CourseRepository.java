package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    Optional<Course> findBySlug(String slug);
    List<Course> findByIsActiveTrue();
    List<Course> findByCategoryIdAndIsActiveTrue(UUID categoryId);
    List<Course> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);
}
