# PvP Service - Othello Game

Service xử lý toàn bộ logic thách đấu trực tiếp giữa người chơi (Player vs Player) cho game Othello.

## Tính năng chính

- **Quản lý phòng chờ**: Tạo phòng, tham gia phòng, xem danh sách phòng đang chờ
- **Matchmaking tự động**: Tìm đối thủ ngẫu nhiên theo Elo rating
- **Realtime gameplay**: WebSocket (STOMP/SockJS) cho trải nghiệm chơi cờ mượt mà
- **Logic cờ Othello đầy đủ**: Kiểm tra nước đi hợp lệ, lật quân, tính điểm
- **Reconnect grace period**: Cho phép người chơi reconnect trong 30 giây khi mất kết nối
- **Lịch sử trận đấu**: Lưu trữ và truy vấn lịch sử các ván cờ
- **Kafka integration**: Gửi kết quả trận đấu sang Leaderboard Service để cập nhật Elo

## Tech Stack

- Java 21
- Spring Boot 3.4.5
- Spring Security + JWT
- Spring WebSocket (STOMP/SockJS)
- Spring Data JPA + PostgreSQL
- Spring Data Redis
- Spring Kafka
- MapStruct
- Lombok

## Cấu trúc dự án

```
src/main/java/com/game/pvp_service/
├── config/              # Cấu hình (Security, WebSocket, Redis, Kafka)
├── controller/          # REST controllers và WebSocket controller
├── service/             # Business logic
├── component/           # Components (PresenceManager, ReconnectManager)
├── repository/          # JPA repositories
├── entity/              # JPA entities
├── dto/
│   ├── request/         # Request DTOs
│   ├── response/        # Response DTOs
│   ├── websocket/       # WebSocket message DTOs
│   └── event/           # Kafka event DTOs
├── mapper/              # MapStruct mappers
└── exception/           # Exception handling
```

## Cấu hình

Cập nhật `src/main/resources/application.yaml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/othello_db?currentSchema=schema_pvp
    username: pvp_service_acc
    password: PvpPassword@123
  data:
    redis:
      host: localhost
      port: 6379
  kafka:
    bootstrap-servers: localhost:9092

jwt:
  signerKey: "your-secret-key-here"
```

## Chạy service

```bash
mvn spring-boot:run
```

Service sẽ chạy trên port 8084.

## API Endpoints

### REST API

#### Phòng chờ
- `POST /rooms` - Tạo phòng mới (yêu cầu JWT)
- `GET /rooms` - Lấy danh sách phòng đang chờ (public)
- `POST /rooms/{roomId}/join` - Tham gia phòng (yêu cầu JWT)

#### Trận đấu
- `GET /matches/{matchId}` - Lấy thông tin trận đấu (public)
- `GET /matches/{matchId}/state` - Lấy trạng thái bàn cờ hiện tại (yêu cầu JWT)
- `GET /matches/my-history?page=0&size=10` - Lấy lịch sử trận đấu (yêu cầu JWT)

### WebSocket API

Kết nối: `ws://localhost:8084/ws` (với SockJS fallback)

Header kết nối:
```
Authorization: Bearer <JWT_TOKEN>
```

#### Destinations

**Gửi từ client:**
- `/app/game.join` - Tham gia hàng chờ matchmaking
- `/app/game.move` - Thực hiện nước đi (payload: `MoveRequest`)
- `/app/game.leave` - Rời trận hoặc rời hàng chờ
- `/app/game.state` - Lấy trạng thái bàn cờ (payload: `GameStateRequest`)

**Nhận từ server:**
- `/user/queue/game` - Nhận trạng thái bàn cờ (`GameStateResponse`)
- `/user/queue/status` - Nhận trạng thái matchmaking
- `/user/queue/error` - Nhận thông báo lỗi (`ErrorResponse`)

## Luồng chơi

### Tạo phòng và chơi với bạn bè

1. Player A gọi `POST /rooms` để tạo phòng
2. Player B gọi `GET /rooms` để xem danh sách phòng
3. Player B gọi `POST /rooms/{roomId}/join` để tham gia
4. Cả hai kết nối WebSocket và nhận `GameStateResponse` ban đầu
5. Lần lượt gửi `/app/game.move` để đánh cờ
6. Nhận `GameStateResponse` sau mỗi nước đi
7. Khi kết thúc, nhận `GameStateResponse` với `status = "FINISHED"` hoặc `"DRAW"`

### Matchmaking tự động

1. Player kết nối WebSocket
2. Gửi message tới `/app/game.join`
3. Nhận message `"Đang tìm đối thủ..."` qua `/user/queue/status`
4. Khi tìm được đối thủ, nhận `GameStateResponse` ban đầu qua `/user/queue/game`
5. Tiếp tục như luồng chơi bình thường

## Reconnect

Nếu người chơi mất kết nối WebSocket trong khi đang chơi:
- Service chờ 30 giây (grace period)
- Nếu reconnect trong 30 giây: tiếp tục ván cờ bình thường
- Nếu không reconnect: xử lý forfeit, đối thủ thắng

## Kafka Events

Service gửi event `match-result` sau khi trận kết thúc:

```json
{
  "matchId": "uuid",
  "player1Id": "username1",
  "player2Id": "username2",
  "winnerId": "username1",
  "status": "FINISHED",
  "endTime": "2026-04-01T10:00:00"
}
```

Leaderboard Service lắng nghe topic này để cập nhật Elo và thống kê.

## Database Schema

```sql
CREATE TABLE matches (
    id VARCHAR(36) PRIMARY KEY,
    match_type VARCHAR(10) NOT NULL,
    player1_id VARCHAR(255) NOT NULL,
    player2_id VARCHAR(255),
    bot_id INTEGER,
    winner_id VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    move_log TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP
);
```

## Redis Data Structures

- `room:{roomId}` - Hash chứa thông tin phòng (TTL 30 phút)
- `rooms:waiting` - Set chứa các roomId đang chờ
- `matchmaking:queue` - Sorted Set với score là Elo (cho matchmaking)

## License

MIT
