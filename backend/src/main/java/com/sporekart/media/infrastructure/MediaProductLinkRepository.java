package com.sporekart.media.infrastructure;

import com.sporekart.media.domain.MediaProductLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MediaProductLinkRepository extends JpaRepository<MediaProductLink, UUID> {
    List<MediaProductLink> findByProductIdOrderByDisplayOrderAsc(UUID productId);
    List<MediaProductLink> findByMediaId(UUID mediaId);
    void deleteByMediaId(UUID mediaId);
}
