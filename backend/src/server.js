import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import axios from 'axios';
import { getDreamInterpretation } from './services/ai_provider.js';
import { getDreamAtmosphere, calculateTopTransits, getCosmicPassport } from './services/astrology.js';
import { calculateNatalChart } from './services/natalChart.js';

const app = express();
const PORT = process.env.PORT || 9000;
const DB_PATH = path.join(process.cwd(), 'db.json');

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
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    writeDB({ users: {} });
    return { users: {} };
  }
  try {
    const dbRaw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(dbRaw);
  } catch (e) {
    console.error("Error reading or parsing db.json:", e);
    return { users: {} };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

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

const ensureUser = (req, res, next) => {
  const userId = req.headers['x-telegram-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'X-Telegram-User-ID header is required' });
  }
  const db = readDB();
  if (!db.users) db.users = {};
  if (!db.users[userId]) {
    db.users[userId] = { dreams: [], profile: {} };
    writeDB(db);
  }
  req.userId = userId;
  next();
};

// --- Маршруты API ---

// Получение профиля
app.get('/profile', ensureUser, (req, res) => {
    const db = readDB();
    const userProfile = db.users[req.userId]?.profile;
    if (userProfile && Object.keys(userProfile).length > 0) {
        res.status(200).json(userProfile);
    } else {
        res.status(404).json({ error: 'Profile not found or empty' });
    }
});

// Обновление профиля
app.put('/profile', ensureUser, async (req, res) => {
    const { birthDate, birthTime, birthPlace } = req.body;
    const db = readDB();
    const userProfile = db.users[req.userId].profile || {};

    // Обновляем дату и время
    userProfile.birthDate = birthDate;
    userProfile.birthTime = birthTime;

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

    db.users[req.userId].profile = userProfile;
    writeDB(db);
    res.status(200).json(db.users[req.userId].profile);
});

// Получение истории снов
app.get('/dreams', ensureUser, (req, res) => {
  const db = readDB();
  res.status(200).json(db.users[req.userId]?.dreams?.reverse() || []);
});

// Получение одного сна по id
app.get('/dreams/:dreamId', ensureUser, (req, res) => {
  const { dreamId } = req.params;
  const db = readDB();
  const userDreams = db.users[req.userId]?.dreams || [];
  const dream = userDreams.find(d => d.id === dreamId);
  if (!dream) {
    return res.status(404).json({ error: 'Dream not found' });
  }
  res.status(200).json(dream);
});

// Удаление снов
app.delete('/dreams', ensureUser, (req, res) => {
  const { dreamIds } = req.body;
  if (!dreamIds || !Array.isArray(dreamIds)) {
    return res.status(400).json({ error: 'dreamIds must be an array' });
  }
  const db = readDB();
  const userDreams = db.users[req.userId]?.dreams || [];
  const updatedDreams = userDreams.filter(dream => !dreamIds.includes(dream.id));
  db.users[req.userId].dreams = updatedDreams;
  writeDB(db);
  res.status(200).json({ message: 'Dreams deleted successfully' });
});

// Обработка текстового сна
app.post('/processDreamText', ensureUser, async (req, res) => {
  const { text, lang, date } = req.body;
  if (!text || !date) {
    return res.status(400).json({ error: "Поля text и date обязательны." });
  }
  try {
    const tarotSpread = generateTarotSpread();
    const userProfile = readDB().users[req.userId]?.profile;
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
        interpretation = await getDreamInterpretation(text, lang, userProfile, tarotSpread, astrologyCalculations);
    }

    const newDreamEntry = { id: uuidv4(), date: dreamDate, originalText: text, activeLens: null, ...interpretation };
    
    const db = readDB();
    db.users[req.userId].dreams.push(newDreamEntry);
    writeDB(db);
    res.status(200).json(newDreamEntry);
  } catch (error) {
    console.error('[Server] Ошибка при обработке сна:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновление состояния линзы
app.put('/dreams/:dreamId/lenses/astrology', ensureUser, (req, res) => {
    const { dreamId } = req.params;
    const { viewedInsights, isSummaryUnlocked, currentIndex } = req.body;
    const db = readDB();
    const userDreams = db.users[req.userId]?.dreams || [];
    const dreamIndex = userDreams.findIndex(dream => dream.id === dreamId);

    if (dreamIndex === -1) {
        return res.status(404).json({ error: 'Dream not found' });
    }

    // Создаем или обновляем состояние
    if (!db.users[req.userId].dreams[dreamIndex].lenses.astrology.state) {
        db.users[req.userId].dreams[dreamIndex].lenses.astrology.state = {};
    }
    
    if (Array.isArray(viewedInsights)) {
        db.users[req.userId].dreams[dreamIndex].lenses.astrology.state.viewedInsights = viewedInsights;
    }
    if (typeof isSummaryUnlocked === 'boolean') {
        db.users[req.userId].dreams[dreamIndex].lenses.astrology.state.isSummaryUnlocked = isSummaryUnlocked;
    }
    if (typeof currentIndex === 'number') {
        db.users[req.userId].dreams[dreamIndex].lenses.astrology.state.currentIndex = currentIndex;
    }

    writeDB(db);
    res.status(200).json(db.users[req.userId].dreams[dreamIndex].lenses.astrology);
});

// Обновление состояния линзы Таро (раскрыты ли карты)
app.put('/dreams/:dreamId/lenses/tarot', ensureUser, (req, res) => {
    const { dreamId } = req.params;
    const { isRevealed } = req.body;
    const db = readDB();
    const userDreams = db.users[req.userId]?.dreams || [];
    const dreamIndex = userDreams.findIndex(dream => dream.id === dreamId);
    if (dreamIndex === -1) {
        return res.status(404).json({ error: 'Dream not found' });
    }

    const tarotLens = db.users[req.userId].dreams[dreamIndex].lenses?.tarot;
    if (!tarotLens) {
        return res.status(400).json({ error: 'Tarot lens not available for this dream' });
    }
    if (!tarotLens.state) tarotLens.state = {};
    if (typeof isRevealed === 'boolean') tarotLens.state.isRevealed = isRevealed;

    writeDB(db);
    res.status(200).json(tarotLens);
});

// Обновление активной линзы для сна
app.put('/dreams/:dreamId/activeLens', ensureUser, (req, res) => {
    const { dreamId } = req.params;
    const { activeLens } = req.body;
    if (activeLens !== null && typeof activeLens !== 'string') {
        return res.status(400).json({ error: 'activeLens must be a string or null' });
    }

    const db = readDB();
    const userDreams = db.users[req.userId]?.dreams || [];
    const dreamIndex = userDreams.findIndex(dream => dream.id === dreamId);

    if (dreamIndex === -1) {
        return res.status(404).json({ error: 'Dream not found' });
    }

    db.users[req.userId].dreams[dreamIndex].activeLens = activeLens;
    writeDB(db);
    res.status(200).json({ activeLens });
});

// Обработка аудио (заглушка)
app.post('/processDreamAudio', ensureUser, (req, res) => {
    res.status(501).json({ message: "Обработка аудио еще не реализована" });
});

app.listen(PORT, () => {
  console.log(`✨ Бэкенд запущен на http://localhost:${PORT}`);
});
