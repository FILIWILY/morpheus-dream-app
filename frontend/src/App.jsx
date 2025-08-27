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
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    const initializeApp = () => {
      try {
        console.log('[App] 🚀 Starting app initialization...');
        
        // Используем новую систему определения Telegram окружения
        const telegramEnv = detectTelegramEnvironment();
        
        console.log('[App] 🔍 Telegram environment detection result:', {
          isTelegram: telegramEnv.isTelegram,
          method: telegramEnv.method,
          hasInitData: !!telegramEnv.initData,
          hasUser: !!telegramEnv.user
        });
        
        // Сохраняем диагностическую информацию для отображения в Placeholder
        setDebugInfo(telegramEnv.debugInfo);
        
        if (telegramEnv.isTelegram) {
          console.log('[App] ✅ Telegram environment detected');
          
          // Инициализируем WebApp API если доступен
          if (telegramEnv.webApp) {
            const initialized = initializeTelegramWebApp(telegramEnv);
            console.log('[App] WebApp initialization:', initialized ? 'success' : 'failed');
          }
          
          // Проверяем валидность для production
          if (isValidProductionEnvironment(telegramEnv)) {
            setView('app');
          } else {
            console.warn('[App] ⚠️ Invalid production environment');
            setView('placeholder');
            setError('Invalid Telegram environment for production');
          }
        }
        else if (isDev) {
          console.log('[App] 🔧 Development mode - bypassing Telegram check');
          setView('app');
        }
        else {
          console.log('[App] ❌ Not in Telegram environment');
          setView('placeholder');
        }
        
      } catch (err) {
        console.error('[App] Error during initialization:', err);
        setError(err.message);
        setView('placeholder');
      }
    };

    // Даем время на инициализацию Telegram WebApp API
    const timer = setTimeout(initializeApp, 300);

    return () => clearTimeout(timer);
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