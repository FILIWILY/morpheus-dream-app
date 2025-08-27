import axios from 'axios';

const API_BASE_URL = '/api'; // Vite proxy will handle this

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // Увеличиваем таймаут до 180 секунд
});

// For local development with DANGEROUSLY_BYPASS_AUTH=true,
// we need to manually add the user ID header that the backend expects.
// In a real Telegram Web App environment, this header is not used;
// instead, the frontend would send the initData string.
if (import.meta.env.DEV) {
  const testUserId = '12345-test-user';
  api.defaults.headers.common['X-Telegram-User-ID'] = testUserId;
  console.log(`[DEV MODE] API client configured to use test user ID: ${testUserId}`);
}


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

export { api }; // Экспортируем как именованный экспорт для App.jsx

export default api; // Оставляем экспорт по умолчанию для остальных частей приложения

/* 
  Profile Management
*/
export const getProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('Profile not found, returning null.');
      return null;
    }
    console.error('Error fetching profile:', error);
    throw error;
  }
};