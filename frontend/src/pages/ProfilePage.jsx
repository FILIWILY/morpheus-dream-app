import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { LocalizationContext } from '../context/LocalizationContext';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { Typography, TextField, Button, Box, Alert, List, ListItem, ListItemText, CircularProgress, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
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
    const { t, locale: lang } = useContext(LocalizationContext) || { locale: 'ru', t: (key) => key };
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [gender, setGender] = useState('');
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
    });
    
    // Moved this line to after birthPlace is defined to prevent a crash.
    const isSaveDisabled = !birthDate || !birthTime || !birthPlace || !placeId || !gender;

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
                    gender,
                    onboardingCompleted: true,
                };
                console.log('[ProfilePage] 💾 Saving profile with gender:', gender);
                console.log('[ProfilePage] 📤 Full profileData:', profileData);
                
                await updateProfile(profileData);
                
                console.log('[ProfilePage] ✅ User completed registration, redirecting to main app');
                navigate('/record');
            } catch (err) {
                console.error('[ProfilePage] ❌ Error saving profile:', err);
                setError(t('profileSaveError'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Send onboarding completed flag along with null values for profile data.
            await updateProfile({
                birthDate: null,
                birthTime: null,
                birthPlace: null,
                onboardingCompleted: true,
            });
            console.log('[ProfilePage] User skipped registration, redirecting to main app');
            navigate('/record');
        } catch (err) {
            setError(t('profileSkipError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.glassCard}>
                <Typography 
                    variant="h1" 
                    component="h1" 
                    className={styles.title} 
                    sx={{ 
                        textAlign: 'center',
                        // mb: '0.5rem' // Removed to rely on parent gap
                    }}
                >
                    {t('profileTitle')}
                </Typography>
                
                <Typography 
                    className={styles.explanation}
                    sx={{
                        textAlign: 'justify',
                        textIndent: 0,
                        margin: 0
                    }}
                >
                    Эти данные помогут нам создать для вас персональный профиль. 
                    Место, дата и время рождения могут использоваться для расширенных функций приложения в будущем.
                    Если вы хотите пропустить этот шаг, это не помешает вам пользоваться основными функциями толкования снов.
                </Typography>

                <Box sx={{position: 'relative'}}>
                    <TextField
                        label={t('birthPlaceLabel')}
                        variant="outlined"
                        fullWidth
                        value={birthPlace}
                        onChange={handleInputChange}
                        disabled={!ready}
                        placeholder={t('birthPlacePlaceholder')}
                        sx={textFieldStyles}
                    />
                    {status === 'OK' && (
                        <List className={styles.suggestionsList}>
                             <Typography variant="caption" sx={{ color: '#ff4d4d', p: '8px 16px', display: 'block' }}>
                                {t('birthPlaceHint')}
                            </Typography>
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

                <TextField
                    label={t('birthDateLabel')}
                    variant="outlined"
                    fullWidth
                    value={birthDate}
                    onChange={(e) => setBirthDate(formatDate(e.target.value))}
                    placeholder="23.05.1990"
                    sx={textFieldStyles}
                    inputProps={{ maxLength: 10 }}
                />
                <TextField
                    label={t('birthTimeLabel')}
                    variant="outlined"
                    fullWidth
                    value={birthTime}
                    onChange={(e) => setBirthTime(formatTime(e.target.value))}
                    placeholder="14:30"
                    sx={textFieldStyles}
                    inputProps={{ maxLength: 5 }}
                />
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
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
                
                {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

                <Button 
                    variant="contained" 
                    onClick={handleSave} 
                    size="large" 
                    disabled={isLoading || isSaveDisabled}
                    className={styles.button}
                >
                    {isLoading ? <CircularProgress size={24} color="inherit"/> : t('saveAndContinue')}
                </Button>
                <Button 
                    onClick={handleSkip} 
                    size="small" 
                    disabled={isLoading}
                    className={styles.skipButton}
                >
                    {t('skipProfileCompletion')}
                </Button>
            </Box>
        </Box>
    );
};

export default ProfilePage;
