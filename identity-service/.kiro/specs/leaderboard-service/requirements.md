# Tài liệu Yêu cầu

## Giới thiệu

Service bảng xếp hạng (Leaderboard Service) cho game Othello cung cấp khả năng truy vấn danh sách người chơi được xếp hạng theo điểm Elo. Service được xây dựng theo cùng cấu trúc với User/Identity Service hiện tại, sử dụng Spring Boot với các layer: controller, service, repository, dto, mapper, exception. Dữ liệu xếp hạng được tính toán trực tiếp từ bảng `users` đã có, không cần bảng mới. API trả về theo chuẩn `ApiResponse<T>` với `code = 100`.

## Bảng thuật ngữ

- **Leaderboard_Service**: Service xử lý logic truy vấn và trả về bảng xếp hạng người chơi
- **LeaderboardController**: REST controller xử lý các HTTP request liên quan đến bảng xếp hạng, ánh xạ tới base path `/leaderboard`
- **LeaderboardService**: Spring `@Service` chứa business logic truy vấn và tính toán xếp hạng
- **UserRepository**: Spring Data JPA repository truy vấn dữ liệu người dùng từ bảng `users`
- **LeaderboardEntryResponse**: DTO response chứa thông tin một người chơi trong bảng xếp hạng (rank, userId, username, name, avatar, elo, totalMatches, totalWins, totalDraws, winRate)
- **LeaderboardResponse**: DTO response chứa danh sách `LeaderboardEntryResponse` kèm thông tin phân trang (page, size, totalElements, totalPages)
- **ApiResponse**: Wrapper response chuẩn `{ int code = 100; String message; T result; }`
- **Elo**: Điểm xếp hạng số nguyên của người chơi, giá trị mặc định là 1200, dùng để sắp xếp thứ hạng
- **Rank**: Thứ hạng số nguyên của người chơi trong bảng xếp hạng, bắt đầu từ 1
- **WinRate**: Tỷ lệ thắng tính bằng phần trăm = (totalWins / totalMatches) * 100, làm tròn 2 chữ số thập phân; bằng 0.0 khi totalMatches = 0
- **Page**: Số trang hiện tại trong phân trang, bắt đầu từ 0
- **Size**: Số lượng bản ghi trên mỗi trang, mặc định là 10, tối đa là 100

---

## Yêu cầu

### Yêu cầu 1: Lấy bảng xếp hạng toàn cầu có phân trang

**User Story:** Là người chơi, tôi muốn xem bảng xếp hạng toàn cầu được sắp xếp theo điểm Elo giảm dần, để biết vị trí của mình so với những người chơi khác.

#### Tiêu chí chấp nhận

1. WHEN client gửi GET request tới `/leaderboard` với tham số `page` và `size` hợp lệ, THE Leaderboard_Service SHALL trả về `ApiResponse<LeaderboardResponse>` với `code = 100` và danh sách người chơi được sắp xếp theo `elo` giảm dần.
2. THE Leaderboard_Service SHALL gán giá trị `rank` cho mỗi `LeaderboardEntryResponse` bằng `(page * size) + index + 1`, trong đó `index` là vị trí của phần tử trong trang hiện tại (bắt đầu từ 0).
3. WHERE tham số `page` không được cung cấp, THE Leaderboard_Service SHALL sử dụng giá trị mặc định `page = 0`.
4. WHERE tham số `size` không được cung cấp, THE Leaderboard_Service SHALL sử dụng giá trị mặc định `size = 10`.
5. IF tham số `size` vượt quá 100, THEN THE Leaderboard_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.INVALID_PAGE_SIZE` và HTTP status 400.
6. IF tham số `page` hoặc `size` là số âm, THEN THE Leaderboard_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.INVALID_PAGE_SIZE` và HTTP status 400.
7. THE Leaderboard_Service SHALL bao gồm trong `LeaderboardResponse` các trường phân trang: `page`, `size`, `totalElements`, `totalPages`.

---

### Yêu cầu 2: Lấy thứ hạng của một người chơi cụ thể

**User Story:** Là người chơi, tôi muốn xem thứ hạng và thông tin xếp hạng của một người chơi bất kỳ theo `userId`, để theo dõi tiến trình của họ.

#### Tiêu chí chấp nhận

