// TODO: remove mock data when backend is ready

export const MOCK_AI_MODELS = [
  { id: 1, name: 'Rookie Bot',   difficulty: 'EASY',   filePath: 'models/rookie.onnx' },
  { id: 2, name: 'Casual AI',    difficulty: 'EASY',   filePath: 'models/casual.onnx' },
  { id: 3, name: 'Standard AI',  difficulty: 'MEDIUM', filePath: 'models/standard.onnx' },
  { id: 4, name: 'Tactical AI',  difficulty: 'MEDIUM', filePath: 'models/tactical.onnx' },
  { id: 5, name: 'Advanced AI',  difficulty: 'HARD',   filePath: 'models/advanced.onnx' },
  { id: 6, name: 'Master Bot',   difficulty: 'HARD',   filePath: 'models/master.onnx' },
  { id: 7, name: 'GrandMaster',  difficulty: 'EXPERT', filePath: 'models/grandmaster.onnx' },
]

export const MOCK_LEADERBOARD = {
  content: [
    { id: 1,  username: 'user123',   name: 'Nguyễn Văn A', elo: 2150, totalMatches: 120, totalWins: 89, totalDraws: 12 },
    { id: 2,  username: 'dragonfly', name: 'Trần Thị B',   elo: 2080, totalMatches: 95,  totalWins: 70, totalDraws: 8  },
    { id: 3,  username: 'shadow_x',  name: 'Lê Văn C',     elo: 1990, totalMatches: 200, totalWins: 140, totalDraws: 20 },
    { id: 4,  username: 'nova99',    name: 'Phạm Thị D',   elo: 1920, totalMatches: 80,  totalWins: 55, totalDraws: 5  },
    { id: 5,  username: 'blitz_k',   name: 'Hoàng Văn E',  elo: 1870, totalMatches: 150, totalWins: 98, totalDraws: 15 },
    { id: 6,  username: 'zenith',    name: 'Đỗ Thị F',     elo: 1810, totalMatches: 60,  totalWins: 38, totalDraws: 4  },
    { id: 7,  username: 'pixel_pro', name: 'Vũ Văn G',     elo: 1755, totalMatches: 110, totalWins: 68, totalDraws: 10 },
    { id: 8,  username: 'storm99',   name: 'Ngô Thị H',    elo: 1700, totalMatches: 90,  totalWins: 52, totalDraws: 7  },
    { id: 9,  username: 'ace_move',  name: 'Bùi Văn I',    elo: 1645, totalMatches: 75,  totalWins: 42, totalDraws: 6  },
    { id: 10, username: 'rookie_z',  name: 'Đinh Thị K',   elo: 1590, totalMatches: 45,  totalWins: 24, totalDraws: 3  },
  ],
  totalPages: 3,
  totalElements: 30,
}

export const MOCK_ROOM = {
  id: 'ROOM-4829',
  player1: {
    id: 1,
    username: 'user123',
    name: 'Nguyễn Văn A',
    avatar: null,
    elo: 2150,
  },
  player2: null, // chưa có đối thủ
}

export const MOCK_MY_PROFILE = {
  id: 1,
  username: 'user123',
  name: 'Nguyễn Văn A',
  email: 'user123@example.com',
  avatar: null,
  elo: 2150,
  rank: 1,
  totalMatches: 120,
  totalWins: 89,
  totalDraws: 12,
}

export const MOCK_USERS = [
  { id: 1,  username: 'user123',   name: 'Nguyen Van A', email: 'usera@example.com',   role: 'USER',  elo: 2150, totalMatches: 120 },
  { id: 2,  username: 'dragonfly', name: 'Tran Thi B',   email: 'userb@example.com',   role: 'USER',  elo: 2080, totalMatches: 95  },
  { id: 3,  username: 'shadow_x',  name: 'Le Van C',     email: 'userc@example.com',   role: 'USER',  elo: 1990, totalMatches: 200 },
  { id: 4,  username: 'nova99',    name: 'Pham Thi D',   email: 'userd@example.com',   role: 'USER',  elo: 1920, totalMatches: 80  },
  { id: 5,  username: 'blitz_k',   name: 'Hoang Van E',  email: 'usere@example.com',   role: 'USER',  elo: 1870, totalMatches: 150 },
  { id: 6,  username: 'zenith',    name: 'Do Thi F',     email: 'userf@example.com',   role: 'USER',  elo: 1810, totalMatches: 60  },
  { id: 7,  username: 'admin123',  name: 'Admin',        email: 'admin@example.com',   role: 'ADMIN', elo: 0,    totalMatches: 0   },
]
