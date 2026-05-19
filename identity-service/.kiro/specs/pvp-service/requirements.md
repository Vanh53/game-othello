# Tài liệu Yêu cầu

## Giới thiệu

PvP Service (Player vs Player Service) cho game Othello cung cấp toàn bộ chức năng để người chơi thách đấu trực tiếp với nhau theo thời gian thực. Service xử lý hai luồng chính: (1) quản lý phòng chờ — người chơi tạo phòng hoặc tìm đối thủ ngẫu nhiên qua hàng chờ matchmaking, và (2) vận hành ván cờ — cập nhật trạng thái bàn cờ realtime qua WebSocket (STOMP/SockJS), kiểm tra nước đi hợp lệ, xác định kết quả thắng/thua/hòa.

Service được xây dựng theo cùng cấu trúc với User/Identity Service, Leaderboard Service và AI Model Service hiện tại, sử dụng Spring Boot với các layer: controller (REST + WebSocket), service, repository, dto, mapper, exception. Dữ liệu lưu trong bốn bảng: `matches`, `tournaments`, `tournament_participants`, `tournament_matches`. Service này chỉ lưu trữ ID của người chơi, không truy cập thông tin nhạy cảm như mật khẩu hay email. API REST trả về theo chuẩn `ApiResponse<T>` với `code = 100`. Giao tiếp realtime qua STOMP WebSocket với SockJS fallback.

Để hỗ trợ scale ngang (horizontal scaling), trạng thái phòng chờ (`Room`) và hàng chờ matchmaking (`MatchmakingQueue`) được lưu trong **Redis** thay vì in-memory. Redis đóng vai trò bộ nhớ chung cho tất cả các instance của PvP Service, đảm bảo người chơi ở instance A có thể thấy phòng của người chơi ở instance B. Sau khi kết thúc trận đấu, PvP Service bắn một **Kafka event** (`match-result`) sang Leaderboard Service để cập nhật thống kê và Elo, thay vì ghi trực tiếp vào DB của User Service.

## Bảng thuật ngữ

