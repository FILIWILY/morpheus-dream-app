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
    "Дурак": CardFool, "Маг": CardMagician, "Верховная Жрица": CardPriestess, "Императрица": CardEmpress, "Император": CardEmperor, "Иерофант": CardHierophant, "Влюбленные": CardLovers, "Колесница": CardChariot, "Сила": CardStrength, "Отшельник": CardHermit, "Колесо Фортуны": CardFortune, "Справедливость": CardJustice, "Повешенный": CardHanged, "Смерть": CardDeath, "Умеренность": CardTemperance, "Дьявол": CardDevil, "Башня": CardTower, "Звезда": CardStar, "Луна": CardMoon, "Солнце": CardSun, "Суд": CardJudgement, "Мир": CardWorld,
    "The Fool": CardFool, "The Magician": CardMagician, "The High Priestess": CardPriestess, "The Empress": CardEmpress, "The Emperor": CardEmperor, "The Hierophant": CardHierophant, "The Lovers": CardLovers, "The Chariot": CardChariot, "Strength": CardStrength, "The Hermit": CardHermit, "Wheel of Fortune": CardFortune, "Justice": CardJustice, "The Hanged Man": CardHanged, "Death": CardDeath, "Temperance": CardTemperance, "The Devil": CardDevil, "The Tower": CardTower, "The Star": CardStar, "The Moon": CardMoon, "The Sun": CardSun, "Judgement": CardJudgement, "The World": CardWorld
};

let preloaded = false;

export const preloadTarotImages = () => {
    if (preloaded) {
        return;
    }

    Object.values(cardImageMap).forEach(imageSrc => {
        const img = new Image();
        img.src = imageSrc;
    });

    preloaded = true;
};
