# Backend API Endpoints

This document outlines the main API endpoints provided by the backend server.

## Base URL
`http://localhost:8081` (in development)

## Authentication
Authentication is required for all endpoints and is handled based on the environment:

### Production Mode (`DANGEROUSLY_BYPASS_AUTH=false`)
In production, the backend authenticates every request by cryptographically verifying user data sent by the Telegram client.

-   **Header**: `X-Telegram-Init-Data`
-   **Content**: The full `initData` string provided by the Telegram Web App (`window.Telegram.WebApp.initData`).
-   **Process**: The backend uses the `TELEGRAM_BOT_TOKEN` to validate the signature of the `initData` string using HMAC-SHA256. Additionally, it checks the TTL (Time To Live) to ensure the data is not older than 24 hours using absolute time difference. If the signature is valid and TTL check passes, the user's `telegram_id` is extracted from the data and used for the request. If validation fails, the request is rejected with a `401` or `403` error.
-   **Security Features**: 
    - HMAC-SHA256 cryptographic validation
    - TTL check with 24-hour expiration (using `Math.abs()` for time difference)
    - Protection against replay attacks

### Local Development Mode (`DANGEROUSLY_BYPASS_AUTH=true`)
For ease of testing outside the Telegram client (e.g., in a local browser), authentication can be bypassed.

-   **Header**: `X-Telegram-User-ID`
-   **Content**: Any string or number representing a user ID.
-   **Process**: The cryptographic check is skipped. The backend trusts the provided user ID. If the user does not exist in the database, a new entry is created. **This mode must never be used in production.**

Все эндпоинты, кроме `/`, требуют аутентификации.

### Аутентификация (Telegram Web App)

Сервер использует механизм проверки подлинности данных от Telegram Web App.

- **Production (`DANGEROUSLY_BYPASS_AUTH=false`)**:
  - Клиент (фронтенд) должен передавать заголовок `X-Telegram-Init-Data`, содержащий строку `initData` от Telegram.
  - Сервер валидирует эту строку с помощью `TELEGRAM_BOT_TOKEN` для подтверждения подлинности пользователя.
  - В случае успеха в объект `req` добавляется `req.userId`, содержащий Telegram ID пользователя.

- **Local Development (`DANGEROUSLY_BYPASS_AUTH=true`)**:
  - Для удобной локальной разработки в обход Telegram, клиент должен передавать заголовок `X-Telegram-User-ID` с любым тестовым идентификатором (например, `12345-test-user`).
  - Сервер пропустит полную проверку и будет использовать этот ID для всех операций с базой данных.
  - **Внимание:** Этот режим **категорически нельзя** включать на продакшене.

### Эндпоинты

#### `GET /`
- **Описание**: Простая проверка работоспособности сервера.
- **Запрос**: Нет тела.
- **Заголовки**: Нет.
- **Ответ**:
    - **Успех (200 OK)**: JSON объект с сообщением "Server is running".
    ```json
    {
        "message": "Server is running"
    }
    ```

### `GET /profile`
- **Description**: Retrieves the profile data for the authenticated user.
- **Request**: No body.
- **Headers**: `X-Telegram-Init-Data` (Production) or `X-Telegram-User-ID` (Development).
- **Response**: 
    - **Success (200 OK)**: JSON object containing user's profile (`birthDate`, `birthTime`, `birthPlace`).
    ```json
    {
        "birthDate": "1990-01-01",
        "birthTime": "12:00",
        "birthPlace": "New York"
    }
    ```
    - **Error (404 Not Found)**: If profile is not found or empty.
    ```json
    {
        "error": "Profile not found or empty"
    }
    ```

### `PUT /profile`
- **Description**: Updates the profile data for the authenticated user.
- **Request Body**: JSON object with `birthDate`, `birthTime`, and `birthPlace`.
    ```json
    {
        "birthDate": "YYYY-MM-DD",
        "birthTime": "HH:MM",
        "birthPlace": "City, Country"
    }
    ```
- **Headers**: `X-Telegram-Init-Data` (Production) or `X-Telegram-User-ID` (Development).
- **Response**: 
    - **Success (200 OK)**: The updated JSON object of the user's profile.
    ```json
    {
        "birthDate": "1990-01-01",
        "birthTime": "12:00",
        "birthPlace": "New York"
    }
    ```

### `GET /dreams`
### `GET /dreams/:dreamId`
- **Description**: Retrieves a single dream by id (used to restore state on page reload/direct link).
- **Headers**: `X-Telegram-Init-Data` (Production) or `X-Telegram-User-ID` (Development).
- **Response**: Full dream object as stored in the database.

- **Description**: Retrieves the history of interpreted dreams for the authenticated user.
- **Request**: No body.
- **Headers**: `X-Telegram-Init-Data` (Production) or `X-Telegram-User-ID` (Development).
- **Response**: 
    - **Success (200 OK)**: An array of dream objects, ordered from most recent to oldest. Each dream object includes `id`, `date`, `originalText`, and the full `interpretation` object (`title`, `snapshotSummary`, and `lenses`).
    ```json
    [
        {
            "id": "uuid1",
            "date": "YYYY-MM-DD",
            "originalText": "Dream description...",
            "title": "Dream Title",
            "snapshotSummary": "Summary of the dream...",
            "lenses": {
                "psychoanalytic": {
                    "title": "Psychoanalysis",
                    "paragraphs": { ... }
                },
                "esoteric": { ... },
                "astrology": { ... },
                "culturology": { ... }
            }
        },
        // ... more dream objects
    ]
    ```

