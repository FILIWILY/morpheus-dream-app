import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { LocalizationContext } from '../context/LocalizationContext';
import styles from './WelcomePage.module.css';

const LENS_COLORS = {
  psycho: '#03A9F4',
  astro: '#C850FF',
  tarot: '#FF9800',
};

const WelcomePage = () => {
  const navigate = useNavigate();
  const { t } = useContext(LocalizationContext);

  const handleContinue = () => {
    navigate('/profile');
  };

  const features = [
    t('featureRecord'),
    <>
      {t('featureDecode_part1')}
      <span style={{ color: LENS_COLORS.psycho, fontWeight: 'bold' }}>{t('featureDecode_lens1')}</span>
      {t('featureDecode_part2')}
      <span style={{ color: LENS_COLORS.astro, fontWeight: 'bold' }}>{t('featureDecode_lens2')}</span>
      {t('featureDecode_part3')}
      <span style={{ color: LENS_COLORS.tarot, fontWeight: 'bold' }}>{t('featureDecode_lens3')}</span>
      {t('featureDecode_part4')}
    </>,
    t('featureTrack'),
  ];

  return (
    <div className={styles.welcomeContainer}>
      <Box className={styles.glassCard}>
        <Typography 
          variant="h1" 
          component="h1" 
          className={styles.newTitle}
        >
          {t('welcomeNewTitle')}
        </Typography>
        
        <List sx={{ width: '100%', color: 'white', p: 0 }}>
          {features.map((feature, index) => (
            <ListItem key={index} sx={{ p: 0, mb: 1.5, alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, mt: '3px', color: 'var(--accent-primary)' }}>
                <CheckCircleOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={feature} 
                primaryTypographyProps={{ style: { fontSize: '0.95rem', lineHeight: '1.4' } }}
              />
            </ListItem>
          ))}
        </List>

        <Button 
          variant="contained" 
          onClick={handleContinue}
          className={styles.button}
        >
          {t('continue')}
        </Button>
      </Box>
    </div>
  );
};

export default WelcomePage;
