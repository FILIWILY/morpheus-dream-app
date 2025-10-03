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
import TelegramBot from 'node-telegram-bot-api';
import { WebSocketServer } from 'ws';
import http from 'http';

// --- Telegram Bot Setup ---
const setupTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webAppUrl = process.env.TELEGRAM_WEB_APP_URL;

  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set. Bot setup is skipped.');
    return;
  }

  if (!webAppUrl) {
    console.error('❌ TELEGRAM_WEB_APP_URL is not set. Bot menu button will not be updated.');
    return;
  }

  const bot = new TelegramBot(token);

  bot.setMyCommands([
    {
      command: '/start',
      description: 'Запустить приложение'
    }
  ]).then(() => {
    console.log('🤖 Telegram commands updated.');
  }).catch(console.error);

  bot.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Открыть Morpheus',
      web_app: {
        url: webAppUrl
      }
    }
  }).then(() => {
    console.log(`✅ Telegram menu button updated to point to: ${webAppUrl}`);
  }).catch((error) => {
    console.error('Failed to set chat menu button:', error.response ? error.response.body : error);
  });

  console.log('🤖 Telegram Bot setup complete.');
};


// Динамический импорт database.js после загрузки переменных окружения
const db = await import('./services/database.js');

// Инициализируем базу данных
await db.initializeDatabase();

// Настраиваем Telegram бота
setupTelegramBot();

const app = express();
const server = http.createServer(app); // Создаем HTTP сервер для Express
const wss = new WebSocketServer({ server }); // Создаем WebSocket сервер поверх HTTP сервера
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
    const { birthDate, birthTime, birthPlace, gender, onboardingCompleted } = req.body;
    let userProfile = (await db.getProfile(req.userId)) || {};

    if (process.env.NODE_ENV !== 'production') {
        console.log(`[SERVER] 📥 Received profile update for user ${req.userId}:`, req.body);
        console.log(`[SERVER] 🚻 Gender from request body:`, gender);
    }

    // Устанавливаем флаг завершения регистрации, если он был передан
    if (onboardingCompleted !== undefined) {
        userProfile.onboardingCompleted = onboardingCompleted;
    }

    // Преобразуем и обновляем дату
    const convertedBirthDate = convertDateFormat(birthDate);
    if (birthDate && !convertedBirthDate) {
        return res.status(400).json({ error: 'Invalid birth date format. Expected DD.MM.YYYY or YYYY-MM-DD' });
    }
    
    userProfile.birthDate = convertedBirthDate;
    userProfile.birthTime = birthTime;
    userProfile.gender = gender;
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[SERVER] Date conversion: "${birthDate}" -> "${convertedBirthDate}"`);
        console.log(`[SERVER] 🚻 Gender assigned to userProfile:`, userProfile.gender);
    }

    // Новая, более надежная логика обработки birthPlace
    try {
        const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
        let geocodeResponse = null;

        if (birthPlace && birthPlace.placeId) {
            console.log(`[Geocode] Attempting geocoding with placeId: ${birthPlace.placeId}`);
            // 1. Предпочтительный способ: геокодирование по placeId
            geocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: { place_id: birthPlace.placeId, key: apiKey, language: 'ru' }
            });
        } else if (birthPlace && birthPlace.description) {
            console.log(`[Geocode] Attempting geocoding with address: "${birthPlace.description}"`);
            // 2. Запасной способ: геокодирование по текстовому описанию
            geocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: { address: birthPlace.description, key: apiKey, language: 'ru' }
            });
        }

        if (geocodeResponse && geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
            const result = geocodeResponse.data.results[0];
            const location = result.geometry.location;
            userProfile.birthPlace = result.formatted_address;
            userProfile.birthLatitude = location.lat;
            userProfile.birthLongitude = location.lng;
            console.log(`[Geocode] ✅ Success: ${userProfile.birthPlace} [${location.lat}, ${location.lng}]`);
        } else {
            // Если геокодирование не удалось или не было данных
            if (geocodeResponse) {
                console.error(`[Geocode] ❌ Failed: ${geocodeResponse.data.status}`, geocodeResponse.data.error_message || '');
            }
            // Сохраняем только текстовое описание, если оно есть
            userProfile.birthPlace = (birthPlace && typeof birthPlace === 'object') ? birthPlace.description : birthPlace;
            delete userProfile.birthLatitude;
            delete userProfile.birthLongitude;
        }
    } catch (error) {
        console.error('[Geocode] 💥 Hard error during geocoding:', error.message);
        // В случае критической ошибки сохраняем только текстовое описание
        userProfile.birthPlace = (birthPlace && typeof birthPlace === 'object') ? birthPlace.description : birthPlace;
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
        
        // Сортируем сны по дате, от новых к старым
        const sortedDreams = dreams.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.status(200).json(sortedDreams);
    } catch (error) {
        console.error('Error fetching dreams:', error);
        res.status(500).json({ error: 'Failed to fetch dreams' });
    }
});

// Получение одного сна по id
app.get('/dreams/:dreamId', async (req, res) => {
  const { dreamId } = req.params;
  console.log(`[Server] 🔍 Fetching dream by ID: ${dreamId} for user: ${req.userId}`);
  console.log(`[Server] Request headers:`, {
    'X-Telegram-Init-Data': req.headers['x-telegram-init-data'] ? '[PRESENT]' : '[MISSING]',
    'X-Telegram-User-ID': req.headers['x-telegram-user-id'] || '[MISSING]'
  });
  try {
      const dream = await db.getDreamById(req.userId, dreamId);
      if (!dream) {
        console.log(`[Server] ❌ Dream not found: ${dreamId} for user: ${req.userId}`);
        console.log(`[Server] 💡 This could mean:`);
        console.log(`[Server]    1. Dream doesn't exist in DB`);
        console.log(`[Server]    2. Dream belongs to different user`);
        console.log(`[Server]    3. Dream was not saved properly (check title/summary)`);
        return res.status(404).json({ error: 'Dream not found' });
      }
      console.log(`[Server] ✅ Dream found: ${dreamId}`);
      console.log(`[Server] 📊 Dream data:`, { 
        id: dream.id, 
        title: dream.title || '[NULL]', 
        hasLenses: !!dream.lenses,
        lensCount: dream.lenses ? Object.keys(dream.lenses).length : 0
      });
      res.status(200).json(dream);
  } catch (error) {
      console.error(`[Server] Error fetching dream ${dreamId}:`, error);
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
    console.log(`[Server] Initializing dream processing for user: ${req.userId}`);
    if (!text || !date) {
        return res.status(400).json({ error: "Поля text и date обязательны." });
    }
    try {
        const dreamDate = date === 'today' ? new Date().toISOString().split('T')[0] : date;
        
        // Создаем "пустую" запись сна, чтобы получить ID
        const newDreamEntry = {
            id: uuidv4(),
            date: dreamDate,
            originalText: text,
            title: null, // Будет заполнено через WebSocket
            snapshotSummary: null, // Будет заполнено через WebSocket
            lenses: {}, // Линзы будут добавлены через WebSocket
            activeLens: null
        };
        
        await db.saveDream(req.userId, newDreamEntry);
        console.log(`[Server] ✅ Dream shell created with ID: ${newDreamEntry.id}`);
        
        // Отправляем клиенту ID для подключения по WebSocket
        res.status(202).json({ dreamId: newDreamEntry.id });
        
    } catch (error) {
        console.error('[Server] Ошибка при создании "пустой" записи сна:', error);
        res.status(500).json({ error: error.message });
    }
});

