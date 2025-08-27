# Управление переменными окружения (.env)

В проекте используется два подхода к управлению переменными окружения, в зависимости от режима запуска.

---

### 1. Режим Docker Compose (Основной)

Для запуска всего приложения через `docker-compose up` используется **единый `.env` файл**, который должен находиться в **корневой директории** проекта. Этот файл является основным источником конфигурации для всех сервисов: базы данных, бэкенда и фронтенда.

**Инструкция:**
1.  Найдите в корне проекта файл `.env.example`.
2.  Скопируйте его и переименуйте копию в `.env`.
3.  Заполните все значения (ключи API, токен бота и т.д.).

Содержимое файла `.env.example`:

```plaintext
# Environment variables for Docker Compose
# Copy this file to .env in the project root and fill in your actual values.

# --- PostgreSQL Database Settings ---
POSTGRES_USER=di_admin
POSTGRES_PASSWORD=didi1234didi
POSTGRES_DB=di
# This is the port on your local machine that will connect to the container's port 5432.
POSTGRES_PORT=5433

# --- Backend Service Settings ---
# This is the port on your local machine that will connect to the backend container's port 9000.
BACKEND_PORT=9000
# Set to 'false' for production/staging or 'true' for local development with db.json
USE_MOCK_API=false

# --- Frontend Service Settings ---
# This is the port on your local machine that will connect to the frontend Nginx container's port 80.
FRONTEND_PORT=8080
# This key is passed to Vite during the build process inside the Docker container.
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# --- AI Provider API Keys ---
OPENAI_API_KEY=your_openai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
# Set to true to use OpenAI, false to use DeepSeek
USE_OPENAI=true

# --- Google Geocoding API Key ---
GOOGLE_GEOCODING_API_KEY=your_google_api_key_here

# --- Telegram Bot Settings ---
TELEGRAM_BOT_TOKEN=your_secret_bot_token_here
# Set to 'true' ONLY for local testing outside of the Telegram client.
# MUST be 'false' or unset in production.
DANGEROUSLY_BYPASS_AUTH=true
```

---

### 2. Режим локальной разработки (Legacy)

Этот режим используется, если вы хотите запустить фронтенд и бэкенд отдельно, без Docker, с помощью команд `npm run dev`. В этом случае используются **два отдельных `.env` файла**:

-   `backend/.env`: Содержит переменные **только для бэкенда** (`DATABASE_URL`, `OPENAI_API_KEY` и т.д.).
-   `frontend/.env`: Содержит переменные **только для фронтенда** (`VITE_GOOGLE_PLACES_API_KEY`).

**Важно:** При запуске через `docker-compose`, эти два файла **полностью игнорируются**.