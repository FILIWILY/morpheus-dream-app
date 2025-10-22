import React, { useContext, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Box, Container, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Checkbox, Button,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import MenuIcon from '@mui/icons-material/Menu'; // Import menu icon
import EditIcon from '@mui/icons-material/Edit'; // Import edit icon
import LockIcon from '@mui/icons-material/Lock'; // Import lock icon
import { LocalizationContext } from '../context/LocalizationContext';
import styles from './HistoryPage.module.css';
import { useDreams } from '../hooks/useDreams'; // Corrected the import path
import { format } from 'date-fns';
import TranscriptModal from '../components/TranscriptModal'; // Import the modal


const HistoryPage = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOutletContext(); // Get function to open the menu
  const { t } = useContext(LocalizationContext);
  const { dreams, isLoading, error, deleteDreams } = useDreams(); // Use the hook

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDreams, setSelectedDreams] = useState(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isTranscriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [selectedDreamText, setSelectedDreamText] = useState('');
  const [selectedDreamTitle, setSelectedDreamTitle] = useState('');

  const handleToggleSelect = (dreamId) => {
    const newSelection = new Set(selectedDreams);
    if (newSelection.has(dreamId)) {
      newSelection.delete(dreamId);
    } else {
      newSelection.add(dreamId);
    }
    setSelectedDreams(newSelection);
  };

  const handleInterpretationClick = (dreamId) => {
    if (!isEditMode) {
      navigate(`/interpretation/${dreamId}`);
    }
  };
  
  const handleDreamTextClick = (dream) => {
    if (!isEditMode) {
        setSelectedDreamText(dream.dreamText || '');
        setSelectedDreamTitle(dream.title);
        setTranscriptModalOpen(true);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedDreams(new Set());
  };
  
  const handleDeleteDreams = async () => {
    await deleteDreams(Array.from(selectedDreams));
    setIsEditMode(false);
    setSelectedDreams(new Set());
    setIsConfirmOpen(false);
  };

  return (
    <>
      <Container maxWidth="md" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        // Используем max() для комбинации дизайнерского отступа и safe area от Telegram
        pt: 'max(60px, calc(var(--tg-safe-area-inset-top) + 20px))'
      }}>
        {/* Updated AppBar */}
        <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
          <Toolbar>
            {/* Menu icon on the left */}
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={openDrawer}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Title that expands */}
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ flexGrow: 1, fontWeight: 'bold' }}
            >
              {isEditMode ? `${t('selected')}: ${selectedDreams.size}` : t('dreams')}
            </Typography>

            {/* Buttons on the right */}
            {isEditMode ? (
              <>
                {selectedDreams.size > 0 && (
                  <Button 
                    onClick={() => setIsConfirmOpen(true)} 
                    color="error"
                  >
                    {t('delete')}
                  </Button>
                )}
                <Button 
                  onClick={toggleEditMode}
                  sx={{ color: 'var(--accent-primary)' }}
                >
                  {t('done')}
                </Button>
              </>
            ) : (
              <>
                <IconButton 
                  onClick={toggleEditMode}
                  sx={{ color: 'var(--accent-primary)' }}
                >
                  <EditIcon />
                </IconButton>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
            {isLoading ? (
                <Typography sx={{ textAlign: 'center', color: 'var(--text-secondary)', mt: 4 }}>
                    {t('loading')}
                </Typography>
            ) : dreams.length === 0 ? (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mt: 8,
                    px: 3
                }}>
                    {/* Стеклянная иконка замка */}
                    <Box sx={{
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1))',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
                        borderRadius: '50%',
                        width: '120px',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3
                    }}>
                        <LockIcon sx={{ 
                            fontSize: '64px', 
                            color: 'rgba(255, 255, 255, 0.6)' 
                        }} />
                    </Box>
                    
                    {/* Текст */}
                    <Typography sx={{ 
                        textAlign: 'center', 
                        color: 'var(--text-primary)',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        mb: 1,
                        lineHeight: 1.6
                    }}>
                        {t('historyLocked')}
                    </Typography>
                    
                    <Typography sx={{ 
                        textAlign: 'center', 
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        maxWidth: '320px'
                    }}>
                        {t('historyLockedHint')}
                    </Typography>
                </Box>
            ) : (
                <List sx={{ pt: 1, p: 0, listStyle: 'none' }}>
                    {dreams.map((dream) => {
                    const isSelected = selectedDreams.has(dream.id);
                    const formattedDate = dream.date ? format(new Date(dream.date), 'dd.MM.yyyy') : '';

                    return (
                        <li key={dream.id} style={{ position: 'relative' }}>
                            <div 
                                className={`${styles.dreamItemContainer} ${isSelected ? styles.selected : ''}`}
                                onClick={() => !isEditMode && handleInterpretationClick(dream.id)}
                            >
                                <div className={styles.cardContent}>
                                    <h2 className={styles.dreamTitle}>{dream.title}</h2>

                                    {!isEditMode && (
                                        <div className={styles.cardActions}>
                                            <Button 
                                                className={`${styles.cardButton} ${styles.outlined}`}
                                                onClick={(e) => { e.stopPropagation(); handleInterpretationClick(dream.id); }}
                                            >
                                                {t('interpretation')}
                                            </Button>
                                            {dream.dreamText && (
                                                <Button 
                                                    className={`${styles.cardButton} ${styles.contained}`}
                                                    onClick={(e) => { e.stopPropagation(); handleDreamTextClick(dream); }}
                                                >
                                                    {t('dreamText')}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    
                                    <Typography component="p" className={styles.dreamDate}>
                                        {formattedDate}
                                    </Typography>
                                </div>
                            </div>
                            {isEditMode && (
                                <Checkbox 
                                    onChange={() => handleToggleSelect(dream.id)} 
                                    checked={isSelected}
                                    sx={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        color: 'var(--text-secondary)', 
                                        '&.Mui-checked': {
                                            color: 'var(--accent-primary)',
                                        },
                                    }}
                                />
                            )}
                        </li>
                    );
                    })}
                </List>
            )}
        </Box>
      </Container>
      
      <Dialog 
        open={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a2e',
            backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
            color: 'var(--text-primary)',
            borderRadius: '16px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: '8px',
            minWidth: '300px',
            // Ограничиваем высоту с учетом safe area
            maxHeight: 'calc(100vh - max(40px, calc(var(--tg-safe-area-inset-top) + var(--tg-safe-area-inset-bottom) + 40px)))',
            overflowY: 'auto'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#8B5CF6', 
          fontSize: '20px', 
          fontWeight: 600,
          paddingBottom: '8px'
        }}>
          {t('confirmationTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ 
            color: 'var(--text-secondary)', 
            fontSize: '15px',
            lineHeight: 1.6
          }}>
            {t('confirmationText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: '16px', gap: '8px' }}>
          <Button 
            onClick={() => setIsConfirmOpen(false)}
            sx={{
              color: 'var(--text-primary)',
              borderRadius: '10px',
              padding: '8px 20px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            {t('no')}
          </Button>
          <Button 
            onClick={handleDeleteDreams} 
            autoFocus
            sx={{
              color: '#ffffff',
              borderRadius: '10px',
              padding: '8px 20px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
              }
            }}
          >
            {t('yesDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      <TranscriptModal
        open={isTranscriptModalOpen}
        onClose={() => setTranscriptModalOpen(false)}
        transcript={selectedDreamText}
        title={selectedDreamTitle}
      />
    </>
  );
};

export default HistoryPage;