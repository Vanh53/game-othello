import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '../..')
const envDir = fs.existsSync(resolve(repoRoot, '.env')) ? repoRoot : __dirname

export default defineConfig({
  plugins: [react()],
  envDir,
  define: {
    global: 'window',
  },
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
