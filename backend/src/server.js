import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import { interpretDreamWithAI } from './services/openai.js';

const app = express();
const PORT = process.env.PORT || 8081;
const DB_PATH = path.join(process.cwd(), 'db.json');

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
app.put('/profile', ensureUser, (req, res) => {
    const { birthDate, birthTime, birthPlace } = req.body;
    const db = readDB();
    db.users[req.userId].profile = { birthDate, birthTime, birthPlace };
    writeDB(db);
    res.status(200).json(db.users[req.userId].profile);
});

// Получение истории снов
app.get('/dreams', ensureUser, (req, res) => {
  const db = readDB();
  res.status(200).json(db.users[req.userId]?.dreams?.reverse() || []);
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
    const interpretation = await interpretDreamWithAI(text, lang);
    const dreamDate = date === 'today' ? new Date().toISOString().split('T')[0] : date;
    const newDreamEntry = { id: uuidv4(), date: dreamDate, originalText: text, ...interpretation };
    const db = readDB();
    db.users[req.userId].dreams.push(newDreamEntry);
    writeDB(db);
    res.status(200).json(newDreamEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обработка аудио (заглушка)
app.post('/processDreamAudio', ensureUser, (req, res) => {
    res.status(501).json({ message: "Обработка аудио еще не реализована" });
});

app.listen(PORT, () => {
  console.log(`✨ Бэкенд запущен на http://localhost:${PORT}`);
});