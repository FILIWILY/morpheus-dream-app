import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const PrivateRoute = () => {
  const { profile, isLoading } = useProfile();
  const location = useLocation();

  // Show loading spinner while profile is being fetched
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Загрузка профиля...
        </Typography>
      </Box>
    );
  }

  // A new user is identified by having onboarding incomplete.
  // Redirect them to the welcome page to start the onboarding flow.
  if (profile && !profile.onboardingCompleted) {
    console.log('[PrivateRoute] New user detected (onboarding not completed), redirecting to language selection page');
    return <Navigate to="/language" state={{ from: location }} replace />;
  }
  
  // User has completed onboarding, allow access.
  console.log('[PrivateRoute] User authenticated and onboarding is complete, allowing access');
  return <Outlet />;
};

export default PrivateRoute;