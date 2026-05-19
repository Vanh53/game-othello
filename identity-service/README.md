# ♟️ Othello Game Server - Backend

Đây là hệ thống Backend cung cấp toàn bộ logic, quản lý dữ liệu và xử lý kết nối thời gian thực (Real-time) cho dự án Game Othello nhiều người chơi. Hệ thống được thiết kế theo kiến trúc 3 lớp (3-Tier Architecture) chuẩn Enterprise, đảm bảo hiệu năng cao và tính toàn vẹn dữ liệu.

## 🛠️ Công nghệ sử dụng (Tech Stack)
* **Ngôn ngữ:** Java 17+
* **Framework chính:** Spring Boot 3.x
* **Bảo mật:** Spring Security & JWT (JSON Web Token)
* **Cơ sở dữ liệu:** MySQL 8.0 & Spring Data JPA (Hibernate)
* **Giao tiếp Real-time:** Spring WebSocket & STOMP Protocol
* **Công cụ hỗ trợ:** Lombok, MapStruct, Maven

## 🚀 Tính năng cốt lõi
1. **Quản lý Tài khoản & Phân quyền (RBAC):** Đăng ký/Đăng nhập an toàn với mật khẩu băm (BCrypt). Phân tách luồng API cho `ROLE_USER` và `ROLE_ADMIN`.
2. **Hệ thống Ghép trận (Matchmaking):** Tự động đưa người chơi vào hàng đợi (Queue) và ghép đôi dựa trên điểm xếp hạng (Elo).
3. **Gameplay Thời gian thực (PvP):** Xử lý và đồng bộ trạng thái bàn cờ 8x8, kiểm tra tính hợp lệ của nước đi (Game Logic) hoàn toàn trên Server để chống gian lận.
4. **Trí tuệ nhân tạo (PvE):** Tích hợp Bot AI sử dụng thuật toán Minimax kết hợp cắt tỉa Alpha-Beta để người chơi luyện tập.
5. **Hệ thống Giải đấu (Tournament):** Quản lý vòng đời giải đấu, tự động bốc thăm chia cặp theo thuật toán hệ Thụy Sĩ (Swiss System), tính điểm Buchholz.

## 📁 Cấu trúc thư mục (Project Structure)
\`\`\`text
src/main/java/com/game/game_othello/
├── configuration/      # Cấu hình Security, WebSocket, CORS
├── controller/         # Chứa các REST API và WebSocket/STOMP Endpoint
├── dto/                # Data Transfer Objects (Request/Response bảo mật)
├── entity/             # Ánh xạ các bảng trong MySQL (User, Match, Tournament...)
├── exception/          # Bắt và xử lý lỗi tập trung (GlobalExceptionHandler)
├── mapper/             # Chuyển đổi giữa Entity và DTO
├── repository/         # Giao tiếp với Database qua JpaRepository
└── service/            # Chứa logic nghiệp vụ cốt lõi (GameLogic, Matchmaking)
\`\`\`

## ⚙️ Hướng dẫn cài đặt & Chạy dự án
1. Clone dự án về máy.
2. Tạo database trong MySQL có tên `othello_db` (Xem file `schema.sql` để biết cấu trúc).
3. Mở file `src/main/resources/application.properties` và cấu hình lại Username/Password của MySQL.
4. Chạy file `GameOthelloApplication.java` hoặc sử dụng lệnh: `mvn spring-boot:run`.
5. Server sẽ khởi động tại cổng mặc định: `http://localhost:8080`.

## 👤 Tác giả
* **Hoàng Việt Anh** - Kỹ sư Phần mềm (Software Engineering)