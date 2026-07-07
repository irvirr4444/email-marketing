import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'client',
  // Load env from the repo root .env (only VITE_-prefixed vars reach the client).
  envDir: path.resolve(__dirname, '..'),
  plugins: [react(), tailwindcss()],
  resolve: {
    // IMPORTANT: don't alias bare "@" because it breaks scoped packages like
    // "@tailwindcss/typography" (it would get rewritten as a local path).
    alias: [
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname, './client/src/untitled-ui')}/`,
      },
      {
        find: /^@ui\//,
        replacement: `${path.resolve(__dirname, './client/src/untitled-ui')}/`,
      },
      {
        find: /^@app\//,
        replacement: `${path.resolve(__dirname, './client/src')}/`,
      },
      {
        find: /^@shared\//,
        replacement: `${path.resolve(__dirname, './shared')}/`,
      },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
})
