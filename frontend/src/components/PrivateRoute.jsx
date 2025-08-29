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

  // If profile is null, user is new - redirect to welcome page
  if (profile === null) {
    console.log('[PrivateRoute] New user detected, redirecting to welcome page');
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // If profile exists but birthDate is missing AND not explicitly set to null (skipped)
  // redirect to profile page to complete registration
  if (profile && profile.birthDate === undefined) {
    console.log('[PrivateRoute] User profile incomplete, redirecting to profile page');
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  // User is fully registered, allow access to protected routes
  console.log('[PrivateRoute] User authenticated and registered, allowing access');
  return <Outlet />;
};

export default PrivateRoute;