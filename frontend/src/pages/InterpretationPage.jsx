import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './InterpretationPage.module.css';

import InterpretationSection from '../components/InterpretationSection';
import LensTabs from '../components/LensTabs';
import PsychoanalyticInsight from '../components/PsychoanalyticInsight';
import PsychoanalyticRecommendations from '../components/PsychoanalyticRecommendations';
import PsychoanalyticSchools from '../components/PsychoanalyticSchools'; // Import the new component
import TarotSpread from '../components/TarotSpread';
import AstrologyLens from '../components/AstrologyLens'; // Импортируем новый компонент

import { LocalizationContext } from '../context/LocalizationContext';
import { useProfile } from '../context/ProfileContext';

import { Box, Button, Typography, CircularProgress, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import api from '../services/api';

const LENS_ACCENT_COLORS = {
    psychoanalytic: '#4D7BFF',
    tarot: '#FFC700',
    astrology: '#C850FF',
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
    const { id: routeDreamId } = useParams();
    const { t } = useContext(LocalizationContext);
    const { profile, isLoading: isProfileLoading } = useProfile();

    const [interpretationData, setInterpretationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeLensKey, setActiveLensKey] = useState(null);
    const [isTarotRevealed, setIsTarotRevealed] = useState(false);

    const handleRevealTarot = async () => {
        // Prevent revealing if already revealed or no data
        if (isTarotRevealed || !interpretationData?.id) return;

        try {
            // Persist the revealed state to the backend
            await api.put(`/dreams/${interpretationData.id}/lenses/tarot`, { 
                isRevealed: true 
            });

            // Update local state to trigger the animation
            setIsTarotRevealed(true);
            
            // Optionally, update the full interpretationData object to ensure consistency
            setInterpretationData(prevData => ({
                ...prevData,
                lenses: {
                    ...prevData.lenses,
                    tarot: {
                        ...prevData.lenses.tarot,
                        state: {
                            ...prevData.lenses.tarot.state,
                            isRevealed: true,
                        }
                    },
                },
            }));

        } catch (error) {
            console.error('Failed to update tarot reveal state:', error);
            // Even if the API call fails, we might want to reveal locally to not block the user
            setIsTarotRevealed(true);
        }
    };

    useEffect(() => {
        const fetchDream = async () => {
            if (!routeDreamId) {
                setError('Dream ID not found.');
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const resp = await api.get(`/dreams/${routeDreamId}`);
                setInterpretationData(resp.data);
            } catch (e) {
                console.error('Failed to fetch dream by id:', e);
                setError('Failed to load interpretation.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDream();
    }, [routeDreamId]);

    const activeAccentColor = useMemo(() => {
        if (!activeLensKey) return 'var(--text-secondary)'; // neutral
        return LENS_ACCENT_COLORS[activeLensKey] || 'var(--accent-primary)';
    }, [activeLensKey]);

    // Keep local UI state in sync with fetched dream data (e.g., after reload)
    useEffect(() => {
        if (!interpretationData) return;
        setActiveLensKey(interpretationData.activeLens ?? null);
        setIsTarotRevealed(!!interpretationData?.lenses?.tarot?.state?.isRevealed);
    }, [interpretationData]);

    const handleAstrologyStateChange = (newAstrologyData) => {
        setInterpretationData(prevData => ({
            ...prevData,
            lenses: {
                ...prevData.lenses,
                astrology: newAstrologyData,
            },
        }));
    };


    if (isLoading) {
        return (
            <Box className={styles.pageWrapper} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !interpretationData || !interpretationData.lenses) {
        return (
            <div className={styles.pageWrapper} style={{ padding: '32px' }}>
                <Typography variant="h5" sx={{ mb: 2 }}>{error || 'Ошибка'}</Typography>
                <Typography sx={{ mb: 2 }}>
                    Не удалось загрузить данные сна. Пожалуйста, попробуйте вернуться.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/history')}>
                    Вернуться к истории
                </Button>
            </div>
        );
    }
    
    const lenses = Object.keys(interpretationData.lenses);
    const activeLensData = activeLensKey ? interpretationData.lenses[activeLensKey] : null;
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
                return <AstrologyLens 
                    data={activeLensData} 
                    dreamId={interpretationData.id}
                    onStateChange={handleAstrologyStateChange} 
                />;
            
            case 'psychoanalytic':
                return (
                    <div className={styles.lensContentFlow}>
                        <PsychoanalyticInsight insights={activeLensData.insights} accentColor={activeAccentColor} />
                        {/* Replace the old mapping with the new interactive component */}
                        <PsychoanalyticSchools 
                            schools={activeLensData.schools} 
                            accentColor={activeAccentColor} 
                        />
                        <PsychoanalyticRecommendations recommendation={activeLensData.recommendation} accentColor={activeAccentColor} />
                    </div>
                );

            case 'tarot':
                return <TarotSpread 
                            spread={activeLensData.spread} 
                            summary={activeLensData.summary} 
                            accentColor={activeAccentColor}
                            isRevealed={isTarotRevealed}
                            onReveal={handleRevealTarot} 
                        />;

            default:
                break;
        }
        
        // Fallback for other potential old structures
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
                <InterpretationSection title={t('snapshotSummary')} accentColor={activeAccentColor}>
                    <p>{interpretationData.snapshotSummary}</p>
                </InterpretationSection>
                
                 {lenses.length > 0 && (
                    <LensTabs 
                        lenses={interpretationData.lenses} 
                        activeLens={activeLensKey}
                        setActiveLens={async (key) => {
                            setActiveLensKey(key);
                            try {
                                // Persist active lens selection
                                const response = await api.put(`/dreams/${interpretationData.id}/activeLens`, { activeLens: key });
                                const newActiveLens = response.data?.activeLens ?? key;
                                setInterpretationData(prev => ({ ...prev, activeLens: newActiveLens }));
                            } catch (e) {
                                console.error('Failed to save active lens:', e);
                                // Keep local state even if persistence failed
                                setInterpretationData(prev => ({ ...prev, activeLens: key }));
                            }
                        }}
                        accentColor={activeAccentColor}
                    />
                )}
                
                {renderLensContent()}
            </main>
        </div>
    );
};

export default InterpretationPage;
