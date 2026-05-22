package com.game.game_othello.repository;

import com.game.game_othello.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {

    // Tìm toàn bộ các quyền ngoại lệ của một user cụ thể
    List<UserPermission> findByUserId(UUID userId);

    // Kiểm tra xem User này đã bị tác động gì lên Permission này chưa (Để Admin update/xóa cho dễ)
    Optional<UserPermission> findByUserIdAndPermissionId(UUID userId, UUID permissionId);
}
