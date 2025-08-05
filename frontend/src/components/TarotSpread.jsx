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
    "Шут": CardFool,
    "Маг": CardMagician,
    "Верховная Жрица": CardPriestess,
    "Императрица": CardEmpress,
    "Император": CardEmperor,
    "Иерофант": CardHierophant,
    "Влюбленные": CardLovers,
    "Колесница": CardChariot,
    "Сила": CardStrength,
    "Отшельник": CardHermit,
    "Колесо Фортуны": CardFortune,
    "Справедливость": CardJustice,
    "Повешенный": CardHanged,
    "Смерть": CardDeath,
    "Умеренность": CardTemperance,
    "Дьявол": CardDevil,
    "Башня": CardTower,
    "Звезда": CardStar,
    "Луна": CardMoon,
    "Солнце": CardSun,
    "Суд": CardJudgement,
    "Мир": CardWorld,
};


const TarotSpread = ({ spread, summary, accentColor, isRevealed, onReveal }) => {
    const [visibleCards, setVisibleCards] = useState([]);

    useEffect(() => {
        if (isRevealed) {
            // Instantly show all cards if already revealed, or animate one by one
            if (visibleCards.length === 0) {
                const timeouts = spread.map((_, index) => 
                    setTimeout(() => {
                        setVisibleCards(prev => [...prev, index]);
                    }, index * 400)
                );
                return () => timeouts.forEach(clearTimeout);
            }
        }
    }, [isRevealed, spread]);

    if (!spread || spread.length === 0) {
        return <Typography>Данные для расклада Таро отсутствуют.</Typography>;
    }

    if (!isRevealed) {
        return (
            <Box className={styles.initialState}>
                <Typography variant="h5" className={styles.initialTitle}>Готовы вытянуть карты?</Typography>
                <Button variant="contained" onClick={onReveal} sx={{ backgroundColor: accentColor, '&:hover': { backgroundColor: accentColor }}}>
                    Вытянуть 5 карт
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