- **PvP_Service**: Service xử lý toàn bộ logic thách đấu trực tiếp giữa người chơi, bao gồm matchmaking, quản lý phòng, vận hành ván cờ và ghi nhận kết quả
- **MatchController**: REST controller xử lý các HTTP request liên quan đến trận đấu, ánh xạ tới base path `/matches`
- **RoomController**: REST controller xử lý các HTTP request liên quan đến phòng chờ, ánh xạ tới base path `/rooms`
- **GameWebSocketController**: STOMP `@Controller` xử lý các message WebSocket realtime, nhận message từ client qua prefix `/app` và gửi về qua `/topic` hoặc `/user/queue`
- **MatchService**: Spring `@Service` chứa business logic tạo trận, ghi nhận kết quả, truy vấn lịch sử trận đấu
- **RoomService**: Spring `@Service` chứa business logic tạo phòng, tham gia phòng, đóng phòng
- **MatchmakingService**: Spring `@Service` chứa business logic hàng chờ tìm đối thủ ngẫu nhiên, ghép cặp theo Elo
- **GameLogicService**: Spring `@Service` chứa toàn bộ logic luật chơi Othello: kiểm tra nước đi hợp lệ, lật quân, tính điểm, xác định kết thúc ván
- **PresenceManager**: Spring `@Component` quản lý trạng thái kết nối WebSocket của người chơi, lưu mapping sessionId ↔ username và matchId ↔ set of usernames
- **MatchRepository**: Spring Data JPA repository truy vấn dữ liệu từ bảng `matches`
- **Match**: JPA entity ánh xạ bảng `matches`, gồm: `id` (UUID), `matchType` (String: "PVP"/"PVE"), `player1Id` (String), `player2Id` (String, nullable), `botId` (int, nullable), `winnerId` (String, nullable), `status` (String: "ONGOING"/"FINISHED"/"DRAW"/"FORFEIT"), `moveLog` (TEXT), `startTime` (LocalDateTime), `endTime` (LocalDateTime, nullable)
- **Room**: Đối tượng đại diện cho phòng chờ, được lưu trong **Redis** (không lưu DB) với TTL 30 phút, gồm: `roomId` (UUID), `hostUsername` (String), `guestUsername` (String, nullable), `status` (String: "WAITING"/"FULL"/"CLOSED"), `createdAt` (LocalDateTime)
- **MatchmakingQueue**: Hàng chờ ghép cặp ngẫu nhiên, được lưu trong **Redis Sorted Set** với score là Elo của người chơi, cho phép ghép cặp theo Elo gần nhau nhất và đảm bảo tính nhất quán khi scale ngang
- **RoomResponse**: DTO response trả về thông tin phòng chờ, gồm: `roomId`, `hostUsername`, `guestUsername`, `status`, `createdAt`
- **MatchResponse**: DTO response trả về thông tin trận đấu, gồm: `id`, `matchType`, `player1Id`, `player2Id`, `botId`, `winnerId`, `status`, `startTime`, `endTime`, `moveLog`
- **MatchSummaryResponse**: DTO response tóm tắt trận đấu trong danh sách lịch sử, gồm: `id`, `matchType`, `opponentId`, `result` (WIN/LOSE/DRAW), `myScore`, `opponentScore`, `startTime`, `endTime`
- **MoveRequest**: DTO WebSocket message gửi từ client khi đánh một nước, gồm: `matchId` (String), `row` (int), `col` (int)
- **GameStateResponse**: DTO WebSocket message gửi từ server về client sau mỗi nước đi, gồm: `matchId` (String), `board` (int[8][8]: 0=trống/1=BLACK/2=WHITE), `currentTurn` (String: "BLACK"/"WHITE"), `blackCount` (int), `whiteCount` (int), `status` (String), `winner` (String, nullable), `validMoves` (List<int[]>), `message` (String, nullable)
- **MatchMapper**: MapStruct `@Mapper(componentModel = "spring")` chuyển đổi giữa `Match` entity và các DTO response
- **ApiResponse**: Wrapper response chuẩn `{ int code = 100; String message; T result; }`
- **BLACK**: Màu quân của player1 (người vào phòng trước hoặc người đầu tiên trong queue), giá trị số nguyên `1` trên bảng cờ, đi trước
- **WHITE**: Màu quân của player2 (người vào phòng sau hoặc người thứ hai trong queue), giá trị số nguyên `2` trên bảng cờ, đi sau
- **MoveLog**: Chuỗi TEXT lưu lịch sử các nước đi theo định dạng `{seq}:{color}({row},{col})`, ví dụ `1:B(3,4);2:W(3,5);3:B(2,4)`. Mỗi nước đi có `seq` (sequence number tăng dần từ 1) để đảm bảo idempotency — nếu client gửi trùng nước đi có cùng `seq`, server bỏ qua mà không xử lý lại
- **Elo**: Điểm xếp hạng của người chơi, được cập nhật sau mỗi trận theo công thức Elo chuẩn với K-factor = 32
- **Forfeit**: Trạng thái trận đấu khi một người chơi rời trận giữa chừng, người còn lại thắng mặc định
- **KafkaMatchResultEvent**: Kafka event được PvP Service bắn vào topic `match-result` sau khi trận kết thúc, gồm: `matchId`, `player1Id`, `player2Id`, `winnerId`, `status`, `endTime`. Leaderboard Service lắng nghe topic này để cập nhật Elo và thống kê vào `schema_leaderboard.user_stats`, tách biệt hoàn toàn với DB của User Service
- **ReconnectGracePeriod**: Khoảng thời gian 30 giây chờ sau khi người chơi ngắt kết nối WebSocket đột ngột. Được quản lý bởi Spring `TaskScheduler`: khi nhận `SessionDisconnectEvent`, tạo một scheduled task chờ 30 giây; nếu người chơi reconnect trong thời gian này thì hủy task; nếu hết 30 giây không reconnect thì xử lý Forfeit

