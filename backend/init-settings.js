// Initialize system settings table
const db = require('./config/db');

async function initializeSettings() {
    console.log('🔧 Initializing system settings...\n');

    try {
        // Check if system_settings table exists
        console.log('1. Checking if system_settings table exists...');
        const [tables] = await db.execute(`
            SHOW TABLES LIKE 'system_settings'
        `);

        if (tables.length === 0) {
            console.log('   ⚠️  Table does not exist. Creating...');

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

            console.log('   ✅ Table created successfully');
        } else {
            console.log('   ✅ Table already exists');
        }

        // Check if default settings exist
        console.log('\n2. Checking default settings...');
        const [settings] = await db.execute(`
            SELECT setting_key FROM system_settings
            WHERE setting_key IN ('current_year_id', 'current_semester_id')
        `);

        if (settings.length === 0) {
            console.log('   ⚠️  No default settings found. Creating...');

            // Get the first academic year from database
            const [years] = await db.execute(`
                SELECT year_id FROM academic_years ORDER BY year_id LIMIT 1
            `);

            const defaultYearId = years.length > 0 ? years[0].year_id : 2;

            // Insert default settings
            await db.execute(`
                INSERT INTO system_settings (setting_key, setting_value, description) VALUES
                ('current_year_id', ?, 'Current academic year ID'),
                ('current_semester_id', '1', 'Current semester ID')
            `, [defaultYearId]);

            console.log(`   ✅ Default settings created (year_id: ${defaultYearId}, semester_id: 1)`);
        } else {
            console.log('   ✅ Default settings already exist');
        }

        // Display current settings
        console.log('\n3. Current settings:');
        const [currentSettings] = await db.execute(`
            SELECT ss.setting_key, ss.setting_value, ay.year_name
            FROM system_settings ss
            LEFT JOIN academic_years ay ON ss.setting_value = ay.year_id AND ss.setting_key = 'current_year_id'
            WHERE ss.setting_key IN ('current_year_id', 'current_semester_id')
        `);

        currentSettings.forEach(setting => {
            if (setting.setting_key === 'current_year_id') {
                console.log(`   - Academic Year: ${setting.year_name || 'Not Set'} (ID: ${setting.setting_value})`);
            } else if (setting.setting_key === 'current_semester_id') {
                const semesterName = setting.setting_value === '1' ? '1st Semester' : '2nd Semester';
                console.log(`   - Semester: ${semesterName} (ID: ${setting.setting_value})`);
            }
        });

        console.log('\n✅ System settings initialized successfully!\n');

    } catch (error) {
        console.error('❌ Error initializing settings:', error.message);
        console.error('   Error details:', error);
    } finally {
        process.exit(0);
    }
}

initializeSettings();
