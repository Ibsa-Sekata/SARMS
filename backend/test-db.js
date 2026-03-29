const db = require('./config/db');

async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');

        // Test basic connection
        const [result] = await db.execute('SELECT 1 as test');
        console.log('✅ Database connection successful:', result);

        // Test if school_system database exists
        const [databases] = await db.execute('SHOW DATABASES LIKE "school_system"');
        if (databases.length === 0) {
            console.log('❌ school_system database not found');
            console.log('Please create the database using the schema.sql file');
            return;
        }
        console.log('✅ school_system database found');

        // Test if tables exist
        const [tables] = await db.execute('SHOW TABLES FROM school_system');
        console.log('📋 Tables in school_system database:', tables.map(t => Object.values(t)[0]));

        // Test sample data
        const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
        console.log('👤 Users count:', users[0].count);

        const [teachers] = await db.execute('SELECT COUNT(*) as count FROM teachers');
        console.log('👥 Teachers count:', teachers[0].count);

        const [students] = await db.execute('SELECT COUNT(*) as count FROM students');
        console.log('🎓 Students count:', students[0].count);

        const [classes] = await db.execute('SELECT COUNT(*) as count FROM classes');
        console.log('🏫 Classes count:', classes[0].count);

        // Test sample user login
        const [sampleUser] = await db.execute(`
            SELECT 
                u.username,
                u.email,
                u.role,
                t.teacher_name,
                d.department_name
            FROM users u
            LEFT JOIN teachers t ON u.user_id = t.user_id
            LEFT JOIN departments d ON t.department_id = d.department_id
            WHERE u.role = 'teacher'
            LIMIT 1
        `);

        if (sampleUser.length > 0) {
            console.log('📧 Sample teacher for testing:', {
                username: sampleUser[0].username,
                email: sampleUser[0].email,
                name: sampleUser[0].teacher_name,
                department: sampleUser[0].department_name,
                password: 'password123'
            });
        }

        // Test admin user
        const [adminUser] = await db.execute(`
            SELECT username, email, role
            FROM users
            WHERE role = 'admin'
            LIMIT 1
        `);

        if (adminUser.length > 0) {
            console.log('👑 Admin user for testing:', {
                username: adminUser[0].username,
                email: adminUser[0].email,
                password: 'password123'
            });
        }

        console.log('✅ Database test completed successfully!');

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        process.exit(0);
    }
}

testDatabaseConnection();
