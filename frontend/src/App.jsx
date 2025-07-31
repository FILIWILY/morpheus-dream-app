import React from 'react';
import { Routes, Route } from 'react-router-dom';

import StarryBackground from './components/StarryBackground';
import Layout from './components/Layout';
import RecordingPage from './pages/RecordingPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import InterpretationPage from './pages/InterpretationPage';
import LanguagePage from './pages/LanguagePage';
import WelcomePage from './pages/WelcomePage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <>
      <StarryBackground /> 
      
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<RecordingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="interpretation" element={<InterpretationPage />} />
        <Route path="language" element={<LanguagePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </>
  );
}

export default App;