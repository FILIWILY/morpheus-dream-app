import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { LocalizationProvider as AppLocalizationProvider } from './context/LocalizationContext.jsx';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

// ✅ Импортируем провайдер профиля
import { ProfileProvider } from './context/ProfileContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppLocalizationProvider>
      <MuiLocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
        {/* ✅ Оборачиваем */}
        <ProfileProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ProfileProvider>
      </MuiLocalizationProvider>
    </AppLocalizationProvider>
  </React.StrictMode>
);