wss.on('connection', (ws, req) => {
    // В реальном приложении здесь должна быть аутентификация,
    // например, через токен, переданный в URL
    console.log('[WebSocket] ✅ Client connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('[WebSocket] Received message:', data);

            if (data.type === 'startInterpretation') {
                const { dreamId, userId, lang } = data.payload;

                // Получаем сон из БД
                const dream = await db.getDreamById(userId, dreamId);
                if (!dream) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Dream not found' } }));
                    return;
                }
                
                // Получаем профиль пользователя
                const userProfile = await db.getProfile(userId);
                
                // Генерируем расклад Таро
                const tarotSpread = generateTarotSpread();

                // Рассчитываем астро-данные
                let astrologyCalculations = null;
                // Убедимся, что natalChart существует и не пустой объект
                if (userProfile?.natalChart && Object.keys(userProfile.natalChart).length > 0) {
                    const dreamDate = dream.date;
                    const [dreamAtmosphere, topTransits, cosmicPassport] = await Promise.all([
                        getDreamAtmosphere(dreamDate),
                        calculateTopTransits(userProfile.natalChart, dreamDate),
                        getCosmicPassport(userProfile.natalChart)
                    ]);
                    astrologyCalculations = { dreamAtmosphere, topTransits, cosmicPassport };
                }

                // Запускаем стриминг
                await getDreamInterpretationStream(ws, dream.originalText, lang, userProfile, tarotSpread, astrologyCalculations, userId, dreamId);
            }
        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Internal server error' } }));
        }
    });

    ws.on('close', () => {
        console.log('[WebSocket] ❌ Client disconnected');
    });
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

server.listen(PORT, () => {
  console.log(`✨ Бэкенд запущен на http://localhost:${PORT}`);
});

// Импорт ai_provider после всех настроек
import { getDreamInterpretationStream } from './services/ai_provider.js';
