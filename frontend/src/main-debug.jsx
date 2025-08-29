import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-debug.jsx';
import './index.css';

console.log('[main-debug] 🚀 Starting application...');
console.log('[main-debug] Environment:', {
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

const root = ReactDOM.createRoot(document.getElementById('root'));

console.log('[main-debug] 📦 Root element found, rendering app...');

// MINIMAL VERSION - без лишних провайдеров
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[main-debug] ✅ App rendered successfully');

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[main-debug] 🚨 Global error caught:', event.error);
  console.error('[main-debug] Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[main-debug] 🚨 Unhandled promise rejection:', event.reason);
});
