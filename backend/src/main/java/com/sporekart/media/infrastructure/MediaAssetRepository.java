package com.sporekart.media.infrastructure;

import com.sporekart.media.domain.MediaAsset;
import com.sporekart.media.domain.MediaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {
    Optional<MediaAsset> findByStorageKey(String storageKey);
    Optional<MediaAsset> findByIdAndIsDeletedFalse(UUID id);
    List<MediaAsset> findByStatusAndIsDeletedFalse(MediaStatus status);
}
