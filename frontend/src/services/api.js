import axios from 'axios';

const API_BASE_URL = '/api'; // Vite proxy will handle this

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // Увеличиваем таймаут до 180 секунд
});

// Centralized request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const tg = window.Telegram?.WebApp;
    const url = new URL(window.location.href);
    const referrer = document.referrer;
    
    // Проверяем различные способы определения Telegram окружения
    const hasTelegramWebApp = tg && typeof tg.ready === 'function';
    const hasTelegramParams = url.searchParams.has('tgWebAppData') || url.hash.includes('tgWebAppData');
    const hasTelegramReferrer = referrer.includes('t.me') || referrer.includes('telegram');
    const isTelegramEnvironment = hasTelegramWebApp || hasTelegramParams || hasTelegramReferrer;

    // For production, use the initData string for cryptographic verification.
    if (hasTelegramWebApp && tg.initData !== undefined) {
      // Стандартный режим с Telegram WebApp API
      config.headers['X-Telegram-Init-Data'] = tg.initData || '';
      console.log('[API] Using standard Telegram WebApp initData, length:', (tg.initData || '').length);
    }
    else if (isTelegramEnvironment) {
      // iOS Safari режим - Telegram окружение без стандартного API
      config.headers['X-Telegram-Init-Data'] = '';
      console.log('[API] Using Telegram environment (iOS Safari mode) with empty initData');
    }
    // For local development, bypass auth with a test user ID.
    else if (import.meta.env.DEV) {
      config.headers['X-Telegram-User-ID'] = '12345-test-user';
      console.log('[API] Using dev bypass auth');
    }
    else {
      console.warn('[API] No authentication method available');
      console.warn('[API] Environment check:', {
        hasTelegramWebApp,
        hasTelegramParams,
        hasTelegramReferrer,
        url: window.location.href,
        referrer
      });
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