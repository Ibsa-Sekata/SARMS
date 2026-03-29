-- Add status field to marks table to track submission to homeroom teacher
USE school_system;

-- Check if status column exists, if not add it
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'school_system' 
    AND TABLE_NAME = 'marks' 
    AND COLUMN_NAME = 'status');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE marks ADD COLUMN status ENUM(''draft'', ''submitted'') DEFAULT ''draft'' AFTER mark',
    'SELECT ''Column status already exists'' as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if submitted_at column exists, if not add it
SET @col_exists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'school_system' 
    AND TABLE_NAME = 'marks' 
    AND COLUMN_NAME = 'submitted_at');

SET @sql2 = IF(@col_exists2 = 0, 
    'ALTER TABLE marks ADD COLUMN submitted_at TIMESTAMP NULL AFTER status',
    'SELECT ''Column submitted_at already exists'' as message');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Add index for status queries (ignore if exists)
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'school_system' 
    AND TABLE_NAME = 'marks' 
    AND INDEX_NAME = 'idx_marks_status');

SET @sql3 = IF(@index_exists = 0, 
    'CREATE INDEX idx_marks_status ON marks(status)',
    'SELECT ''Index idx_marks_status already exists'' as message');

PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

SELECT 'Mark status fields added successfully!' as message;
