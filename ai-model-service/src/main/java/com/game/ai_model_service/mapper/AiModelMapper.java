package com.game.ai_model_service.mapper;

import com.game.ai_model_service.dto.request.AiModelUpdateRequest;
import com.game.ai_model_service.dto.response.AiModelResponse;
import com.game.ai_model_service.entity.AiModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface AiModelMapper {

    AiModelResponse toAiModelResponse(AiModel aiModel);

    List<AiModelResponse> toListAiModelResponse(List<AiModel> aiModels);

    @Mapping(target = "filePath", ignore = true)
    @Mapping(target = "id", ignore = true)
    void updateAiModel(@MappingTarget AiModel aiModel, AiModelUpdateRequest request);
}
