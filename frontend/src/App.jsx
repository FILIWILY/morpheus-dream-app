import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {ru, enUS, de, es, fr} from 'date-fns/locale';
import WelcomePage from './pages/WelcomePage';
import LanguageSelectionPage from './pages/LanguageSelectionPage';
import RecordingPage from './pages/RecordingPage';
import HistoryPage from './pages/HistoryPage';
import InterpretationPageInteractive from './pages/InterpretationPageInteractive';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import StarryBackground from './components/StarryBackground';
import { LocalizationProvider, LocalizationContext } from './context/LocalizationContext';

export const AppReadyContext = React.createContext(false);

const localeMap = {
  ru,
  en: enUS,
  de,
  es,
  fr
};

function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  // This effect will run once on component mount
  React.useEffect(() => {
    // Simulate app readiness, e.g., loading configs, checking auth tokens, etc.
    setIsAppReady(true);
  }, []);
  
  return (
    <AppReadyContext.Provider value={isAppReady}>
      <LocalizationProvider>
        <LocalizationContext.Consumer>
          {({ locale }) => (
            <MuiLocalizationProvider 
              dateAdapter={AdapterDateFns}
              adapterLocale={localeMap[locale] || enUS}
            >
              <ProfileProvider>
                <BrowserRouter>
                  <StarryBackground />
                  <Routes>
                    {/* Public onboarding routes that render WITHOUT the main Layout */}
                    <Route path="/language" element={<LanguageSelectionPage />} />
                    <Route path="/welcome" element={<WelcomePage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Protected routes that render WITHIN the main Layout */}
                    <Route element={<PrivateRoute />}>
                      <Route element={<Layout />}>
                        <Route path="/record" element={<RecordingPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/interpretation/:dreamId" element={<InterpretationPageInteractive />} />
                        {/* Redirect any other nested path to /record */}
                        <Route path="*" element={<Navigate to="/record" replace />} />
                      </Route>
                    </Route>
                    
                    {/* A top-level catch-all to redirect to the main app entry point */}
                    <Route path="*" element={<Navigate to="/record" replace />} />
                  </Routes>
                </BrowserRouter>
              </ProfileProvider>
            </MuiLocalizationProvider>
          )}
        </LocalizationContext.Consumer>
      </LocalizationProvider>
    </AppReadyContext.Provider>
  );
}

export default App;