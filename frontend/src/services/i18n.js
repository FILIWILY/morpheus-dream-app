import { I18n } from 'i18n-js';

// Импортируем все наши файлы с переводами
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';

// ✅ ДОБАВЛЯЕМ НОВЫЕ ЯЗЫКИ В КОНФИГУРАЦИЮ
const i18n = new I18n({
  en,
  ru,
  de,
  es,
  fr,
});

// ✅ РАСШИРЯЕМ СПИСОК ПОДДЕРЖИВАЕМЫХ ЯЗЫКОВ
const supportedLocales = ['en', 'ru', 'de', 'es', 'fr'];

// 1. Проверяем сохраненный язык в localStorage
const savedLanguage = localStorage.getItem('userLanguage');

// 2. Определяем язык Telegram
const telegramLanguage = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

// 3. Определяем язык браузера
const browserLanguage = navigator.language.split(/[-_]/)[0];

// Приоритетный выбор языка
let language = 'en'; // Язык по умолчанию

if (savedLanguage && supportedLocales.includes(savedLanguage)) {
  language = savedLanguage;
} else if (telegramLanguage && supportedLocales.includes(telegramLanguage)) {
  language = telegramLanguage;
} else if (supportedLocales.includes(browserLanguage)) {
  language = browserLanguage;
}

// Устанавливаем язык
i18n.locale = language;


i18n.enableFallback = true;

export const t = (key, options) => i18n.t(key, options);

export default i18n;