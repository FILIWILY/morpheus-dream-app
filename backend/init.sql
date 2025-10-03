-- This script initializes the database schema for the Morpheus Dream App.
-- It's designed to be idempotent, meaning it can be run multiple times without causing errors.

-- Create the users table to store user profile information.
CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    birth_date DATE,
    birth_time TIME,
    birth_place VARCHAR(255),
    birth_latitude REAL,
    birth_longitude REAL,
    gender VARCHAR(10),
    "natalChart" JSONB,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create the dreams table to store dream interpretations.
-- The 'interpretation' column uses JSONB for efficient storage and querying of complex JSON data.
CREATE TABLE IF NOT EXISTS dreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(telegram_id) ON DELETE CASCADE,
    dream_date TIMESTAMP WITH TIME ZONE NOT NULL,
    dream_text TEXT NOT NULL,
    processed_text TEXT,
    interpretation JSONB NOT NULL,
    active_lens VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance.
-- Index on telegram_id will be crucial for finding users quickly.
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
-- Index on user_id in the dreams table will speed up fetching a user's dream history.
CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON dreams(user_id);

-- Optional: Add a comment to the tables to describe their purpose.
COMMENT ON TABLE users IS 'Stores user profile information, including data for astrological calculations.';
COMMENT ON TABLE dreams IS 'Stores individual dream records and their multi-faceted interpretations from the AI.';
COMMENT ON COLUMN dreams.processed_text IS 'LLM-processed version of the dream text with proper formatting';
