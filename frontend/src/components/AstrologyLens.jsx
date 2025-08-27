import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import styles from './AstrologyLens.module.css';
import ReactMarkdown from 'react-markdown';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import { EffectCoverflow } from 'swiper/modules';
import api from '../services/api';


// --- Иконки ---

const planetIcons = {
    sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
};
const aspectIcons = {
    conjunction: '☌', opposition: '☍', square: '□', trine: '△', sextile: '⚹',
};
const QuestionMarkIcon = () => ( <span style={{cursor: 'pointer', color: '#888'}}>?</span> );

import NewMoonIcon from '../assets/moon_phases/new_moon.png';
import WaxingCrescentIcon from '../assets/moon_phases/waxing_crescent.png';
import FirstQuarterIcon from '../assets/moon_phases/first_quarter.png';
import WaxingGibbousIcon from '../assets/moon_phases/waxing_gibbous.png';
import FullMoonIcon from '../assets/moon_phases/full_moon.png';
import WaningGibbousIcon from '../assets/moon_phases/waning_gibbous.png';
import LastQuarterIcon from '../assets/moon_phases/last_quarter.png';
import WaningCrescentIcon from '../assets/moon_phases/waning_crescent.png';

const moonPhaseIcons = {
    new_moon: NewMoonIcon, waxing_crescent: WaxingCrescentIcon, first_quarter: FirstQuarterIcon, waxing_gibbous: WaxingGibbousIcon, full_moon: FullMoonIcon, waning_gibbous: WaningGibbousIcon, last_quarter: LastQuarterIcon, waning_crescent: WaningCrescentIcon,
};


// --- Компоненты ---

const Tooltip = ({ text }) => ( <div className={styles.tooltip}>{text}</div> );

const HelpIcon = ({ tooltipText }) => {
    const [isTooltipVisible, setTooltipVisible] = useState(false);
    return (
        <div 
            className={styles.helpIconContainer}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
        >
            <QuestionMarkIcon />
            {isTooltipVisible && <Tooltip text={tooltipText} />}
        </div>
    );
};


const InsightPoint = () => {
    const pointStyle = {
        backgroundColor: 'var(--lens-accent-color)',
        boxShadow: `0 0 8px 1px var(--lens-accent-color)`,
    };
    return <div className={styles.insightPoint} style={pointStyle}></div>;
};

