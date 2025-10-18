-- =============================================================================
-- Morpheus Dream App - Simplified Database Schema
-- =============================================================================
-- This script creates a clean, simple database structure for MVP:
-- - users: Telegram authentication (NO CHANGES from old version)
-- - dreams: Store dream and interpretation overview
-- - dream_symbols: Store individual dream symbols/images
-- =============================================================================

-- Drop old tables if migrating from complex version
DROP TABLE IF EXISTS dream_symbols CASCADE;
DROP TABLE IF EXISTS dreams CASCADE;
-- NOTE: We keep users table structure for Telegram auth!

-- =============================================================================
-- TABLE: users
-- =============================================================================
-- Stores user profile information. Structure preserved for Telegram auth!
CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    birth_date DATE,
    birth_time TIME,
    birth_place VARCHAR(255),
    birth_latitude REAL,
    birth_longitude REAL,
    gender VARCHAR(10),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================================================
-- TABLE: dreams
-- =============================================================================
-- Stores dreams and general interpretation info (title, intro, advice)
CREATE TABLE IF NOT EXISTS dreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(telegram_id) ON DELETE CASCADE,
    dream_date DATE NOT NULL,
    dream_text TEXT NOT NULL,
    title VARCHAR(255),
    introduction TEXT,
    advice_title VARCHAR(255),
    advice_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: dream_symbols
-- =============================================================================
-- Stores individual dream symbols/images with their interpretations
CREATE TABLE IF NOT EXISTS dream_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dream_id UUID REFERENCES dreams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    interpretation TEXT NOT NULL,
    category VARCHAR(100),              -- For future analytics (can be NULL)
    symbol_order INTEGER NOT NULL,      -- Display order (1, 2, 3...)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON dreams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dream_symbols_dream_id ON dream_symbols(dream_id);
CREATE INDEX IF NOT EXISTS idx_dream_symbols_category ON dream_symbols(category);

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE users IS 'User profiles and Telegram authentication data';
COMMENT ON TABLE dreams IS 'Dreams with general interpretation info';
COMMENT ON TABLE dream_symbols IS 'Individual dream symbols/images with interpretations';
COMMENT ON COLUMN dream_symbols.category IS 'Symbol category for future analytics (nullable)';
COMMENT ON COLUMN dream_symbols.symbol_order IS 'Display order from OpenAI (1-5)';
