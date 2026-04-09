-- Tạo schemas
CREATE SCHEMA IF NOT EXISTS schema_user;
CREATE SCHEMA IF NOT EXISTS schema_ai;
CREATE SCHEMA IF NOT EXISTS schema_pvp;
CREATE SCHEMA IF NOT EXISTS schema_leaderboard;

-- Tạo users cho từng service
CREATE USER user_service_acc WITH PASSWORD 'UserPassword@123';
CREATE USER ai_service_acc WITH PASSWORD 'AiPassword@123';
CREATE USER pvp_service_acc WITH PASSWORD 'PvpPassword@123';
CREATE USER leaderboard_service_acc WITH PASSWORD 'LeaderPassword@123';

-- Cấp quyền
GRANT ALL PRIVILEGES ON SCHEMA schema_user TO user_service_acc;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA schema_user TO user_service_acc;
ALTER DEFAULT PRIVILEGES IN SCHEMA schema_user GRANT ALL ON TABLES TO user_service_acc;

GRANT ALL PRIVILEGES ON SCHEMA schema_ai TO ai_service_acc;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA schema_ai TO ai_service_acc;
ALTER DEFAULT PRIVILEGES IN SCHEMA schema_ai GRANT ALL ON TABLES TO ai_service_acc;

GRANT ALL PRIVILEGES ON SCHEMA schema_pvp TO pvp_service_acc;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA schema_pvp TO pvp_service_acc;
ALTER DEFAULT PRIVILEGES IN SCHEMA schema_pvp GRANT ALL ON TABLES TO pvp_service_acc;

GRANT ALL PRIVILEGES ON SCHEMA schema_leaderboard TO leaderboard_service_acc;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA schema_leaderboard TO leaderboard_service_acc;
ALTER DEFAULT PRIVILEGES IN SCHEMA schema_leaderboard GRANT ALL ON TABLES TO leaderboard_service_acc;
