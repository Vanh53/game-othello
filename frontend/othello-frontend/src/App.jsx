import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LobbyPage from './pages/LobbyPage'
import LeaderboardPage from './pages/LeaderboardPage'
import PlayerHistoryPage from './pages/PlayerHistoryPage'
import ProfilePage from './pages/ProfilePage'
import PvPMenuPage from './pages/PvPMenuPage'
import RoomPage from './pages/RoomPage'
import GamePage from './pages/GamePage'
import AdminPage from './pages/AdminPage'
import AiModelPage from './pages/AiModelPage'
import OAuth2Callback from './pages/OAuth2Callback'
import { getToken } from './utils/auth'

// Route guard: redirect ve login neu chua co token
export const PrivateRoute = ({ children }) => {
  const location = useLocation()
  return getToken()
    ? children
    : <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/oauth2/callback" element={<OAuth2Callback />} />
      <Route path="/" element={<LobbyPage />} />
      <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
      <Route path="/leaderboard/:userId/history" element={<PrivateRoute><PlayerHistoryPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/pvp" element={<PrivateRoute><PvPMenuPage /></PrivateRoute>} />
      <Route path="/room/:roomId" element={<PrivateRoute><RoomPage /></PrivateRoute>} />
      <Route path="/game/:gameId" element={<PrivateRoute><GamePage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="/admin/models" element={<PrivateRoute><AiModelPage /></PrivateRoute>} />
      {/* Cac route khac se them sau */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
