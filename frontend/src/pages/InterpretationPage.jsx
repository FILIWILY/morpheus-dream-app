import React, { useState, useMemo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './InterpretationPage.module.css';

import DreamTags from '../components/DreamTags';
import InterpretationSection from '../components/InterpretationSection';
import LensTabs from '../components/LensTabs';
import PsychoanalyticInsight from '../components/PsychoanalyticInsight';
import TarotSpread from '../components/TarotSpread';

import { LocalizationContext } from '../context/LocalizationContext';
import { useProfile } from '../context/ProfileContext';

import { Box, Button, Typography, CircularProgress, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';

const LENS_ACCENT_COLORS = {
    psychoanalytic: '#C850FF',
    tarot: '#FFC700',
    astrology: '#4D7BFF',
    folkloric: '#34E49D',
};

const AstrologyLock = () => {
    const navigate = useNavigate();
    return (
        <Box className={styles.lockContainer} onClick={() => navigate('/profile')}>
            <LockIcon className={styles.lockIcon} />
            <Typography className={styles.lockText}>
                Чтобы получить доступ к астрологической линзе, необходимо заполнить данные в личном кабинете для точной расшифровки.
            </Typography>
        </Box>
    );
};

const InterpretationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useContext(LocalizationContext);
    const { profile, isLoading: isProfileLoading } = useProfile();

    const interpretationData = location.state?.interpretationData;

    if (!interpretationData || !interpretationData.lenses) {
        return (
            <div className={styles.pageWrapper} style={{ padding: '32px' }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Ошибка</Typography>
                <Typography sx={{ mb: 2 }}>
                    Не удалось загрузить данные сна. Вероятно, вы перезагрузили страницу.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/history')}>
                    Вернуться к истории
                </Button>
            </div>
        );
    }
    
    const lenses = Object.keys(interpretationData.lenses);
        const [activeLensKey, setActiveLensKey] = useState(lenses.length > 0 ? lenses[0] : null);
    const [isTarotRevealed, setIsTarotRevealed] = useState(false);

    const activeLensData = activeLensKey ? interpretationData.lenses[activeLensKey] : null;
    const activeAccentColor = useMemo(() => LENS_ACCENT_COLORS[activeLensKey] || '#C850FF', [activeLensKey]);
    const isAstrologyDataMissing = !profile?.birthDate || !profile?.birthPlace;

    const renderLensContent = () => {
        if (!activeLensData) return null;

        switch (activeLensKey) {
            case 'astrology':
                if (isProfileLoading) {
                    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
                }
                if (isAstrologyDataMissing) {
                    return <AstrologyLock />;
                }
                break;
            
            case 'psychoanalytic':
                const schools = activeLensData.schools ? Object.values(activeLensData.schools) : [];
                return (
                    <div className={styles.lensContentFlow}>
                        <PsychoanalyticInsight insights={activeLensData.insights} accentColor={activeAccentColor} />
                        {schools.map(school => (
                            <div key={school.title} className={styles.flowParagraph}>
                                <h3 className={styles.flowTitle} style={{ color: activeAccentColor }}>
                                    {school.title}
                                </h3>
                                <p className={styles.flowText}>{school.content}</p>
                            </div>
                        ))}
                    </div>
                );

            case 'tarot':
                return <TarotSpread 
                            spread={activeLensData.spread} 
                            summary={activeLensData.summary} 
                            accentColor={activeAccentColor}
                            isRevealed={isTarotRevealed}
                            onReveal={() => setIsTarotRevealed(true)} 
                        />;

            default:
                break;
        }
        
        // Fallback for old structure lenses like folkloric
        const paragraphs = activeLensData.paragraphs ? Object.values(activeLensData.paragraphs) : [];
        if (paragraphs.length > 0) {
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
        }

        return null;
    };

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>
                <h1 className={styles.pageTitle}>{interpretationData.title}</h1>
            </header>

            <main className={styles.content}>
                <DreamTags tags={interpretationData.keyImages} accentColor={activeAccentColor} />
                <InterpretationSection title={t('snapshotSummary')} accentColor={activeAccentColor}>
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