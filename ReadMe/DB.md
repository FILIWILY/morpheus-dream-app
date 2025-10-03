# Database Architecture and Management

This document details the database architecture for the Morpheus Dream App, which uses PostgreSQL for production and a `db.json` file for mock development.

## Production Database: PostgreSQL

For production and staging environments, the application uses a PostgreSQL database. The schema is designed to be relational for core data while leveraging the power of `JSONB` for flexible, semi-structured data.

### Schema Definition (`init.sql`)

The database schema is defined in `backend/init.sql`. This script is designed to be idempotent, meaning it can be run multiple times without causing errors. It automatically creates the necessary tables, indexes, and relationships.

When using Docker Compose (`docker-compose up`), this script is **automatically executed** the first time the database container is created, so no manual setup is required.

#### `users` Table
Stores essential information about each user.

| Column | Type | Description |
|---|---|---|
| `telegram_id` | `TEXT PRIMARY KEY` | The user's ID from Telegram, used for authentication and as the primary identifier. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Timestamp of user registration. |
| `birth_date` | `DATE` | User's birth date for astrology calculations. |
| `birth_time` | `TIME` | User's birth time for astrology calculations. |
| `birth_place` | `VARCHAR(255)` | User's birth place for astrology calculations. |
| `birth_latitude` | `REAL` | Geocoded latitude of the birth place. |
| `birth_longitude` | `REAL` | Geocoded longitude of the birth place. |
| `"natalChart"` | `JSONB` | Stores the calculated natal chart data as a JSON object. |
| `onboarding_completed` | `BOOLEAN` | `false` by default. Set to `true` after the user saves or skips the `ProfilePage` for the first time. Prevents the user from being sent back into the onboarding flow on subsequent sessions. |

#### `dreams` Table
Stores each dream and its full interpretation.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Unique identifier for the dream. |
| `user_id` | `TEXT` | Foreign key referencing `users.telegram_id`. Ensures dreams are linked to a user. |
| `dream_date` | `TIMESTAMP WITH TIME ZONE` | The date and time the dream occurred, as specified by the user. |
| `dream_text` | `TEXT NOT NULL` | The raw text of the dream. |
| `processed_text` | `TEXT` | LLM-processed version of the dream text with proper formatting and punctuation. |
| `interpretation` | `JSONB NOT NULL` | The complete JSON object received from the AI, including `title` and all `lenses`. |
| `active_lens` | `VARCHAR(50)` | Stores which lens the user last viewed for this dream. |
| `created_at` | `TIMESTAMPTZ` | Timestamp of when the dream was saved. |

---

## Development Database (`db.json`)

For local development and testing, the application can be configured to use a simple JSON file database (`backend/db.json`). This avoids the need to constantly write to the production database.

### Usage

This mode is controlled by the `DATABASE_TYPE` environment variable.

-   `DATABASE_TYPE=json`: The data access layer will read from and write to `backend/db.json`.
-   `DATABASE_TYPE=postgres`: The data access layer will connect to the PostgreSQL database specified by `DATABASE_URL`.

The structure of `db.json` mirrors the production schema in a nested format.

**Note:** `DATABASE_TYPE` is independent from `USE_MOCK_AI`. You can use mock AI responses with any database type:
- `DATABASE_TYPE=json` + `USE_MOCK_AI=true` - JSON database with mock AI
- `DATABASE_TYPE=postgres` + `USE_MOCK_AI=true` - PostgreSQL with mock AI
