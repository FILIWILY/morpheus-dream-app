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

  // A new user is identified by having a profile object from the backend,
  // but the `birthDate` field is specifically `null`. `undefined` is not
  // a possible state from the backend for this field.
  if (profile && profile.birthDate === null) {
    console.log('[PrivateRoute] New user detected (birthDate is null), redirecting to welcome page');
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }
  
  // User is fully registered (has a birthDate string) or has explicitly skipped
  // in a way that is no longer handled here. Allow access.
  console.log('[PrivateRoute] User authenticated and profile is complete, allowing access');
  return <Outlet />;
};

export default PrivateRoute;