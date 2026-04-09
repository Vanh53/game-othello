import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Tất cả request /api/* đều qua gateway port 8888
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // WebSocket cho pvp-service
      '/ws': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
