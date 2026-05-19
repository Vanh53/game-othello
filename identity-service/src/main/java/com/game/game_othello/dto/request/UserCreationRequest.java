package com.game.game_othello.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {

    @NotBlank(message = "USERNAME_BLANK")
    @Size(min = 4, max = 50, message = "USERNAME_SIZE_INVALID")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "USERNAME_FORM_INVALID")
    String username;

    @NotBlank(message = "PASSWORD_BLANK")
    @Size(min = 8, message = "PASSWORD_SIZE_INVALID")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
            message = "PASSWORD_FORM_INVALID"
    )
    String password;

    String confirmPassword;

    String name;

    @NotBlank(message = "EMAIL_BLANK")
    @Email(message = "EMAIL_FORM_INVALID")
    String email;

}
