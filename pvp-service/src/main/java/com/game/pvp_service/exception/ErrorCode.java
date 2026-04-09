package com.game.pvp_service.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public enum ErrorCode {
    // Generic
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "Chưa xác thực", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1002, "Không có quyền truy cập", HttpStatus.FORBIDDEN),

    // Room errors
    ROOM_NOT_FOUND(4001, "Phòng không tồn tại", HttpStatus.NOT_FOUND),
    ROOM_NOT_AVAILABLE(4002, "Phòng không khả dụng", HttpStatus.BAD_REQUEST),
    CANNOT_JOIN_OWN_ROOM(4003, "Không thể tham gia phòng của chính mình", HttpStatus.BAD_REQUEST),
    ALREADY_IN_ROOM(4004, "Người chơi đã đang trong phòng", HttpStatus.BAD_REQUEST),
    ROOM_IS_FULL(4005, "Phòng đã đầy", HttpStatus.BAD_REQUEST),

    // Match / Game errors
    GAME_NOT_FOUND(4010, "Trận đấu không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_MOVE(4011, "Nước đi không hợp lệ", HttpStatus.BAD_REQUEST),
    NOT_YOUR_TURN(4012, "Chưa đến lượt của bạn", HttpStatus.BAD_REQUEST),
    NOT_IN_MATCH(4013, "Bạn không thuộc trận đấu này", HttpStatus.BAD_REQUEST),
    MATCH_ALREADY_STARTED(4014, "Trận đấu đã bắt đầu", HttpStatus.BAD_REQUEST),
    ALREADY_IN_MATCH(4015, "Người chơi đã đang trong trận đấu", HttpStatus.BAD_REQUEST),


    // Queue errors
    ALREADY_IN_QUEUE(4020, "Bạn đã đang trong hàng chờ", HttpStatus.BAD_REQUEST),
    ;

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
