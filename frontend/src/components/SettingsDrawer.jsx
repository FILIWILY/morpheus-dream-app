import React, { useState, useEffect, useContext } from 'react';
import { useProfile } from '../context/ProfileContext';
import { LocalizationContext } from '../context/LocalizationContext';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { Drawer, Box, AppBar, Toolbar, IconButton, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Button, Alert, CircularProgress, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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

const SuccessAlert = styled(Alert)(({ theme }) => ({
    backgroundColor: 'rgba(52, 228, 157, 0.1)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    '& .MuiAlert-icon': {
      color: '#34E49D',
    },
    '& .MuiAlert-message': {
        width: '100%',
    }
}));

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
    const [gender, setGender] = useState('');
    const [placeId, setPlaceId] = useState(null);
    const [initialProfile, setInitialProfile] = useState(null);
    const suggestionsRef = React.useRef(null);
    const blurTimeoutRef = React.useRef(null);
    
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
        // Инициализируем профиль даже если он null или пустой
        let birthPlaceText = '';
        let initialPlaceId = null;

        console.log('[SettingsDrawer] 🔍 Profile loaded:', profile);

        if (profile) {
            if (typeof profile.birthPlace === 'string') {
                try {
                    // Пытаемся распарсить, если это JSON-строка
                    const parsed = JSON.parse(profile.birthPlace);
                    if (typeof parsed === 'object' && parsed !== null && parsed.description) {
                        birthPlaceText = parsed.description;
                        initialPlaceId = parsed.placeId || null;
                    } else {
                        // Если распарсилось, но структура не та, или это просто строка
                        birthPlaceText = profile.birthPlace;
                    }
                } catch (e) {
                    // Если это невалидный JSON, считаем просто строкой
                    birthPlaceText = profile.birthPlace;
                }
            } else if (typeof profile.birthPlace === 'object' && profile.birthPlace !== null && profile.birthPlace.description) {
                birthPlaceText = profile.birthPlace.description;
                initialPlaceId = profile.birthPlace.placeId || null;
            }
        }
        
        const initialData = {
            birthDate: profile?.birthDate || '',
            birthTime: profile?.birthTime || '',
            birthPlace: birthPlaceText,
            gender: profile?.gender || '',
            placeId: initialPlaceId,
        };
        
        console.log('[SettingsDrawer] 📝 Setting initial gender:', initialData.gender);
        
        setBirthDate(initialData.birthDate);
        setBirthTime(initialData.birthTime);
        setBirthPlace(initialData.birthPlace, false);
        setGender(initialData.gender);
        setPlaceId(initialData.placeId);
        setInitialProfile(initialData);
    }, [profile, setBirthPlace, t]);

    useEffect(() => {
        if (!open) {
            setSuccess('');
            setError('');
        }
    }, [open]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                clearSuggestions();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [suggestionsRef, clearSuggestions]);

    const isRequiredFieldsFilled = birthDate && birthTime && birthPlace;

    const hasChanges = initialProfile && (
        initialProfile.birthDate !== birthDate ||
        initialProfile.birthTime !== birthTime ||
        initialProfile.birthPlace !== birthPlace ||
        initialProfile.gender !== gender ||
        initialProfile.placeId !== placeId
    );

    const handlePlaceInputChange = (e) => {
        const newValue = e.target.value;
        setBirthPlace(newValue);

        if (initialProfile && newValue !== initialProfile.birthPlace) {
            setPlaceId(null);
        } else if (initialProfile && newValue === initialProfile.birthPlace) {
            setPlaceId(initialProfile.placeId);
        } else {
            setPlaceId(null);
        }
    };

    const handleSelectSuggestion = ({ description, place_id }) => {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
        }
        setBirthPlace(description, false);
        setPlaceId(place_id);
        clearSuggestions();
    };

    const handleSave = async () => {
        if (!isRequiredFieldsFilled) {
            setError(t('profileSaveErrorRequired'));
            return;
        }
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            const profileData = {
                birthDate,
                birthTime,
                birthPlace: { description: birthPlace, placeId: placeId || null },
                gender,
            };
            console.log('[SettingsDrawer] 💾 Saving profile with gender:', gender);
            console.log('[SettingsDrawer] 📤 Full profileData:', profileData);
            
            await updateProfile(profileData);
            
            console.log('[SettingsDrawer] ✅ Profile saved successfully');
            setSuccess(t('profileSaveSuccess'));
            setInitialProfile({
                birthDate,
                birthTime,
                birthPlace,
                gender,
                placeId,
            });
            setTimeout(() => {
                onClose();
            }, 500);
        } catch (err) {
            console.error('[SettingsDrawer] ❌ Error saving profile:', err);
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
                <Box sx={{ 
                    width: 300, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    boxSizing: 'border-box',
                    paddingTop: '60px'
                }}>
                    <AppBar position="relative" sx={{ // Changed to relative
                        background: 'transparent', 
                        boxShadow: 'none', 
                        flexShrink: 0,
                    }}>
                        <Toolbar sx={{ paddingTop: '48px' }}>
                            <IconButton edge="start" color="inherit" onClick={onClose}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
                              {t('settings')}
                            </Typography>
                            {hasChanges && (
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {isSaving ? <CircularProgress size={24} color="inherit" /> : t('save')}
                                </Button>
                            )}
                        </Toolbar>
                    </AppBar>

                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                        {isProfileLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-primary)' }}>
                                    {t('profileDescription')}
                                </Typography>

                                <Box sx={{ position: 'relative', mb: 2 }}>
                                    <TextField
                                        label={t('birthPlaceLabel')}
                                        variant="outlined"
                                        fullWidth
                                        value={birthPlace}
                                        onChange={handlePlaceInputChange}
                                        disabled={!ready || isSaving}
                                        inputProps={{ placeholder: "Москва, Россия" }}
                                        sx={textFieldStyles}
                                    />
                                    {status === 'OK' && (
                                        <List ref={suggestionsRef} className={styles.suggestionsList}>
                                            <Typography variant="caption" sx={{ color: '#ff4d4d', p: '8px 16px', display: 'block' }}>
                                                {t('birthPlaceHint')}
                                            </Typography>
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
                                </Box>

                                <TextField
                                    label={t('birthDateLabel')}
                                    variant="outlined"
                                    fullWidth
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(formatDate(e.target.value))}
                                    inputProps={{ maxLength: 10, placeholder: "23.05.1990" }}
                                    sx={{...textFieldStyles, mb: 2}}
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
                                
                                <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                                    <FormLabel component="legend" sx={{ color: 'var(--text-secondary)', '&.Mui-focused': { color: 'var(--accent-primary)' } }}>
                                        {t('genderLabel')}
                                    </FormLabel>
                                    <RadioGroup
                                        row
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        sx={{ mt: 1 }}
                                    >
                                        <FormControlLabel 
                                            value="male" 
                                            control={<Radio sx={{ color: 'var(--text-secondary)', '&.Mui-checked': { color: 'var(--accent-primary)' } }} />} 
                                            label={t('male')}
                                            sx={{ color: 'var(--text-primary)' }}
                                        />
                                        <FormControlLabel 
                                            value="female" 
                                            control={<Radio sx={{ color: 'var(--text-secondary)', '&.Mui-checked': { color: 'var(--accent-primary)' } }} />} 
                                            label={t('female')}
                                            sx={{ color: 'var(--text-primary)' }}
                                        />
                                    </RadioGroup>
                                </FormControl>
                                
                                {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
                                {success && 
                                    <SuccessAlert 
                                        icon={<CheckCircleOutlineIcon fontSize="inherit" />} 
                                        severity="success" 
                                        sx={{mt: 2}}
                                    >
                                        {success}
                                    </SuccessAlert>
                                }
                            
                                <List sx={{mt: 2}}>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={() => setIsLangModalOpen(true)}>
                                        <ListItemIcon>
                                            <TranslateIcon sx={{ color: 'var(--text-secondary)' }} />
                                        </ListItemIcon>
                                        <ListItemText primary={t('language')} sx={{ color: 'var(--text-primary)' }}/>
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
