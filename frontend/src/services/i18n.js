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
const browserLanguage = navigator.language.split(/[-_]/)[0];

// Устанавливаем язык по умолчанию на основе языка браузера, если он поддерживается
i18n.locale = supportedLocales.includes(browserLanguage) ? browserLanguage : 'en';

i18n.enableFallback = true;

export const t = (key, options) => i18n.t(key, options);

export default i18n;