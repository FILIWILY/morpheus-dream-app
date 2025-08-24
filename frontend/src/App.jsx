import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import StarryBackground from './components/StarryBackground';
import Layout from './components/Layout';
import RecordingPage from './pages/RecordingPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import InterpretationPage from './pages/InterpretationPage';
import LanguagePage from './pages/LanguagePage';
import WelcomePage from './pages/WelcomePage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute'; // Импортируем PrivateRoute

function App() {
  return (
    <>
      <StarryBackground /> 
      
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<RecordingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="interpretation/:id" element={<InterpretationPage />} />
        <Route path="interpretation" element={<InterpretationPage />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
        <Route path="language" element={<LanguagePage />} />
      </Routes>
    </>
  );
}

export default App;