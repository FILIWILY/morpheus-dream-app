import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { LocalizationContext } from '../context/LocalizationContext';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Container, Typography, TextField, Button, Box, Alert, CircularProgress, AppBar, Toolbar, IconButton, List, ListItem, ListItemText } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './ProfilePage.module.css';

// ✅ Возвращаем стили для полей ввода на темном фоне
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

// Функции форматирования (остаются без изменений)
const formatDate = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  } else if (digits.length > 2) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  return digits;
};

const formatTime = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  return digits;
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const { profile, updateProfile, isLoading: isProfileLoading } = useProfile();
    const { locale: lang } = useContext(LocalizationContext);

    // Локальное состояние для полей формы
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    
    // Состояние для автокомплита
    const {
        ready,
        value: birthPlaceValue,
        suggestions: { status, data: suggestionsData },
        setValue: setBirthPlaceValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            language: lang,
            types: ['(cities)'],
        },
        debounce: 300,
    });

    const [placeId, setPlaceId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Заполняем форму данными из профиля при загрузке
    useEffect(() => {
        if (profile) {
            setBirthDate(profile.birthDate || '');
            setBirthTime(profile.birthTime || '');
            setBirthPlaceValue(profile.birthPlace || '', false); // Устанавливаем значение без вызова API
        }
    }, [profile, setBirthPlaceValue]);

    const handleInputChange = (e) => {
        setBirthPlaceValue(e.target.value);
        setPlaceId(null); // Сбрасываем placeId при ручном вводе
    };

    const handleSelectSuggestion = ({ description, place_id }) => {
        setBirthPlaceValue(description, false); // Обновляем поле ввода
        setPlaceId(place_id); // Сохраняем place_id
        clearSuggestions(); // Очищаем список предложений
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        const profileData = {
            birthDate,
            birthTime,
            birthPlace: placeId ? { description: birthPlaceValue, placeId } : birthPlaceValue,
        };

        try {
            await updateProfile(profileData);
            setSuccess('Данные успешно сохранены!');
        } catch (err) {
            setError('Не удалось сохранить данные.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isProfileLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" className={styles.container}>
            <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
                        Личный кабинет
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box className={styles.formBox}>
                <TextField
                    label="Дата рождения (дд.мм.гггг)"
                    variant="outlined"
                    fullWidth
                    value={birthDate}
                    onChange={(e) => setBirthDate(formatDate(e.target.value))}
                    inputProps={{ maxLength: 10, placeholder: "23.05.1990" }}
                    sx={textFieldStyles}
                />
                <TextField
                    label="Время рождения (чч:мм, необязательно)"
                    variant="outlined"
                    fullWidth
                    value={birthTime}
                    onChange={(e) => setBirthTime(formatTime(e.target.value))}
                    inputProps={{ maxLength: 5, placeholder: "14:30" }}
                    sx={textFieldStyles}
                />
                <Box>
                    <TextField
                        label="Место рождения (Город, Страна)"
                        variant="outlined"
                        fullWidth
                        value={birthPlaceValue}
                        onChange={handleInputChange}
                        disabled={!ready}
                        inputProps={{ placeholder: "Начните вводить город..." }}
                        sx={textFieldStyles}
                    />
                    {status === 'OK' && (
                        <List sx={{ bgcolor: 'var(--background-secondary)', mt: 1, p: 0 }}>
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
                
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <Button variant="contained" onClick={handleSave} size="large" disabled={isSaving}>
                    {isSaving ? <CircularProgress size={24} /> : 'Сохранить'}
                </Button>
            </Box>
        </Container>
    );
};


export default ProfilePage;