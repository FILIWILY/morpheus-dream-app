import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import styles from './WelcomePage.module.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/profile');
  };

  return (
    <div className={styles.container}>
      <Box className={styles.glassCard}>
        <Typography 
          variant="h1" 
          component="h1" 
          className={styles.title}
        >
          Добро пожаловать в Morpheus
        </Typography>

        <Typography 
          className={styles.subtitle}
        >
          Ваш персональный толкователь снов
        </Typography>

        <div className={styles.content}>
          <Typography className={styles.paragraph}>
            <strong>Morpheus</strong> — это современное приложение для толкования снов, основанное на мудрости традиционных сонников.
          </Typography>

          <Typography className={styles.paragraph}>
            Мы анализируем ключевые образы из ваших снов и находим их значения в проверенных временем источниках: сонниках Миллера, Ванги, Фрейда и других известных толкователей.
          </Typography>

          <Typography className={styles.paragraph}>
            <strong>Что вы получите:</strong>
          </Typography>

          <ul className={styles.list}>
            <li>Краткую характеристику вашего сна</li>
            <li>Разбор ключевых образов с толкованиями из разных сонников</li>
            <li>Практические советы и рекомендации</li>
            <li>Историю всех ваших снов с возможностью пересмотра</li>
          </ul>

          <Typography className={styles.paragraph}>
            Просто опишите свой сон текстом, и наш ИИ найдет в нем важные символы и растолкует их через призму народной мудрости и классических сонников.
          </Typography>
        </div>

        <Button
          variant="contained"
          size="large"
          onClick={handleContinue}
          className={styles.continueButton}
          sx={{
            mt: 4,
            py: 1.5,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Начать
        </Button>
      </Box>
    </div>
  );
};

export default WelcomePage;

