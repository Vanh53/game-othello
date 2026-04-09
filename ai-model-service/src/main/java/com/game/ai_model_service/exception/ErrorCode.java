package com.game.ai_model_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR(1002, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1003, "Bạn không có quyền truy cập", HttpStatus.FORBIDDEN),
    UNAUTHENTICATED(1004, "Chưa xác thực", HttpStatus.UNAUTHORIZED),

    AI_MODEL_NOT_FOUND(3001, "Mô hình AI không tồn tại", HttpStatus.NOT_FOUND),
    AI_MODEL_NAME_EXISTED(3002, "Tên mô hình AI đã tồn tại", HttpStatus.BAD_REQUEST),
    ;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    final int code;
    final String message;
    final HttpStatus httpStatus;
}
