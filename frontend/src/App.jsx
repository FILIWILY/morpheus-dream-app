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

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    const initializeApp = () => {
      try {
        const tg = window.Telegram?.WebApp;

        // Проверяем наличие Telegram Web App объекта (более надежная проверка)
        console.log('[App] Checking Telegram environment...');
        console.log('[App] window.Telegram exists:', !!window.Telegram);
        console.log('[App] window.Telegram.WebApp exists:', !!window.Telegram?.WebApp);
        console.log('[App] tg object:', tg);
        console.log('[App] tg.ready function exists:', typeof tg?.ready === 'function');
        console.log('[App] User agent:', navigator.userAgent);
        
        if (tg && typeof tg.ready === 'function') {
          console.log('[App] ✅ Telegram environment detected.');
          console.log('[App] initData available:', !!tg.initData);
          console.log('[App] initData length:', tg.initData ? tg.initData.length : 0);
          console.log('[App] initData content:', tg.initData);
          
          // Вызываем ready() для уведомления Telegram о готовности приложения
          tg.ready();
          
          // Расширяем приложение на всю высоту
          if (tg.expand) {
            tg.expand();
          }
          
          setView('app');
        }
        else if (isDev) {
          console.log('[App] Development mode detected. Bypassing Telegram check.');
          setView('app');
        }
        else {
          console.log('[App] ❌ Not in Telegram or DEV mode. Showing placeholder.');
          console.log('[App] Reasons: tg exists:', !!tg, ', tg.ready is function:', typeof tg?.ready === 'function', ', isDev:', isDev);
          setView('placeholder');
        }
      } catch (err) {
        console.error('[App] Error during initialization:', err);
        setError(err.message);
        // В случае ошибки показываем заглушку
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
        <Placeholder error={error} />
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