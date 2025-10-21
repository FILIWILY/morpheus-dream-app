import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Button, Radio } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { LocalizationContext } from '../context/LocalizationContext';
import styles from './LanguagePage.module.css';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const LanguagePage = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useContext(LocalizationContext);

  const [selectedLocale, setSelectedLocale] = useState(locale);

  const handleLanguageChange = (code) => {
    setSelectedLocale(code);
    // Сразу меняем язык при выборе
    setLocale(code);
  };

  const handleSave = () => {
    // Язык уже изменен, просто возвращаемся назад
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <Box className={styles.glassCard}>
        {/* Header */}
        <div className={styles.header}>
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{ 
              color: 'var(--text-primary)',
              padding: '8px'
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography className={styles.title}>
            {t('language')}
          </Typography>
        </div>

        {/* Language Options */}
        <div className={styles.languageOptions}>
          {LANGUAGES.map((lang) => (
            <div
              key={lang.code}
              className={`${styles.languageOption} ${selectedLocale === lang.code ? styles.selected : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <Radio
                checked={selectedLocale === lang.code}
                sx={{
                  color: 'rgba(255, 255, 255, 0.3)',
                  padding: 0,
                  '&.Mui-checked': {
                    color: '#8B5CF6',
                  }
                }}
              />
              <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
              <span className={styles.languageLabel}>{lang.label}</span>
              {selectedLocale === lang.code && (
                <CheckCircleIcon sx={{ color: '#8B5CF6', fontSize: '1.25rem' }} />
              )}
            </div>
          ))}
        </div>

        {/* Close Button */}
        <Button 
          className={styles.saveButton}
          onClick={handleSave}
        >
          {t('done')}
        </Button>
      </Box>
    </div>
  );
};

export default LanguagePage;