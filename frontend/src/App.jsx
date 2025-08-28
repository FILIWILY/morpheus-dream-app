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
    let detectionAttempts = 0;
    const maxDetectionAttempts = 40; // 40 * 50ms = 2 seconds timeout

    const initializeApp = () => {
      detectionAttempts++;
      console.log(`[App] 🚀 Initialization attempt #${detectionAttempts}`);

      // Условие готовности: ждем только появления самого объекта WebApp.
      // Поле initData может появиться чуть позже.
      if (window.Telegram && window.Telegram.WebApp) {
        console.log('[App] ✅ Telegram WebApp object is available.');
        
        // Добавим микро-задержку, чтобы initData успел прогрузиться, если он еще не готов
        setTimeout(() => {
            try {
              const telegramEnv = detectTelegramEnvironment();
              
              console.log('[App] 🔍 Detection result:', {
                isTelegram: telegramEnv.isTelegram,
                method: telegramEnv.method,
                hasInitData: !!telegramEnv.initData,
                initDataLength: telegramEnv.initData?.length || 0,
                user: telegramEnv.user,
              });
    
              setDebugInfo(telegramEnv.debugInfo);
    
              if (telegramEnv.isTelegram) {
                if (telegramEnv.webApp) {
                  initializeTelegramWebApp(telegramEnv);
                }
                setView('app');
              } else {
                 console.warn('[App] ⚠️ Detected as non-Telegram environment inside the main check.');
                 setView('placeholder');
              }
            } catch (err) {
                console.error('[App] 💥 Error during initialization:', err);
                setError(err.message);
                setDebugInfo(prev => ({ ...prev, error: err.message }));
                setView('placeholder');
            }
        }, 50); // 50ms задержки должно быть достаточно

      } else if (detectionAttempts < maxDetectionAttempts) {
        // Если API еще не готово, пробуем снова через 50 мс
        setTimeout(initializeApp, 50);
      } else {
        // Timeout: API не появилось за 2 секунды
        console.log('[App] ❌ Telegram WebApp API not found after 2 seconds.');
        setDebugInfo(prev => ({
            ...prev,
            timeout: true,
            isDev,
            finalCheck: {
                hasTelegram: !!window.Telegram,
                hasWebApp: !!window.Telegram?.WebApp,
                hasInitData: window.Telegram?.WebApp?.initData !== undefined,
            }
        }));

        if (isDev) {
          console.log('[App] 🔧 Development mode - bypassing Telegram check.');
          setView('app');
        } else {
          console.log('[App]  Showing placeholder.');
          setView('placeholder');
        }
      }
    };

    initializeApp();
    
    // Мы не возвращаем cleanup-функцию, чтобы не прерывать polling
  }, []);

  if (view === 'loading') {
    return null; 
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