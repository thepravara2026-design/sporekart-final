package com.sporekart.media.infrastructure;

import com.sporekart.media.domain.MediaCourseLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MediaCourseLinkRepository extends JpaRepository<MediaCourseLink, UUID> {
    List<MediaCourseLink> findByCourseId(UUID courseId);
    List<MediaCourseLink> findByMediaId(UUID mediaId);
    void deleteByMediaId(UUID mediaId);
}
