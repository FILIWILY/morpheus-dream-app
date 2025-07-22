import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Наши главные компоненты
import StarryBackground from './components/StarryBackground';
import Layout from './components/Layout';

// Наши страницы
import RecordingPage from './pages/RecordingPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import InterpretationPage from './pages/InterpretationPage';
import LanguagePage from './pages/LanguagePage';
import WelcomePage from './pages/WelcomePage';
import ProfilePage from './pages/ProfilePage';

function App() {
  // ✅ Мы временно убрали всю сложную логику с useEffect и useNavigate отсюда,
  // чтобы устранить причину "белого экрана".
  // Приложение теперь всегда будет сначала загружать главный экран.

  return (
    <>
      <StarryBackground /> 
      
      <Routes>
        {/* Маршрут для страницы приветствия. Вы сможете заходить на нее вручную. */}
        <Route path="/welcome" element={<WelcomePage />} />

        {/* Маршруты с нижней навигацией */}
        <Route path="/" element={<Layout />}>
          <Route index element={<RecordingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        {/* Маршруты без нижней навигации */}
        <Route path="interpretation" element={<InterpretationPage />} />
        <Route path="language" element={<LanguagePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </>
  );
}

export default App;