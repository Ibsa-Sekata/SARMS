const db = require('./config/db');

async function testLogin() {
    try {
        console.log('Testing database connection...');

        // Test connection
        await db.execute('SELECT 1');
        console.log('✅ Database connection OK\n');

        // Check if users table exists
        console.log('Checking users table...');
        const [users] = await db.execute('SELECT * FROM users');
        console.log(`Found ${users.length} users in database:`);
        users.forEach(user => {
            console.log(`  - ${user.username} (${user.role})`);
        });
        console.log('');

        // Test login with admin credentials
        console.log('Testing login with admin credentials...');
        const [adminUsers] = await db.execute(`
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.role,
                t.teacher_id,
                t.teacher_name
            FROM users u
            LEFT JOIN teachers t ON u.user_id = t.user_id
            WHERE u.username = ? AND u.password = ?
        `, ['admin', 'password123']);

        if (adminUsers.length > 0) {
            console.log('✅ Admin login would succeed');
            console.log('Admin user:', adminUsers[0]);
        } else {
            console.log('❌ Admin login would fail - user not found');
        }
        console.log('');

        // Test login with teacher1 credentials
        console.log('Testing login with teacher1 credentials...');
        const [teacherUsers] = await db.execute(`
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.role,
                t.teacher_id,
                t.teacher_name
            FROM users u
            LEFT JOIN teachers t ON u.user_id = t.user_id
            WHERE u.username = ? AND u.password = ?
        `, ['teacher1', 'password123']);

        if (teacherUsers.length > 0) {
            console.log('✅ Teacher1 login would succeed');
            console.log('Teacher user:', teacherUsers[0]);
        } else {
            console.log('❌ Teacher1 login would fail - user not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testLogin();
