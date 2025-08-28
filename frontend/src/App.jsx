import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext'; // Импортируем провайдер
import { LocalizationProvider } from './context/LocalizationContext';
import WelcomePage from './pages/WelcomePage';
import RecordingPage from './pages/RecordingPage';
import InterpretationPage from './pages/InterpretationPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LanguagePage from './pages/LanguagePage';
import PrivateRoute from './components/PrivateRoute';
import { getProfile, api } from './services/api';
import i18n from './services/i18n'; // Используем существующий i18n
import Placeholder from './components/Placeholder';
import React from 'react'; // Added missing import for React
import { detectTelegramEnvironment, initializeTelegramWebApp, isValidProductionEnvironment } from './utils/telegramDetection.js';

// ✅ Создаем новый контекст для статуса готовности приложения
export const AppReadyContext = React.createContext(false);


// Глобальный обработчик ошибок
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] React error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Передаем debugInfo в Placeholder, если он есть
      return <Placeholder error={this.state.error} debugInfo={this.props.debugInfo || {}} />;
    }

    return this.props.children;
  }
}

// Создаем I18nContext для передачи i18n экземпляра
// Это замена I18nextProvider, которую я ошибочно пытался использовать
export const I18nContext = React.createContext(i18n);


function App() {
  const [view, setView] = useState('loading'); // 'loading', 'app', 'placeholder'
  const [i18nInstance, setI18nInstance] = useState(i18n);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [isAppReady, setIsAppReady] = useState(false); // ✅ Новый стейт


  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    // Функция для безопасного получения объекта WebApp
    const getWebApp = () => {
        try {
            return window.Telegram?.WebApp;
        } catch (e) {
            console.error('[App] Ошибка доступа к window.Telegram.WebApp:', e);
            return null;
        }
    };

    const initializeApp = (tg) => {
      console.log('[App] ✅ Инициализация приложения...');
      if (!tg) {
          console.error('[App] ❌ Объект Telegram WebApp не найден на этапе инициализации!');
          setError('Объект Telegram WebApp не найден.');
          setView('placeholder');
          return;
      }

      // Явно вызываем ready(), чтобы сообщить Telegram, что приложение готово.
      tg.ready();
      
      // Вызываем остальные методы для улучшения UX
      initializeTelegramWebApp({ webApp: tg, isTelegram: true });
      
      console.log('[App] ✨ Приложение готово. Устанавливаем view = "app"');
      setView('app');
      setIsAppReady(true); // ✅ Подаем сигнал, что приложение полностью готово!
    };
    
    const startApp = () => {
        console.log('[App] 🚀 Запуск startApp...');
        const tg = getWebApp();

        setDebugInfo({
            isDev,
            isTgObjectPresent: !!tg,
            isInitDataPresent: !!tg?.initData,
            initDataLength: tg?.initData?.length || 0,
            platform: tg?.platform || 'unknown',
            version: tg?.version || 'unknown',
            colorScheme: tg?.colorScheme || 'unknown',
        });

        if (!tg) {
            console.log('[App] ❌ Объект Telegram WebApp не найден.');
            if (isDev) {
                console.log('[App] 🔧 Режим разработки, пропускаем проверку и показываем приложение.');
                initializeApp(tg); // Передаем tg, даже если он null, для консистентности
            } else {
                setError('Приложение должно быть открыто в Telegram.');
                setView('placeholder');
                setIsAppReady(true); // ✅ Готово, даже если это заглушка (чтобы логи показались)
            }
            return;
        }

        // Ключевая проверка: ждем initData
        if (tg.initData) {
            console.log(`[App] ✅ initData уже доступна (длина: ${tg.initData.length}). Запускаем инициализацию немедленно.`);
            initializeApp(tg);
        } else {
            console.log('[App] ⏳ initData еще не доступна. Устанавливаем тайм-аут и слушатели для ожидания.');
            let resolved = false;
            const timeout = 5000; // 5 секунд

            const resolutionHandler = () => {
                if (resolved) return;
                const currentTg = getWebApp();
                if (currentTg && currentTg.initData) {
                    resolved = true;
                    console.log(`[App] ✅ initData получена через слушатель 'viewportChanged' (длина: ${currentTg.initData.length}).`);
                    if (fallbackTimeout) clearTimeout(fallbackTimeout);
                    currentTg.offEvent('viewportChanged', resolutionHandler);
                    initializeApp(currentTg);
                }
            };
            
            const fallbackTimeout = setTimeout(() => {
                if (resolved) return;
                const currentTg = getWebApp();
                if (currentTg && currentTg.initData) {
                    resolved = true;
                    console.log(`[App] ✅ initData получена через fallback тайм-аут (длина: ${currentTg.initData.length}).`);
                    currentTg.offEvent('viewportChanged', resolutionHandler);
                    initializeApp(currentTg);
                } else {
                    console.error(`[App] ❌ Critical Error: initData не появилась после ${timeout}мс.`);
                    setError('Не удалось получить данные для аутентификации от Telegram.');
                    setView('placeholder');
                    setIsAppReady(true); // ✅ Готово, даже если с ошибкой (чтобы логи показались)
                }
            }, timeout);

            tg.onEvent('viewportChanged', resolutionHandler);
        }
    };
    
    startApp();

  }, []);

  if (view === 'loading') {
    // Показываем простой индикатор загрузки вместо null
    return (
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
        Загрузка...
      </div>
    );
  }

  if (view === 'placeholder') {
    return (
      <I18nContext.Provider value={i18nInstance}>
        <Placeholder error={error} debugInfo={debugInfo} />
      </I18nContext.Provider>
    );
  }

  return (
    <ErrorBoundary debugInfo={debugInfo}>
      <AppReadyContext.Provider value={isAppReady}> {/* ✅ Оборачиваем всё в новый провайдер */}
        <I18nContext.Provider value={i18nInstance}>
          <LocalizationProvider>
            <ProfileProvider>
              <Router>
                <Routes>
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/language" element={<LanguagePage />} />
                  <Route path="/" element={<PrivateRoute />}>
                    <Route index element={<Navigate to="/record" />} />
                    <Route path="record" element={<RecordingPage />} />
                    <Route path="interpretation/:id" element={<InterpretationPage />} />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Routes>
              </Router>
            </ProfileProvider>
          </LocalizationProvider>
        </I18nContext.Provider>
      </AppReadyContext.Provider>
    </ErrorBoundary>
  );
}

export default App;