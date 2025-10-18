# Morpheus Dream App - MVP Documentation

## 📋 Описание проекта

**Morpheus** — это Telegram Mini App для толкования снов через призму традиционных сонников. Приложение анализирует ключевые образы из снов и предоставляет их значения из проверенных источников.

---

## 🏗️ Архитектура (Упрощенная MVP версия)

### Технологический стек:
- **Backend**: Node.js 20 + Express
- **Database**: PostgreSQL 16
- **Frontend**: React + Vite
- **AI**: OpenAI Responses API (один промпт)
- **Auth**: Telegram Web App (HMAC-SHA256)
- **Deploy**: Docker Compose

### Структура проекта:
```
├── backend/               # Node.js backend
│   ├── init.sql          # Схема БД (3 таблицы)
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js   # Telegram авторизация
│   │   ├── services/
│   │   │   ├── database.js
│   │   │   └── dreamInterpreter.js  # Единственный запрос к OpenAI
│   │   └── server.js
│   └── Dockerfile
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LanguageSelectionPage.jsx
│   │   │   ├── WelcomePage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── RecordingPage.jsx
│   │   │   ├── InterpretationPage.jsx
│   │   │   └── HistoryPage.jsx
│   │   ├── components/
│   │   └── services/
│   └── Dockerfile
│
├── docker-compose.yml    # Оркестрация контейнеров
└── ReadMe/              # Документация
```

---

## 🗄️ База Данных

### Структура (3 таблицы):

**1. users** - Профили пользователей и Telegram авторизация
```sql
- telegram_id (PK)
- birth_date, birth_time, birth_place
- birth_latitude, birth_longitude
- gender
- onboarding_completed
```

**2. dreams** - Основная информация о снах
```sql
- id (PK)
- user_id (FK)
- dream_text
- title
- introduction
- advice_title
- advice_content
- dream_date
```

**3. dream_symbols** - Образы из снов
```sql
- id (PK)
- dream_id (FK)
- title
- interpretation
- category (nullable - для будущей аналитики)
- symbol_order
```

---

## 🤖 AI Integration

### Единственный запрос к OpenAI:
```javascript
const response = await openai.responses.create({
  prompt: {
    id: "pmpt_68de883ddb2c8194af2c136bf403a7410bebe0a38c798ba8",
    version: "12"
  },
  input: JSON.stringify({
    dream: dreamText,
    gender: userGender
  })
});
```

### Структура ответа:
```json
{
  "title": "Заголовок сна",
  "introduction": "Общая характеристика...",
  "symbols": [
    { "title": "Образ 1", "interpretation": "Толкование..." }
  ],
  "advice": {
    "title": "Заголовок совета",
    "content": "Совет..."
  }
}
```

---

## 🔌 API Endpoints

### Защищенные (требуют Telegram auth):

**Интерпретация сна:**
```http
POST /interpretDream
Body: { "text": "текст сна", "date": "2025-10-18" }
Response: { полный объект сна с symbols }
```

**Получение сна:**
```http
GET /dreams/:dreamId
Response: { полный объект сна }
```

**История снов:**
```http
GET /dreams
Response: [{ "id", "title", "introduction", "symbolCount" }]
```

**Удаление снов:**
```http
DELETE /dreams
Body: { "dreamIds": ["uuid1", "uuid2"] }
```

**Профиль:**
```http
GET /profile
PUT /profile
```

---

## 🚀 Локальный запуск

### 1. Backend + Database (Docker):
    ```bash
docker-compose up -d
docker-compose logs -f backend
    ```

### 2. Frontend (npm):
    ```bash
cd frontend
npm install
    npm run dev
    ```

**Откройте:** `http://localhost:3001` (или другой порт Vite)

---

## 🔄 Процесс регистрации:

```
1. /language - Выбор языка
2. /welcome  - Приветствие (информация о приложении)
3. /profile  - Ввод данных (или пропуск)
4. /record   - Главная страница (ввод сна)
```

---

## 🔐 Безопасность

### Telegram авторизация:
- ✅ HMAC-SHA256 валидация
- ✅ TTL проверка (24 часа)
- ✅ `X-Telegram-Init-Data` заголовок
- ✅ Bypass режим для разработки (`DANGEROUSLY_BYPASS_AUTH=true`)

**Файлы БЕЗ ИЗМЕНЕНИЙ:**
- `backend/src/middleware/auth.js`
- Таблица `users`

---

## 📚 Документация

### Основные файлы:
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Полная документация API (backend + frontend)
- **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - Деплой на продакшен, миграции, troubleshooting
- **[PRODUCTION_READINESS_CHECK.md](./PRODUCTION_READINESS_CHECK.md)** - Чеклист готовности к проду, ответы на FAQ
- **[SIMPLE_ARCHITECTURE.md](./SIMPLE_ARCHITECTURE.md)** - Подробная архитектура приложения
- **[Telegram.md](./Telegram.md)** - Telegram Web App интеграция и авторизация
- **[nginx.md](./nginx.md)** - Настройка Nginx на сервере
- **[example.env.md](./example.env.md)** - Переменные окружения и их описание

---

## 🛠️ Переменные окружения

См. `example.env.md` для полного списка.

**Ключевые переменные:**
```env
# Database
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@postgres:5432/db

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Telegram
TELEGRAM_BOT_TOKEN=...
DANGEROUSLY_BYPASS_AUTH=true  # Только для dev!

# Environment
NODE_ENV=development
```

---

## 📦 Деплой на продакшен

### Быстрый деплой (сохраняет данные):
```bash
ssh root@your-server
cd /path/to/project
./deploy.sh
```

### Полная пересборка (удаляет данные!):
```bash
./redeploy.sh
```

**Подробнее:** См. [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

---

## 🎯 Упрощения в MVP версии

### Удалено:
- ❌ WebSocket стриминг → простой HTTP POST
- ❌ swisseph (C++ библиотека)
- ❌ 4 типа линз (психоанализ, таро, астрология, культурология)
- ❌ Сложные компоненты UI
- ❌ Python и build tools из Docker

### Сохранено:
- ✅ Telegram авторизация (без изменений!)
- ✅ Docker (упрощенный)
- ✅ Profile, History страницы
- ✅ Геокодинг (Google API)

---

## 📊 Метрики

| Метрика | Старая версия | MVP |
|---------|---------------|-----|
| Запросы к OpenAI | 4 | 1 |
| Время интерпретации | ~2 мин | 30-60 сек |
| Таблицы БД | 2 | 3 |
| Lines of code | ~5000 | ~2500 |
| Backend файлы | ~10 | ~4 |

---

## 🐛 Troubleshooting

### "relation does not exist"
```bash
docker-compose down -v
docker volume rm morpheus_pg_data
docker-compose up -d
```

### "Cannot find module 'swisseph'"
```bash
cd backend
npm install
docker-compose build --no-cache
```

---

## 📞 Контакты

**Проект:** Morpheus Dream App  
**Версия:** 2.0 (MVP Simplified)  
**Дата:** October 2025
