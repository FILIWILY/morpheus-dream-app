-- Migration: Add gender column to users table
-- Date: 2025-10-02
-- Description: Adds a gender field to store user's gender information

-- Add gender column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gender'
    ) THEN
        ALTER TABLE users ADD COLUMN gender VARCHAR(10);
        RAISE NOTICE 'Column gender added to users table';
    ELSE
        RAISE NOTICE 'Column gender already exists in users table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN users.gender IS 'User gender: male or female';

