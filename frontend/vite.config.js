import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Наша настройка прокси остается без изменений
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    // ✅ ВОТ ЧТО НУЖНО ДОБАВИТЬ
    // Разрешаем Vite принимать подключения не только с localhost
    host: '0.0.0.0', 
    // Добавляем домен ngrok в список разрешенных хостов
    // Точка в начале означает, что будет разрешен любой поддомен,
    // так что вам не придется менять это при каждой смене URL от ngrok.
    allowedHosts: ['.ngrok-free.app'],
  },
});