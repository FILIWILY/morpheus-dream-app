import React, { useState, useEffect, useContext } from 'react';
import { useProfile } from '../context/ProfileContext';
import { LocalizationContext } from '../context/LocalizationContext';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { Drawer, Box, AppBar, Toolbar, IconButton, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Button, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageSelectionModal from './LanguageSelectionModal';
import styles from './SettingsDrawer.module.css'; // Import styles

const textFieldStyles = {
    '& .MuiInputBase-input': { color: 'var(--text-primary)' },
    '& label': { color: 'var(--text-secondary)' },
    '& label.Mui-focused': { color: 'var(--accent-primary)' },
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: 'var(--border-color)' },
        '&:hover fieldset': { borderColor: 'var(--accent-primary)' },
        '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
    },
};

const formatDate = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return digits;
};

const formatTime = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return digits;
};


const SettingsDrawer = ({ open, onClose }) => {
    const { t, locale: lang } = useContext(LocalizationContext);
    const { profile, updateProfile, isLoading: isProfileLoading } = useProfile();
    
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [placeId, setPlaceId] = useState(null);
    
    const {
        ready,
        value: birthPlace,
        suggestions: { status, data: suggestionsData },
        setValue: setBirthPlace,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: { language: lang, types: ['(cities)'] },
        debounce: 300,
        initOnMount: typeof window !== 'undefined' && typeof window.google !== 'undefined',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLangModalOpen, setIsLangModalOpen] = useState(false);

    useEffect(() => {
        if (profile) {
            setBirthDate(profile.birthDate || '');
            setBirthTime(profile.birthTime || '');
            setBirthPlace(profile.birthPlace || '', false);
        }
    }, [profile, setBirthPlace]);

    const isSaveDisabled = !birthDate || !birthTime || !birthPlace;

    const handlePlaceInputChange = (e) => {
        setBirthPlace(e.target.value);
        setPlaceId(null);
    };

    const handleSelectSuggestion = ({ description, place_id }) => {
        setBirthPlace(description, false);
        setPlaceId(place_id);
        clearSuggestions();
    };

    const handleSave = async () => {
        if (!birthDate || !birthTime || !birthPlace) {
            setError(t('profileSaveErrorRequired')); // Assuming you'll add this to locales
            return;
        }
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            const profileData = {
                birthDate,
                birthTime,
                birthPlace: placeId ? { description: birthPlace, placeId } : birthPlace,
            };
            await updateProfile(profileData);
            setSuccess(t('profileSaveSuccess'));
        } catch (err) {
            setError(t('profileSaveError'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Drawer 
                anchor="left" 
                open={open} 
                onClose={onClose}
                PaperProps={{ 
                    sx: { 
                        backgroundColor: 'unset',
                        background: 'linear-gradient(135deg, rgba(10, 10, 12, 0.6), rgba(10, 10, 12, 0.4))',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    } 
                }}
            >
                <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', height: '100%', pt: '60px', boxSizing: 'border-box' }}>
                    <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
                        <Toolbar>
                            <IconButton edge="start" color="inherit" onClick={onClose}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
                              {t('settings')}
                            </Typography>
                        </Toolbar>
                    </AppBar>

                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                        {isProfileLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
                                    <Typography variant="body2" sx={{ mb: 1, color: 'var(--text-primary)' }}>
                                        {t('profileDescription')}
                                    </Typography>
                                    <TextField
                                        label={t('birthDateLabel')}
                                        variant="outlined"
                                        fullWidth
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(formatDate(e.target.value))}
                                        inputProps={{ maxLength: 10, placeholder: "23.05.1990" }}
                                        sx={textFieldStyles}
                                    />
                                    <TextField
                                        label={t('birthTimeLabel')}
                                        variant="outlined"
                                        fullWidth
                                        value={birthTime}
                                        onChange={(e) => setBirthTime(formatTime(e.target.value))}
                                        inputProps={{ maxLength: 5, placeholder: "14:30" }}
                                        sx={textFieldStyles}
                                    />
                                    <TextField
                                        label={t('birthPlaceLabel')}
                                        variant="outlined"
                                        fullWidth
                                        value={birthPlace}
                                        onChange={handlePlaceInputChange}
                                        disabled={!ready}
                                        inputProps={{ placeholder: "Москва, Россия" }}
                                        sx={textFieldStyles}
                                    />
                                    {status === 'OK' && (
                                        <List className={styles.suggestionsList}>
                                            {suggestionsData.map((suggestion) => (
                                                <ListItem
                                                    button
                                                    key={suggestion.place_id}
                                                    onClick={() => handleSelectSuggestion(suggestion)}
                                                    className={styles.suggestionItem}
                                                >
                                                    <ListItemText primary={suggestion.description} sx={{ color: 'var(--text-primary)'}} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                    
                                    {error && <Alert severity="error">{error}</Alert>}
                                    {success && <Alert severity="success">{success}</Alert>}

                                    <Button 
                                        variant="contained" 
                                        onClick={handleSave} 
                                        size="large" 
                                        disabled={isSaving || isSaveDisabled}
                                        sx={{ mt: 'auto' }}
                                    >
                                        {isSaving ? <CircularProgress size={24} /> : t('saveData')}
                                    </Button>
                                </Box>

                                <List sx={{mt: 2}}>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={() => setIsLangModalOpen(true)}>
                                        <ListItemIcon>
                                            <TranslateIcon sx={{ color: 'var(--text-secondary)' }} />
                                        </ListItemIcon>
                                        <ListItemText primary={t('language')} />
                                        </ListItemButton>
                                    </ListItem>
                                </List>
                            </>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <LanguageSelectionModal 
                open={isLangModalOpen} 
                onClose={() => setIsLangModalOpen(false)} 
            />
        </>
    );
};

export default SettingsDrawer;