---

## Yêu cầu

### Yêu cầu 1: Tạo phòng chờ

**User Story:** Là người chơi đã xác thực, tôi muốn tạo một phòng chờ để người chơi khác có thể tham gia, để tôi có thể thách đấu với bạn bè hoặc người chơi cụ thể.

#### Tiêu chí chấp nhận

1. WHEN client đã xác thực gửi POST request tới `/rooms`, THE PvP_Service SHALL tạo một `Room` mới với `hostUsername` là username của người gửi request, `status = "WAITING"`, `roomId` là UUID mới, và trả về `ApiResponse<RoomResponse>` với `code = 100`.
2. THE PvP_Service SHALL lưu `Room` vào **Redis** với key `room:{roomId}` và TTL 30 phút, đồng thời thêm `roomId` vào Redis Set `rooms:waiting` để hỗ trợ truy vấn danh sách phòng đang chờ trên mọi instance.
3. IF người chơi đã đang trong một phòng khác có `status = "WAITING"` hoặc đang trong một trận đấu `status = "ONGOING"`, THEN THE PvP_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.ALREADY_IN_ROOM` và HTTP status 400.
4. THE PvP_Service SHALL yêu cầu JWT hợp lệ để tạo phòng; IF không có JWT, THEN trả về HTTP status 401.

---

### Yêu cầu 2: Lấy danh sách phòng chờ

**User Story:** Là người chơi, tôi muốn xem danh sách các phòng đang chờ người chơi, để tôi có thể chọn phòng phù hợp để tham gia.

#### Tiêu chí chấp nhận

1. WHEN client gửi GET request tới `/rooms`, THE PvP_Service SHALL trả về `ApiResponse<List<RoomResponse>>` với `code = 100` chứa tất cả các phòng có `status = "WAITING"`.
2. THE PvP_Service SHALL sắp xếp danh sách phòng theo `createdAt` giảm dần (phòng mới nhất lên đầu).
3. WHERE không có phòng nào đang chờ, THE PvP_Service SHALL trả về danh sách rỗng với `code = 100`.
4. THE PvP_Service SHALL cho phép truy cập endpoint này mà không yêu cầu xác thực (public endpoint).

---

### Yêu cầu 3: Tham gia phòng chờ

**User Story:** Là người chơi đã xác thực, tôi muốn tham gia vào một phòng đang chờ, để bắt đầu ván cờ với người tạo phòng.

#### Tiêu chí chấp nhận

1. WHEN client đã xác thực gửi POST request tới `/rooms/{roomId}/join`, THE PvP_Service SHALL kiểm tra phòng tồn tại và có `status = "WAITING"`, sau đó gán `guestUsername` là username của người gửi request, cập nhật `status = "FULL"`, tạo `Match` mới trong DB với `matchType = "PVP"`, `player1Id = hostUsername`, `player2Id = guestUsername`, `status = "ONGOING"`, và trả về `ApiResponse<MatchResponse>` với `code = 100`.
2. THE PvP_Service SHALL khởi tạo trạng thái bàn cờ trong `GameLogicService` với `matchId` vừa tạo.
3. THE PvP_Service SHALL gửi `GameStateResponse` ban đầu tới cả hai người chơi qua WebSocket destination `/user/{username}/queue/game`.
4. IF phòng không tồn tại, THEN THE PvP_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.ROOM_NOT_FOUND` và HTTP status 404.
5. IF phòng đã có `status = "FULL"` hoặc `status = "CLOSED"`, THEN THE PvP_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.ROOM_NOT_AVAILABLE` và HTTP status 400.
6. IF người chơi cố tham gia phòng do chính mình tạo, THEN THE PvP_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.CANNOT_JOIN_OWN_ROOM` và HTTP status 400.

