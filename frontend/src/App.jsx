import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileContext } from './context/ProfileContext';
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

// Создаем I18nContext для передачи i18n экземпляра
// Это замена I18nextProvider, которую я ошибочно пытался использовать
export const I18nContext = React.createContext(i18n);


function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('loading'); // 'loading', 'app', 'placeholder'
  const [i18nInstance, setI18nInstance] = useState(i18n);

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    const initializeApp = () => {
      const tg = window.Telegram?.WebApp;

      if (tg && tg.initData) {
        console.log('[App] Telegram environment detected.');
        tg.ready();
        api.defaults.headers.common['X-Telegram-Init-Data'] = tg.initData;
        setView('app');
      }
      else if (isDev) {
        console.log('[App] Development mode detected. Bypassing Telegram check.');
        setView('app');
      }
      else {
        console.log('[App] Not in Telegram or DEV mode. Showing placeholder.');
        setView('placeholder');
      }
    };

    const timer = setTimeout(initializeApp, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (view !== 'app') {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const profileData = await getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [view]);

  if (view === 'loading' || (view === 'app' && loading)) {
    return null; 
  }

  if (view === 'placeholder') {
    return (
      <I18nContext.Provider value={i18nInstance}>
        <Placeholder />
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={i18nInstance}>
      <ProfileContext.Provider value={{ profile, setProfile, loading }}>
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
      </ProfileContext.Provider>
    </I18nContext.Provider>
  );
}

export default App;