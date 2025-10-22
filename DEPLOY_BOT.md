# 🚀 Быстрый деплой Telegram бота

## На сервере выполните:

```bash
cd DI
git pull origin main
docker compose build --no-cache bot
docker compose up -d bot
```

## Проверка:

```bash
# Смотреть логи бота
docker compose logs -f bot

# Проверить статус всех сервисов
docker compose ps
```

## Ожидаемый вывод:

```
morpheus-bot  | 🤖 Telegram Bot started successfully!
morpheus-bot  | ✅ Bot is running. Waiting for commands...
morpheus-bot  | 📱 Web App URL: https://dream-interpretation.ru
```

## Если что-то пошло не так:

```bash
# Перезапустить бота
docker compose restart bot

# Полная пересборка
docker compose down
docker compose up -d
```

---

## 📝 Настройка команд в BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. `/mybots` → Выберите бота → **Edit Bot** → **Edit Commands**

Вставьте:
```
start - Start the bot and get app info
```

3. **Edit Description** (что умеет бот):
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

Use /start to get started and open the app via the Menu button!
```

4. **Настройка Menu Button:**

**Edit Bot** → **Bot Settings** → **Menu Button** → **Configure Menu Button**

- **Button Text:** `🌙 Open App` (EN) / `🌙 Открыть` (RU)
- **URL:** Ваш `TELEGRAM_WEB_APP_URL` (должен быть автоматически взят из настроек)

---

## ✅ Готово!

Теперь бот отвечает на команду `/start` и отправляет два сообщения:
1. **Приветствие** с описанием возможностей
2. **Инструкция с картинкой** как открыть приложение через кнопку Menu

