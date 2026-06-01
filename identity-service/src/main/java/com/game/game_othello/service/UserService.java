package com.game.game_othello.service;

import com.game.game_othello.dto.request.ChangePasswordRequest;
import com.game.game_othello.dto.request.OpponentsRequest;
import com.game.game_othello.dto.request.UserCreationRequest;
import com.game.game_othello.dto.request.UserStatsCreationRequest;
import com.game.game_othello.dto.request.UserUpdateRequest;
import com.game.game_othello.dto.response.OpponentResponse;
import com.game.game_othello.dto.response.UserResponse;
import com.game.game_othello.entity.Account;
import com.game.game_othello.entity.Role;
import com.game.game_othello.entity.User;
import com.game.game_othello.exception.AppException;
import com.game.game_othello.exception.ErrorCode;
import com.game.game_othello.exception.UserExitedException;
import com.game.game_othello.mapper.UserMapper;
import com.game.game_othello.repository.AccountRepository;
import com.game.game_othello.repository.RoleRepository;
import com.game.game_othello.repository.UserRepository;
import com.game.game_othello.repository.httpclient.LeaderboardClient;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    AccountRepository accountRepository;

    UserMapper userMapper;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;

    LeaderboardClient leaderboardClient;

    public UserResponse createUser(UserCreationRequest userCreationRequest) {
        if (accountRepository.existsByProviderAndProviderAccountId("LOCAL", userCreationRequest.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(userCreationRequest.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (!userCreationRequest.getPassword().equals(userCreationRequest.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRMATION_MISMATCH);
        }
        User user = userMapper.toUser(userCreationRequest);

        Role defaultRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        Set<Role> roles = new HashSet<>();
        roles.add(defaultRole);

        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        Account account = Account.builder()
                .userId(savedUser.getId())
                .provider("LOCAL")
                .providerAccountId(userCreationRequest.getUsername())
                .password(passwordEncoder.encode(userCreationRequest.getPassword()))
                .build();
        accountRepository.save(account);

        UserStatsCreationRequest request = UserStatsCreationRequest.builder()
                .userId(savedUser.getId())
                .name(savedUser.getName())
                .avatar(savedUser.getAvatar())
                .build();
        leaderboardClient.createUserStats(request);

        return userMapper.toUserResponse(savedUser);
    }

    public UserResponse updateUser(String userId, UserUpdateRequest userUpdateRequest) {
        UUID userIdReal = UUID.fromString(userId);
        User user = userRepository.findById(userIdReal)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userMapper.updateUser(user, userUpdateRequest);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public List<UserResponse> getUsers() {
        log.info("In method get users");
        return userMapper.toListUserResponse(userRepository.findAllWithQuery());
    }

    public UserResponse getUser(String userId) {
        UUID userIdReal = UUID.fromString(userId);
        return userMapper.toUserResponse(userRepository.findById(userIdReal)
                .orElseThrow(() -> new RuntimeException("User not found")));
    }

    public List<OpponentResponse> getOpponents(OpponentsRequest opponentsRequest) {
        List<User> opponents = userRepository.findAllById(opponentsRequest.getUserIds());
        return userMapper.toListOpponent(opponents);
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String id = context.getAuthentication().getName();
        User user = userRepository.findById(UUID.fromString(id)).orElseThrow(()
            -> new AppException(ErrorCode.USER_NOT_EXIST));
        return userMapper.toUserResponse(user);
    }

    public void deleteUser(String userId) {
        UUID userIdReal = UUID.fromString(userId);
        User user = userRepository.findById(userIdReal)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_EXIST.getMessage()));
        user.setDeleted(true);
        userRepository.save(user);
        leaderboardClient.deleteUserStats(userId);
    }

    public void changePassword(ChangePasswordRequest request) {
    }

    public void restoreUser(String userId) {
        UUID userIdReal = UUID.fromString(userId);
        User user = userRepository.findById(userIdReal)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_EXIST.getMessage()));
        user.setDeleted(false);
        userRepository.save(user);
        leaderboardClient.restoreUserStats(userId);
    }


    // thêm api: cập nhật quyền, cập nhật avt, đổi mật khẩu
}
