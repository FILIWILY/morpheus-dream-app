import React, { useState, useContext } from 'react';
import { Modal, Box, Typography, Button, Stack } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationContext } from '../context/LocalizationContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'calc(100% - 64px)',
  maxWidth: 400,
  // Ограничиваем высоту с учетом safe area + дополнительный отступ для кнопок Telegram
  maxHeight: 'calc(100vh - max(60px, calc(var(--tg-safe-area-inset-top) + 20px)) - max(20px, var(--tg-safe-area-inset-bottom)))',
  overflowY: 'auto',
  p: 3,
  color: 'var(--text-primary)',
  borderRadius: '20px',
  // Glassmorphism как на RecordingPage
  background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(26, 26, 46, 0.9) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

const DateSelectionModal = ({ open, onClose, onDateSelect }) => {
  const { t } = useContext(LocalizationContext);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleSelectToday = () => {
    onDateSelect('today');
  };

  const handleSelectFromCalendar = () => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      onDateSelect(formattedDate);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            mb: 3, 
            textAlign: 'center',
            fontSize: '1.3rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          {t('whenDidYouDream')}
        </Typography>
        
        <Stack spacing={2.5}>
          {/* Кнопка "Сегодня" - как на HistoryPage */}
          <Button 
            onClick={handleSelectToday} 
            fullWidth
            sx={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.5)',
                background: 'linear-gradient(135deg, #9B6CF6 0%, #16C6E4 100%)',
              }
            }}
          >
            {t('today')}
          </Button>
          
          {/* Поле выбора даты - как на RecordingPage */}
          <DatePicker
            label={t('selectDate')}
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  '& .MuiInputLabel-root': { 
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'var(--text-secondary)',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8B5CF6',
                      borderWidth: '2px',
                    },
                  },
                }
              }
            }}
          />

          {/* Кнопка подтверждения даты */}
          {selectedDate && (
            <Button 
              onClick={handleSelectFromCalendar} 
              fullWidth
              sx={{
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.5)',
                  background: 'linear-gradient(135deg, #9B6CF6 0%, #16C6E4 100%)',
                }
              }}
            >
              {t('confirmDate')}
            </Button>
          )}
        </Stack>
      </Box>
    </Modal>
  );
};

export default DateSelectionModal;