package com.game.ai_model_service.service;

import com.game.ai_model_service.dto.request.AiModelCreationRequest;
import com.game.ai_model_service.dto.request.AiModelUpdateRequest;
import com.game.ai_model_service.dto.response.AiModelAdminResponse;
import com.game.ai_model_service.dto.response.AiModelResponse;
import com.game.ai_model_service.entity.AiModel;
import com.game.ai_model_service.exception.AppException;
import com.game.ai_model_service.exception.ErrorCode;
import com.game.ai_model_service.mapper.AiModelMapper;
import com.game.ai_model_service.repository.AiModelRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AiModelService {

    AiModelRepository aiModelRepository;
    AiModelMapper aiModelMapper;

    public List<AiModelResponse> getAllAiModels() {
        log.info("Fetching all AI models sorted by difficulty");
        return aiModelMapper.toListAiModelResponse(
                aiModelRepository.findAll().stream()
                        .sorted(Comparator.comparingInt(AiModel::getDifficultyLevel))
                        .toList()
        );
    }

    public List<AiModelAdminResponse> getAllAiModelsAdmin() {
        log.info("Fetching all AI models sorted by difficulty");
        return aiModelMapper.toListAiModelAdminResponse(
                aiModelRepository.findAll().stream()
                        .sorted(Comparator.comparingInt(AiModel::getDifficultyLevel))
                        .toList()
        );
    }

    public AiModelResponse getAiModelById(UUID id) {
        log.info("Fetching AI model with id: {}", id);
        AiModel aiModel = aiModelRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AI_MODEL_NOT_FOUND));
        return aiModelMapper.toAiModelResponse(aiModel);
    }

    public AiModelResponse createAiModel(AiModelCreationRequest request) {
        log.info("Creating AI model with name: {}", request.getName());
        if (aiModelRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.AI_MODEL_NAME_EXISTED);
        }
        AiModel aiModel = AiModel.builder()
                .name(request.getName())
                .difficultyLevel(request.getDifficultyLevel())
                .filePath(request.getFilePath())
                .build();
        return aiModelMapper.toAiModelResponse(aiModelRepository.save(aiModel));
    }

    public AiModelResponse updateAiModel(UUID id, AiModelUpdateRequest request) {
        log.info("Updating AI model with id: {}", id);
        AiModel aiModel = aiModelRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AI_MODEL_NOT_FOUND));
        aiModelMapper.updateAiModel(aiModel, request);
        if (request.getFilePath() != null) {
            aiModel.setFilePath(request.getFilePath());
        }
        return aiModelMapper.toAiModelResponse(aiModelRepository.save(aiModel));
    }

    public void deleteAiModel(UUID id) {
        log.info("Deleting AI model with id: {}", id);
        if (!aiModelRepository.existsById(id)) {
            throw new AppException(ErrorCode.AI_MODEL_NOT_FOUND);
        }
        aiModelRepository.deleteById(id);
    }
}
