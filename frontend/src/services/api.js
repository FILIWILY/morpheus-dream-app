import axios from 'axios';
import { detectTelegramEnvironment, getTelegramAuthData } from '../utils/telegramDetection.js';

const API_BASE_URL = '/api'; // Vite proxy will handle this

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // Увеличиваем таймаут до 180 секунд
});

let webSocket = null;
let reconnectTimeout = null;

const cleanupWebSocket = () => {
    if (webSocket) {
        try {
            webSocket.onopen = null;
            webSocket.onmessage = null;
            webSocket.onclose = null;
            webSocket.onerror = null;
        } catch (err) {
            console.warn('[WS] Error during cleanup:', err);
        }
    }
    webSocket = null;
};

api.connectWebSocket = () => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    if (webSocket && webSocket.readyState < 2) { // 0: CONNECTING, 1: OPEN
        console.log('[WS] Returning existing connection.');
        return webSocket;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
        ? window.location.host 
        : 'localhost:9000'; // Используем порт бэкенда для разработки

    const wsUrl = `${proto}//${host}`;
    
    console.log(`[WS] Connecting to ${wsUrl}...`);
    
    webSocket = new WebSocket(wsUrl);

    webSocket.onclose = (event) => {
        console.log('[WS] Connection closed:', event.code, event.reason);
        cleanupWebSocket();
    };

    webSocket.onerror = (error) => {
        console.error('[WS] WebSocket Error:', error);
    };

    return webSocket;
};

// Centralized request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Используем новую систему определения Telegram окружения
    const telegramEnv = detectTelegramEnvironment();
    const authData = getTelegramAuthData(telegramEnv);
    
    console.log('[API] Telegram environment check:', {
      isTelegram: telegramEnv.isTelegram,
      method: telegramEnv.method,
      hasInitData: !!telegramEnv.initData,
      initDataLength: telegramEnv.initData ? telegramEnv.initData.length : 0
    });

    if (telegramEnv.isTelegram && telegramEnv.initData && telegramEnv.initData.length > 0) {
      // Отправляем initData на сервер для валидации (только если есть реальные данные)
      config.headers['X-Telegram-Init-Data'] = telegramEnv.initData;
      console.log('[API] Using Telegram initData, length:', telegramEnv.initData.length);
    }
    // For development mode - use bypass auth when no valid initData
    else if (import.meta.env.DEV) {
      config.headers['X-Telegram-User-ID'] = 'dev_test_user_123'; // Тот же ID что в database.js
      console.log('[API] Using dev bypass auth with test user (DEV mode)');
    }
    else {
      console.warn('[API] No valid authentication method available');
      console.warn('[API] Environment:', { 
        isDev: import.meta.env.DEV,
        isTelegram: telegramEnv.isTelegram,
        hasInitData: !!telegramEnv.initData,
        initDataLength: telegramEnv.initData ? telegramEnv.initData.length : 0
      });
      console.warn('[API] Debug info:', telegramEnv.debugInfo);
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