# 🔧 Управление переменными окружения (.env)

Приложение использует **единый `.env` файл** в корне проекта для всех режимов запуска.

## 📋 Настройка

1. Скопируйте `env.example` в `.env`:
   ```bash
   cp env.example .env
   ```
2. Заполните все значения API ключами

## 🔑 Содержимое .env файла

# Environment variables for Docker Compose
# Copy this file to .env and fill in your actual values.

# --- PostgreSQL Database Settings ---
POSTGRES_USER=di_admin
POSTGRES_PASSWORD=didi1234didi
POSTGRES_DB=di
# This is the port on your local machine that will connect to the container's port 5432.
POSTGRES_PORT=5433

# --- Backend Service Settings ---
# This is the port on your local machine that will connect to the backend container's port 9000.
BACKEND_PORT=9000
# Database connection string for backend
DATABASE_URL=postgresql://di_admin:didi1234didi@postgres:5432/di

# --- Frontend Service Settings ---
# This is the port on your local machine that will connect to the frontend Nginx container's port 80.
FRONTEND_PORT=8080
# This key is passed to Vite during the build process inside the Docker container.
VITE_GOOGLE_PLACES_API_KEY=AIzaSyBmVZw7Vbjg0D_Z170Jbh3YWX7wrHydKaY

# --- AI Provider API Keys ---
OPENAI_API_KEY=your_openai_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
# Set to true to use OpenAI, false to use DeepSeek
USE_OPENAI=true

# --- Google Geocoding API Key ---
GOOGLE_GEOCODING_API_KEY=AIzaSyBt-NVP7W3i8t2UtLjV_qCKs7nnKwLzFhs

# --- Telegram Bot Settings ---
TELEGRAM_BOT_TOKEN=your_secret_bot_token_here

# Base URL for the Telegram Web App (used by the deployment script for cache busting)
BASE_WEB_APP_URL=https://dream-interpretation.ru/

# Full Web App URL with a version parameter for cache busting.
# This variable is automatically generated and updated by the deploy.sh script.
TELEGRAM_WEB_APP_URL=https://dream-interpretation.ru/?v=20250101000000

# --- Development/Production Settings ---
# Set to 'true' ONLY for local testing outside of the Telegram client.
# MUST be 'false' or unset in production.
DANGEROUSLY_BYPASS_AUTH=true

# Database type: 'json' for db.json file, 'postgres' for PostgreSQL
DATABASE_TYPE=postgres

# Mock AI: 'true' to use mock data (no AI API calls), 'false' for real AI API calls
# Useful for UI development to avoid spending API credits
# Works independently from DATABASE_TYPE - you can use mock AI with any database
USE_MOCK_AI=false

# Node environment - определяет режим работы приложения
NODE_ENV=development

## 🌍 Режимы окружения

### Development (NODE_ENV=development)
- ✅ Подробные логи и отладка
- ✅ Hot reload при изменениях кода  
- ✅ Можно использовать `DANGEROUSLY_BYPASS_AUTH=true`
- ✅ Source maps для отладки

### Production (NODE_ENV=production) 
- 🚀 Оптимизированная сборка
- 🔒 Строгая безопасность (`DANGEROUSLY_BYPASS_AUTH=false`)
- 📊 Минимальные логи
- ⚡ Максимальная производительность

## ⚙️ Настройки для разных сред

### Для разработки UI (без трат на API):
```bash
NODE_ENV=development
DANGEROUSLY_BYPASS_AUTH=true
DATABASE_TYPE=json         # или postgres, если хотите тестировать с реальной БД
USE_MOCK_AI=true          # 🎭 Используем mock данные AI
```

### Для тестирования AI с JSON БД (с реальными API):
```bash
NODE_ENV=development
DANGEROUSLY_BYPASS_AUTH=true
DATABASE_TYPE=json
USE_MOCK_AI=false         # 🤖 Используем настоящие AI API
```

### Для тестирования AI с PostgreSQL (с реальными API):
```bash
NODE_ENV=development
DANGEROUSLY_BYPASS_AUTH=true
DATABASE_TYPE=postgres
USE_MOCK_AI=false         # 🤖 Используем настоящие AI API
```

### Для продакшена:
```bash
NODE_ENV=production
DANGEROUSLY_BYPASS_AUTH=false
DATABASE_TYPE=postgres    # 🚀 Всегда PostgreSQL в продакшене
USE_MOCK_AI=false         # 🚀 Всегда настоящие AI API
```

## 🎭 USE_MOCK_AI - экономия API кредитов

**Когда USE_MOCK_AI=true:**
- ✅ Никаких запросов к OpenAI/DeepSeek
- ✅ Мгновенные ответы
- ✅ Экономия API кредитов
- ✅ Идеально для разработки UI/UX
- ✅ Работает с любым DATABASE_TYPE (json или postgres)

**Когда USE_MOCK_AI=false:**
- 🤖 Настоящие AI интерпретации
- 💰 Тратятся API кредиты
- ⏱️ Реальное время ответа API
- 🎯 Для тестирования функциональности
- 🎯 Работает с любым DATABASE_TYPE (json или postgres)

## 🔑 Важно: DATABASE_TYPE и USE_MOCK_AI - независимые переменные!

Эти переменные теперь **НЕ связаны** друг с другом:
- `DATABASE_TYPE` - выбирает где хранятся данные (json файл или PostgreSQL)
- `USE_MOCK_AI` - выбирает откуда брать AI интерпретации (моки или настоящий API)

**Все комбинации работают:**
- `DATABASE_TYPE=json` + `USE_MOCK_AI=true` ✅ - Быстрая UI разработка
- `DATABASE_TYPE=json` + `USE_MOCK_AI=false` ✅ - Тест AI без PostgreSQL
- `DATABASE_TYPE=postgres` + `USE_MOCK_AI=true` ✅ - UI разработка с реальной БД
- `DATABASE_TYPE=postgres` + `USE_MOCK_AI=false` ✅ - Полное тестирование / продакшен