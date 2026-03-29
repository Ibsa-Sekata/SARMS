// Quick database verification script
const db = require('./config/db');

async function verifyDatabase() {
    console.log('🔍 Verifying database setup...\n');

    try {
        // Test connection
        console.log('1. Testing database connection...');
        const [result] = await db.execute('SELECT 1 as test');
        console.log('   ✅ Database connection successful\n');

        // Check departments
        console.log('2. Checking departments...');
        const [departments] = await db.execute('SELECT * FROM departments ORDER BY department_name');
        console.log(`   ✅ Found ${departments.length} departments:`);
        departments.forEach(dept => {
            console.log(`      - ${dept.department_name} (ID: ${dept.department_id})`);
        });
        console.log('');

        // Check users
        console.log('3. Checking users...');
        const [users] = await db.execute('SELECT user_id, username, role FROM users');
        console.log(`   ✅ Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`      - ${user.username} (${user.role})`);
        });
        console.log('');

        // Check teachers
        console.log('4. Checking teachers...');
        const [teachers] = await db.execute('SELECT teacher_id, teacher_name FROM teachers');
        console.log(`   ✅ Found ${teachers.length} teachers:`);
        teachers.forEach(teacher => {
            console.log(`      - ${teacher.teacher_name} (ID: ${teacher.teacher_id})`);
        });
        console.log('');

        // Check classes
        console.log('5. Checking classes...');
        const [classes] = await db.execute(`
            SELECT c.class_id, g.grade_number, sec.section_name, t.teacher_name as homeroom_teacher
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            ORDER BY g.grade_number, sec.section_name
        `);
        console.log(`   ✅ Found ${classes.length} classes:`);
        classes.forEach(cls => {
            console.log(`      - Grade ${cls.grade_number}${cls.section_name} (Homeroom: ${cls.homeroom_teacher || 'None'})`);
        });
        console.log('');

        // Check students
        console.log('6. Checking students...');
        const [students] = await db.execute('SELECT student_id, student_name, gender FROM students');
        console.log(`   ✅ Found ${students.length} students`);
        console.log('');

        // Check subjects
        console.log('7. Checking subjects...');
        const [subjects] = await db.execute('SELECT subject_id, subject_name FROM subjects');
        console.log(`   ✅ Found ${subjects.length} subjects:`);
        subjects.forEach(subject => {
            console.log(`      - ${subject.subject_name} (ID: ${subject.subject_id})`);
        });
        console.log('');

        // Check academic years
        console.log('8. Checking academic years...');
        const [years] = await db.execute('SELECT year_id, year_name FROM academic_years');
        console.log(`   ✅ Found ${years.length} academic years:`);
        years.forEach(year => {
            console.log(`      - ${year.year_name} (ID: ${year.year_id})`);
        });
        console.log('');

        // Check semesters
        console.log('9. Checking semesters...');
        const [semesters] = await db.execute('SELECT semester_id, semester_name FROM semesters');
        console.log(`   ✅ Found ${semesters.length} semesters:`);
        semesters.forEach(semester => {
            console.log(`      - ${semester.semester_name} (ID: ${semester.semester_id})`);
        });
        console.log('');

        console.log('✅ Database verification complete!\n');
        console.log('📝 Summary:');
        console.log(`   - Departments: ${departments.length}`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Teachers: ${teachers.length}`);
        console.log(`   - Classes: ${classes.length}`);
        console.log(`   - Students: ${students.length}`);
        console.log(`   - Subjects: ${subjects.length}`);
        console.log(`   - Academic Years: ${years.length}`);
        console.log(`   - Semesters: ${semesters.length}`);
        console.log('');

        if (departments.length === 0) {
            console.log('⚠️  WARNING: No departments found!');
            console.log('   Run the INSERT_ALL_DATA.sql script to populate the database.');
        }

        if (users.length === 0) {
            console.log('⚠️  WARNING: No users found!');
            console.log('   Run the INSERT_ALL_DATA.sql script to populate the database.');
        }

    } catch (error) {
        console.error('❌ Database verification failed:', error.message);
        console.error('   Error details:', error);
    } finally {
        process.exit(0);
    }
}

verifyDatabase();
