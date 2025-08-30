import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Настройка путей для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем .env из корня проекта (../../.env относительно src/server.js)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Отладочный вывод переменных окружения
console.log('[ENV] DATABASE_TYPE:', process.env.DATABASE_TYPE);
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV] DANGEROUSLY_BYPASS_AUTH:', process.env.DANGEROUSLY_BYPASS_AUTH);

// Импорты после загрузки .env
import axios from 'axios';
import { getDreamInterpretation } from './services/ai_provider.js';
import { getDreamAtmosphere, calculateTopTransits, getCosmicPassport } from './services/astrology.js';
import { calculateNatalChart } from './services/natalChart.js';
import { verifyTelegramAuth } from './middleware/auth.js';

// Динамический импорт database.js после загрузки переменных окружения
const db = await import('./services/database.js');

// Инициализируем базу данных
await db.initializeDatabase();

const app = express();
const PORT = process.env.PORT || 9000;

// --- Константы для Таро ---
const MAJOR_ARCANA = [
    "Дурак", "Маг", "Верховная Жрица", "Императрица", "Император", "Иерофант",
    "Влюбленные", "Колесница", "Сила", "Отшельник", "Колесо Фортуны", "Справедливость",
    "Повешенный", "Смерть", "Умеренность", "Дьявол", "Башня", "Звезда",
    "Луна", "Солнце", "Суд", "Мир"
];

const TAROT_POSITIONS = [
    "Причина Сна", "Тема Сна", "Препятствие/Блок", "Послание/Совет", "Урок/Потенциал"
];

app.use(cors());
app.use(express.json());

// --- Вспомогательные функции ---

// --- Вспомогательные функции для Таро ---
const shuffleAndPick = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const generateTarotSpread = () => {
    const selectedCards = shuffleAndPick(MAJOR_ARCANA, 5);
    return TAROT_POSITIONS.map((position, index) => ({
        position: position,
        cardName: selectedCards[index]
    }));
};

// --- Маршруты API ---
// All routes will now be protected by the new authentication middleware.
app.use(verifyTelegramAuth);

