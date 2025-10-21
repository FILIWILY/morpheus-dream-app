import React, { useState, useContext, useEffect } from 'react';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';
import { LocalizationContext } from '../context/LocalizationContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useContext(LocalizationContext);
  
  const [value, setValue] = useState(location.pathname);

  useEffect(() => {
    // Handle all navigation paths correctly
    if (location.pathname === '/' || location.pathname === '/record') {
        setValue('/record');
    } else if (location.pathname === '/history') {
        setValue('/history');
    }
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  const navigationItemStyle = {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.75rem',
    minWidth: 'auto',
    padding: '6px 12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.75rem',
      transition: 'all 0.3s ease',
      opacity: 0.7,
    },
    '&.Mui-selected': {
      color: '#8B5CF6',
      '& .MuiBottomNavigationAction-label': {
        fontSize: '0.8rem',
        opacity: 1,
        fontWeight: 600,
      },
      '& .MuiSvgIcon-root': {
        filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))',
        transform: 'scale(1.1)',
      }
    },
    '&:hover:not(.Mui-selected)': {
      color: 'rgba(255, 255, 255, 0.8)',
    }
  };

  return (
    <BottomNavigation 
      value={value} 
      onChange={handleChange} 
      showLabels 
      sx={{ 
        background: 'transparent',
        height: '100%',
      }}
    >
      <BottomNavigationAction 
        label={t('recordDream')} 
        value="/record" 
        icon={<MicIcon />} 
        sx={navigationItemStyle}
      />
      <BottomNavigationAction 
        label={t('history')} 
        value="/history" 
        icon={<HistoryIcon />} 
        sx={navigationItemStyle}
      />
    </BottomNavigation>
  );
};

export default BottomNav;