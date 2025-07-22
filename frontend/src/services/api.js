import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000, // ✅ Добавляем тайм-аут в 5 секунд
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