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
    if (["/record", "/history", "/settings"].includes(location.pathname)) {
        setValue(location.pathname);
    } else if (location.pathname === "/") {
        setValue("/record");
    }
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  const iconStyle = {
    color: 'var(--text-secondary)',
    '&.Mui-selected': {
        color: 'var(--accent-primary)'
    }
  };

  return (
    <BottomNavigation 
      value={value} 
      onChange={handleChange} 
      showLabels 
      sx={{ 
        background: 'transparent',
        /* The height is managed by the .nav container in Layout.module.css */
        height: '100%' 
      }}
    >
      <BottomNavigationAction 
        label={t('recordDream')} 
        value="/record" 
        icon={<MicIcon />} 
        sx={iconStyle}
      />
      <BottomNavigationAction 
        label={t('history')} 
        value="/history" 
        icon={<HistoryIcon />} 
        sx={iconStyle}
      />
      <BottomNavigationAction 
        label={t('settings')} 
        value="/settings" 
        icon={<SettingsIcon />} 
        sx={iconStyle}
      />
    </BottomNavigation>
  );
};

export default BottomNav;