import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': __dirname + 'src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://3648-223-123-15-102.ngrok-free.app',
        changeOrigin: true,
      },
    },
  },
})
