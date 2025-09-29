import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AppReadyContext } from '../App';

// Create context with safe default values
export const ProfileContext = createContext({
  profile: null,
  isLoading: true,
  error: null,
  updateProfile: async () => {},
  refetchProfile: async () => {}
});

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAppReady = useContext(AppReadyContext);

  const fetchProfile = async () => {
    console.log('[ProfileContext] Starting profile fetch...');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/profile');
      console.log('[ProfileContext] Profile fetched successfully:', response.data);
      setProfile(response.data);
    } catch (error) {
      console.log('[ProfileContext] Profile fetch result:', {
        status: error.response?.status,
        message: error.message
      });

      if (error.response?.status === 404) {
        // 404 means user exists but has no profile data (new user)
        console.log('[ProfileContext] New user detected (404 response)');
        setProfile(null);
      } else {
        // Other errors (network, server, auth issues)
        console.error('[ProfileContext] Error fetching profile:', error);
        setError(error.message);
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
      console.log('[ProfileContext] Profile fetch completed');
    }
  };

  // Fetch profile only when app is ready
  useEffect(() => {
    if (isAppReady) {
      console.log('[ProfileContext] App is ready, fetching profile...');
      fetchProfile();
    } else {
      console.log('[ProfileContext] ⏳ Waiting for app to be ready...');
    }
  }, [isAppReady]);

  const updateProfile = async (newProfileData) => {
    const oldProfile = profile; // Save the old profile in case of an error
    console.log('[ProfileContext] Optimistically updating profile with data:', newProfileData);
    
    // Optimistically update the local state immediately
    setProfile(prevProfile => ({
      ...prevProfile,
      ...newProfileData,
    }));
    
    setError(null);
    
    try {
      // Then, send the update to the server
      const response = await api.put('/profile', newProfileData);
      console.log('[ProfileContext] Profile updated on server successfully:', response.data);
      
      // Update the local state with the final, authoritative data from the server
      setProfile(response.data);
      return response.data;
    } catch (error) {
      console.error('[ProfileContext] Error updating profile, rolling back optimistic update:', error);
      setError(error.message);
      setProfile(oldProfile); // Rollback to the old profile on error
      throw error;
    }
    // No finally block needed here, as we are not using a loading state for this optimistic update.
  };

  const refetchProfile = async () => {
    await fetchProfile();
  };

  const value = { 
    profile, 
    isLoading, 
    error,
    updateProfile, 
    refetchProfile 
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};