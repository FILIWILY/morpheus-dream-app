/**
 * Определение платформы через Telegram WebApp API
 */

export function getTelegramPlatform() {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.platform) {
    return window.Telegram.WebApp.platform;
  }
  return 'unknown';
}

export function isAndroid() {
  const platform = getTelegramPlatform();
  return platform === 'android';
}

export function isIOS() {
  const platform = getTelegramPlatform();
  return platform === 'ios';
}

/**
 * Получает Safe Area Insets от Telegram
 * @returns {Object} { top, bottom, left, right } в пикселях
 */
export function getSafeAreaInsets() {
  const telegram = window.Telegram?.WebApp;
  
  if (telegram && telegram.safeAreaInset) {
    return {
      top: telegram.safeAreaInset.top || 0,
      bottom: telegram.safeAreaInset.bottom || 0,
      left: telegram.safeAreaInset.left || 0,
      right: telegram.safeAreaInset.right || 0
    };
  }
  
  // Fallback для старых версий или если API недоступно
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  };
}

/**
 * Применяет класс платформы к body элементу и устанавливает CSS переменные для safe area
 */
export function applyPlatformClass() {
  const platform = getTelegramPlatform();
  
  if (platform === 'android') {
    document.body.classList.add('platform-android');
  } else if (platform === 'ios') {
    document.body.classList.add('platform-ios');
  } else {
    document.body.classList.add('platform-web');
  }
  
  // Получаем safe area insets от Telegram
  const insets = getSafeAreaInsets();
  
  // Устанавливаем CSS переменные (если Telegram их не установил)
  const root = document.documentElement;
  
  if (!root.style.getPropertyValue('--tg-safe-area-inset-top')) {
    root.style.setProperty('--tg-safe-area-inset-top', `${insets.top}px`);
  }
  if (!root.style.getPropertyValue('--tg-safe-area-inset-bottom')) {
    root.style.setProperty('--tg-safe-area-inset-bottom', `${insets.bottom}px`);
  }
  if (!root.style.getPropertyValue('--tg-safe-area-inset-left')) {
    root.style.setProperty('--tg-safe-area-inset-left', `${insets.left}px`);
  }
  if (!root.style.getPropertyValue('--tg-safe-area-inset-right')) {
    root.style.setProperty('--tg-safe-area-inset-right', `${insets.right}px`);
  }
  
  console.log('[Platform] Detected platform:', platform);
  console.log('[Platform] Safe Area Insets:', insets);
}

