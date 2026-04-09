package com.game.pvp_service.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    @Builder.Default
    private int code = 100;
    private String message;
    private T result;

    public static <T> ApiResponse<T> success(T result) {
        return ApiResponse.<T>builder().code(100).result(result).build();
    }

    public static <T> ApiResponse<T> success(String message, T result) {
        return ApiResponse.<T>builder().code(100).message(message).result(result).build();
    }
}