### `DELETE /dreams`
- **Description**: Deletes specified dreams from the user's history.
- **Request Body**: JSON object containing an array of `dreamIds` to be deleted.
    ```json
    {
        "dreamIds": ["uuid1", "uuid2"]
    }
    ```
- **Headers**: `X-Telegram-Init-Data` (Production) or `X-Telegram-User-ID` (Development).
- **Response**: 
    - **Success (200 OK)**:
    ```json
    {
        "message": "Dreams deleted successfully"
    }
    ```
    - **Error (400 Bad Request)**: If `dreamIds` is missing or not an array.
    ```json
    {
        "error": "dreamIds must be an array"
    }
    ```

### `POST /processDreamText`
- **Description**: This is the **first step** in the dream processing workflow. It creates a placeholder dream entry in the database (with `title`, `processedText`, etc., set to `null`) and returns a `dreamId`. The client must then use this ID to open a WebSocket connection to receive the full interpretation.
- **Request Body**: JSON object with `text`, `lang`, and `date`.
    ```json
    {
        "text": "I dreamt about flying...",
        "lang": "en",
        "date": "2023-10-26"
    }
    ```
- **Headers**: Standard authentication headers.
- **Response**: 
    - **Success (202 Accepted)**: The request has been accepted for processing. The body contains the `dreamId` needed for the WebSocket connection.
    ```json
    {
        "dreamId": "uuid-for-the-new-dream"
    }
    ```
    - **Error (500 Internal Server Error)**: If the initial dream shell cannot be saved.

### WebSocket Endpoint: `/`
- **Description**: This is the **second step**. After getting a `dreamId` from `POST /processDreamText`, the client connects to this endpoint to receive interpretation data in real-time.
- **Connection**: The WebSocket server is running on the same port as the HTTP server. The client should connect to `ws://your-backend-url/` or `wss://your-backend-url/`.

- **Client to Server Messages**:
  - Once connected, the client must send a message to start the interpretation process:
    ```json
    {
        "type": "startInterpretation",
        "payload": {
            "dreamId": "uuid-from-step-1",
            "userId": "current-user-id",
            "lang": "en"
        }
    }
    ```

- **Server to Client Messages**:
  - The server will send a series of messages as data becomes available.
  - **Partial Data**: Each message contains a piece of the final interpretation object. The client should merge these pieces.
    ```json
    {
        "type": "part",
        "payload": {
            "lenses": {
                "psychoanalytic": { ... }
            }
        }
    }
    ```
    ```json
    {
        "type": "part",
        "payload": {
            "lenses": {
                "astrology": { ... }
            }
        }
    }
    ```
    ```json
    {
        "type": "part",
        "payload": {
            "lenses": {
                "tarot": { ... }
            }
        }
    }
    ```
  - **Completion**: A final message indicates that the process is complete.
    ```json
    {
        "type": "done"
    }
    ```
  - **Error**: If an error occurs during processing.
    ```json
    {
        "type": "error",
        "payload": { "message": "Failed to get interpretation from AI." }
    }
    ```

### `PUT /dreams/:dreamId/activeLens`
- **Description**: Persists which lens is currently active for this dream.
- **Body**:
```json
{ "activeLens": "tarot" } // or null
```
- **Response**:
```json
{ "activeLens": "tarot" }
```

### `PUT /dreams/:dreamId/lenses/astrology`
- **Description**: Saves UI progress for Astrology lens.
- **Body**:
```json
{
  "viewedInsights": [0,1,2],
  "isSummaryUnlocked": true,
  "currentIndex": 3
}
```
- **Response**: Updated `lenses.astrology` object.

### `PUT /dreams/:dreamId/lenses/tarot`
- **Description**: Saves Tarot reveal state.
- **Body**:
```json
{ "isRevealed": true }
```
- **Response**: Updated `lenses.tarot` object.

---

## Data Structures

### Dream Object
The final, fully-formed dream object (as stored in the DB and returned by `GET /dreams/:dreamId`) has the following structure:
```json
{
  "id": "uuid-string",
  "date": "YYYY-MM-DD",
  "originalText": "User's raw dream text...",
  "processedText": "LLM-cleaned version of the dream text.",
  "activeLens": "psychoanalytic",
  "title": "AI Generated Title",
  "lenses": {
    "dreambook": {
      "title": "Сонник",
      "content": "Interpretation text...",
      "highlightWords": ["word1", "word2"]
    },
    "psychoanalytic": { "..." },
    "astrology": { "..." },
    "tarot": { "... " }
  }
}
```
    ```
    - **Error (500 Internal Server Error)**: If there's an issue with AI interpretation or saving the dream.
    ```json
    {
        "error": "Failed to get interpretation from AI."
    }
    ```

### `POST /processDreamAudio`
- **Description**: Placeholder endpoint for processing dream audio. This functionality is not yet implemented.
- **Request Body**: Expected to be a `FormData` object containing an audio file.
- **Headers**: `X-Telegram-Init-Data` (Production) or `X-Telegram-User-ID` (Development).
- **Response**: 
    - **Error (501 Not Implemented)**:
    ```json
    {
        "message": "Обработка аудио еще не реализована" 
    }
    ```