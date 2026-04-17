-- Add domain column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS domain VARCHAR(255) NULL AFTER description;

-- Populate domains from task areas
UPDATE projects p
SET domain = (
    SELECT area
    FROM tasks t
    WHERE t.project_id = p.id 
    AND t.area IS NOT NULL 
    AND t.area != ''
    GROUP BY area
    ORDER BY COUNT(*) DESC
    LIMIT 1
)
WHERE p.domain IS NULL OR p.domain = '';
