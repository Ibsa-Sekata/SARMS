-- Update marks status ENUM to include 'approved' value

ALTER TABLE marks 
MODIFY COLUMN status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft';