const AstrologyLens = ({ data, dreamId, onStateChange }) => {
    if (!data || (!data.celestialMap && !data.topTransits && !data.error)) {
        return <div className={styles.astrologyLens}><p>Астрологические данные не доступны.</p></div>;
    }
    if (data.error) {
        return <div className={styles.astrologyLens}><p>{data.error}</p></div>;
    }

    const { title, celestialMap, analysis, topTransits, explanation, cosmicPassport } = data;

    const handleStateUpdate = async (newState) => {
        if (!dreamId) return;
        try {
            const response = await api.put(`/dreams/${dreamId}/lenses/astrology`, {
                viewedInsights: Array.from(newState.viewedInsights),
                isSummaryUnlocked: newState.isSummaryUnlocked,
                currentIndex: newState.currentIndex,
            });
            onStateChange(response.data);
        } catch (error) {
            console.error('Failed to save astrology lens state:', error);
        }
    };



    return (
        <div className={styles.astrologyLens}>
            
            
            {/* Блок 1: Атмосфера Сна */}
            {celestialMap && (
                <div className={styles.atmosphereBlock}>
                                         <h3 className={styles.blockTitle}>Энергия сна</h3>
                    <div className={styles.insightRow}>
                        <img src={moonPhaseIcons[celestialMap.moonPhase.phase]} alt={celestialMap.moonPhase.name} className={styles.iconImage} />
                        <div className={styles.textBlock}>
                            <h4 className={styles.subTitle}>
                                <span className={styles.subTitleLabel}>Фаза Луны: </span>
                                <span className={styles.subTitleValue}>{celestialMap.moonPhase.name}</span>
                            </h4>
                            <div className={styles.markdown}>
                                <ReactMarkdown>{celestialMap.moonPhase.text}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                    <div className={styles.insightRow}>
                        <div className={styles.iconEmoji}>{celestialMap.moonSign.emoji}</div>
                        <div className={styles.textBlock}>
                            <h4 className={styles.subTitle}>
                                <span className={styles.subTitleLabel}>Знак Луны: </span>
                                <span className={styles.subTitleValue}>{celestialMap.moonSign.name}</span>
                            </h4>
                            <div className={styles.markdown}>
                                <ReactMarkdown>{celestialMap.moonSign.text}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                    {cosmicPassport && !cosmicPassport.error && (
                        <div className={styles.passportSection}>
                            <h3 className={styles.blockTitle}>Ваш Космический Паспорт</h3>
                            <div className={styles.passportGrid}>
                                <div className={styles.insightRow}>
                                    <div className={styles.iconEmoji}>
                                        <span className={styles.celestialIcon}>☀️</span>
                                        {cosmicPassport.sun.signEmoji && <span className={styles.zodiacIcon}>{cosmicPassport.sun.signEmoji}</span>}
                                    </div>
                                    <div className={styles.textBlock}>
                                        <h4 className={styles.subTitle}>
                                            <span className={styles.subTitleLabel}>{cosmicPassport.sun.title}: </span>
                                        </h4>
                                        <span className={styles.passportTagline}>{cosmicPassport.sun.tagline}</span>
                                    </div>
                                </div>
                                <div className={styles.insightRow}>
                                     <div className={styles.iconEmoji}>
                                        <span className={styles.celestialIcon}>🌙</span>
                                        {cosmicPassport.moon.signEmoji && <span className={styles.zodiacIcon}>{cosmicPassport.moon.signEmoji}</span>}
                                    </div>
                                    <div className={styles.textBlock}>
                                        <h4 className={styles.subTitle}>
                                            <span className={styles.subTitleLabel}>{cosmicPassport.moon.title}: </span>
                                        </h4>
                                        <span className={styles.passportTagline}>{cosmicPassport.moon.tagline}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                     {analysis && (
                        <div className={styles.analysisSection}>
                             <h3 className={styles.blockTitle}>Анализ через призму энергии сна</h3>
                             {analysis.sections.map((section, index) => (
                                <div key={index} className={styles.insightBlock}>
                                    <h4 className={styles.insightTitle}>{section.title}</h4>
                                    <div className={styles.markdown}>
                                        <ReactMarkdown>{section.content}</ReactMarkdown>
                                    </div>
                                </div>
                             ))}
                        </div>
                     )}
                </div>
            )}

            {/* Блок 2: Ключевые Планетарные Влияния - ИНТЕРАКТИВНАЯ ВЕРСИЯ */}
            <PlanetaryInfluence
                data={data}
                topTransits={topTransits}
                explanation={explanation}
                onStateUpdate={handleStateUpdate}
            />
        </div>
    );
};

// Моковые данные для текстового содержания
const mockPlanetaryData = {
    insights: [
        {
            title: "Грань 1: Эмоциональное Напряжение",
            p1: "moon",
            p2: "saturn",
            aspect: "square",
            tagline: "Луна в квадрате к Сатурну",
            power: 8,
            interpretation: "Ваш сон окрашен влиянием квадратуры Луны к Сатурну. Это создает внутреннее напряжение между потребностью в безопасности и стремлением к долгу. Возможно, вы чувствуете, что эмоции мешают вам выполнять обязанности.",
            lesson: "Урок этого аспекта — найти баланс между заботой о себе и ответственностью. Не подавляйте чувства, а признайте их и дайте им конструктивный выход.",
            recommendation: "Попробуйте вести дневник эмоций. Записывая свои переживания, вы сможете лучше понять их природу и снизить внутреннее давление."
        },
        {
            title: "Грань 2: Прозрение и Трансформация",
            p1: "sun",
            p2: "pluto",
            aspect: "trine",
            tagline: "Солнце в трине к Плутону",
            power: 9,
            interpretation: "Трин Солнца к Плутону указывает на мощный потенциал для глубоких прозрений. Ваш сон может быть ключом к пониманию скрытых аспектов вашей личности и неиспользованных ресурсов.",
            lesson: "Возможность для глубокой личностной трансформации. Сейчас вы способны увидеть правду, которая раньше была скрыта, и использовать ее для роста.",
            recommendation: "Медитируйте с вопросом: 'Что я готов(а) отпустить, чтобы стать сильнее?' Ответ, пришедший во сне или в мыслях, будет вашим ориентиром."
        },
        {
            title: "Грань 3: Социальная Гармония",
            p1: "venus",
            p2: "jupiter",
            aspect: "sextile",
            tagline: "Венера в секстиле к Юпитеру",
            power: 7,
            interpretation: "Секстиль Венеры к Юпитеру наполняет сон ощущением легкости и оптимизма в социальных взаимодействиях. Это знак того, что ваши отношения с окружающими могут стать источником радости и поддержки.",
            lesson: "Научитесь принимать дары от Вселенной и людей с благодарностью. Ваша открытость и дружелюбие притягивают удачу.",
            recommendation: "Не бойтесь принимать приглашения и заводить новые знакомства. Даже случайный разговор может принести неожиданную пользу."
        }
    ],
    summary: {
        title: "Общий Совет Астропсихолога",
        content: "Сложив все грани воедино, ваш сон говорит о периоде важного выбора. С одной стороны, вы ощущаете груз ответственности (Луна-Сатурн), но с другой — у вас есть огромный внутренний ресурс для трансформации (Солнце-Плутон) и поддержка со стороны окружения (Венера-Юпитер). **Ключ к успеху** — не игнорировать свои эмоции, а использовать их как топливо для роста. Приняв свои чувства, вы сможете с легкостью пройти через любые трудности и обрести гармонию."
    }
};


const CrystalIcon = ({ isFilled }) => (
    <svg width="40" height="60" viewBox="0 0 50 70" className={`${styles.crystalIcon} ${isFilled ? styles.filled : ''}`}>
        <defs>
            <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--lens-accent-color)', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: 'var(--lens-accent-color)', stopOpacity: 0.2 }} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <path 
            d="M25 0 L5 20 L5 50 L25 70 L45 50 L45 20 Z" 
            className={styles.crystalPath}
            strokeWidth="2" 
            stroke="rgba(255,255,255,0.7)"
            fill={isFilled ? "url(#crystalGradient)" : "rgba(255,255,255,0.05)"}
            style={{ filter: isFilled ? 'url(#glow)' : 'none' }}
        />
        <path d="M5 20 L25 25 L45 20 M25 25 L25 70" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
    </svg>
);


const SynthesizingAnimation = () => (
    <div className={styles.synthesizingContainer}>
        <div className={styles.synthesizingText}>
            <p>Совет от астропсихолога синтезируется</p>
            <div className={styles.dots}>
                <span>.</span><span>.</span><span>.</span>
            </div>
        </div>
    </div>
);

const PlanetaryInfluence = ({ data, topTransits, explanation, onStateUpdate }) => {
    
    const { state } = data;
    const [viewedInsights, setViewedInsights] = useState(new Set(state?.viewedInsights || [0]));
    const [isSummaryUnlocked, setIsSummaryUnlocked] = useState(state?.isSummaryUnlocked || false);
    const [animationState, setAnimationState] = useState(state?.isSummaryUnlocked ? 'unlocked' : 'idle'); 
    
    const insights = topTransits?.insights && topTransits.insights.length > 0
        ? topTransits.insights
        : mockPlanetaryData.insights;
        
    const swiperRef = useRef(null);

    useLayoutEffect(() => {
        if (swiperRef.current && insights.length > 0) {
            const swiper = swiperRef.current;
            const slides = swiper.slides;
            if (!slides || slides.length === 0) return;
            let maxHeight = 0;
            slides.forEach(slide => {
                const card = slide.querySelector(`.${styles.transitCard}`);
                if (card) {
                    card.style.height = 'auto';
                    if (card.scrollHeight > maxHeight) {
                        maxHeight = card.scrollHeight;
                    }
                }
            });
            if (maxHeight > 0) {
                slides.forEach(slide => {
                    const card = slide.querySelector(`.${styles.transitCard}`);
                    if (card) {
                        card.style.height = `${maxHeight}px`;
                    }
                });
            }
        }
    }, [insights]);

    useEffect(() => {
        if (viewedInsights.size === insights.length + 1 && animationState === 'idle') {
            setAnimationState('flashing');
        }
    }, [viewedInsights, insights.length, animationState]);
    
    useEffect(() => {
        let timer;
        if (animationState === 'flashing') {
            timer = setTimeout(() => setAnimationState('fading'), 500);
        } else if (animationState === 'fading') {
            timer = setTimeout(() => {
                setAnimationState('synthesizing');
                const newSummaryUnlocked = true;
                setIsSummaryUnlocked(newSummaryUnlocked);
                onStateUpdate({ viewedInsights, isSummaryUnlocked: newSummaryUnlocked });
            }, 500);
        } else if (animationState === 'synthesizing') {
            // Wait for synthesis, then transition to a state where the user can reveal the summary
            timer = setTimeout(() => setAnimationState('readyToUnlock'), 3000);
        }
        return () => clearTimeout(timer);
    }, [animationState, onStateUpdate, viewedInsights]);

    const handleSlideChange = (swiper) => {
        const newViewedInsights = new Set(viewedInsights).add(swiper.activeIndex);
        setViewedInsights(newViewedInsights);
        onStateUpdate({ viewedInsights: newViewedInsights, isSummaryUnlocked, currentIndex: swiper.activeIndex });
    };

    const showCrystals = animationState !== 'synthesizing' && animationState !== 'unlocked' && animationState !== 'readyToUnlock';
    const showFlash = animationState === 'flashing';
    const isFading = animationState === 'fading';
    const isSynthesizing = animationState === 'synthesizing';
    const isReadyToUnlock = animationState === 'readyToUnlock';
    const isUnlocked = animationState === 'unlocked';
    
    return (
        <div className={`${styles.block} ${styles.topTransitsBlock}`}>
            <div className={styles.titleWithTooltip}>
                <h3 className={styles.blockTitle}>Ключевые Планетарные Влияния</h3>
                <HelpIcon tooltipText={explanation || "Проведите по картам, чтобы узнать больше."} />
            </div>

            <div className={styles.swiperContainer}>
            <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                coverflowEffect={{
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: true,
                }}
                modules={[EffectCoverflow]}
                onSwiper={(swiper) => { 
                    swiperRef.current = swiper; 
                    const savedIndex = typeof state?.currentIndex === 'number' ? state.currentIndex : 0;
                    try { swiper.slideTo(savedIndex, 0); } catch (_) {}
                }}
                onSlideChange={handleSlideChange}
                className={styles.mySwiper}
            >
                <SwiperSlide className={styles.swiperSlide}>
                    <div className={`${styles.transitCard} ${styles.placeholderBlock}`}>
                         <div className={styles.placeholderContent}>
                            <p className={styles.placeholderText}>Космос оставил вам послание...</p>
                            <p className={styles.placeholderSubtext}>Свайпните влево, чтобы открыть</p>
                        </div>
                    </div>
                </SwiperSlide>

                {insights.map((transit, index) => (
                    <SwiperSlide key={index} className={styles.swiperSlide}>
                            <div className={styles.transitCard}>
                                <div className={styles.transitIcons}>
                                    <span className={styles.planetIcon}>{planetIcons[transit.p1]}</span>
                                    <span className={styles.aspectIcon}>{aspectIcons[transit.aspect]}</span>
                                    <span className={styles.planetIcon}>{planetIcons[transit.p2]}</span>
                                </div>
                                <p className={styles.transitTagline}>{transit.tagline}</p>
                                <div className={styles.powerPill}>
                                    Сила влияния: {transit.power}
                                </div>
                                <div className={styles.cardBody}>
                                    <h4 className={styles.insightTitle}>{transit.title}</h4>
                                    <div className={styles.markdown}>
                                        <ReactMarkdown>{transit.interpretation}</ReactMarkdown>
                                    </div>
                                    <h4 className={`${styles.insightTitle} ${styles.lessonTitle}`}>Урок и Возможность</h4>
                                    <div className={styles.markdown}>
                                        <ReactMarkdown>{transit.lesson}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                    </SwiperSlide>
                ))}
            </Swiper>
            </div>

            <div className={styles.animationContainer}>
                {showCrystals && (
                    <div className={`${styles.crystalsContainer} ${showFlash ? styles.flash : ''} ${isFading ? styles.fadeOut : ''}`}>
                        {insights.map((_, index) => (
                            <CrystalIcon key={index} isFilled={viewedInsights.has(index + 1)} />
                        ))}
                    </div>
                )}
                {isSynthesizing && <SynthesizingAnimation />}
                
                {isReadyToUnlock && (
                    <div className={styles.revealButtonContainer}>
                        <button 
                            className={styles.revealButton} 
                            onClick={() => setAnimationState('unlocked')}
                        >
                            Прочитать совет
                        </button>
                    </div>
                )}

                <div className={`${styles.unlockedContainer} ${isUnlocked ? styles.unlocked : ''}`}>
                    <div className={styles.unlockedContent}>
                        <div className={styles.summaryBlock}>
                            <h3 className={styles.blockTitle}>Общий Совет Астропсихолога</h3>
                            <div className={styles.markdown}>
                                <ReactMarkdown>{data.summary || mockPlanetaryData.summary.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AstrologyLens;
