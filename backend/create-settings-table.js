const db = require('./config/db');

async function createSettingsTable() {
    try {
        console.log('Creating system_settings table...');

        // Create table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(50) UNIQUE NOT NULL,
                setting_value VARCHAR(255) NOT NULL,
                description VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('✓ Table created');

        // Insert default settings
        await db.execute(`
            INSERT INTO system_settings (setting_key, setting_value, description) VALUES
            ('current_year_id', '1', 'Current academic year ID'),
            ('current_semester_id', '1', 'Current semester ID')
            ON DUPLICATE KEY UPDATE setting_value = setting_value
        `);

        console.log('✓ Default settings inserted');

        // Verify
        const [settings] = await db.execute('SELECT * FROM system_settings');
        console.log('\nCurrent settings:');
        settings.forEach(s => {
            console.log(`  - ${s.setting_key}: ${s.setting_value} (${s.description})`);
        });

        console.log('\n✓ Settings table ready!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createSettingsTable();
