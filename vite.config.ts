import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    watch: {
      // Windows often locks PNGs while previews/editors open them
      ignored: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp'],
    },
  },
})
