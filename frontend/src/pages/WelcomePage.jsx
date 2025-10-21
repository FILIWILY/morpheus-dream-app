import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { LocalizationContext } from '../context/LocalizationContext';
import styles from './WelcomePage.module.css';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { t } = useContext(LocalizationContext);

  const handleContinue = () => {
    navigate('/profile');
  };

  return (
    <div className={styles.container}>
      <Box className={styles.glassCard}>
        <Typography 
          className={styles.subtitle}
        >
          {t('welcomeSubtitle')}
        </Typography>

        <div className={styles.content}>
          <Typography className={styles.paragraph}>
            <strong>{t('welcomeIntro').split('—')[0]}</strong> — {t('welcomeIntro').split('—')[1]}
          </Typography>

          <Typography className={styles.paragraph}>
            {t('welcomeDescription')}
          </Typography>

          <Typography className={styles.paragraph}>
            <strong>{t('welcomeWhatYouGet')}</strong>
          </Typography>

          <ul className={styles.list}>
            <li>{t('welcomeFeature1')}</li>
            <li>{t('welcomeFeature2')}</li>
            <li>{t('welcomeFeature3')}</li>
            <li>{t('welcomeFeature4')}</li>
          </ul>

          <Typography className={styles.paragraph}>
            {t('welcomeClosing')}
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
          {t('welcomeStart')}
        </Button>
      </Box>
    </div>
  );
};

export default WelcomePage;

