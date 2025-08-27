# Morpheus Dream App

## Project Overview
This application is a dream interpreter that utilizes a language model to analyze dreams through four different "lenses": Psychoanalytic, Esoteric, Astrology, and Folkloric. It's currently set up for development using a frontend and backend architecture.

## Getting Started

### Prerequisites
- Node.js (with npm) installed.

### Installation
1. Clone the repository.
2. Navigate to the project root directory.
3. Install dependencies for both frontend and backend:
   ```bash
   npm install
   npm install --prefix frontend
   npm install --prefix backend
   ```

### Running the Application
To run the application in development mode (both frontend and backend simultaneously):
```bash
npm run dev
```

To reset the database to its initial empty state and run the application (this will require re-registration):
```bash
npm run dev:reset
```

## Architecture

### Frontend
- **Framework**: React with Vite
- **Routing**: `react-router-dom` with `PrivateRoute` for authenticated routes.
- **UI Components**: Uses Material-UI (`@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`) and custom components.
- **State Management**: Context API (`LocalizationContext`, `ProfileContext`) for global state.
- **API Interaction**: Communicates with the backend via `frontend/src/services/api.js`.
- **Key Pages**:
    - `WelcomePage`: Initial welcome screen, redirects to ProfilePage for new users.
    - `ProfilePage`: User profile management (e.g., birth date, birth place for Astrology interpretations). This is where new users register their profile.
    - `RecordingPage`: Handles dream input (text or audio) and sends it for interpretation.
    - `HistoryPage`: Shows past dream interpretations.
    - `SettingsPage`: Application settings.
    - `LanguagePage`: Language selection.
- **Audio Recording**: Utilizes a custom `useAudioRecorder` hook.
- **Localization**: Managed via `i18n-js` and `LocalizationContext` with language files in `frontend/src/locales/`.

### Backend
- **Framework**: Node.js with Express
- **API Provides endpoints for dream interpretation.
- **Data Storage**: Uses PostgreSQL for production and staging, with a fallback to a `db.json` file for local mock development. See `ReadMe/DB.md` for more details.
- **Authentication**: Implements secure, cryptographically-verified authentication for users via the Telegram Web App protocol. A bypass is available for local development. See `ReadMe/API_backend.md` for details.
- **External Integrations**: Connects to AI providers (OpenAI, DeepSeek) to generate dream interpretations.
- **Environment Variables**: Uses `dotenv` for configuration. See `.env.example` for the full list of required variables.

## Deployment

The recommended method for running this application in production is using Docker. The project includes a `Dockerfile` for the backend and a `docker-compose.yml` file to orchestrate all services.

For detailed instructions on how to build and run the application with Docker, please see the **[Deployment Guide](ReadMe/Deployment.md)**.

## Environment Variables

Refer to `.env.example` in the project root for the environment variables required for the Docker setup. The old `backend/.env` is now only used for running the backend service natively without Docker.

## Запуск проекта в режиме Production (с помощью Docker)

Для запуска приложения в режиме, приближенном к продакшену, используется Docker и Docker Compose. Это позволяет упаковать приложение и все его зависимости (базу данных, Node.js, Nginx) в изолированные контейнеры.

### Требования
- Установленный Docker Desktop.

### Настройка
1.  **Создайте файл `.env`** в корневой директории проекта. Скопируйте в него содержимое из `.env.example` и заполните все необходимые ключи API (`OPENAI_API_KEY`, `GOOGLE_GEOCODING_API_KEY` и т.д.) и токен Telegram-бота.
2.  **Убедитесь, что Docker Desktop запущен.**

### Первый запуск
Откройте терминал в корневой папке проекта и выполните команду:
```bash
docker-compose up --build
```
-   `--build`: Эта опция заставит Docker собрать образы для фронтенда и бэкенда заново. Это необходимо при первом запуске или после внесения изменений в код или `Dockerfile`.

### Последующие запуски
Для всех последующих запусков (например, после перезагрузки компьютера) достаточно выполнить:
```bash
docker-compose up
```

### Остановка
Чтобы остановить все контейнеры, нажмите `Ctrl + C` в терминале, где запущен `docker-compose`.

---

## Запуск проекта в режиме Dev (локально)

Этот режим предназначен для активной разработки и отладки.
