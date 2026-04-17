-- Manual migration for time tracking columns
-- Run this SQL directly on the database if the Laravel migration fails

-- Add time_spent column (stores time in seconds)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS time_spent INT DEFAULT 0;

-- Add timer_started_at column (stores when timer was started)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP NULL;

-- Add timer_running column (boolean flag for timer state)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS timer_running TINYINT(1) DEFAULT 0;

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'tasks' 
AND COLUMN_NAME IN ('time_spent', 'timer_started_at', 'timer_running');