1. WHEN client gửi GET request tới `/leaderboard/users/{userId}`, THE Leaderboard_Service SHALL trả về `ApiResponse<LeaderboardEntryResponse>` với `code = 100` chứa thông tin xếp hạng của người chơi có `id` tương ứng.
2. THE Leaderboard_Service SHALL tính `rank` của người chơi bằng số lượng người chơi có `elo` lớn hơn `elo` của người chơi đó cộng thêm 1.
3. IF không tồn tại người chơi với `userId` được cung cấp, THEN THE Leaderboard_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.USER_NOT_EXIST` và HTTP status 404.

---

### Yêu cầu 3: Lấy thứ hạng của người chơi đang đăng nhập

**User Story:** Là người chơi đã xác thực, tôi muốn xem thứ hạng hiện tại của bản thân mà không cần biết `userId`, để nhanh chóng kiểm tra vị trí của mình.

#### Tiêu chí chấp nhận

1. WHEN client đã xác thực gửi GET request tới `/leaderboard/me`, THE Leaderboard_Service SHALL trả về `ApiResponse<LeaderboardEntryResponse>` với `code = 100` chứa thông tin xếp hạng của người chơi đang đăng nhập.
2. THE Leaderboard_Service SHALL lấy `username` từ `SecurityContextHolder` để xác định người chơi hiện tại.
3. IF token JWT không hợp lệ hoặc không được cung cấp, THEN THE Leaderboard_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.UNAUTHENTICATED` và HTTP status 401.

---

### Yêu cầu 4: Cấu trúc LeaderboardEntryResponse

**User Story:** Là frontend developer, tôi muốn response của bảng xếp hạng chứa đầy đủ thông tin cần thiết để hiển thị, để không cần gọi thêm API khác.

#### Tiêu chí chấp nhận

1. THE Leaderboard_Service SHALL bao gồm trong mỗi `LeaderboardEntryResponse` các trường: `rank` (int), `userId` (String), `username` (String), `name` (String), `avatar` (String), `elo` (int), `totalMatches` (int), `totalWins` (int), `totalDraws` (int), `winRate` (double).
2. THE Leaderboard_Service SHALL tính `winRate` theo công thức: `(totalWins * 100.0 / totalMatches)` làm tròn 2 chữ số thập phân.
3. IF `totalMatches` của người chơi bằng 0, THEN THE Leaderboard_Service SHALL gán `winRate = 0.0`.
4. THE Leaderboard_Service SHALL không bao gồm các trường nhạy cảm như `password` trong `LeaderboardEntryResponse`.

---

### Yêu cầu 5: Cấu trúc đồng nhất với User/Identity Service

**User Story:** Là backend developer, tôi muốn Leaderboard Service tuân theo cùng cấu trúc với User Service hiện tại, để dễ bảo trì và mở rộng.

#### Tiêu chí chấp nhận

1. THE Leaderboard_Service SHALL sử dụng `LeaderboardMapper` (MapStruct `@Mapper(componentModel = "spring")`) để chuyển đổi từ `User` entity sang `LeaderboardEntryResponse`.
2. THE Leaderboard_Service SHALL sử dụng `@RequiredArgsConstructor` và `@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)` trong `LeaderboardService` và `LeaderboardController`.
3. THE Leaderboard_Service SHALL đặt `LeaderboardController` tại package `controller`, `LeaderboardService` tại package `service`, `LeaderboardMapper` tại package `mapper`, `LeaderboardEntryResponse` và `LeaderboardResponse` tại package `dto/response`.
4. THE Leaderboard_Service SHALL sử dụng `AppException` với `ErrorCode` enum hiện có để xử lý lỗi, thêm các `ErrorCode` mới nếu cần (ví dụ: `INVALID_PAGE_SIZE`).
5. THE Leaderboard_Service SHALL sử dụng `UserRepository` hiện có (không tạo repository mới) và bổ sung các phương thức query cần thiết vào `UserRepository`.
6. WHEN một lỗi xảy ra trong Leaderboard_Service, THE GlobalExceptionHandler SHALL xử lý và trả về `ApiResponse` với `code` và `message` tương ứng từ `ErrorCode`.

---

### Yêu cầu 6: Bảo mật endpoint

**User Story:** Là quản trị viên hệ thống, tôi muốn kiểm soát quyền truy cập vào các endpoint bảng xếp hạng, để đảm bảo an toàn dữ liệu.

#### Tiêu chí chấp nhận

1. THE Leaderboard_Service SHALL cho phép truy cập endpoint `GET /leaderboard` và `GET /leaderboard/users/{userId}` mà không yêu cầu xác thực (public endpoint).
2. THE Leaderboard_Service SHALL yêu cầu xác thực JWT hợp lệ để truy cập endpoint `GET /leaderboard/me`.
3. WHILE người dùng đã xác thực, THE Leaderboard_Service SHALL cho phép bất kỳ người dùng nào có role `USER` hoặc `ADMIN` truy cập endpoint `GET /leaderboard/me`.
4. IF request tới `GET /leaderboard/me` không có JWT token hợp lệ, THEN THE Leaderboard_Service SHALL trả về HTTP status 401 với `ErrorCode.UNAUTHENTICATED`.
