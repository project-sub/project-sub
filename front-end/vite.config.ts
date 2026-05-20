import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true, // 👈 도커 환경에서 파일 변경을 강제로 감지하게 합니다.
    },
  },
})
