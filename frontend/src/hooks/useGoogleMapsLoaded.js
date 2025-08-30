import { useState, useEffect } from 'react';

export const useGoogleMapsLoaded = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Проверяем, загружен ли уже Google Maps
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Ожидаем загрузки через callback
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('[GoogleMaps] ✅ Google Maps Places API loaded successfully');
        setIsLoaded(true);
      } else {
        console.log('[GoogleMaps] ⏳ Waiting for Google Maps Places API...');
        setTimeout(checkGoogleMaps, 500);
      }
    };

    // Проверяем наличие API ключа
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    console.log('[GoogleMaps] 🔍 Checking API key:', {
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      allEnvVars: Object.keys(import.meta.env).filter(key => key.includes('GOOGLE'))
    });
    
    if (!apiKey) {
      console.warn('[GoogleMaps] ⚠️ Google Places API key is missing');
      setError('Google Places API key is missing');
      return;
    }

    // Начинаем проверку
    checkGoogleMaps();

    // Таймаут на случай если API не загрузится
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.error('[GoogleMaps] ❌ Google Maps Places API failed to load');
        setError('Failed to load Google Maps Places API');
      }
    }, 10000); // 10 секунд таймаут

    return () => clearTimeout(timeout);
  }, [isLoaded]);

  return { isLoaded, error };
};
