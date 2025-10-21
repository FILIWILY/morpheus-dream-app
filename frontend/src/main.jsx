import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { LocalizationProvider as AppLocalizationProvider } from './context/LocalizationContext.jsx';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { ProfileProvider } from './context/ProfileContext.jsx';
import { setupErrorReporting } from './services/errorReporter.js';

// Setup global error reporting to Telegram
setupErrorReporting();

const root = ReactDOM.createRoot(document.getElementById('root'));

// Restore full application with all providers
root.render(
  // StrictMode temporarily disabled to prevent double-mounting during countdown
  // <React.StrictMode>
    <AppLocalizationProvider>
      <MuiLocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </MuiLocalizationProvider>
    </AppLocalizationProvider>
  // </React.StrictMode>
);

// The Google Maps script is now loaded directly in index.html
// to prevent race conditions with the React component lifecycle.
// The dynamic loading logic below has been removed.