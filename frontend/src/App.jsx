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
import { I18nextProvider } from 'react-i18next';
import i18n from './services/i18n';
import Placeholder from './components/Placeholder';

function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('loading'); // 'loading', 'app', 'placeholder'

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    const initializeApp = () => {
      const tg = window.Telegram?.WebApp;

      // Case 1: We are in a real Telegram environment.
      if (tg && tg.initData) {
        console.log('[App] Telegram environment detected.');
        tg.ready(); // Inform Telegram client the app is ready
        api.defaults.headers.common['X-Telegram-Init-Data'] = tg.initData;
        setView('app');
      }
      // Case 2: We are in local development mode (outside Telegram).
      else if (isDev) {
        console.log('[App] Development mode detected. Bypassing Telegram check.');
        // The api.js interceptor handles the X-Telegram-User-ID header.
        setView('app');
      }
      // Case 3: We are in a browser in production (not dev, not Telegram).
      else {
        console.log('[App] Not in Telegram or DEV mode. Showing placeholder.');
        setView('placeholder');
      }
    };

    // The Telegram script might take a fraction of a second to load.
    // A timeout is a pragmatic and reliable way to wait for `window.Telegram` to be populated.
    const timer = setTimeout(initializeApp, 150);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  useEffect(() => {
    // This effect runs only when `view` is set to 'app'.
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
    // You can add a global loading spinner here if you want
    return null; 
  }

  if (view === 'placeholder') {
    return (
      <I18nextProvider i18n={i18n}>
        <Placeholder />
      </I18nextProvider>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
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
    </I18nextProvider>
  );
}

export default App;