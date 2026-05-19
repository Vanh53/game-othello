# Tài liệu Yêu cầu

## Giới thiệu

AI Model Service cho game Othello cung cấp khả năng quản lý và truy vấn các mô hình AI đã được huấn luyện, cho phép người chơi chọn đấu với bot theo độ khó mong muốn. Service được xây dựng theo cùng cấu trúc với User/Identity Service và Leaderboard Service hiện tại, sử dụng Spring Boot với các layer: controller, service, repository, dto, mapper, exception. Dữ liệu mô hình AI được lưu trong bảng `ai_models` với entity `AiModel` đã có sẵn, bổ sung thêm trường `description` và `isActive`. API trả về theo chuẩn `ApiResponse<T>` với `code = 100`. Base URL: `http://localhost:8080/othello`, context path: `/othello`.

## Bảng thuật ngữ

- **AiModel_Service**: Service xử lý toàn bộ logic quản lý và truy vấn mô hình AI
- **AiModelController**: REST controller xử lý các HTTP request liên quan đến mô hình AI, ánh xạ tới base path `/ai-models`
- **AiModelService**: Spring `@Service` chứa business logic tạo, cập nhật, truy vấn và quản lý vòng đời mô hình AI
- **AiModelRepository**: Spring Data JPA repository truy vấn dữ liệu mô hình AI từ bảng `ai_models`, cung cấp các phương thức: `findByIsActiveTrue()`, `findByDifficultyLevel(int)`, `existsByName(String)`
- **AiModel**: JPA entity ánh xạ bảng `ai_models`, gồm các trường: `id` (int, auto increment), `name` (String), `difficultyLevel` (int), `filePath` (String), `description` (String), `isActive` (boolean, mặc định true)
- **AiModelCreationRequest**: DTO request tạo mô hình AI mới, gồm: `name` (@NotBlank), `difficultyLevel` (@Min=1 @Max=10), `filePath` (@NotBlank), `description` (tùy chọn)
- **AiModelUpdateRequest**: DTO request cập nhật mô hình AI, tất cả các trường đều tùy chọn: `name`, `difficultyLevel`, `filePath`, `description`, `isActive`
- **AiModelResponse**: DTO response trả về thông tin mô hình AI, gồm: `id`, `name`, `difficultyLevel`, `description`, `isActive` — KHÔNG bao gồm `filePath` (thông tin nội bộ)
- **AiModelMapper**: MapStruct `@Mapper(componentModel = "spring")` chuyển đổi giữa `AiModel` entity và các DTO, cung cấp: `toAiModelResponse`, `toListAiModelResponse`, `updateAiModel`
- **ApiResponse**: Wrapper response chuẩn `{ int code = 100; String message; T result; }`
- **DifficultyLevel**: Độ khó của mô hình AI, là số nguyên từ 1 (dễ nhất) đến 10 (khó nhất)
- **isActive**: Trạng thái hoạt động của mô hình AI, `true` = đang hoạt động và hiển thị với người chơi, `false` = đã bị ẩn
- **Admin**: Người dùng có role `ADMIN`, có toàn quyền quản lý mô hình AI
- **Player**: Người dùng có role `USER`, chỉ có quyền xem danh sách mô hình AI đang hoạt động
