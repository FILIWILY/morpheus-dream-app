import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// ✅ Создаем контекст с "безопасными" значениями по умолчанию
export const ProfileContext = createContext({
  profile: null,
  isLoading: true,
  updateProfile: async () => {},
});

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Эта функция будет вызвана только один раз при старте приложения
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile');
        setProfile(data);
      } catch (error) {
        // Если профиль не найден (ошибка 404) или сервер не отвечает,
        // мы просто устанавливаем null.
        // Это говорит приложению, что пользователь новый, и НЕ вызывает сбоя.
        console.error("Could not fetch profile, assuming new user:", error.message);
        setProfile(null); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []); // Пустой массив зависимостей означает "выполнить один раз"

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