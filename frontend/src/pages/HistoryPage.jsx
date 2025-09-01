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
import { LocalizationContext } from '../context/LocalizationContext';
import styles from './HistoryPage.module.css';
import { useDreams } from '../hooks/useDreams'; // Corrected the import path
import { format } from 'date-fns';


const HistoryPage = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOutletContext(); // Get function to open the menu
  const { t } = useContext(LocalizationContext);
  const { dreams, isLoading, error, deleteDreams } = useDreams(); // Use the hook

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDreams, setSelectedDreams] = useState(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleItemClick = (dream) => {
    if (isEditMode) {
      const newSelection = new Set(selectedDreams);
      newSelection.has(dream.id) ? newSelection.delete(dream.id) : newSelection.add(dream.id);
      setSelectedDreams(newSelection);
    } else {
      navigate(`/interpretation/${dream.id}`); // Navigate by ID
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
                  edge="end" 
                  onClick={() => navigate('/')}
                  sx={{ color: 'var(--accent-primary)' }}
                >
                  <AddIcon />
                </IconButton>
                <Button 
                  onClick={toggleEditMode}
                  sx={{ color: 'var(--accent-primary)' }}
                >
                  {t('edit')}
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
            {isLoading ? (
                <Typography>Loading...</Typography>
            ) : error ? (
                <Typography>{error}</Typography>
            ) : dreams.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: 'var(--text-secondary)', mt: 4 }}>
                    {t('historyEmpty')}
                </Typography>
            ) : (
                <List sx={{ pt: 1, p: 0 }}>
                    {dreams.map((dream) => {
                    const isSelected = selectedDreams.has(dream.id);
                    const formattedDate = dream.date ? format(new Date(dream.date), 'dd.MM.yyyy') : '';
                    return (
                        <div key={dream.id} className={`${styles.dreamItemContainer} ${isSelected ? styles.selected : ''}`}>
                            <ListItem
                                disablePadding
                                className={styles.listItem}
                                secondaryAction={ 
                                  isEditMode && 
                                  <Checkbox 
                                    edge="end" 
                                    onChange={() => handleItemClick(dream)} 
                                    checked={isSelected}
                                    sx={{
                                      color: 'var(--text-secondary)', 
                                      '&.Mui-checked': {
                                        color: 'var(--accent-primary)',
                                      },
                                    }}
                                  /> 
                                }
                            >
                                <ListItemButton onClick={() => handleItemClick(dream)} sx={{ borderRadius: '14px' }}>
                                    <ListItemIcon> <NightsStayIcon sx={{ color: 'var(--accent-primary)' }} /> </ListItemIcon>
                                    <ListItemText
                                        primary={dream.title}
                                        secondary={formattedDate}
                                        primaryTypographyProps={{ fontWeight: '500', color: 'var(--text-primary)' }}
                                        secondaryTypographyProps={{ style: { color: 'var(--text-secondary)' } }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </div>
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
    </>
  );
};

export default HistoryPage;