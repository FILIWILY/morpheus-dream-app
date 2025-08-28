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
      return <Placeholder error={this.state.error} />;
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

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    const tg = window.Telegram?.WebApp;

    const initializeApp = () => {
      console.log('[App] ✅ initializeApp function called.');
      if (!tg) {
        console.log('[App] ❌ Telegram WebApp object not found.');
        if (!isDev) {
          setView('placeholder');
        } else {
          console.log('[App] 🔧 Development mode, showing app.');
          setView('app');
        }
        return;
      }
      
      console.log('[App] ✨ Telegram WebApp object found. Initializing now.');
      // Явно вызываем ready(), чтобы сообщить Telegram, что приложение готово.
      tg.ready();
      
      // Вызываем остальные методы для улучшения UX
      initializeTelegramWebApp({ webApp: tg, isTelegram: true });
      
      setView('app');
    };

    // Вешаем слушатель на событие `viewportChanged`. 
    // Это событие надежно срабатывает после инициализации WebApp.
    // Мы используем его как триггер, чтобы начать работу нашего приложения.
    const onViewportChanged = () => {
        console.log('[App] 📢 viewportChanged event fired. Initializing app.');
        // Убираем слушатель после первого срабатывания, чтобы избежать повторной инициализации
        tg.offEvent('viewportChanged', onViewportChanged);
        initializeApp();
    };

    if (tg && tg.initData) {
        // Если WebApp уже готово к моменту загрузки нашего скрипта, 
        // немедленно запускаем инициализацию.
        console.log('[App] 🚀 WebApp is already available. Initializing immediately.');
        initializeApp();
    } else if (tg) {
        // Если WebApp есть, но, возможно, еще не полностью готово,
        // мы подписываемся на событие viewportChanged.
        console.log('[App] ⏳ WebApp is available, but might be initializing. Setting up viewportChanged listener.');
        tg.onEvent('viewportChanged', onViewportChanged);
    } else {
        // Если объекта tg нет вообще, значит мы точно не в Telegram.
        console.log('[App] ❌ Not in a Telegram environment.');
        if (!isDev) {
          setView('placeholder');
        } else {
          setView('app');
        }
    }

    // Функция очистки на случай размонтирования компонента
    return () => {
      if (tg) {
        tg.offEvent('viewportChanged', onViewportChanged);
      }
    };
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;