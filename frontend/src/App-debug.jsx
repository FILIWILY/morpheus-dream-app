import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import Placeholder from './components/Placeholder';
import { detectTelegramEnvironment } from './utils/telegramDetection.js';

// MINIMAL DEBUG VERSION - максимальное логирование, минимум компонентов
console.log('[App-Debug] 🚀 App module loading...');

// Simple debug component instead of complex pages
const DebugWelcome = () => {
  console.log('[DebugWelcome] Component rendered');
  
  const [apiTest, setApiTest] = useState('testing...');
  
  useEffect(() => {
    console.log('[DebugWelcome] useEffect started - testing API');
    
    // Test API connection
    fetch('/api/profile', {
      headers: {
        'X-Telegram-User-ID': 'debug-test-user'
      }
    })
    .then(response => {
      console.log('[DebugWelcome] API Response status:', response.status);
      setApiTest(`API Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log('[DebugWelcome] API Response data:', data);
      setApiTest(prev => `${prev} - Data received`);
    })
    .catch(error => {
      console.error('[DebugWelcome] API Error:', error);
      setApiTest(`API ERROR: ${error.message}`);
    });
  }, []);
  
  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <h1>🐛 DEBUG MODE</h1>
      <p>✅ React component working</p>
      <p>✅ Router working</p>
      <p>API Test: {apiTest}</p>
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #333' }}>
        <h3>Telegram Environment:</h3>
        <pre>{JSON.stringify(detectTelegramEnvironment(), null, 2)}</pre>
      </div>
    </div>
  );
};

// Ultra-simple error boundary with detailed logging
class DebugErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    console.log('[DebugErrorBoundary] Constructor called');
  }

  static getDerivedStateFromError(error) {
    console.error('[DebugErrorBoundary] ❌ Error caught in getDerivedStateFromError:', error);
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DebugErrorBoundary] ❌ Error caught in componentDidCatch:', error);
    console.error('[DebugErrorBoundary] Error info:', errorInfo);
    console.error('[DebugErrorBoundary] Component stack:', errorInfo.componentStack);
    
    this.setState({
      error: error.message,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      console.log('[DebugErrorBoundary] Rendering error state');
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
          <h1>🚨 ERROR BOUNDARY TRIGGERED</h1>
          <h2>Error: {this.state.error}</h2>
          <h3>Component Stack:</h3>
          <pre style={{ color: '#ccc', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <h3>Debug Info:</h3>
          <pre style={{ color: '#ccc', fontSize: '12px' }}>
            {JSON.stringify(this.props.debugInfo || {}, null, 2)}
          </pre>
        </div>
      );
    }

    console.log('[DebugErrorBoundary] Rendering children');
    return this.props.children;
  }
}

function AppDebug() {
  console.log('[AppDebug] 🎯 Component function called');
  
  const [appState, setAppState] = useState('initializing');
  const [debugInfo, setDebugInfo] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[AppDebug] 🔄 useEffect started');
    
    const initApp = async () => {
      try {
        console.log('[AppDebug] 📊 Collecting debug info...');
        
        const telegramEnv = detectTelegramEnvironment();
        const isDev = import.meta.env.DEV;
        
        const debug = {
          isDev,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          telegramEnv: telegramEnv,
          windowTelegram: !!window.Telegram,
          windowTelegramWebApp: !!window.Telegram?.WebApp,
        };
        
        console.log('[AppDebug] 📊 Debug info collected:', debug);
        setDebugInfo(debug);
        
        // In production, check Telegram
        if (!isDev && !telegramEnv.isTelegram) {
          throw new Error('Production mode requires Telegram environment');
        }
        
        console.log('[AppDebug] ✅ Initialization successful');
        setAppState('ready');
        
      } catch (error) {
        console.error('[AppDebug] ❌ Initialization failed:', error);
        setError(error.message);
        setAppState('error');
      }
    };
    
    initApp();
  }, []);

  console.log('[AppDebug] 🎨 Rendering with state:', appState);

  if (appState === 'initializing') {
    console.log('[AppDebug] 🔄 Rendering loading state');
    return (
      <div style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        color: 'white',
        textAlign: 'center'
      }}>
        <div>🔄 Initializing Debug Mode...</div>
        <div style={{ fontSize: '12px', marginTop: '10px' }}>
          Check console for detailed logs
        </div>
      </div>
    );
  }

  if (appState === 'error') {
    console.log('[AppDebug] ❌ Rendering error state');
    return <Placeholder error={error} debugInfo={debugInfo} />;
  }

  console.log('[AppDebug] ✅ Rendering main app');
  
  return (
    <DebugErrorBoundary debugInfo={debugInfo}>
      <Router>
        <Routes>
          <Route path="*" element={<DebugWelcome />} />
        </Routes>
      </Router>
    </DebugErrorBoundary>
  );
}

console.log('[App-Debug] 📦 Module loaded, exporting AppDebug');
export default AppDebug;
