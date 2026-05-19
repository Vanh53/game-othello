package com.game.game_othello.client;

import com.game.game_othello.dto.response.AiModelResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

// "ai-model-service" phải khớp với spring.application.name của ai-model-service
@FeignClient(name = "ai-model-service")
public interface AiModelClient {

    @GetMapping("/ai-models")
    List<AiModelResponse> getAllAiModels();

    @GetMapping("/ai-models/{id}")
    AiModelResponse getAiModelById(@PathVariable UUID id);
}
