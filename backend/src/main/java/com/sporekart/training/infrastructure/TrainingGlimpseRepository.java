package com.sporekart.training.infrastructure;

import com.sporekart.training.domain.TrainingGlimpse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TrainingGlimpseRepository extends JpaRepository<TrainingGlimpse, String> {
    List<TrainingGlimpse> findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
    List<TrainingGlimpse> findAllByOrderByDisplayOrderAscCreatedAtDesc();
}
