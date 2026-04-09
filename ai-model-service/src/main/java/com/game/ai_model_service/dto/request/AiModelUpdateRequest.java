package com.game.ai_model_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiModelUpdateRequest {

    String name;

    Integer difficultyLevel;

    String filePath;
}
