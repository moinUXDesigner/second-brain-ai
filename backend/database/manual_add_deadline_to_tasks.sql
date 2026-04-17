-- Add deadline_date column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS deadline_date DATE NULL AFTER due_date;
