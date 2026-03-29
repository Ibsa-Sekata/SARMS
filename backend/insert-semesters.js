const db = require('./config/db');

async function insertSemesters() {
    try {
        // Insert semesters
        await db.execute(`
            INSERT INTO semesters (semester_id, semester_name) VALUES
            (1, '1st Semester'),
            (2, '2nd Semester')
        `);

        console.log('✅ Semesters inserted successfully!');

        // Verify
        const [semesters] = await db.execute('SELECT * FROM semesters');
        console.log('Semesters in database:', semesters);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

insertSemesters();
