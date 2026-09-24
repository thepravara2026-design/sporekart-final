package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.Course;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    @EntityGraph(attributePaths = {"category"})
    Optional<Course> findBySlug(String slug);

    @EntityGraph(attributePaths = {"category"})
    List<Course> findByIsActiveTrue();

    @EntityGraph(attributePaths = {"category"})
    List<Course> findByCategoryIdAndIsActiveTrue(UUID categoryId);

    List<Course> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);
}
