import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // ✅ Иконка для профиля
import { LocalizationContext } from '../context/LocalizationContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { t } = useContext(LocalizationContext);

  return (
    <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Toolbar>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {t('settings')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {/* ✅ Добавляем пункт "Личный кабинет" */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/profile')}>
              <ListItemIcon>
                <AccountCircleIcon sx={{ color: 'var(--text-secondary)' }} />
              </ListItemIcon>
              <ListItemText primary="Личный кабинет" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/language')}>
              <ListItemIcon>
                <TranslateIcon sx={{ color: 'var(--text-secondary)' }} />
              </ListItemIcon>
              <ListItemText primary={t('language')} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Container>
  );
};

export default SettingsPage;