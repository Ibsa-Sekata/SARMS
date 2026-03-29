const db = require('./config/db');

async function testYear() {
    try {
        const [settings] = await db.execute('SELECT * FROM system_settings');
        console.log('System settings:', settings);

        const [years] = await db.execute('SELECT * FROM academic_years');
        console.log('Academic years:', years);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testYear();