---

### Yêu cầu 4: Tìm đối thủ ngẫu nhiên (Matchmaking)

**User Story:** Là người chơi đã xác thực, tôi muốn tìm đối thủ ngẫu nhiên mà không cần tạo phòng, để nhanh chóng bắt đầu ván cờ.

#### Tiêu chí chấp nhận

1. WHEN client đã xác thực gửi WebSocket message tới `/app/game.join`, THE PvP_Service SHALL thêm người chơi vào **Redis Sorted Set** `matchmaking:queue` với score là Elo của người chơi, và gửi message `{ "status": "WAITING", "message": "Đang tìm đối thủ..." }` tới `/user/{username}/queue/status`.
2. WHEN hàng chờ có từ 2 người chơi trở lên, THE PvP_Service SHALL ghép cặp hai người chơi có Elo gần nhau nhất (lấy hai phần tử liền kề trong Sorted Set), xóa cả hai khỏi `matchmaking:queue`, tạo `Match` mới trong DB với `matchType = "PVP"`, khởi tạo bàn cờ, và gửi `GameStateResponse` ban đầu tới cả hai người chơi qua `/user/{username}/queue/game`.
3. THE PvP_Service SHALL gán người chơi vào hàng chờ trước là `player1` (BLACK, đi trước) và người vào sau là `player2` (WHITE).
4. IF người chơi đã đang trong hàng chờ (kiểm tra qua Redis), THEN THE PvP_Service SHALL gửi message lỗi `ErrorCode.ALREADY_IN_QUEUE` tới `/user/{username}/queue/error` mà không thêm vào hàng chờ lần nữa.
5. IF người chơi đã đang trong một trận đấu `status = "ONGOING"`, THEN THE PvP_Service SHALL gửi message lỗi `ErrorCode.MATCH_ALREADY_STARTED` tới `/user/{username}/queue/error`.
6. WHEN người chơi ngắt kết nối WebSocket trong khi đang chờ, THE PvP_Service SHALL tự động xóa người chơi khỏi Redis Sorted Set `matchmaking:queue`.

---

### Yêu cầu 5: Thực hiện nước đi

**User Story:** Là người chơi đang trong ván cờ, tôi muốn đánh một nước cờ và nhận lại trạng thái bàn cờ mới ngay lập tức, để trải nghiệm chơi cờ realtime mượt mà.

#### Tiêu chí chấp nhận

1. WHEN client gửi WebSocket message tới `/app/game.move` với payload `MoveRequest { matchId, row, col }`, THE PvP_Service SHALL kiểm tra tính hợp lệ của nước đi và cập nhật trạng thái bàn cờ trong `GameLogicService`.
2. AFTER nước đi hợp lệ được áp dụng, THE PvP_Service SHALL gửi `GameStateResponse` mới tới cả hai người chơi qua `/user/{username}/queue/game`, bao gồm bàn cờ mới, lượt đi tiếp theo, số quân mỗi bên, và danh sách `validMoves` cho lượt tiếp theo.
3. IF nước đi không hợp lệ (ô đã có quân, không lật được quân nào), THEN THE PvP_Service SHALL gửi message lỗi `ErrorCode.INVALID_MOVE` tới `/user/{username}/queue/error` mà không thay đổi trạng thái bàn cờ.
4. IF không phải lượt của người chơi gửi request, THEN THE PvP_Service SHALL gửi message lỗi `ErrorCode.NOT_YOUR_TURN` tới `/user/{username}/queue/error`.
5. IF người chơi không thuộc trận đấu có `matchId` được cung cấp, THEN THE PvP_Service SHALL gửi message lỗi `ErrorCode.NOT_IN_MATCH` tới `/user/{username}/queue/error`.
6. WHEN đối thủ không có nước đi hợp lệ sau nước đi của người chơi hiện tại, THE PvP_Service SHALL bỏ qua lượt của đối thủ, giữ nguyên lượt cho người chơi hiện tại, và gửi `GameStateResponse` với `message = "Đối thủ không có nước đi hợp lệ, bạn đi tiếp!"`.
7. THE PvP_Service SHALL ghi nước đi vào `moveLog` của `Match` entity theo định dạng `{seq}:{color}({row},{col})`, ví dụ `1:B(3,4);2:W(3,5)`, trong đó `seq` là sequence number tăng dần từ 1. THE PvP_Service SHALL bỏ qua nước đi nếu `seq` đã tồn tại trong `moveLog` (idempotency — tránh xử lý trùng khi client gửi lại do mạng lag), và lưu vào DB sau mỗi nước đi hợp lệ.

