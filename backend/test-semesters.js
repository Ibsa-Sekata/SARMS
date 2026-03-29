const db = require('./config/db');

async function testSemesters() {
    try {
        const [semesters] = await db.execute('SELECT * FROM semesters');
        console.log('Semesters in database:', semesters);

        const [settings] = await db.execute('SELECT * FROM system_settings');
        console.log('System settings:', settings);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testSemesters();
