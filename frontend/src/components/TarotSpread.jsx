import React, { useState, useEffect, useMemo } from 'react';
import styles from './TarotSpread.module.css';
import { Box, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Import card images with correct paths and filenames
import CardFool from '../assets/tarot/major_arcana_fool.webp';
import CardMagician from '../assets/tarot/major_arcana_magician.webp';
import CardPriestess from '../assets/tarot/major_arcana_priestess.webp';
import CardEmpress from '../assets/tarot/major_arcana_empress.webp';
import CardEmperor from '../assets/tarot/major_arcana_emperor.webp';
import CardHierophant from '../assets/tarot/major_arcana_hierophant.webp';
import CardLovers from '../assets/tarot/major_arcana_lovers.webp';
import CardChariot from '../assets/tarot/major_arcana_chariot.webp';
import CardStrength from '../assets/tarot/major_arcana_strength.webp';
import CardHermit from '../assets/tarot/major_arcana_hermit.webp';
import CardFortune from '../assets/tarot/major_arcana_fortune.webp';
import CardJustice from '../assets/tarot/major_arcana_justice.webp';
import CardHanged from '../assets/tarot/major_arcana_hanged.webp';
import CardDeath from '../assets/tarot/major_arcana_death.webp';
import CardTemperance from '../assets/tarot/major_arcana_temperance.webp';
import CardDevil from '../assets/tarot/major_arcana_devil.webp';
import CardTower from '../assets/tarot/major_arcana_tower.webp';
import CardStar from '../assets/tarot/major_arcana_star.webp';
import CardMoon from '../assets/tarot/major_arcana_moon.webp';
import CardSun from '../assets/tarot/major_arcana_sun.webp';
import CardJudgement from '../assets/tarot/major_arcana_judgement.webp';
import CardWorld from '../assets/tarot/major_arcana_world.webp';

const cardImageMap = {
    // Russian Names
    "Дурак": CardFool, "Маг": CardMagician, "Верховная Жрица": CardPriestess, "Императрица": CardEmpress, "Император": CardEmperor, "Иерофант": CardHierophant, "Влюбленные": CardLovers, "Колесница": CardChariot, "Сила": CardStrength, "Отшельник": CardHermit, "Колесо Фортуны": CardFortune, "Справедливость": CardJustice, "Повешенный": CardHanged, "Смерть": CardDeath, "Умеренность": CardTemperance, "Дьявол": CardDevil, "Башня": CardTower, "Звезда": CardStar, "Луна": CardMoon, "Солнце": CardSun, "Суд": CardJudgement, "Мир": CardWorld,
    // English Names
    "The Fool": CardFool, "The Magician": CardMagician, "The High Priestess": CardPriestess, "The Empress": CardEmpress, "The Emperor": CardEmperor, "The Hierophant": CardHierophant, "The Lovers": CardLovers, "The Chariot": CardChariot, "Strength": CardStrength, "The Hermit": CardHermit, "Wheel of Fortune": CardFortune, "Justice": CardJustice, "The Hanged Man": CardHanged, "Death": CardDeath, "Temperance": CardTemperance, "The Devil": CardDevil, "The Tower": CardTower, "The Star": CardStar, "The Moon": CardMoon, "The Sun": CardSun, "Judgement": CardJudgement, "The World": CardWorld
};

const TarotSpread = ({ spread, summary, accentColor, isRevealed, onReveal }) => {
    const [currentIndex, setCurrentIndex] = useState(-1); // -1: initial, 0-4: cards, 5: summary
    const [isAnimating, setIsAnimating] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false); // Prevent navigation spam
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    // Combine spread and summary into a single array for easier indexing
    const sliderItems = useMemo(() => [
        ...spread, 
        { position: 'Общий Смысл', cardName: null, interpretation: summary }
    ], [spread, summary]);
    
    useEffect(() => {
        if (isRevealed && currentIndex === -1) {
            setCurrentIndex(0);
        }
        if (!isRevealed) {
            setCurrentIndex(-1);
        }
    }, [isRevealed, currentIndex]);

    const changeSlide = (newIndex) => {
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex(newIndex);
            setIsAnimating(false);
        }, 300); // Animation duration
    };

    const navigateToSlide = (newIndex) => {
        if (isNavigating || isAnimating) return;

        const nextItem = sliderItems[newIndex];
        if (nextItem && nextItem.cardName) {
            setIsNavigating(true);
            const imageUrl = cardImageMap[nextItem.cardName];
            const img = new Image();
            img.src = imageUrl;

            const onImageReady = () => {
                changeSlide(newIndex);
                setIsNavigating(false);
            };

            img.onload = onImageReady;
            img.onerror = onImageReady; // Also navigate on error to not block user
        } else {
            // For non-image slides like the summary, navigate directly
            changeSlide(newIndex);
        }
    };

    const handleNext = () => {
        if (currentIndex < sliderItems.length - 1) {
            navigateToSlide(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            navigateToSlide(currentIndex - 1);
        }
    };

    const handleTouchStart = (e) => {
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        // Swipe left
        if (touchStartX - touchEndX > 75) {
            handleNext();
        }

        // Swipe right
        if (touchStartX - touchEndX < -75) {
            handlePrev();
        }
    };

    if (!spread || spread.length === 0) {
        return null;
    }

    if (currentIndex === -1) {
        return (
             <Box className={styles.initialState}>
                 <Typography variant="h6" className={styles.initialTagline}>5 карт</Typography>
                 <Button variant="contained" onClick={onReveal} sx={{ backgroundColor: accentColor, '&:hover': { backgroundColor: accentColor }}}>
                     Сделать расклад
                 </Button>
             </Box>
        );
    }

    const currentItem = sliderItems[currentIndex];

    return (
        <Box 
            className={styles.spreadContainer}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Tap Zones */}
            {currentIndex > 0 && <div className={styles.tapZoneLeft} onClick={handlePrev} />}
            {currentIndex < sliderItems.length - 1 && <div className={styles.tapZoneRight} onClick={handleNext} />}

            <Box className={styles.titleContainer}>
                {currentIndex > 0 && (
                     <IconButton onClick={handlePrev} className={styles.navArrow} style={{ color: accentColor }}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                )}
                <Typography variant="h6" className={styles.positionTitle} style={{ color: accentColor }}>
                    {currentItem.position}
                </Typography>
                {currentIndex < sliderItems.length - 1 && (
                    <IconButton onClick={handleNext} className={`${styles.navArrow} ${styles.nextArrow}`} style={{ color: accentColor }}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                )}
            </Box>

            <Box className={`${styles.cardContent} ${isAnimating ? styles.fading : ''}`}>
                
                {/* Mini-spread for the summary slide */}
                {currentIndex === sliderItems.length - 1 && (
                    <Box className={styles.miniSpreadContainer}>
                        {spread.map((card, cardIndex) => (
                            <Box key={cardIndex} className={styles.miniCard}>
                                <img src={cardImageMap[card.cardName]} alt={card.cardName} className={styles.miniCardImage} />
                                <Typography variant="caption" className={styles.miniCardName}>
                                    {card.cardName}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {currentItem.cardName && (
                    <Box className={styles.card}>
                        <img 
                            src={cardImageMap[currentItem.cardName]} 
                            alt={currentItem.cardName} 
                            className={styles.cardImage}
                        />
                    </Box>
                )}
                
                <Box className={styles.textContent}>
                    {currentItem.cardName && (
                         <Typography variant="subtitle1" className={styles.cardName}>{currentItem.cardName}</Typography>
                    )}
                    <Typography variant="body2" className={styles.interpretationText}>
                        {currentItem.interpretation}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default TarotSpread;
