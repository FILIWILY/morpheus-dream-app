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

  // If profile exists but birthDate is undefined, the user is new and hasn't
  // completed the profile setup yet. Redirect them to the welcome page first.
  if (profile && profile.birthDate === undefined) {
    console.log('[PrivateRoute] New user detected (profile exists but birthDate is undefined), redirecting to welcome page');
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }
  
  // The old check `profile === null` is removed because the backend now always
  // creates a user record on first contact, so the profile object will exist,
  // even if its fields (like birthDate) are not set.

  // User is fully registered (or has explicitly skipped), allow access to protected routes
  console.log('[PrivateRoute] User authenticated and registered, allowing access');
  return <Outlet />;
};

export default PrivateRoute;