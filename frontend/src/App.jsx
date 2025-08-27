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
        const tg = window.Telegram?.WebApp;
        
        // Получаем информацию о текущем окружении
        const url = new URL(window.location.href);
        const referrer = document.referrer;
        const userAgent = navigator.userAgent;
        
        console.log('[App] 🔍 Comprehensive Telegram detection...');
        console.log('[App] URL:', window.location.href);
        console.log('[App] Referrer:', referrer);
        console.log('[App] User agent:', userAgent);
        console.log('[App] URL params:', Object.fromEntries(url.searchParams.entries()));
        
        // Метод 1: Стандартная проверка Telegram WebApp объекта
        const hasTelegramWebApp = tg && typeof tg.ready === 'function';
        console.log('[App] Method 1 - Telegram WebApp object:', hasTelegramWebApp);
        
        // Метод 2: Проверка URL параметров (Telegram может передавать специальные параметры)
        const hasTelegramParams = url.searchParams.has('tgWebAppData') || 
                                 url.searchParams.has('tgWebAppVersion') ||
                                 url.searchParams.has('tgWebAppPlatform') ||
                                 url.hash.includes('tgWebAppData');
        console.log('[App] Method 2 - Telegram URL params:', hasTelegramParams);
        
        // Метод 3: Проверка referrer (может содержать t.me или telegram)
        const hasTelegramReferrer = referrer.includes('t.me') || 
                                   referrer.includes('telegram') ||
                                   referrer.includes('web.telegram.org');
        console.log('[App] Method 3 - Telegram referrer:', hasTelegramReferrer);
        
        // Метод 4: Проверка User Agent (iOS Safari может содержать специфические признаки)
        const isTelegramUserAgent = userAgent.includes('TelegramWebview') ||
                                   userAgent.includes('Telegram') ||
                                   (userAgent.includes('Safari') && (hasTelegramParams || hasTelegramReferrer));
        console.log('[App] Method 4 - Telegram User Agent:', isTelegramUserAgent);
        
        // Метод 5: Проверка наличия window.TelegramWebviewProxy (iOS specific)
        const hasTelegramProxy = typeof window.TelegramWebviewProxy !== 'undefined';
        console.log('[App] Method 5 - Telegram iOS Proxy:', hasTelegramProxy);
        
        // Комбинированная проверка - считаем Telegram окружением если хотя бы один метод сработал
        const isTelegramEnvironment = hasTelegramWebApp || hasTelegramParams || 
                                     hasTelegramReferrer || isTelegramUserAgent || hasTelegramProxy;
        
        console.log('[App] 🎯 Final decision - Is Telegram:', isTelegramEnvironment);
        
        // Сохраняем диагностическую информацию
        const debugData = {
          url: window.location.href,
          referrer,
          userAgent,
          hasTelegramWebApp,
          hasTelegramParams,
          hasTelegramReferrer,
          isTelegramUserAgent,
          hasTelegramProxy,
          isTelegramEnvironment
        };
        setDebugInfo(debugData);
        
        if (isTelegramEnvironment) {
          console.log('[App] ✅ Telegram environment detected (combined methods)');
          
          // Если есть стандартный WebApp объект, используем его
          if (hasTelegramWebApp) {
            console.log('[App] Using standard Telegram WebApp API');
            console.log('[App] initData available:', !!tg.initData);
            console.log('[App] initData length:', tg.initData ? tg.initData.length : 0);
            
            tg.ready();
            if (tg.expand) {
              tg.expand();
            }
          } else {
            console.log('[App] Using alternative Telegram detection (iOS Safari mode)');
          }
          
          setView('app');
        }
        else if (isDev) {
          console.log('[App] Development mode detected. Bypassing Telegram check.');
          setView('app');
        }
        else {
          console.log('[App] ❌ Not in Telegram environment. Showing placeholder.');
          setView('placeholder');
        }
      } catch (err) {
        console.error('[App] Error during initialization:', err);
        setError(err.message);
        setView('placeholder');
      }
    };

    // Увеличиваем задержку для более надежной инициализации
    const timer = setTimeout(initializeApp, 500);

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