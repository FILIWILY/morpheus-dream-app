# Backend API Endpoints

This document outlines the main API endpoints provided by the backend server.

## Base URL
`http://localhost:8081` (in development)

## Authentication
All requests to these endpoints require an `X-Telegram-User-ID` header. If the user ID is not found in the `db.json` file, a new user entry is automatically created.

## Endpoints

### `GET /profile`
- **Description**: Retrieves the profile data for the authenticated user.
- **Request**: No body.
- **Headers**: `X-Telegram-User-ID: <user_id>`
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
- **Headers**: `X-Telegram-User-ID: <user_id>`
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
- **Headers**: `X-Telegram-User-ID: <user_id>`
- **Response**: Full dream object as stored in `db.json` (see DB_Structure.md).

- **Description**: Retrieves the history of interpreted dreams for the authenticated user.
- **Request**: No body.
- **Headers**: `X-Telegram-User-ID: <user_id>`
- **Response**: 
    - **Success (200 OK)**: An array of dream objects, ordered from most recent to oldest. Each dream object includes `id`, `date`, `originalText`, `title`, `keyImages`, `snapshotSummary`, and `lenses` (containing psychoanalytic, esoteric, astrology, and folkloric interpretations).
    ```json
    [
        {
            "id": "uuid1",
            "date": "YYYY-MM-DD",
            "originalText": "Dream description...",
            "title": "Dream Title",
            "keyImages": ["image1", "image2"],
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
- **Headers**: `X-Telegram-User-ID: <user_id>`
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
- **Description**: Processes a textual dream description using the OpenAI API for interpretation. The interpretation is then saved to the user's dream history. A 5-card Tarot spread is automatically generated and included in the interpretation.
- **Request Body**: JSON object with the dream `text`, `lang` (language of the dream, e.g., 'en', 'ru'), and `date` (date of the dream in YYYY-MM-DD format, or 'today').
    ```json
    {
        "text": "I dreamt about flying...",
        "lang": "en",
        "date": "2023-10-26"
    }
    ```
- **Headers**: `X-Telegram-User-ID: <user_id>`
- **Response**: 
    - **Success (200 OK)**: The new dream entry, including its generated ID, date, original text, and the full AI interpretation. The response now includes enriched lenses.
    ```json
    {
        "id": "uuid3",
        "date": "2023-10-26",
        "originalText": "I dreamt about flying...",
        "title": "Soaring Dreams",
        "keyImages": ["flying", "clouds"],
        "snapshotSummary": "A dream about flying often symbolizes a sense of freedom and control over one's life. It can also represent escaping from reality or overcoming obstacles.",
        "activeLens": null,
        "lenses": {
          /* ... other lenses ... */
          "culturology": {
            "title": "Культурный Код",
            "preface": {
              "title": "Макро-анализ Сновидения",
              "content": "Markdown text for the preface..."
            },
            "analysis": [
              {
                "title": "Архетип: Дорогостоящая Ошибка",
                "content": "Markdown text analyzing the first archetype..."
              },
              {
                "title": "Архетип: Неожиданный Мудрец",
                "content": "Markdown text analyzing the second archetype..."
              }
            ],
            "insight": {
              "title": "Ключевой Инсайт и Практический Совет",
              "content": "Markdown text for the key insight...",
              "recommendation": "Markdown text for the practical advice..."
            }
          }
        }
    }
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
- **Headers**: `X-Telegram-User-ID: <user_id>`
- **Response**: 
    - **Error (501 Not Implemented)**:
    ```json
    {
        "message": "Обработка аудио еще не реализована" 
    }
    ```