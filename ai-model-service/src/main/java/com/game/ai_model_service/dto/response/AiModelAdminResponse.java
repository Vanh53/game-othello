package com.game.ai_model_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiModelAdminResponse {

    UUID id;
    String name;
    int difficultyLevel;
    String filePath;
    String description;
    UUID createdBy;
}
