package com.game.ai_model_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiModelCreationRequest {

    @NotBlank(message = "Name is required")
    String name;

    @Min(value = 1, message = "Difficulty level must be at least 1")
    @Max(value = 10, message = "Difficulty level must be at most 10")
    @NotBlank(message = "Difficulty Level is required")
    int difficultyLevel;

    @NotBlank(message = "File path is required")
    String filePath;

    String description;
}
