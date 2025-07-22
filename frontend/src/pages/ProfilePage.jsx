import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { Container, Typography, TextField, Button, Box, Alert, CircularProgress, AppBar, Toolbar, IconButton } from '@mui/material';
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
    
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setBirthDate(profile.birthDate || '');
            setBirthTime(profile.birthTime || '');
            setBirthPlace(profile.birthPlace || '');
        }
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            await updateProfile({ birthDate, birthTime, birthPlace });
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
                    sx={textFieldStyles} // ✅ Применяем стили
                />
                <TextField
                    label="Время рождения (чч:мм, необязательно)"
                    variant="outlined"
                    fullWidth
                    value={birthTime}
                    onChange={(e) => setBirthTime(formatTime(e.target.value))}
                    inputProps={{ maxLength: 5, placeholder: "14:30" }}
                    sx={textFieldStyles} // ✅ Применяем стили
                />
                <TextField
                    label="Место рождения (Город, Страна)"
                    variant="outlined"
                    fullWidth
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    inputProps={{ placeholder: "Москва, Россия" }}
                    sx={textFieldStyles} // ✅ Применяем стили
                />
                
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