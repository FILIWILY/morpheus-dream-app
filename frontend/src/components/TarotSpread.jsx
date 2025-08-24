import React, { useState, useEffect } from 'react';
import styles from './TarotSpread.module.css';
import { Box, Typography, Button } from '@mui/material';

// Import card images with correct paths and filenames
import CardFool from '../assets/tarot/major_arcana_fool.png';
import CardMagician from '../assets/tarot/major_arcana_magician.png';
import CardPriestess from '../assets/tarot/major_arcana_priestess.png';
import CardEmpress from '../assets/tarot/major_arcana_empress.png';
import CardEmperor from '../assets/tarot/major_arcana_emperor.png';
import CardHierophant from '../assets/tarot/major_arcana_hierophant.png';
import CardLovers from '../assets/tarot/major_arcana_lovers.png';
import CardChariot from '../assets/tarot/major_arcana_chariot.png';
import CardStrength from '../assets/tarot/major_arcana_strength.png';
import CardHermit from '../assets/tarot/major_arcana_hermit.png';
import CardFortune from '../assets/tarot/major_arcana_fortune.png';
import CardJustice from '../assets/tarot/major_arcana_justice.png';
import CardHanged from '../assets/tarot/major_arcana_hanged.png';
import CardDeath from '../assets/tarot/major_arcana_death.png';
import CardTemperance from '../assets/tarot/major_arcana_temperance.png';
import CardDevil from '../assets/tarot/major_arcana_devil.png';
import CardTower from '../assets/tarot/major_arcana_tower.png';
import CardStar from '../assets/tarot/major_arcana_star.png';
import CardMoon from '../assets/tarot/major_arcana_moon.png';
import CardSun from '../assets/tarot/major_arcana_sun.png';
import CardJudgement from '../assets/tarot/major_arcana_judgement.png';
import CardWorld from '../assets/tarot/major_arcana_world.png';

const cardImageMap = {
    // Russian Names
    "Дурак": CardFool, "Маг": CardMagician, "Верховная Жрица": CardPriestess, "Императрица": CardEmpress, "Император": CardEmperor, "Иерофант": CardHierophant, "Влюбленные": CardLovers, "Колесница": CardChariot, "Сила": CardStrength, "Отшельник": CardHermit, "Колесо Фортуны": CardFortune, "Справедливость": CardJustice, "Повешенный": CardHanged, "Смерть": CardDeath, "Умеренность": CardTemperance, "Дьявол": CardDevil, "Башня": CardTower, "Звезда": CardStar, "Луна": CardMoon, "Солнце": CardSun, "Суд": CardJudgement, "Мир": CardWorld,
    // English Names
    "The Fool": CardFool, "The Magician": CardMagician, "The High Priestess": CardPriestess, "The Empress": CardEmpress, "The Emperor": CardEmperor, "The Hierophant": CardHierophant, "The Lovers": CardLovers, "The Chariot": CardChariot, "Strength": CardStrength, "The Hermit": CardHermit, "Wheel of Fortune": CardFortune, "Justice": CardJustice, "The Hanged Man": CardHanged, "Death": CardDeath, "Temperance": CardTemperance, "The Devil": CardDevil, "The Tower": CardTower, "The Star": CardStar, "The Moon": CardMoon, "The Sun": CardSun, "Judgement": CardJudgement, "The World": CardWorld
};

const TarotSpread = ({ spread, summary, accentColor, isRevealed, onReveal }) => {
    const [visibleCards, setVisibleCards] = useState([]);

    useEffect(() => {
        if (!spread || !isRevealed) {
            setVisibleCards([]);
            return;
        }
        const timers = spread.map((_, index) => 
            setTimeout(() => {
                setVisibleCards(prev => [...prev, index]);
            }, index * 300)
        );

        return () => timers.forEach(clearTimeout);
    }, [isRevealed, spread]);

    // This initial state is now simplified: if there's no spread, nothing is shown.
    // The parent component (InterpretationPage) will handle the loading state.
    if (!spread || spread.length === 0) {
        return null; // Or a loading spinner, handled by parent
    }
    
    // The "Draw cards" button is now simplified to "Reveal cards"
    // as the drawing happens on the backend.
    if (!isRevealed) {
        return (
             <Box className={styles.initialState}>
                 <Typography variant="h5" className={styles.initialTitle}>Ваши карты готовы</Typography>
                 <Button variant="contained" onClick={onReveal} sx={{ backgroundColor: accentColor, '&:hover': { backgroundColor: accentColor }}}>
                     Открыть карты
                 </Button>
             </Box>
        );
    }

    return (
        <Box className={styles.spreadContainer}>
            <Box className={styles.cardsGrid}>
                {spread.map((item, index) => (
                    <Box key={index} className={`${styles.cardContainer} ${visibleCards.includes(index) ? styles.visible : ''}`}>
                        <Typography variant="h6" className={styles.positionTitle} style={{ color: accentColor }}>
                            {item.position}
                        </Typography>
                        <Box className={styles.card}>
                            <img src={cardImageMap[item.cardName] || CardFool} alt={item.cardName} className={styles.cardImage} />
                            <Typography variant="subtitle1" className={styles.cardName}>{item.cardName}</Typography>
                        </Box>
                        <Typography variant="body2" className={styles.interpretationText}>
                            {item.interpretation}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {visibleCards.length === spread.length && (
                 <Box className={styles.summaryContainer}>
                    <Typography variant="h5" className={styles.summaryTitle}>Общий смысл</Typography>
                    <Typography variant="body1" className={styles.summaryText}>
                        {summary}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default TarotSpread;
