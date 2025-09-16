import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, IconButton } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageSelectionModal from '../components/LanguageSelectionModal';
import { LocalizationContext } from '../context/LocalizationContext';
import styles from './WelcomePage.module.css';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { t } = useContext(LocalizationContext);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const handleContinue = () => {
    navigate('/profile');
  };

  return (
    <>
      <div className={styles.welcomeContainer}>
        <Box className={styles.glassCard}>
          
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <IconButton onClick={() => setIsLangModalOpen(true)} sx={{ color: 'white' }}>
              <TranslateIcon />
            </IconButton>
          </Box>

          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
            {t('welcomeTitle')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            {t('welcomeText1')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {t('welcomeText2')}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleContinue}
            className={styles.button}
          >
            {t('continue')}
          </Button>
        </Box>
      </div>

      <LanguageSelectionModal 
        open={isLangModalOpen} 
        onClose={() => setIsLangModalOpen(false)} 
      />
    </>
  );
};

export default WelcomePage;
