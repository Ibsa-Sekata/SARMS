const db = require('./config/db');

async function checkUsers() {
    try {
        console.log('=== Checking User Accounts ===\n');

        const [users] = await db.execute(`
            SELECT 
                u.user_id,
                u.username,
                u.password,
                u.role,
                t.teacher_id,
                t.teacher_name
            FROM users u
            LEFT JOIN teachers t ON u.user_id = t.user_id
            WHERE u.role = 'teacher'
            ORDER BY u.user_id
        `);

        console.table(users);

        console.log('\n=== Done ===');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
