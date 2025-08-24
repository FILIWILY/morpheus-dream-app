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
- **External Integrations**: Connects to the OpenAI API (`backend/src/services/openai.js`) to generate dream interpretations.
- **Environment Variables**: Uses `dotenv` for configuration (e.g., `PORT`, `OPENAI_API_KEY`).
- **Data Storage**: `db.json` is actively used for persistence of user profiles and dreams.
- **Core Logic**:
    - `server.js`: Sets up the Express server, handles routes, and manages interactions with the OpenAI service.
    - `openai.js`: Contains the logic for constructing prompts and interacting with the OpenAI API for dream interpretation, formatting the response into the required JSON structure with various "lenses" (Psychoanalytic, Esoteric, Astrology, Folkloric).

## Environment Variables

Refer to `example.env.txt` for details on environment variables required for both frontend and backend.
