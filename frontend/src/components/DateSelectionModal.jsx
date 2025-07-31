import React, { useState, useContext } from 'react';
import { Modal, Box, Typography, Button, Stack } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationContext } from '../context/LocalizationContext';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'calc(100% - 32px)',
  maxWidth: 400,
  bgcolor: '#1c1c1e',
  border: '1px solid #333',
  borderRadius: '14px',
  boxShadow: 24,
  p: 3,
  color: 'white',
};

const DateSelectionModal = ({ open, onClose, onDateSelect }) => {
  const { t } = useContext(LocalizationContext);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleSelectToday = () => {
    onDateSelect('today');
  };

  const handleSelectFromCalendar = () => {
    if (selectedDate) {
      // Форматируем дату в YYYY-MM-DD
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleSelectToday}
            fullWidth
          >
            {t('today')}
          </Button>
          
          <DatePicker
            label={t('selectDate')}
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': {
                  color: 'white',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '& .MuiSvgIcon-root': {
                  color: 'white',
              }
            }}
          />

          {selectedDate && (
            <Button
              variant="contained"
              onClick={handleSelectFromCalendar}
              fullWidth
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