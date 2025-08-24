import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { profile, isLoading } = useProfile();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если профиль не существует (пустой объект), перенаправляем на страницу приветствия.
  if (!profile || Object.keys(profile).length === 0) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // Если есть профиль, но не указана дата рождения - на страницу профиля
  if (!profile.birthDate) {
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }
  
  return children;
};

export default PrivateRoute;