// Получение профиля
app.get('/profile', async (req, res) => {
    try {
        const userProfile = await db.getProfile(req.userId);
        if (userProfile) {
            res.status(200).json(userProfile);
        } else {
            res.status(404).json({ error: 'Profile not found or empty' });
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Функция для преобразования даты из DD.MM.YYYY в YYYY-MM-DD
const convertDateFormat = (dateString) => {
    if (!dateString) return null;
    
    // Если дата уже в формате YYYY-MM-DD, возвращаем как есть
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return dateString.split('T')[0]; // Убираем время если есть
    }
    
    // Преобразуем из DD.MM.YYYY в YYYY-MM-DD
    const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    console.warn(`[SERVER] Invalid date format received: ${dateString}`);
    return null;
};

// Обновление профиля
app.put('/profile', async (req, res) => {
    const { birthDate, birthTime, birthPlace } = req.body;
    let userProfile = (await db.getProfile(req.userId)) || {};

    // Преобразуем и обновляем дату
    const convertedBirthDate = convertDateFormat(birthDate);
    if (birthDate && !convertedBirthDate) {
        return res.status(400).json({ error: 'Invalid birth date format. Expected DD.MM.YYYY or YYYY-MM-DD' });
    }
    
    userProfile.birthDate = convertedBirthDate;
    userProfile.birthTime = birthTime;
    
    console.log(`[SERVER] Date conversion: "${birthDate}" -> "${convertedBirthDate}"`);

    // Если передан placeId, получаем координаты
    if (birthPlace && birthPlace.placeId) {
        try {
            const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    place_id: birthPlace.placeId,
                    key: apiKey,
                    language: 'ru' // Можно сделать динамическим в будущем
                }
            });

            const { data } = response;
            if (data.status === 'OK' && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                userProfile.birthPlace = data.results[0].formatted_address;
                userProfile.birthLatitude = location.lat;
                userProfile.birthLongitude = location.lng;
                console.log(`Геокодирование успешно: ${userProfile.birthPlace} [${location.lat}, ${location.lng}]`);
            } else {
                console.error(`Ошибка геокодирования: ${data.status}`, data.error_message || '');
                // Если геокодирование не удалось, сохраняем только текстовое описание
                userProfile.birthPlace = birthPlace.description;
                delete userProfile.birthLatitude;
                delete userProfile.birthLongitude;
            }
        } catch (error) {
            console.error('Error fetching geocoding data:', error);
            // В случае ошибки сохраняем текстовое описание
            userProfile.birthPlace = birthPlace.description;
            delete userProfile.birthLatitude;
            delete userProfile.birthLongitude;
        }
    } else {
        // Сохраняем как есть (для обратной совместимости)
        userProfile.birthPlace = birthPlace;
        delete userProfile.birthLatitude;
        delete userProfile.birthLongitude;
    }

    // Расчет и сохранение натальной карты ТОЛЬКО при наличии координат
    if (userProfile.birthLatitude && userProfile.birthLongitude) {
        console.log('Attempting to calculate natal chart with coordinates...');
        const natalChart = await calculateNatalChart(
            userProfile.birthDate,
            userProfile.birthTime,
            userProfile.birthLatitude,
            userProfile.birthLongitude
        );

        if (natalChart) {
            userProfile.natalChart = natalChart;
            console.log('Natal chart calculated successfully.');
        } else {
            delete userProfile.natalChart; // Удаляем, если расчет не удался
            console.log('Natal chart calculation failed, removing from profile.');
        }
    } else {
        // Если координат нет, убеждаемся, что натальная карта удалена
        delete userProfile.natalChart;
        console.log('No coordinates, skipping natal chart calculation.');
    }

    try {
        const updatedProfile = await db.updateProfile(req.userId, userProfile);
        res.status(200).json(updatedProfile);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Получение истории снов
app.get('/dreams', async (req, res) => {
    try {
        const dreams = await db.getDreams(req.userId);
        res.status(200).json(dreams.slice().reverse()); // Maintain original reverse logic for now
    } catch (error) {
        console.error('Error fetching dreams:', error);
        res.status(500).json({ error: 'Failed to fetch dreams' });
    }
});

// Получение одного сна по id
app.get('/dreams/:dreamId', async (req, res) => {
  const { dreamId } = req.params;
  try {
      const dream = await db.getDreamById(req.userId, dreamId);
      if (!dream) {
        return res.status(404).json({ error: 'Dream not found' });
      }
      res.status(200).json(dream);
  } catch (error) {
      console.error(`Error fetching dream ${dreamId}:`, error);
      res.status(500).json({ error: 'Failed to fetch dream' });
  }
});

// Удаление снов
app.delete('/dreams', async (req, res) => {
  const { dreamIds } = req.body;
  if (!dreamIds || !Array.isArray(dreamIds)) {
    return res.status(400).json({ error: 'dreamIds must be an array' });
  }
  try {
      await db.deleteDreams(req.userId, dreamIds);
      res.status(200).json({ message: 'Dreams deleted successfully' });
  } catch (error) {
      console.error('Error deleting dreams:', error);
      res.status(500).json({ error: 'Failed to delete dreams' });
  }
});

// Обработка текстового сна
app.post('/processDreamText', async (req, res) => {
  const { text, lang, date } = req.body;
  if (!text || !date) {
    return res.status(400).json({ error: "Поля text и date обязательны." });
  }
  try {
    const tarotSpread = generateTarotSpread();
    const userProfile = await db.getProfile(req.userId);
    const dreamDate = date === 'today' ? new Date().toISOString().split('T')[0] : date;

    let interpretation;

    if (process.env.USE_MOCK_API === 'true') {
        const mockDataPath = path.join(process.cwd(), 'mock-interpretation.json');
        const mockData = fs.readFileSync(mockDataPath, 'utf-8');
        interpretation = JSON.parse(mockData);

        // --- Линза Таро: соединяем сгенерированные карты с мок-интерпретациями ---
        const mockTarotInterpretations = interpretation.lenses.tarot.spread;
        const mockSummary = interpretation.lenses.tarot.summary;
        const interpretedSpread = tarotSpread.map((generatedCard, index) => {
            const mockInterpretationData = mockTarotInterpretations[index] || {};
            return {
                ...generatedCard,
                interpretation: (mockInterpretationData.interpretation || "Интерпретация не найдена.").replace(/<<cardName>>/g, generatedCard.cardName)
            };
        });
        interpretation.lenses.tarot = {
            title: interpretation.lenses.tarot.title || "Таро",
            spread: interpretedSpread,
            summary: mockSummary,
            state: { isRevealed: false }
        };
    } else {
        // --- БОЕВОЙ РЕЖИМ ---
        // 1. Рассчитываем астро-данные, если профиль заполнен
        let astrologyCalculations = null;
        if (userProfile?.natalChart) {
            console.log('[Server] Профиль заполнен, рассчитываем астрологию...');
            const [dreamAtmosphere, topTransits, cosmicPassport] = await Promise.all([
                getDreamAtmosphere(dreamDate),
                calculateTopTransits(userProfile.natalChart, dreamDate),
                getCosmicPassport(userProfile.natalChart)
            ]);
            // Собираем только расчетные данные для передачи в AI
            astrologyCalculations = { dreamAtmosphere, topTransits, cosmicPassport };
        } else {
            console.log('[Server] Профиль неполный, пропускаем расчет астрологии.');
        }

        // 2. Вызываем AI-провайдер со всеми доступными данными
        console.log('[Server] Calling AI provider...');
        interpretation = await getDreamInterpretation(text, lang, userProfile, tarotSpread, astrologyCalculations);
        console.log('[Server] ✅ AI interpretation received successfully');
    }

    console.log('[Server] Creating dream entry...');
    const newDreamEntry = { id: uuidv4(), date: dreamDate, originalText: text, activeLens: null, ...interpretation };
    
    console.log('[Server] Saving dream to database...');
    await db.saveDream(req.userId, newDreamEntry);
    console.log('[Server] ✅ Dream saved successfully, ID:', newDreamEntry.id);
    
    console.log('[Server] Sending response to client...');
    res.status(200).json(newDreamEntry);
  } catch (error) {
    console.error('[Server] Ошибка при обработке сна:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновление состояния линзы
app.put('/dreams/:dreamId/lenses/astrology', async (req, res) => {
    const { dreamId } = req.params;
    const stateUpdate = req.body; // { viewedInsights, isSummaryUnlocked, currentIndex }
    
    try {
        const updatedLens = await db.updateLensState(req.userId, dreamId, 'astrology', stateUpdate);
        res.status(200).json(updatedLens);
    } catch (error) {
        console.error(`Error updating astrology lens state for dream ${dreamId}:`, error);
        if (error.message.includes("not found")) {
            return res.status(404).json({ error: 'Dream not found' });
        }
        res.status(500).json({ error: 'Failed to update lens state' });
    }
});

// Обновление состояния линзы Таро (раскрыты ли карты)
app.put('/dreams/:dreamId/lenses/tarot', async (req, res) => {
    const { dreamId } = req.params;
    const { isRevealed } = req.body;

    try {
        const updatedLens = await db.updateLensState(req.userId, dreamId, 'tarot', { isRevealed });
        res.status(200).json(updatedLens);
    } catch (error) {
        console.error(`Error updating tarot lens state for dream ${dreamId}:`, error);
        if (error.message.includes("not found")) {
            return res.status(404).json({ error: 'Dream not found' });
        }
        res.status(500).json({ error: 'Failed to update lens state' });
    }
});

// Обновление активной линзы для сна
app.put('/dreams/:dreamId/activeLens', async (req, res) => {
    const { dreamId } = req.params;
    const { activeLens } = req.body;
    if (activeLens !== null && typeof activeLens !== 'string') {
        return res.status(400).json({ error: 'activeLens must be a string or null' });
    }

    try {
        await db.updateActiveLens(req.userId, dreamId, activeLens);
        res.status(200).json({ activeLens });
    } catch (error) {
        console.error(`Error updating active lens for dream ${dreamId}:`, error);
        res.status(500).json({ error: 'Failed to update active lens' });
    }
});

// Обработка аудио (заглушка)
app.post('/processDreamAudio', (req, res) => {
    res.status(501).json({ message: "Обработка аудио еще не реализована" });
});

app.listen(PORT, () => {
  console.log(`✨ Бэкенд запущен на http://localhost:${PORT}`);
});
