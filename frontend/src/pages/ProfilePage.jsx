import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { LocalizationContext } from '../context/LocalizationContext';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { Typography, TextField, Button, Box, Alert, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import styles from './ProfilePage.module.css';

// Styles for input fields on a dark background
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


const ProfilePage = () => {
    const navigate = useNavigate();
    const { updateProfile } = useProfile();
    const { locale: lang } = useContext(LocalizationContext) || { locale: 'ru' };
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [placeId, setPlaceId] = useState(null);
    
    const {
        ready,
        value: birthPlace,
        suggestions: { status, data: suggestionsData },
        setValue: setBirthPlace,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            language: lang,
            types: ['(cities)'],
        },
        debounce: 300,
        initOnMount: typeof window !== 'undefined' && typeof window.google !== 'undefined',
    });
    
    // Moved this line to after birthPlace is defined to prevent a crash.
    const isSaveDisabled = !birthDate || !birthTime || !birthPlace || !placeId;

    const handleInputChange = (e) => {
        setBirthPlace(e.target.value);
        setPlaceId(null); 
    };

    const handleSelectSuggestion = ({ description, place_id }) => {
        setBirthPlace(description, false);
        setPlaceId(place_id); 
        clearSuggestions();
    };

    const handleSave = async () => {
        if (!isSaveDisabled) {
            setIsLoading(true);
            setError('');
            try {
                const profileData = {
                    birthDate,
                    birthTime,
                    birthPlace: { description: birthPlace, placeId },
                };
                await updateProfile(profileData);
                console.log('[ProfilePage] User completed registration, redirecting to main app');
                navigate('/record');
            } catch (err) {
                setError("Не удалось сохранить данные. Попробуйте снова.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Send empty data to indicate the user has skipped this step.
            // The backend will save the profile with null values.
            await updateProfile({
                birthDate: null,
                birthTime: null,
                birthPlace: null,
            });
            console.log('[ProfilePage] User skipped registration, redirecting to main app');
            navigate('/record');
        } catch (err) {
            setError("Произошла ошибка. Попробуйте снова.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.glassCard}>
                <Typography variant="h5" component="h1" className={styles.title}>
                    Расскажите о себе
                </Typography>
                <Typography className={styles.subtitle}>
                    Эти данные необходимы для точных астрологических толкований.
                </Typography>

                <TextField
                    label="Дата рождения (дд.мм.гггг)"
                    variant="outlined"
                    fullWidth
                    value={birthDate}
                    onChange={(e) => setBirthDate(formatDate(e.target.value))}
                    placeholder="23.05.1990"
                    sx={textFieldStyles}
                    inputProps={{ maxLength: 10 }}
                />
                <TextField
                    label="Время рождения (чч:мм)"
                    variant="outlined"
                    fullWidth
                    value={birthTime}
                    onChange={(e) => setBirthTime(formatTime(e.target.value))}
                    placeholder="14:30"
                    sx={textFieldStyles}
                    inputProps={{ maxLength: 5 }}
                />
                <Box sx={{position: 'relative'}}>
                    <TextField
                        label="Место рождения (Город, Страна)"
                        variant="outlined"
                        fullWidth
                        value={birthPlace}
                        onChange={handleInputChange}
                        disabled={!ready}
                        placeholder="Начните вводить город..."
                        sx={textFieldStyles}
                    />
                    {status === 'OK' && (
                        <List className={styles.suggestionsList}>
                            {suggestionsData.map((suggestion) => (
                                <ListItem
                                    button
                                    key={suggestion.place_id}
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                >
                                    <ListItemText primary={suggestion.description} sx={{ color: 'var(--text-primary)'}} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
                
                {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

                <Button 
                    variant="contained" 
                    onClick={handleSave} 
                    size="large" 
                    disabled={isLoading || isSaveDisabled}
                    className={styles.button}
                >
                    {isLoading ? <CircularProgress size={24} color="inherit"/> : 'Сохранить и продолжить'}
                </Button>
                <Button 
                    onClick={handleSkip} 
                    size="small" 
                    disabled={isLoading}
                    className={styles.skipButton}
                >
                    Пропустить
                </Button>
            </Box>
        </Box>
    );
};

export default ProfilePage;
