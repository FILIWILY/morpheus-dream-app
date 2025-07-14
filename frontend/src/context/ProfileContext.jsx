import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile');
        setProfile(data);
      } catch (error) {
        console.error("Could not fetch profile, assuming new user.", error.message);
        setProfile({}); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateProfile = async (newProfileData) => {
    // ✅ Управляем состоянием загрузки при обновлении
    setIsLoading(true); 
    try {
      const { data } = await api.put('/profile', newProfileData);
      setProfile(data);
      return data;
    } catch (error) {
      console.error("Could not update profile", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);