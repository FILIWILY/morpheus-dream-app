# Telegram Bot Setup Guide

## 📝 Описание

Telegram бот для Morpheus Dream Interpreter. Бот предоставляет команды для открытия Mini App и описывает возможности приложения.

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка переменных окружения

Убедитесь, что в `.env` файле есть:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEB_APP_URL=https://your-domain.com
```

### 3. Запуск бота

**Development:**
```bash
npm run bot:dev
```

**Production:**
```bash
npm run bot
```

---

## 🤖 Настройка в BotFather

### 1. Создание бота (если еще не создан)

Откройте [@BotFather](https://t.me/BotFather) и выполните:

```
/newbot
```

Следуйте инструкциям, чтобы получить `TELEGRAM_BOT_TOKEN`.

### 2. Настройка команд

Отправьте в BotFather:

```
/mybots
```

Выберите вашего бота → **Edit Bot** → **Edit Commands**

Вставьте следующий текст:

```
start - Start the bot and get app info
open - Open Morpheus Dream Interpreter
```

### 3. Настройка описания (Description)

**Edit Bot** → **Edit Description**

Вставьте:

```
🌙 Morpheus — AI-powered dream interpreter

Record your dreams by voice or text, get personalized AI interpretations, explore dream symbols, and save your dream history.

Use /open to launch the app
```

### 4. Настройка короткого описания (About)

**Edit Bot** → **Edit About Text**

Вставьте:

```
AI-powered dream interpreter. Record, interpret, and explore your dreams with personalized insights.
```

### 5. Настройка "What can this bot do?"

**Edit Bot** → **Edit Botpic** (пролистайте вниз) → **Edit Description**

Или найдите опцию **"Edit Bot Description"** (в некоторых версиях)

Вставьте:

```
🌙 Morpheus Dream Interpreter — Your Personal AI Dream Guide

✨ Features:
• Record dreams using voice or text input
• Get AI-powered interpretations of dream symbols
• Receive personalized psychological insights
• Explore dream meanings from various perspectives
• Save and review your dream history
• Multilingual support (EN, RU, DE, ES, FR)

🔮 The app uses advanced AI to analyze your dreams and provide meaningful interpretations based on psychology, symbolism, and personalized context.

Use /open to start interpreting your dreams!
```

### 6. Настройка Mini App

**Edit Bot** → **Bot Settings** → **Menu Button** → **Configure Menu Button**

- **Button Text:** `🌙 Open App`
- **URL:** Ваш `TELEGRAM_WEB_APP_URL` (например, `https://dream-interpretation.ru`)

---

## 📱 Команды бота

### `/start`
Приветственное сообщение с кратким описанием приложения и кнопкой для открытия Mini App.

**Особенности:**
- Автоматически определяет язык пользователя (русский/английский)
- Показывает описание возможностей приложения
- Предоставляет кнопку для открытия Mini App

### `/open`
Быстрый способ открыть Mini App без описания.

**Особенности:**
- Минимальный текст
- Сразу предоставляет кнопку для открытия приложения
- Поддержка русского и английского языков

---

## 🌍 Поддержка языков

Бот автоматически определяет язык пользователя на основе `language_code` из Telegram:
- 🇷🇺 Русский (`ru`)
- 🇬🇧 Английский (по умолчанию для всех остальных языков)

---

## 🔧 Production Deployment

### Использование PM2 (рекомендуется)

```bash
# Установка PM2
npm install -g pm2

# Запуск бота
pm2 start src/bot.js --name morpheus-bot

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Логи
pm2 logs morpheus-bot

# Перезапуск
pm2 restart morpheus-bot
```

### Использование Docker

Добавьте в `docker-compose.yml`:

```yaml
services:
  bot:
    build: ./backend
    command: npm run bot
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - db
```

Запуск:
```bash
docker compose up -d bot
```

---

## 🐛 Troubleshooting

### Бот не отвечает на команды

1. Проверьте, что `TELEGRAM_BOT_TOKEN` правильный
2. Убедитесь, что бот запущен (`npm run bot`)
3. Проверьте логи на ошибки

### Кнопка "Open App" не работает

1. Убедитесь, что `TELEGRAM_WEB_APP_URL` указывает на рабочий HTTPS-домен
2. Проверьте, что Mini App настроен в BotFather
3. Убедитесь, что домен имеет валидный SSL-сертификат

### Сообщения на неправильном языке

Язык определяется автоматически из Telegram `language_code`. Если нужно добавить больше языков, отредактируйте `backend/src/bot.js`.

---

## 📝 Логи

Бот выводит следующие логи:
- ✅ Успешный запуск
- 📱 URL Mini App
- ❌ Ошибки polling
- ❌ Другие ошибки

---

## 🔐 Безопасность

- **Никогда** не коммитьте `.env` файл с токеном
- Используйте разные токены для development и production
- Регулярно проверяйте логи на подозрительную активность

---

## 📚 Дополнительные ресурсы

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [node-telegram-bot-api Library](https://github.com/yagop/node-telegram-bot-api)

