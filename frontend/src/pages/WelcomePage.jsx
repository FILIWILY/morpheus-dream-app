import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { LocalizationContext } from '../context/LocalizationContext';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { Typography, TextField, Button, Box, Alert, List, ListItem, ListItemText } from '@mui/material';
import styles from './WelcomePage.module.css';

// Стили для полей ввода на темном фоне
const textFieldStyles = {
    '& .MuiInputBase-input': {
        color: 'var(--text-primary)',
    },
    '& label': {
        color: 'var(--text-secondary)',
    },
    '& label.Mui-focused': {
        color: 'var(--accent-primary)',
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'var(--border-color)',
        },
        '&:hover fieldset': {
            borderColor: 'var(--accent-primary)',
        },
        '&.Mui-focused fieldset': {
            borderColor: 'var(--accent-primary)',
        },
    },
};

// ✅ Функция для форматирования ДАТЫ (dd.mm.yyyy)
const formatDate = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  } else if (digits.length > 2) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  return digits;
};

// ✅ Функция для форматирования ВРЕМЕНИ (hh:mm)
const formatTime = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  return digits;
};


const WelcomePage = () => {
    const navigate = useNavigate();
    const { updateProfile } = useProfile();
    const { locale: lang } = useContext(LocalizationContext) || { locale: 'ru' }; // ✅ Защита от неопределенного контекста
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [placeId, setPlaceId] = useState(null);
    
    const isSaveDisabled = !birthDate || !birthTime || !birthPlace;

    // ✅ Полностью переработана логика для защиты от падения Google Places API
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
        // ✅ Отключаем хук, если Google API не загрузился, чтобы избежать падения
        initOnMount: typeof window !== 'undefined' && typeof window.google !== 'undefined',
    });


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
        if (!birthDate || !birthTime || !birthPlace) {
            setError("Пожалуйста, заполните все поля: дату, время и место рождения.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const profileData = {
                birthDate,
                birthTime,
                birthPlace: placeId ? { description: birthPlace, placeId } : birthPlace,
            };
            await updateProfile(profileData);
            console.log('[WelcomePage] User completed registration, redirecting to main app');
            navigate('/record'); // Go directly to main recording page
        } catch (err) {
            setError("Не удалось сохранить данные. Попробуйте снова.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.contentBox}>
                <Typography variant="h4" component="h1" className={styles.title}>
                    Добро пожаловать в Morpheus
                </Typography>
                <Typography className={styles.subtitle}>
                    Укажите ваши данные
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
                <Box>
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
                        <List sx={{ bgcolor: 'var(--background-secondary)', mt: 1, p: 0, borderRadius: '8px' }}>
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
                
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                <Alert severity="info" className={styles.alert}>
                    Эти данные нужны для доступа к Астрологической линзе
                </Alert>

                <Button variant="contained" onClick={handleSave} size="large" disabled={isLoading || isSaveDisabled}>
                    Сохранить и продолжить
                </Button>
            </Box>
        </Box>
    );
};

export default WelcomePage;
