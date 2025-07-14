import axios from 'axios';

// Создаем экземпляр axios
const api = axios.create({
  baseURL: '/api', // Базовый URL для всех запросов, который Vite будет проксировать
});

// Создаем "перехватчик" (interceptor) запросов
api.interceptors.request.use(
  (config) => {
    // Пытаемся получить данные пользователя из Telegram Web App
    const tg = window.Telegram?.WebApp;
    const userId = tg?.initDataUnsafe?.user?.id;

    if (userId) {
      // Если ID пользователя есть, добавляем его в заголовок каждого запроса
      config.headers['X-Telegram-User-ID'] = userId;
      console.log(`Sending request with User ID: ${userId}`);
    } else {
      // Для локального тестирования в обычном браузере, где нет объекта Telegram
      // можно использовать "заглушку"
      config.headers['X-Telegram-User-ID'] = '12345-test-user';
      console.log('Telegram user not found, using test ID: 12345-test-user');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;