import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-debug.jsx';
import './index.css';

console.log('[main] 🚀 Starting DEBUG application...');

const root = ReactDOM.createRoot(document.getElementById('root'));

// SIMPLIFIED VERSION - direct render without Google Maps dependency
console.log('[main] 📦 Rendering app directly...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[main] ✅ App rendered');

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('[main] 🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[main] 🚨 Unhandled promise rejection:', event.reason);
});

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