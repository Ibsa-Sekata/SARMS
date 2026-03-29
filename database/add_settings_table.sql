-- Add settings table for system configuration
USE school_system;

-- Create settings table
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('current_year_id', '2', 'Current academic year ID'),
('current_semester_id', '1', 'Current semester ID')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Verify settings
SELECT * FROM system_settings;
