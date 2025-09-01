import React, { useContext } from 'react';
import { Modal, Box, Typography, FormControl, FormControlLabel, RadioGroup, Radio } from '@mui/material';
import { LocalizationContext } from '../context/LocalizationContext';
import styles from './LanguageSelectionModal.module.css'; // Import new styles

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'calc(100% - 64px)',
  maxWidth: 320,
  bgcolor: 'transparent',
  border: 'none',
  boxShadow: 'none',
  p: 1,
  color: 'white',
};

const radioStyles = {
    color: 'var(--text-secondary)',
    '&.Mui-checked': {
        color: 'var(--accent-primary)',
    },
};

const LanguageSelectionModal = ({ open, onClose }) => {
  const { locale, setLocale, t } = useContext(LocalizationContext);

  const handleLanguageChange = (event) => {
    const newLocale = event.target.value;
    setLocale(newLocale);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" sx={{ mb: 2, textAlign: 'center' }}>
          {t('language')}
        </Typography>
        <FormControl component="fieldset" sx={{width: '100%'}}>
          <RadioGroup
            aria-label="language"
            name="language-radio-buttons-group"
            value={locale}
            onChange={handleLanguageChange}
          >
            {LANGUAGES.map((lang) => (
              <div key={lang.code} className={styles.languageItemContainer}>
                  <FormControlLabel 
                    value={lang.code} 
                    control={<Radio sx={radioStyles} />}
                    label={lang.label} 
                    sx={{width: '100%', margin: 0, padding: '8px 16px'}}
                  />
              </div>
            ))}
          </RadioGroup>
        </FormControl>
      </Box>
    </Modal>
  );
};

export default LanguageSelectionModal;
