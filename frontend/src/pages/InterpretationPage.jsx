import React, { useState, useMemo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './InterpretationPage.module.css';

import DreamTags from '../components/DreamTags';
import InterpretationSection from '../components/InterpretationSection';
import LensTabs from '../components/LensTabs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LocalizationContext } from '../context/LocalizationContext';
import { useProfile } from '../context/ProfileContext';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';

const DUMMY_DATA_FOR_FALLBACK = {
    title: "Ошибка загрузки данных",
    keyImages: [],
    snapshotSummary: "Не удалось загрузить данные для этого сна. Пожалуйста, вернитесь назад и попробуйте снова.",
    lenses: { error: { title: "Ошибка", paragraphs: {} } }
};

const LENS_ACCENT_COLORS = {
    psychoanalytic: '#C850FF',
    esoteric: '#00D4FF',
    astrology: '#4D7BFF',
    folkloric: '#34E49D',
};

// ✅ Компонент для ввода данных по астрологии определен ОДИН РАЗ
const AstrologyOnboarding = ({ onUpdate }) => {
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!birthDate || !birthPlace) {
            setError('Пожалуйста, укажите дату и место рождения.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await onUpdate({ birthDate, birthTime, birthPlace });
        } catch (err) {
            setError('Не удалось сохранить данные. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: '#1a1a1f', borderRadius: '12px' }}>
            <Typography variant="h6">Астрологическая Линза</Typography>
            <Typography color="text.secondary">Для получения астрологического толкования, пожалуйста, укажите ваши данные о рождении.</Typography>
            <TextField label="Дата рождения (дд.мм.гггг)" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <TextField label="Время рождения (чч:мм)" value={birthTime} onChange={e => setBirthTime(e.target.value)} />
            <TextField label="Место рождения (Город, Страна)" value={birthPlace} onChange={e => setBirthPlace(e.target.value)} />
            {error && <Alert severity="error">{error}</Alert>}
            <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : "Получить толкование"}
            </Button>
        </Box>
    );
};

const InterpretationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useContext(LocalizationContext);
    const { profile, updateProfile, isLoading: isProfileLoading } = useProfile();

    const interpretationData = location.state?.interpretationData || DUMMY_DATA_FOR_FALLBACK;
    
    const lenses = interpretationData.lenses ? Object.keys(interpretationData.lenses) : [];
    const [activeLensKey, setActiveLensKey] = useState(lenses.length > 0 ? lenses[0] : null);

    const activeLensData = activeLensKey ? interpretationData.lenses[activeLensKey] : null;
    const paragraphs = activeLensData?.paragraphs ? Object.values(activeLensData.paragraphs) : [];
    
    const activeAccentColor = useMemo(() => LENS_ACCENT_COLORS[activeLensKey] || '#C850FF', [activeLensKey]);
    const isAstrologyDataMissing = !profile?.birthDate || !profile?.birthPlace;

    const renderLensContent = () => {
        if (activeLensKey === 'astrology') {
            if (isProfileLoading) {
                return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
            }
            if (isAstrologyDataMissing) {
                return <AstrologyOnboarding onUpdate={updateProfile} />;
            }
        }

        return (
            <div className={styles.lensContentFlow}>
                {paragraphs.map(paragraph => (
                    <div key={paragraph.title} className={styles.flowParagraph}>
                        <h3 className={styles.flowTitle} style={{ color: activeAccentColor }}>
                            {paragraph.title}
                        </h3>
                        <p className={styles.flowText}>{paragraph.content}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <ArrowBackIcon />
                </button>
                <h1 className={styles.pageTitle}>{interpretationData.title}</h1>
            </header>

            <main className={styles.content}>
                <DreamTags tags={interpretationData.keyImages} />
                <InterpretationSection title={t('snapshotSummary')}>
                    <p>{interpretationData.snapshotSummary}</p>
                </InterpretationSection>
                
                {lenses.length > 0 && (
                    <LensTabs 
                        lenses={interpretationData.lenses} 
                        activeLens={activeLensKey}
                        setActiveLens={setActiveLensKey}
                        accentColor={activeAccentColor}
                    />
                )}
                
                {renderLensContent()}
            </main>
        </div>
    );
};

export default InterpretationPage;