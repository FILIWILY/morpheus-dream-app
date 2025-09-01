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
  p: 3,
  color: 'white',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1))',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
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
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {t('whenDidYouDream')}
        </Typography>
        
        <Stack spacing={2}>
          <Button variant="contained" onClick={handleSelectToday} fullWidth>
            {t('today')}
          </Button>
          
          <DatePicker
            label={t('selectDate')}
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slotProps={{
              textField: {
                sx: {
                  '& .MuiInputLabel-root': { 
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .M_uiInputBase-input': {
                    color: 'white',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--accent-primary)',
                    },
                  },
                }
              }
            }}
          />

          {selectedDate && (
            <Button variant="contained" onClick={handleSelectFromCalendar} fullWidth>
              {t('confirmDate')}
            </Button>
          )}
        </Stack>
      </Box>
    </Modal>
  );
};

export default DateSelectionModal;