import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

const TranscriptModal = ({ open, onClose, transcript, title }) => {
    const { t } = useTranslation();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: '#16213e',
                    backgroundImage: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)',
                    color: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    // Используем safe area + дополнительный отступ для кнопок Telegram
                    marginTop: 'max(60px, calc(var(--tg-safe-area-inset-top) + 20px))',
                    marginBottom: 'max(20px, var(--tg-safe-area-inset-bottom))',
                    // Ограничиваем максимальную высоту с учетом safe areas
                    maxHeight: 'calc(100vh - max(60px, calc(var(--tg-safe-area-inset-top) + 20px)) - max(20px, var(--tg-safe-area-inset-bottom)))',
                    overflowY: 'auto',
                    // Стилизация скроллбара
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(139, 92, 246, 0.5)',
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: 'rgba(139, 92, 246, 0.7)',
                    }
                }
            }}
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'center'
                }
            }}
        >
            <DialogTitle 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    pb: 1, 
                    pt: 2,
                    borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
                }}
            >
                <Typography 
                    variant="h6" 
                    component="div"
                    sx={{ 
                        color: '#8B5CF6',
                        fontWeight: 600,
                        fontSize: '1.2rem'
                    }}
                >
                    {title || t('dreamTranscript')}
                </Typography>
                <IconButton 
                    onClick={onClose} 
                    sx={{ 
                        color: '#ffffff',
                        '&:hover': {
                            backgroundColor: 'rgba(139, 92, 246, 0.1)'
                        }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <Typography 
                    component="div" 
                    sx={{ 
                        color: 'rgba(255, 255, 255, 0.85)', 
                        lineHeight: 1.7, 
                        fontSize: '16px',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'justify'
                    }}
                >
                    {transcript}
                </Typography>
            </DialogContent>
        </Dialog>
    );
};

export default TranscriptModal;
