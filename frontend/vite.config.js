import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем .env из корня проекта (на уровень выше)
  const env = loadEnv(mode, '../', '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.API_URL || 'http://localhost:9000', // Убеждаемся, что порт 9000
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    // Передаем переменные окружения в клиентский код
    define: {
      'import.meta.env.VITE_GOOGLE_PLACES_API_KEY': JSON.stringify(env.VITE_GOOGLE_PLACES_API_KEY),
    },
  }
})