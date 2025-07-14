import React, { useState, useContext, useEffect } from 'react';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import { LocalizationContext } from '../context/LocalizationContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useContext(LocalizationContext);
  
  const [value, setValue] = useState(location.pathname);

  useEffect(() => {
    if (["/", "/history", "/settings"].includes(location.pathname)) {
        setValue(location.pathname);
    }
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  // ✅ Стили для иконок
  const iconStyle = {
    color: 'var(--text-secondary)', // Цвет неактивной иконки
    '&.Mui-selected': {
        color: 'var(--accent-primary)' // Цвет активной иконки
    }
  };

  return (
    // Задаем прозрачный фон для самой навигации
    <BottomNavigation 
      value={value} 
      onChange={handleChange} 
      showLabels 
      sx={{ background: 'transparent' }}
    >
      <BottomNavigationAction 
        label={t('recordDream')} 
        value="/" 
        icon={<MicIcon />} 
        sx={iconStyle} // Применяем стили
      />
      <BottomNavigationAction 
        label={t('history')} 
        value="/history" 
        icon={<HistoryIcon />} 
        sx={iconStyle} // Применяем стили
      />
      <BottomNavigationAction 
        label={t('settings')} 
        value="/settings" 
        icon={<SettingsIcon />} 
        sx={iconStyle} // Применяем стили
      />
    </BottomNavigation>
  );
};

export default BottomNav;