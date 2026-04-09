import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LobbyPage from './pages/LobbyPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import PvPMenuPage from './pages/PvPMenuPage'
import RoomPage from './pages/RoomPage'
import GamePage from './pages/GamePage'
import AdminPage from './pages/AdminPage'
import { getToken } from './utils/auth'

// Route guard: redirect ve login neu chua co token
export const PrivateRoute = ({ children }) => {
  return getToken() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
      <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/pvp" element={<PrivateRoute><PvPMenuPage /></PrivateRoute>} />
      <Route path="/room/:roomId" element={<PrivateRoute><RoomPage /></PrivateRoute>} />
      <Route path="/game/:gameId" element={<PrivateRoute><GamePage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      {/* Cac route khac se them sau */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
