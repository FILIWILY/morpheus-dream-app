import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { LocalizationContext } from '../context/LocalizationContext';
import styles from './LanguageSelectionPage.module.css';

// Import SVG icons as React components
import UsFlag from '../assets/flags/UsFlag.svg?react';
import RuFlag from '../assets/flags/RuFlag.svg?react';
import DeFlag from '../assets/flags/DeFlag.svg?react';
import EsFlag from '../assets/flags/EsFlag.svg?react';
import FrFlag from '../assets/flags/FrFlag.svg?react';

const LANGUAGES = [
  { code: 'en', label: 'English', Icon: UsFlag },
  { code: 'ru', label: 'Русский', Icon: RuFlag },
  { code: 'de', label: 'Deutsch', Icon: DeFlag },
  { code: 'es', label: 'Español', Icon: EsFlag },
  { code: 'fr', label: 'Français', Icon: FrFlag },
];

const radioStyles = {
    color: 'var(--text-secondary)',
    '&.Mui-checked': {
        color: 'var(--accent-primary)',
    },
};

const getBrowserLanguage = () => {
    const lang = navigator.language.split('-')[0];
    return LANGUAGES.some(l => l.code === lang) ? lang : 'en';
};

const LanguageSelectionPage = () => {
  const navigate = useNavigate();
  const { setLocale, t } = useContext(LocalizationContext);
  const [selectedLang, setSelectedLang] = useState('en');

  useEffect(() => {
    const browserLang = getBrowserLanguage();
    setSelectedLang(browserLang);
  }, []);

  const handleContinue = () => {
    setLocale(selectedLang);
    navigate('/welcome');
  };

  return (
    <div className={styles.container}>
      <Box className={styles.glassCard}>
        <Typography variant="h5" component="h1" gutterBottom className={styles.title}>
          {t('selectLanguagePrompt')}
        </Typography>
        <RadioGroup
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className={styles.radioGroup}
        >
          {LANGUAGES.map(({ code, label, Icon }) => (
            <FormControlLabel 
              key={code} 
              value={code} 
              control={<Radio sx={radioStyles} />} 
              label={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Icon className={styles.flagIcon} />
                  {label}
                </Box>
              }
              className={styles.formControlLabel}
            />
          ))}
        </RadioGroup>
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

export default LanguageSelectionPage;
