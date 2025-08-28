import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AppReadyContext } from './App'; // ✅ Импортируем новый контекст

// ✅ Создаем контекст с "безопасными" значениями по умолчанию
export const ProfileContext = createContext({
  profile: null,
  isLoading: true,
  updateProfile: async () => {},
});

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAppReady = useContext(AppReadyContext); // ✅ Получаем статус готовности приложения

  useEffect(() => {
    // Эта функция будет вызвана только один раз при старте приложения
    const fetchProfile = async () => {
      console.log('[ProfileContext] Starting profile fetch...');
      try {
        const { data } = await api.get('/profile');
        console.log('[ProfileContext] Profile fetched successfully:', data);
        setProfile(data);
      } catch (error) {
        // Если профиль не найден (ошибка 404) или сервер не отвечает,
        // мы просто устанавливаем null.
        // Это говорит приложению, что пользователь новый, и НЕ вызывает сбоя.
        console.error("[ProfileContext] Could not fetch profile, assuming new user:", {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        setProfile(null); 
      } finally {
        setIsLoading(false);
        console.log('[ProfileContext] Profile fetch completed');
      }
    };

    // 🛑 Ключевое изменение: запускаем fetchProfile ТОЛЬКО КОГДА приложение готово
    if (isAppReady) {
        fetchProfile();
    } else {
        console.log('[ProfileContext] ⏳ Ожидание сигнала готовности приложения...');
    }
  }, [isAppReady]); // ✅ Добавляем isAppReady в зависимости

  const updateProfile = async (newProfileData) => {
    setIsLoading(true);
    try {
      const { data } = await api.put('/profile', newProfileData);
      setProfile(data); // Обновляем профиль новыми данными с сервера
      return data;
    } catch (error) {
      console.error("Could not update profile", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = { profile, isLoading, updateProfile };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);