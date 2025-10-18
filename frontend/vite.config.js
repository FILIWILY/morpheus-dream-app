import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr' 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    svgr({
      svgrOptions: {
        // svgr options
      },
    }),
  ],
  envDir: '..',
  server: {
    host: '127.0.0.1',
    port: 3001, // Using a different port to avoid conflicts
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Удаляем /api префикс
      }
    }
  }
})