---

### Yêu cầu 6: Kết thúc ván cờ

**User Story:** Là người chơi, tôi muốn nhận thông báo kết quả ngay khi ván cờ kết thúc, để biết mình thắng, thua hay hòa và xem điểm Elo thay đổi.

#### Tiêu chí chấp nhận

1. WHEN cả hai người chơi đều không còn nước đi hợp lệ, THE PvP_Service SHALL xác định kết quả: người có nhiều quân hơn thắng; nếu bằng nhau thì hòa.
2. THE PvP_Service SHALL cập nhật `Match` entity: set `status = "FINISHED"` hoặc `"DRAW"`, set `winnerId`, set `endTime = now()`, và lưu vào DB.
3. THE PvP_Service SHALL gửi `GameStateResponse` cuối cùng với `status = "FINISHED"` hoặc `"DRAW"` và `winner = username` (hoặc null nếu hòa) tới cả hai người chơi qua WebSocket.
4. THE PvP_Service SHALL cập nhật điểm Elo của cả hai người chơi theo công thức Elo chuẩn với K-factor = 32 sau khi trận kết thúc.
5. THE PvP_Service SHALL bắn một **Kafka event** vào topic `match-result` với payload `KafkaMatchResultEvent { matchId, player1Id, player2Id, winnerId, status, endTime }` để Leaderboard Service cập nhật thống kê `totalMatches`, `totalWins`, `totalDraws` và Elo vào `schema_leaderboard.user_stats`. PvP_Service KHÔNG ghi trực tiếp vào bảng `users` của User Service.
6. THE PvP_Service SHALL xóa trạng thái bàn cờ khỏi bộ nhớ (`GameLogicService`) và xóa mapping trong `PresenceManager` sau khi trận kết thúc.

---

### Yêu cầu 7: Rời trận giữa chừng (Forfeit)

**User Story:** Là người chơi đang trong ván cờ, tôi muốn có thể rời trận bất cứ lúc nào, để không bị kẹt trong ván cờ không mong muốn.

#### Tiêu chí chấp nhận

1. WHEN client gửi WebSocket message tới `/app/game.leave` trong khi đang trong trận `status = "ONGOING"`, THE PvP_Service SHALL cập nhật `Match` entity: set `status = "FORFEIT"`, set `winnerId` là ID của người chơi còn lại, set `endTime = now()`, và lưu vào DB.
2. THE PvP_Service SHALL gửi message thông báo tới người chơi còn lại qua `/user/{username}/queue/game` với `status = "FORFEIT"` và `message = "Đối thủ đã rời trận, bạn thắng!"`.
3. WHEN client gửi WebSocket message tới `/app/game.leave` trong khi đang trong hàng chờ matchmaking, THE PvP_Service SHALL xóa người chơi khỏi hàng chờ và gửi xác nhận tới `/user/{username}/queue/status`.
4. WHEN người chơi ngắt kết nối WebSocket đột ngột trong khi đang trong trận, THE PvP_Service SHALL kích hoạt cơ chế **ReconnectGracePeriod**: lắng nghe `SessionDisconnectEvent`, tạo một Spring `TaskScheduler` task chờ 30 giây. IF người chơi reconnect và gửi lại JWT hợp lệ trong 30 giây, THE PvP_Service SHALL hủy task và tiếp tục ván cờ bình thường. IF hết 30 giây không có reconnect, THEN THE PvP_Service SHALL xử lý Forfeit tương tự điểm 1 và 2.
5. THE PvP_Service SHALL cập nhật Elo và bắn Kafka event `match-result` tương tự như kết thúc ván cờ bình thường khi xảy ra forfeit.

