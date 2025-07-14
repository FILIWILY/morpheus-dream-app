import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { Typography, TextField, Button, Box, Alert } from '@mui/material';
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
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!birthDate || !birthPlace) {
            setError("Дата и место рождения обязательны для сохранения.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await updateProfile({ birthDate, birthTime, birthPlace });
            localStorage.setItem('hasCompletedWelcomeFlow', 'true');
            navigate('/');
        } catch (err) {
            setError("Не удалось сохранить данные. Попробуйте снова.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('hasCompletedWelcomeFlow', 'true');
        navigate('/');
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
                    // ✅ Применяем форматирование при каждом изменении
                    onChange={(e) => setBirthDate(formatDate(e.target.value))}
                    placeholder="23.05.1990"
                    sx={textFieldStyles}
                    // Ограничиваем общую длину поля
                    inputProps={{ maxLength: 10 }}
                />
                <TextField
                    label="Время рождения (чч:мм, необязательно)"
                    variant="outlined"
                    fullWidth
                    value={birthTime}
                    // ✅ Применяем форматирование при каждом изменении
                    onChange={(e) => setBirthTime(formatTime(e.target.value))}
                    placeholder="14:30"
                    sx={textFieldStyles}
                    // Ограничиваем общую длину поля
                    inputProps={{ maxLength: 5 }}
                />
                <TextField
                    label="Место рождения (Город, Страна)"
                    variant="outlined"
                    fullWidth
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Москва, Россия"
                    sx={textFieldStyles}
                />
                
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                <Alert severity="info" className={styles.alert}>
                    *Для доступа к Астрологической линзе
                </Alert>

                <Button variant="contained" onClick={handleSave} size="large" disabled={isLoading}>
                    Сохранить и продолжить
                </Button>
                <Button variant="text" onClick={handleSkip} className={styles.skipButton}>
                    Пропустить
                </Button>
            </Box>
        </Box>
    );
};

export default WelcomePage;