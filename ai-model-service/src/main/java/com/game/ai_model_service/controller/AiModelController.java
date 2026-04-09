package com.game.ai_model_service.controller;

import com.game.ai_model_service.dto.request.AiModelCreationRequest;
import com.game.ai_model_service.dto.request.AiModelUpdateRequest;
import com.game.ai_model_service.dto.response.AiModelResponse;
import com.game.ai_model_service.dto.response.ApiResponse;
import com.game.ai_model_service.service.AiModelService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AiModelResponse> createAiModel(@RequestBody @Valid AiModelCreationRequest request) {
        return ApiResponse.<AiModelResponse>builder()
                .result(aiModelService.createAiModel(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AiModelResponse> updateAiModel(@PathVariable UUID id,
                                                       @RequestBody AiModelUpdateRequest request) {
        return ApiResponse.<AiModelResponse>builder()
                .result(aiModelService.updateAiModel(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteAiModel(@PathVariable UUID id) {
        aiModelService.deleteAiModel(id);
        return ApiResponse.<Void>builder()
                .message("Xóa mô hình AI thành công")
                .build();
    }
}
