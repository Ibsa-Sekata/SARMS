const db = require('./config/db');

async function testSubjects() {
    try {
        const [subjects] = await db.execute('SELECT * FROM subjects');
        console.log('Subjects in database:', subjects);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testSubjects();