---

### Yêu cầu 8: Lấy trạng thái ván cờ hiện tại

**User Story:** Là người chơi đang trong ván cờ, tôi muốn có thể lấy lại trạng thái bàn cờ hiện tại khi cần (ví dụ sau khi reconnect), để tiếp tục ván cờ mà không bị mất dữ liệu.

#### Tiêu chí chấp nhận

1. WHEN client gửi WebSocket message tới `/app/game.state` với payload `{ "matchId": "..." }`, THE PvP_Service SHALL trả về `GameStateResponse` hiện tại của trận đấu tới `/user/{username}/queue/game`.
2. WHEN client đã xác thực gửi GET request tới `/matches/{matchId}/state`, THE PvP_Service SHALL trả về `ApiResponse<GameStateResponse>` với `code = 100` chứa trạng thái bàn cờ hiện tại. Endpoint REST này phục vụ trường hợp WebSocket bị lỗi hoặc client cần load lại bàn cờ bằng HTTP request.
3. IF trận đấu không tồn tại trong bộ nhớ (đã kết thúc hoặc không hợp lệ), THEN THE PvP_Service SHALL gửi message lỗi `ErrorCode.GAME_NOT_FOUND` tới `/user/{username}/queue/error` (WebSocket) hoặc trả về `ApiResponse` với `code` tương ứng `ErrorCode.GAME_NOT_FOUND` và HTTP status 404 (REST).
4. THE PvP_Service SHALL yêu cầu JWT hợp lệ được truyền qua STOMP connect header để xác thực người chơi trước khi xử lý bất kỳ WebSocket message nào.
5. THE PvP_Service SHALL yêu cầu JWT hợp lệ cho REST endpoint `GET /matches/{matchId}/state`.

---

### Yêu cầu 9: Lấy lịch sử trận đấu

**User Story:** Là người chơi, tôi muốn xem lịch sử các trận đấu của mình, để theo dõi tiến trình và phân tích các ván cờ đã chơi.

#### Tiêu chí chấp nhận

1. WHEN client đã xác thực gửi GET request tới `/matches/my-history` với tham số `page` và `size`, THE PvP_Service SHALL trả về `ApiResponse<PagedResponse<MatchSummaryResponse>>` với `code = 100` chứa danh sách trận đấu của người chơi hiện tại, sắp xếp theo `startTime` giảm dần.
2. THE PvP_Service SHALL lấy `username` từ `SecurityContextHolder` để xác định người chơi hiện tại.
3. THE PvP_Service SHALL tính `result` trong `MatchSummaryResponse` là `"WIN"` nếu `winnerId` bằng userId của người chơi, `"LOSE"` nếu `winnerId` là người khác, `"DRAW"` nếu `status = "DRAW"`.
4. WHERE tham số `page` không được cung cấp, THE PvP_Service SHALL sử dụng giá trị mặc định `page = 0`.
5. WHERE tham số `size` không được cung cấp, THE PvP_Service SHALL sử dụng giá trị mặc định `size = 10`.

---

### Yêu cầu 10: Lấy chi tiết một trận đấu

**User Story:** Là người chơi, tôi muốn xem chi tiết một trận đấu cụ thể bao gồm toàn bộ lịch sử nước đi, để có thể replay và phân tích ván cờ.

#### Tiêu chí chấp nhận

