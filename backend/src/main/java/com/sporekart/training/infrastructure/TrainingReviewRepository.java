package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.TrainingReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrainingReviewRepository extends JpaRepository<TrainingReview, UUID> {

    List<TrainingReview> findByCourseIdAndStatusOrderByCreatedAtDesc(UUID courseId, String status);

    List<TrainingReview> findByCourseIdOrderByCreatedAtDesc(UUID courseId);

    List<TrainingReview> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<TrainingReview> findByUserIdAndEnrollmentId(UUID userId, UUID enrollmentId);

    boolean existsByUserIdAndEnrollmentId(UUID userId, UUID enrollmentId);

    @Query("SELECT AVG(r.rating) FROM TrainingReview r WHERE r.course.id = :courseId AND r.status = 'PUBLISHED'")
    Double getAverageRatingForCourse(@Param("courseId") UUID courseId);

    @Query("SELECT AVG(r.instructorRating) FROM TrainingReview r WHERE r.course.id = :courseId AND r.status = 'PUBLISHED' AND r.instructorRating IS NOT NULL")
    Double getAverageInstructorRatingForCourse(@Param("courseId") UUID courseId);

    @Query("SELECT COUNT(r) FROM TrainingReview r WHERE r.course.id = :courseId AND r.status = 'PUBLISHED'")
    Long getReviewCountForCourse(@Param("courseId") UUID courseId);

    @Query("SELECT r.rating, COUNT(r) FROM TrainingReview r WHERE r.course.id = :courseId AND r.status = 'PUBLISHED' GROUP BY r.rating")
    List<Object[]> getRatingDistributionForCourse(@Param("courseId") UUID courseId);
}
