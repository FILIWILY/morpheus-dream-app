import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, AppBar, Toolbar, Typography, IconButton, FormControl, FormControlLabel, RadioGroup, Radio, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LocalizationContext } from '../context/LocalizationContext';

// ✅ СОЗДАЕМ МАССИВ С ЯЗЫКАМИ ДЛЯ УДОБСТВА
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

const LanguagePage = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useContext(LocalizationContext);

  const [selectedLocale, setSelectedLocale] = useState(locale);

  const handleLanguageChange = (event) => {
    setSelectedLocale(event.target.value);
  };

  const handleSave = () => {
    setLocale(selectedLocale);
    navigate(-1);
  };

  return (
    <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="go back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            {t('language')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, textAlign: 'left' }}>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="language"
            name="language-radio-buttons-group"
            value={selectedLocale}
            onChange={handleLanguageChange}
          >
            {/* ✅ ДИНАМИЧЕСКИ СОЗДАЕМ СПИСОК ИЗ МАССИВА */}
            {LANGUAGES.map((lang) => (
              <FormControlLabel 
                key={lang.code}
                value={lang.code} 
                control={<Radio />} 
                label={lang.label} 
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleSave}>
            {t('save')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LanguagePage;