1. WHEN client gửi GET request tới `/matches/{matchId}`, THE PvP_Service SHALL trả về `ApiResponse<MatchResponse>` với `code = 100` chứa đầy đủ thông tin trận đấu bao gồm `moveLog`.
2. IF trận đấu không tồn tại, THEN THE PvP_Service SHALL trả về `ApiResponse` với `code` tương ứng `ErrorCode.GAME_NOT_FOUND` và HTTP status 404.
3. THE PvP_Service SHALL cho phép truy cập endpoint này mà không yêu cầu xác thực (public endpoint).

---

### Yêu cầu 11: Cấu trúc đồng nhất với các Service hiện tại

**User Story:** Là backend developer, tôi muốn PvP Service tuân theo cùng cấu trúc với User Service, Leaderboard Service và AI Model Service hiện tại, để dễ bảo trì và mở rộng.

#### Tiêu chí chấp nhận

1. THE PvP_Service SHALL sử dụng `MatchMapper` (MapStruct `@Mapper(componentModel = "spring")`) để chuyển đổi giữa `Match` entity và các DTO response.
2. THE PvP_Service SHALL sử dụng `@RequiredArgsConstructor` và `@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)` trong tất cả các class `@Service`, `@Controller`, `@Component`.
3. THE PvP_Service SHALL đặt các class theo đúng package: `controller/` cho controllers, `service/` cho services, `component/` cho components, `mapper/` cho mappers, `dto/request/` cho request DTOs, `dto/response/` cho response DTOs, `dto/websocket/` cho WebSocket DTOs, `entity/` cho JPA entities, `repository/` cho repositories.
4. THE PvP_Service SHALL sử dụng `AppException` với `ErrorCode` enum hiện có để xử lý lỗi trong REST endpoints, thêm các `ErrorCode` mới cho PvP: `ROOM_NOT_FOUND (4001)`, `ROOM_NOT_AVAILABLE (4002)`, `CANNOT_JOIN_OWN_ROOM (4003)`, `ALREADY_IN_ROOM (4004)`.
5. WHEN một lỗi xảy ra trong REST endpoint của PvP_Service, THE GlobalExceptionHandler SHALL xử lý và trả về `ApiResponse` với `code` và `message` tương ứng từ `ErrorCode`.
6. WHEN một lỗi xảy ra trong WebSocket handler của PvP_Service, THE GameWebSocketController SHALL bắt `AppException` và gửi message lỗi tới `/user/{username}/queue/error` với `{ "code": ..., "message": ... }`.
7. THE PvP_Service SHALL sử dụng `@Slf4j` trong tất cả các class service và controller để ghi log.

---

### Yêu cầu 12: Bảo mật endpoint

**User Story:** Là quản trị viên hệ thống, tôi muốn kiểm soát quyền truy cập vào các endpoint PvP, để đảm bảo chỉ người chơi đã xác thực mới có thể tạo phòng và tham gia ván cờ.

#### Tiêu chí chấp nhận

1. THE PvP_Service SHALL cho phép truy cập `GET /rooms`, `GET /matches/{matchId}` mà không yêu cầu xác thực (public endpoints).
2. THE PvP_Service SHALL yêu cầu JWT hợp lệ cho các endpoint: `POST /rooms`, `POST /rooms/{roomId}/join`, `GET /matches/my-history`.
3. THE PvP_Service SHALL yêu cầu JWT hợp lệ được truyền qua STOMP connect header (`Authorization: Bearer <token>`) cho tất cả WebSocket connections; IF không có JWT hợp lệ, THEN từ chối kết nối WebSocket.
4. THE PvP_Service SHALL cho phép bất kỳ người dùng có role `USER` hoặc `ADMIN` truy cập tất cả các chức năng PvP.
5. THE PvP_Service SHALL cập nhật `SecurityConfig` để thêm `/rooms` (GET) và `/matches/{matchId}` (GET) vào danh sách public endpoints, và `/ws/**` vào danh sách cho phép không cần auth (đã có).
