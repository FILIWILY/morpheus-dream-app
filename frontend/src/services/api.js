import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Все запросы будут идти к /api, который проксируется Vite
  timeout: 180000, // Увеличиваем таймаут до 180 секунд
});

api.interceptors.request.use(
  (config) => {
    const tg = window.Telegram?.WebApp;
    const userId = tg?.initDataUnsafe?.user?.id;

    if (userId) {
      config.headers['X-Telegram-User-ID'] = userId;
    } else {
      config.headers['X-Telegram-User-ID'] = '12345-test-user';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;