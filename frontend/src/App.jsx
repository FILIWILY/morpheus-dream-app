import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {ru, enUS, de, es, fr} from 'date-fns/locale';
import WelcomePage from './pages/WelcomePage';
import RecordingPage from './pages/RecordingPage';
import HistoryPage from './pages/HistoryPage';
import InterpretationPage from './pages/InterpretationPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import { AppLocalizationProvider, LocalizationContext } from './context/LocalizationContext';

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
      <AppLocalizationProvider>
        <LocalizationContext.Consumer>
          {({ locale }) => (
            <MuiLocalizationProvider 
              dateAdapter={AdapterDateFns}
              adapterLocale={localeMap[locale] || enUS}
            >
              <ProfileProvider>
                <BrowserRouter>
                  <Routes>
                    {/* Public routes that don't require a profile */}
                    <Route path="/welcome" element={<WelcomePage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* All main app routes are protected */}
                    <Route element={<PrivateRoute />}>
                      <Route path="/record" element={<RecordingPage />} />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/interpretation/:dreamId" element={<InterpretationPage />} />
                    </Route>
                    
                    {/* Default route redirects to the main recording page */}
                    <Route path="*" element={<Navigate to="/record" replace />} />
                  </Routes>
                </BrowserRouter>
              </ProfileProvider>
            </MuiLocalizationProvider>
          )}
        </LocalizationContext.Consumer>
      </AppLocalizationProvider>
    </AppReadyContext.Provider>
  );
}

export default App;