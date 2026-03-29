const db = require('./config/db');

async function insertSubjects() {
    try {
        // Insert subjects
        await db.execute(`
            INSERT INTO subjects (subject_name, department_id) VALUES
            ('Mathematics', 1),
            ('English', 2),
            ('Biology', 3),
            ('Chemistry', 4),
            ('Physics', 5)
        `);

        console.log('✅ Subjects inserted successfully!');

        // Verify
        const [subjects] = await db.execute('SELECT * FROM subjects');
        console.log('Subjects in database:', subjects);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

insertSubjects();
