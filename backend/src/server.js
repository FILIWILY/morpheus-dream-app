import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import { interpretDreamWithAI } from './services/openai.js';

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(process.cwd(), 'db.json');

app.use(cors());
app.use(express.json());

// --- Вспомогательные функции (без изменений) ---
const readDB = () => { /* ... код без изменений ... */ };
const writeDB = (data) => { /* ... код без изменений ... */ };
const ensureUser = (req, res, next) => { /* ... код без изменений ... */ };

// --- Маршруты API ---

app.get('/dreams', ensureUser, (req, res) => { /* ... код без изменений ... */ });

app.post('/processDreamText', ensureUser, async (req, res) => { /* ... код без изменений ... */ });

// ✅ НОВЫЙ ЭНДПОИНТ ДЛЯ УДАЛЕНИЯ СНОВ
app.delete('/dreams', ensureUser, (req, res) => {
  const { userId } = req;
  const { dreamIds } = req.body; // Ожидаем массив ID снов для удаления

  if (!dreamIds || !Array.isArray(dreamIds)) {
    return res.status(400).json({ error: 'dreamIds must be an array' });
  }

  try {
    const db = readDB();
    const userDreams = db.users[userId]?.dreams || [];

    // Фильтруем массив, оставляя только те сны, чьих ID нет в списке на удаление
    const updatedDreams = userDreams.filter(dream => !dreamIds.includes(dream.id));

    db.users[userId].dreams = updatedDreams;
    writeDB(db);

    res.status(200).json({ message: 'Dreams deleted successfully', remainingCount: updatedDreams.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dreams' });
  }
});

app.get('/profile', ensureUser, (req, res) => { /* ... код без изменений ... */ });
app.put('/profile', ensureUser, (req, res) => { /* ... код без изменений ... */ });
app.post('/processDreamAudio', ensureUser, async (req, res) => { /* ... код без изменений ... */ });


app.listen(PORT, () => {
  console.log(`✨ Бэкенд запущен на http://localhost:${PORT}`);
});