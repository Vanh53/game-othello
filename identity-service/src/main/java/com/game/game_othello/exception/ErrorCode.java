package com.game.game_othello.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNDEFINE (999, "Undefined exception", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_ENUM_KEY (1010, "Invalid enum key", HttpStatus.BAD_REQUEST),
    USER_EXISTED (1011, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_BLANK (1012, "Tên đăng nhập không được để trống", HttpStatus.BAD_REQUEST),
    USERNAME_SIZE_INVALID (1013, "Tên đăng nhập phải từ 4 đến 50 ký tự", HttpStatus.BAD_REQUEST),
    USERNAME_FORM_INVALID (1014, "Username không được chứa dấu cách hoặc ký tự đặc biệt (trừ dấu gạch dưới)", HttpStatus.BAD_REQUEST),
    PASSWORD_BLANK (1015,"Mật khẩu không được để trống", HttpStatus.BAD_REQUEST),
    PASSWORD_SIZE_INVALID (1016, "Mật khẩu phải có ít nhất 8 ký tự", HttpStatus.BAD_REQUEST),
    PASSWORD_FORM_INVALID  (1017, "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt (@, $, !, %, *, ?, &)", HttpStatus.BAD_REQUEST),
    EMAIL_BLANK (1018, "Email không được để trống", HttpStatus.BAD_REQUEST),
    EMAIL_FORM_INVALID (1019, "Email không đúng định dạng", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED (1020, "Email đã tồn tại", HttpStatus.BAD_REQUEST),
    USER_NOT_EXIST (1021, "User not exist", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED (1030, "Không thể xác minh", HttpStatus.UNAUTHORIZED),
    PASSWORD_CONFIRMATION_MISMATCH(1022, "Mật khẩu và mật khẩu xác nhận không khớp", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND (1023, "Không tìm thấy quyền mặc định", HttpStatus.NOT_FOUND),
    UNAUTHORIZED (1024, "You do not permission to access", HttpStatus.FORBIDDEN),
    GAME_NOT_FOUND (2001, "Trận đấu không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_MOVE (2002, "Nước đi không hợp lệ", HttpStatus.BAD_REQUEST),
    NOT_YOUR_TURN (2003, "Chưa đến lượt của bạn", HttpStatus.BAD_REQUEST),
    NOT_IN_MATCH (2004, "Bạn không tham gia trận đấu này", HttpStatus.FORBIDDEN),
    MATCH_ALREADY_STARTED (2005, "Trận đấu đã bắt đầu", HttpStatus.BAD_REQUEST),
    ALREADY_IN_QUEUE (2006, "Bạn đã đang trong hàng chờ", HttpStatus.BAD_REQUEST)
    ;
    private int code;
    private String message;
    private HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

}
