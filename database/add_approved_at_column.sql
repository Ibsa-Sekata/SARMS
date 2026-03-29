-- Add approved_at column to marks table for homeroom teacher approval tracking

ALTER TABLE marks 
ADD COLUMN approved_at TIMESTAMP NULL AFTER submitted_at;

-- Update existing 'approved' marks to have an approved_at timestamp
UPDATE marks 
SET approved_at = submitted_at 
WHERE status = 'approved' AND approved_at IS NULL;
