import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './InterpretationPage.module.css';

import InterpretationSection from '../components/InterpretationSection';
import LensTabs from '../components/LensTabs';
import PsychoanalyticInsight from '../components/PsychoanalyticInsight';
import PsychoanalyticRecommendations from '../components/PsychoanalyticRecommendations';
import PsychoanalyticSchools from '../components/PsychoanalyticSchools'; // Import the new component
import TarotSpread from '../components/TarotSpread';
import AstrologyLens from '../components/AstrologyLens'; // Импортируем новый компонент
import LensSkeleton from '../components/LensSkeleton'; // Импортируем скелетон
import DreamBookLens from '../components/DreamBookLens';
import TranscriptModal from '../components/TranscriptModal';

import { LocalizationContext } from '../context/LocalizationContext';
import { useProfile } from '../context/ProfileContext';

import { Box, Button, Typography, CircularProgress, IconButton, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import api from '../services/api';

const LENS_ORDER = ['dreambook', 'psychoanalytic', 'tarot', 'astrology'];

const LENS_ACCENT_COLORS = {
    dreambook: '#28a745', // Зеленый для Сонника
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
    const { dreamId: routeDreamId } = useParams(); // ✅ ИСПРАВЛЕНО: используем dreamId из роута
    const { t } = useContext(LocalizationContext);
    const { profile, isLoading: isProfileLoading } = useProfile();

    const wsRef = useRef(null);
    const activeStreamDreamIdRef = useRef(null);

    const [interpretationData, setInterpretationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeLensKey, setActiveLensKey] = useState(null);
    const [isTarotRevealed, setIsTarotRevealed] = useState(false);
    const [isTranscriptModalOpen, setTranscriptModalOpen] = useState(false);
    const [storedUserId, setStoredUserId] = useState(() => location.state?.userId || location.state?.initialData?.userId || null);
    const [isStreaming, setIsStreaming] = useState(false); // Новое состояние для отслеживания стриминга

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
                if (location.state?.isNew) {
                    const initialUserId = location.state?.userId ?? location.state?.initialData?.userId ?? profile?.userId ?? profile?.telegramId ?? (import.meta.env.DEV ? 'dev_test_user_123' : null);
                    if (initialUserId) {
                        setStoredUserId(initialUserId);
                    }
                    setInterpretationData(prev => ({
                        ...location.state.initialData,
                        userId: location.state.initialData.userId ?? initialUserId
                    }));
                    setIsLoading(false);
                } else {
                    setError('Dream ID not found.');
                    setIsLoading(false);
                }
                return;
            }
            
            setIsLoading(true);
            try {
                const resp = await api.get(`/dreams/${routeDreamId}`);
                const dream = resp.data;
                const dreamUserId = dream.userId ?? profile?.userId ?? profile?.telegramId ?? location.state?.userId ?? (import.meta.env.DEV ? 'dev_test_user_123' : null);
                if (dreamUserId) {
                    setStoredUserId(dreamUserId);
                }
                setInterpretationData({ ...dream, userId: dreamUserId });
                // ВАЖНО: НЕ вызываем navigate здесь, чтобы избежать бесконечного цикла
            } catch (e) {
                console.error('[InterpretationPage] Failed to fetch dream:', e);
                setError('Failed to load interpretation.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDream();
    }, [routeDreamId, profile]); // Убрали location.state из зависимостей, чтобы избежать бесконечного цикла

    // WebSocket logic
    useEffect(() => {
        const dreamId = interpretationData?.id;
        if (!dreamId) {
            return;
        }

        // ВАЖНО: WebSocket запускаем ТОЛЬКО если это ЯВНО новый сон
        const isExplicitlyNew = location.state?.isNew === true;
        
        if (!isExplicitlyNew) {
            setIsStreaming(false); // Убедимся, что для старых снов флаг выключен
            return;
        }

        // Проверяем что уже не стримим этот сон
        if (activeStreamDreamIdRef.current === dreamId) {
            return;
        }

        const effectiveUserId = storedUserId ?? interpretationData.userId ?? profile?.userId ?? profile?.telegramId ?? (import.meta.env.DEV ? 'dev_test_user_123' : null);
        if (!effectiveUserId) {
            console.warn('[WS] Cannot start interpretation: unknown userId');
            return;
        }

        activeStreamDreamIdRef.current = dreamId;
        setIsStreaming(true); // Включаем флаг стриминга

        const ws = api.connectWebSocket();
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[WS] Connection opened');
            ws.send(JSON.stringify({
                type: 'startInterpretation',
                payload: {
                    dreamId,
                    userId: effectiveUserId,
                    lang: 'ru' // TODO: make dynamic
                }
            }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('[WS] Message received:', message);

            if (message.type === 'part') {
                setInterpretationData(prevData => {
                    const newData = { ...prevData };
                    if (message.payload.title) newData.title = message.payload.title;
                    // Удаляем обработку snapshotSummary
                    if (message.payload.processedText) newData.processedText = message.payload.processedText;
                    if (message.payload.lenses) {
                        newData.lenses = { ...newData.lenses, ...message.payload.lenses };
                    }
                    return newData;
                });
            } else if (message.type === 'done') {
                console.log('[WS] Interpretation finished');
                setIsStreaming(false); // Выключаем флаг стриминга по завершению
                ws.close();
            } else if (message.type === 'error') {
                setError(message.payload.message);
                console.error('[WS] Error:', message.payload.message);
                setIsStreaming(false); // Выключаем флаг стриминга при ошибке
                ws.close();
            }
        };

        ws.onclose = () => {
            console.log('[WS] Connection closed');
            if (wsRef.current === ws) {
                wsRef.current = null;
            }
        };

        return () => {
            if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
                try {
                    wsRef.current.close();
                } catch (err) {
                    console.warn('[WS] Error while closing socket:', err);
                }
            }

            if (activeStreamDreamIdRef.current === dreamId) {
                activeStreamDreamIdRef.current = null;
            }
        };

    }, [interpretationData?.id, location.state?.isNew, storedUserId]);

    const activeAccentColor = useMemo(() => {
        if (!activeLensKey) return 'var(--text-secondary)'; // neutral
        return LENS_ACCENT_COLORS[activeLensKey] || 'var(--accent-primary)';
    }, [activeLensKey]);

    // Keep local UI state in sync with fetched dream data (e.g., after reload)
    useEffect(() => {
        if (!interpretationData) return;
        // Устанавливаем активную линзу, если она есть, иначе первую из списка
        const defaultLens = interpretationData.activeLens ?? LENS_ORDER.find(key => interpretationData.lenses?.[key]);
        setActiveLensKey(defaultLens);
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
        if (!activeLensKey) return null;

        const lensData = interpretationData.lenses[activeLensKey];

        // Если данных для этой линзы еще нет, показываем индикатор загрузки
        // Проверяем наличие ключевых полей для каждой линзы
        const hasData = lensData && (
            (activeLensKey === 'dreambook' && lensData.content) ||
            (activeLensKey === 'psychoanalytic' && lensData.insights) ||
            (activeLensKey === 'tarot' && lensData.spread) ||
            (activeLensKey === 'astrology' && lensData.celestialMap)
        );
        
        if (!hasData) {
            // Если идет стрим - показываем "Ожидаем ИИ", если нет - скелетон (загрузка старого сна)
            if (isStreaming) {
                return (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 2,
                        p: 4,
                        minHeight: '200px'
                    }}>
                        <CircularProgress size={48} sx={{ color: LENS_ACCENT_COLORS[activeLensKey] }} />
                        <Typography variant="body1" sx={{ color: 'var(--text-primary)', textAlign: 'center' }}>
                            {t('waitingForAI')}
                        </Typography>
                    </Box>
                );
            }
            // Для старых снов показываем скелетон, пока данные подгружаются
            return <LensSkeleton />;
        }
        
        // activeLensData больше не нужна, используем lensData напрямую
        // const activeLensData = activeLensKey ? interpretationData.lenses[activeLensKey] : null;

        switch (activeLensKey) {
            case 'dreambook':
                return <DreamBookLens 
                            content={lensData.content} 
                            highlightWords={lensData.highlightWords} 
                            accentColor={activeAccentColor}
                            metadata={lensData.metadata}
                        />;

            case 'astrology':
                if (isProfileLoading) {
                    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
                }
                if (isAstrologyDataMissing) {
                    return <AstrologyLock />;
                }
                return <AstrologyLens 
                    data={lensData} 
                    dreamId={interpretationData.id}
                    onStateChange={handleAstrologyStateChange} 
                />;
            
            case 'psychoanalytic':
                return (
                    <div className={styles.lensContentFlow}>
                        <PsychoanalyticInsight insights={lensData.insights} accentColor={activeAccentColor} />
                        <PsychoanalyticSchools 
                            schools={lensData.schools} 
                            accentColor={activeAccentColor} 
                        />
                        <PsychoanalyticRecommendations recommendation={lensData.recommendation} accentColor={activeAccentColor} />
                    </div>
                );

            case 'tarot':
                return <TarotSpread 
                            spread={lensData.spread} 
                            summary={lensData.summary} 
                            accentColor={activeAccentColor}
                            isRevealed={isTarotRevealed}
                            onReveal={handleRevealTarot} 
                        />;

            default:
                break;
        }
        
        // Fallback for other потенциальных старых структур
        if (lensData.summary) {
             return (
                <div className={styles.lensContentFlow}>
                    <div className={styles.flowParagraph}>
                        <p className={styles.flowText}>{lensData.summary}</p>
                    </div>
                </div>
            );
        }
        
        const paragraphs = lensData.paragraphs ? Object.values(lensData.paragraphs) : [];
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
            {/* Убираем зависимость от summary, теперь ждем только title */}
            {interpretationData.title ? (
                <main className={styles.content}>
                    <div className={styles.contentInner}>
                        <InterpretationSection 
                            title={interpretationData.title} 
                            accentColor={activeAccentColor}
                            onBackClick={() => navigate(-1)}
                        >
                            {/* Возвращаем текст-подсказку */}
                            <p>{t('selectLensPrompt')}</p>
                        </InterpretationSection>
                        
                        <LensTabs 
                            lenses={{
                                // Добавляем Сонник
                                dreambook: interpretationData.lenses?.dreambook || { title: t('lenses.dreambook') },
                                psychoanalytic: interpretationData.lenses?.psychoanalytic || { title: t('lenses.psychoanalytic') },
                                tarot: interpretationData.lenses?.tarot || { title: t('lenses.tarot') },
                                astrology: interpretationData.lenses?.astrology || { title: t('lenses.astrology') }
                            }} 
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
                        <div className={styles.lensContentContainer}>
                            {activeLensKey && renderLensContent()}
                        </div>
                    </div>
                </main>
            ) : (
                <main className={styles.content}>
                    <div className={styles.contentInner}>
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: 2,
                            p: 4,
                            minHeight: '300px'
                        }}>
                            <CircularProgress size={48} sx={{ color: 'var(--text-secondary)' }} />
                            <Typography variant="body1" sx={{ color: 'var(--text-primary)', textAlign: 'center' }}>
                                {t('generatingInterpretation')}
                            </Typography>
                        </Box>
                    </div>
                </main>
            )}

            {/* Модальное окно было перенесено на HistoryPage */}
        </div>
    );
};

export default InterpretationPage;
