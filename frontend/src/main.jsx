import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { LocalizationProvider as AppLocalizationProvider } from './context/LocalizationContext.jsx';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { ProfileProvider } from './context/ProfileContext.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Эта функция будет вызвана скриптом Google Maps после его полной загрузки
window.initApp = () => {
  root.render(
    <React.StrictMode>
      <AppLocalizationProvider>
        <MuiLocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
          <ProfileProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ProfileProvider>
        </MuiLocalizationProvider>
      </AppLocalizationProvider>
    </React.StrictMode>
  );
};

// Функция для динамической загрузки скрипта Google Maps
const loadGoogleMapsScript = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("Google Places API key is missing. Please add VITE_GOOGLE_PLACES_API_KEY to your .env file.");
    // В случае отсутствия ключа, можно запустить приложение без функционала карт
    // или показать сообщение об ошибке. Запустим приложение, чтобы не блокировать интерфейс.
    window.initApp(); 
    return;
  }
  
  const script = document.createElement('script');
  // Добавляем `&callback=initApp` в конец URL
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initApp`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

loadGoogleMapsScript();