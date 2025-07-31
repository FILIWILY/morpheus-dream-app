# Frontend API Interactions

This document outlines how the frontend application interacts with the backend API.

## API Client
All API calls from the frontend are made using an `axios` instance, which is configured in `frontend/src/services/api.js`.

## Base URL and Proxying
During local development, frontend requests are made to the `/api` path. This path is then expected to be proxied to the backend server's address (e.g., `http://localhost:8081`). This proxying is typically configured via `vite.config.js` and uses the `API_URL` environment variable from `frontend/.env`.

## Authentication (X-Telegram-User-ID Header)
An `axios` interceptor in `frontend/src/services/api.js` automatically adds an `X-Telegram-User-ID` header to all outgoing requests. This header is crucial for the backend to identify and manage user-specific data.

- If the application is running within a Telegram Web App context (`window.Telegram?.WebApp.initDataUnsafe?.user?.id`), the actual Telegram user ID is used.
- Otherwise, a default test user ID (`'12345-test-user'`) is used for development purposes.

## Frontend Components and Backend Endpoint Interactions

| Frontend Component(s) | Description of Interaction                                                                                                                                                                                                                                        | Corresponding Backend Endpoint(s) |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| `RecordingPage.jsx`   | Handles user input for dreams. It sends textual dream descriptions to the backend for AI interpretation. While there's a placeholder for audio processing, it's currently not implemented.
    - **Sends**: Dream text, language, and date.
    - **Receives**: AI-generated dream interpretation with various lenses, which is then passed to `InterpretationPage`. | `POST /processDreamText`<br>`POST /processDreamAudio` (future) |
| `HistoryPage.jsx`     | Responsible for fetching and displaying a user's past dream interpretations. It also provides functionality to delete selected dreams from the history.
    - **Sends**: Requests for dream history; specific dream IDs for deletion.
    - **Receives**: List of historical dreams; confirmation of deletion.                                                  | `GET /dreams`<br>`DELETE /dreams`   |
| `ProfilePage.jsx`     | Manages the user's personal profile information, specifically birth details (date, time, and place). This data is used by the backend for more accurate astrological dream interpretations.
    - **Sends**: Updated birth date, birth time, and birth place.
    - **Receives**: Current or updated user profile data.                                                                    | `GET /profile`<br>`PUT /profile`    |
| `InterpretationPage.jsx` | This page receives the interpreted dream data (usually passed from `RecordingPage` via React Router's `location.state`). It then renders the dream's title, key images, summary, and the detailed interpretations across the four lenses (Psychoanalytic, Esoteric, Astrology, Folkloric). | (Data received via client-side routing, no direct API call from this component for initial data) |