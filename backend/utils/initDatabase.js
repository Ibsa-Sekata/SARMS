// Database initialization utilities
const db = require('../config/db');

async function ensureSettingsTable() {
    try {
        // Check if system_settings table exists
        const [tables] = await db.execute(`
            SHOW TABLES LIKE 'system_settings'
        `);

        if (tables.length === 0) {
            console.log('⚠️  Creating system_settings table...');

            // Create system_settings table
            await db.execute(`
                CREATE TABLE system_settings (
                    setting_id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(50) UNIQUE NOT NULL,
                    setting_value VARCHAR(255) NOT NULL,
                    description VARCHAR(255),
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            console.log('✅ system_settings table created');

            // Insert default settings
            const [years] = await db.execute(`
                SELECT year_id FROM academic_years ORDER BY year_id LIMIT 1
            `);

            const defaultYearId = years.length > 0 ? years[0].year_id : 2;

            await db.execute(`
                INSERT INTO system_settings (setting_key, setting_value, description) VALUES
                ('current_year_id', ?, 'Current academic year ID'),
                ('current_semester_id', '1', 'Current semester ID')
            `, [defaultYearId]);

            console.log('✅ Default settings initialized');
        }
    } catch (error) {
        console.error('❌ Error ensuring settings table:', error.message);
    }
}

module.exports = {
    ensureSettingsTable
};
