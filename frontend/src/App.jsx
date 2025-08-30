import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { LocalizationProvider } from './context/LocalizationContext';
import WelcomePage from './pages/WelcomePage';
import RecordingPage from './pages/RecordingPage';
import InterpretationPage from './pages/InterpretationPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LanguagePage from './pages/LanguagePage';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import StarryBackground from './components/StarryBackground';
import i18n from './services/i18n';
import Placeholder from './components/Placeholder';
import React from 'react';
import { detectTelegramEnvironment, initializeTelegramWebApp } from './utils/telegramDetection.js';

// Context for app readiness
export const AppReadyContext = React.createContext(false);
export const I18nContext = React.createContext(i18n);

// Error boundary component
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
      return <Placeholder error={this.state.error} debugInfo={this.props.debugInfo || {}} />;
    }
    return this.props.children;
  }
}

function App() {
  const [appState, setAppState] = useState('initializing'); // 'initializing', 'ready', 'error'
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const initializeApp = async () => {
      console.log('[App] 🚀 Starting app initialization...');
      
      const isDev = import.meta.env.DEV;
      
      try {
        // Detect Telegram environment
        const telegramEnv = detectTelegramEnvironment();
        
        console.log('[App] Telegram environment detected:', {
          isTelegram: telegramEnv.isTelegram,
          method: telegramEnv.method,
          hasInitData: !!telegramEnv.initData,
          initDataLength: telegramEnv.initData ? telegramEnv.initData.length : 0
        });

        // Set debug info
        setDebugInfo({
          isDev,
          isTelegram: telegramEnv.isTelegram,
          method: telegramEnv.method,
          hasInitData: !!telegramEnv.initData,
          initDataLength: telegramEnv.initData ? telegramEnv.initData.length : 0,
          platform: telegramEnv.webApp?.platform || 'unknown',
          version: telegramEnv.webApp?.version || 'unknown'
        });

        // In development mode, always proceed
        if (isDev) {
          console.log('[App] 🔧 Development mode - proceeding without strict Telegram checks');
          if (telegramEnv.isTelegram && telegramEnv.webApp) {
            initializeTelegramWebApp(telegramEnv);
          }
          setAppState('ready');
          return;
        }

        // In production, require Telegram environment
        if (!telegramEnv.isTelegram) {
          throw new Error('This application must be opened in Telegram');
        }

        // Initialize Telegram WebApp if available
        if (telegramEnv.webApp) {
          const initialized = initializeTelegramWebApp(telegramEnv);
          if (!initialized) {
            console.warn('[App] Failed to initialize Telegram WebApp, but continuing...');
          }
        }

        // App is ready
        console.log('[App] ✅ App initialization completed successfully');
        setAppState('ready');

      } catch (error) {
        console.error('[App] ❌ App initialization failed:', error);
        setError(error.message);
        setAppState('error');
      }
    };

    initializeApp();
  }, []);

  // Show loading state
  if (appState === 'initializing') {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        color: 'white',
        textAlign: 'center'
      }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  // Show error state
  if (appState === 'error') {
    return (
      <I18nContext.Provider value={i18n}>
        <Placeholder error={error} debugInfo={debugInfo} />
      </I18nContext.Provider>
    );
  }

  // Show main app
  return (
    <ErrorBoundary debugInfo={debugInfo}>
      <AppReadyContext.Provider value={true}>
        <I18nContext.Provider value={i18n}>
          <LocalizationProvider>
            <ProfileProvider>
              <StarryBackground />
              <Router>
                <Routes>
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/language" element={<LanguagePage />} />
                  <Route path="/" element={<PrivateRoute />}>
                    <Route element={<Layout />}>
                      <Route index element={<Navigate to="/record" />} />
                      <Route path="record" element={<RecordingPage />} />
                      <Route path="interpretation/:id" element={<InterpretationPage />} />
                      <Route path="history" element={<HistoryPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
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