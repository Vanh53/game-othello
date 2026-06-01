package com.game.ai_model_service.repository;

import com.game.ai_model_service.entity.AiModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiModelRepository extends JpaRepository<AiModel, UUID> {

    boolean existsByName(String name);

    List<AiModel> findAllByIsDeletedFalse();
}
