package com.game.ai_model_service.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.ai_model_service.dto.request.AiModelCreationRequest;
import com.game.ai_model_service.dto.request.AiModelUpdateRequest;
import com.game.ai_model_service.dto.response.AiModelAdminResponse;
import com.game.ai_model_service.dto.response.AiModelResponse;
import com.game.ai_model_service.dto.response.ApiResponse;
import com.game.ai_model_service.service.AiModelService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/ai-models")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AiModelController {

    AiModelService aiModelService;

    @GetMapping
    public ApiResponse<List<AiModelResponse>> getAllAiModels() {
        return ApiResponse.<List<AiModelResponse>>builder()
                .result(aiModelService.getAllAiModels())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<AiModelResponse> getAiModelById(@PathVariable UUID id) {
        return ApiResponse.<AiModelResponse>builder()
                .result(aiModelService.getAiModelById(id))
                .build();
    }

    @GetMapping("/getAllByAdmin")
    @PreAuthorize("hasAuthority('AI_MODEL_VIEW_ADMIN')")
    public ApiResponse<List<AiModelAdminResponse>> getAllAiModelsAdmin() {
        return ApiResponse.<List<AiModelAdminResponse>>builder()
                .result(aiModelService.getAllAiModelsAdmin())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('AI_MODEL_CREATE')")
    public ApiResponse<AiModelResponse> createAiModel(@RequestBody @Valid AiModelCreationRequest request) {
        return ApiResponse.<AiModelResponse>builder()
                .result(aiModelService.createAiModel(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('AI_MODEL_UPDATE')")
    public ApiResponse<AiModelResponse> updateAiModel(@PathVariable UUID id,
                                                       @RequestBody AiModelUpdateRequest request) {
        return ApiResponse.<AiModelResponse>builder()
                .result(aiModelService.updateAiModel(id, request))
                .build();
    }

    @PutMapping("/{id}/delete")
    @PreAuthorize("hasAuthority('AI_MODEL_DELETE')")
    public ApiResponse<Void> deleteAiModel(@PathVariable String id) {
        aiModelService.deleteAiModel(id);
        return ApiResponse.<Void>builder()
                .message("Xóa mô hình AI thành công")
                .build();
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('AI_MODEL_DELETE')")
    public ApiResponse<Void> restoreAiModel(@PathVariable String id) {
        aiModelService.restoreAiModel(id);
        return ApiResponse.<Void>builder()
                .message("Khôi phục mô hình AI thành công")
                .build();
    }
}
