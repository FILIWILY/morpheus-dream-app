/**
 * Telegram Web App Environment Detection
 * Основано на официальной документации Telegram Web Apps
 * https://core.telegram.org/bots/webapps
 */

/**
 * Проверяет, запущено ли приложение в окружении Telegram
 * @returns {Object} Объект с результатами проверки
 */
export function detectTelegramEnvironment() {
  const result = {
    isTelegram: false,
    method: null,
    webApp: null,
    initData: null,
    user: null,
    debugInfo: {}
  };

  try {
    // Основной метод: проверка наличия Telegram WebApp API
    const tg = window.Telegram?.WebApp;
    
    if (tg && typeof tg.ready === 'function') {
      result.isTelegram = true;
      result.method = 'webapp_api';
      result.webApp = tg;
      result.initData = tg.initData || '';
      
      // Получаем данные пользователя из initDataUnsafe (только для отображения)
      if (tg.initDataUnsafe?.user) {
        result.user = tg.initDataUnsafe.user;
      }
      
      result.debugInfo = {
        hasWebApp: true,
        hasInitData: !!tg.initData,
        initDataLength: tg.initData ? tg.initData.length : 0,
        hasUser: !!tg.initDataUnsafe?.user,
        version: tg.version || 'unknown',
        platform: tg.platform || 'unknown',
        colorScheme: tg.colorScheme || 'unknown'
      };
      
      return result;
    }

    // Если WebApp API недоступно, проверяем другие признаки
    const url = new URL(window.location.href);
    const referrer = document.referrer || '';
    const userAgent = navigator.userAgent || '';

    // Проверка URL параметров (может содержать tgWebAppData)
    const hasTelegramParams = url.searchParams.has('tgWebAppData') ||
                             url.searchParams.has('tgWebAppVersion') ||
                             url.searchParams.has('tgWebAppPlatform') ||
                             url.hash.includes('tgWebAppData');

    // Проверка referrer
    const hasTelegramReferrer = referrer.includes('t.me') ||
                               referrer.includes('telegram.org') ||
                               referrer.includes('web.telegram.org');

    // Проверка User Agent
    const hasTelegramUserAgent = userAgent.includes('TelegramWebview') ||
                                userAgent.includes('Telegram');

    // Проверка специфичных для iOS объектов
    const hasTelegramProxy = typeof window.TelegramWebviewProxy !== 'undefined' ||
                            typeof window.external?.notify !== 'undefined';

    result.debugInfo = {
      hasWebApp: false,
      url: window.location.href,
      referrer,
      userAgent,
      hasTelegramParams,
      hasTelegramReferrer,
      hasTelegramUserAgent,
      hasTelegramProxy,
      urlParams: Object.fromEntries(url.searchParams.entries())
    };

    // Если найдены альтернативные признаки Telegram
    if (hasTelegramParams || hasTelegramReferrer || hasTelegramUserAgent || hasTelegramProxy) {
      result.isTelegram = true;
      result.method = 'alternative_detection';
      result.initData = ''; // Пустой initData для альтернативного метода
      
      // Попытка извлечь данные из URL параметров
      if (hasTelegramParams && url.searchParams.has('tgWebAppData')) {
        try {
          const tgData = url.searchParams.get('tgWebAppData');
          result.initData = decodeURIComponent(tgData);
        } catch (e) {
          console.warn('[TelegramDetection] Failed to decode tgWebAppData:', e);
        }
      }
    }

  } catch (error) {
    console.error('[TelegramDetection] Error during detection:', error);
    result.debugInfo.error = error.message;
  }

  return result;
}

/**
 * Инициализирует Telegram WebApp API если доступен
 * @param {Object} telegramEnv - результат detectTelegramEnvironment()
 */
export function initializeTelegramWebApp(telegramEnv) {
  if (!telegramEnv.isTelegram || !telegramEnv.webApp) {
    return false;
  }

  try {
    const tg = telegramEnv.webApp;
    
    // Инициализируем WebApp
    tg.ready();
    
    // Расширяем приложение на весь экран
    if (typeof tg.expand === 'function') {
      tg.expand();
    }
    
    // Настраиваем основные параметры
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('secondary_bg_color');
    }
    
    // Включаем подтверждение закрытия если нужно
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }

    console.log('[TelegramDetection] WebApp initialized successfully');
    return true;
  } catch (error) {
    console.error('[TelegramDetection] Error initializing WebApp:', error);
    return false;
  }
}

/**
 * Получает данные для отправки на backend
 * @param {Object} telegramEnv - результат detectTelegramEnvironment()
 * @returns {Object} Данные для отправки на сервер
 */
export function getTelegramAuthData(telegramEnv) {
  const authData = {
    isTelegram: telegramEnv.isTelegram,
    method: telegramEnv.method,
    initData: telegramEnv.initData || ''
  };

  // Добавляем дополнительную информацию для отладки
  if (process.env.NODE_ENV === 'development') {
    authData.debugInfo = telegramEnv.debugInfo;
  }

  return authData;
}

/**
 * Проверяет, является ли окружение валидным для production
 * @param {Object} telegramEnv - результат detectTelegramEnvironment()
 * @returns {boolean}
 */
export function isValidProductionEnvironment(telegramEnv) {
  // В production доверяем любому обнаруженному окружению Telegram.
  // Бэкенд все равно проверит initData, если он будет предоставлен.
  if (process.env.NODE_ENV !== 'production') {
    return true; // В dev режиме разрешаем все
  }

  return telegramEnv.isTelegram;
}
