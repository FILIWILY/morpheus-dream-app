import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import Layout from '../components/Layout';
import styles from './WelcomePage.module.css'; // Import the new CSS module

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/profile');
  };

  return (
    <Layout>
      <div className={styles.welcomeContainer}>
        <Box className={styles.glassCard}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
            Добро пожаловать!
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Morpheus поможет вам лучше понять свои сны. Чтобы разблокировать полный потенциал астрологических толкований, мы рекомендуем указать данные вашего рождения.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Это необязательно, и вы всегда сможете сделать это позже в настройках.
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleContinue}
            className={styles.button}
          >
            Продолжить
          </Button>
        </Box>
      </div>
    </Layout>
  );
};

export default WelcomePage;
