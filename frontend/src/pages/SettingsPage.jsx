import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI Компоненты
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';

// Иконки
import TranslateIcon from '@mui/icons-material/Translate';

// Контекст для локализации
import { LocalizationContext } from '../context/LocalizationContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { t } = useContext(LocalizationContext);

  const handleLanguageClick = () => {
    navigate('/language');
  };

  return (
    <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Шапка страницы */}
      <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Toolbar>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {t('settings')}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Список настроек */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLanguageClick}>
              <ListItemIcon>
                {/* ✅ ЗАДАЕМ ЦВЕТ ИКОНКЕ НАПРЯМУЮ */}
                <TranslateIcon sx={{ color: 'var(--text-secondary)' }} />
              </ListItemIcon>
              <ListItemText primary={t('language')} />
            </ListItemButton>
          </ListItem>
          {/* Здесь в будущем можно будет добавлять другие пункты настроек */}
        </List>
      </Box>
    </Container>
  );
};

export default SettingsPage;