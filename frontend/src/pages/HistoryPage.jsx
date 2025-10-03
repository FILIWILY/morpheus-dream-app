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
        const isMock = dream.title && dream.title.toLowerCase().startsWith('mock');
        const textForModal = dream.processedText || (isMock ? t('mockProcessedText') : '');
        setSelectedDreamText(textForModal);
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
      <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: '60px' }}>
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
                <Typography>Loading...</Typography> // TODO: Localize this
            ) : error ? (
                <Typography>{t(error)}</Typography>
            ) : dreams.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: 'var(--text-secondary)', mt: 4 }}>
                    {t('historyEmptyNew')}
                </Typography>
            ) : (
                <List sx={{ pt: 1, p: 0, listStyle: 'none' }}>
                    {dreams.map((dream) => {
                    const isSelected = selectedDreams.has(dream.id);
                    const formattedDate = dream.date ? format(new Date(dream.date), 'dd.MM.yyyy') : '';
                    const isMock = dream.title && dream.title.toLowerCase().startsWith('mock');
                    const hasProcessedText = dream.processedText || (isMock && !dream.processedText);
                    const textForModal = dream.processedText || (isMock ? t('mockProcessedText') : '');

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
                                            {dream.processedText && (
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
      
      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <DialogTitle>{t('confirmationTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('confirmationText')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmOpen(false)}>{t('no')}</Button>
          <Button onClick={handleDeleteDreams} autoFocus color="error">{t('yesDelete')}</Button>
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