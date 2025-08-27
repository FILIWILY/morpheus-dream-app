import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = () => {
  const { profile, loading } = useProfile();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если профиль не существует (null), перенаправляем на страницу приветствия.
  if (!profile) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // Если есть профиль, но не указана дата рождения - на страницу профиля
  if (!profile.birthDate) {
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};

export default PrivateRoute;
