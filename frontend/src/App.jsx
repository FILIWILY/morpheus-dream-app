import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import StarryBackground from './components/StarryBackground';
import Layout from './components/Layout';
import RecordingPage from './pages/RecordingPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import InterpretationPage from './pages/InterpretationPage';
import LanguagePage from './pages/LanguagePage';
// ✅ Импортируем новую страницу
import WelcomePage from './pages/WelcomePage';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasCompletedWelcome = localStorage.getItem('hasCompletedWelcomeFlow');
    // Если пользователь еще не был на странице приветствия и еще не на ней,
    // перенаправляем его туда.
    if (!hasCompletedWelcome && location.pathname !== '/welcome') {
      navigate('/welcome', { replace: true });
    }
  }, [navigate, location.pathname]);

  return (
    <>
      <StarryBackground /> 
      
      <Routes>
        {/* ✅ Добавляем новый маршрут для страницы приветствия */}
        <Route path="/welcome" element={<WelcomePage />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<RecordingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="interpretation" element={<InterpretationPage />} />
        <Route path="language" element={<LanguagePage />} />
      </Routes>
    </>
  );
}

export default App;