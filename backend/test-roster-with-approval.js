const mysql = require('mysql2/promise');

async function testRosterWithApproval() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'IbsaMysql1',
        database: 'school_system'
    });

    try {
        console.log('=== Testing Roster Generation with Approval Status ===\n');

        const classId = 2;
        const yearId = 1;
        const semesterId = 1;

        // Check mark statuses
        console.log('Current mark statuses in database:');
        const [markStatuses] = await connection.execute(`
      SELECT 
        m.status,
        COUNT(*) as count
      FROM marks m
      JOIN students s ON m.student_id = s.student_id
      WHERE s.class_id = ?
        AND m.year_id = ?
        AND m.semester_id = ?
      GROUP BY m.status
    `, [classId, yearId, semesterId]);

        markStatuses.forEach(status => {
            console.log(`  ${status.status}: ${status.count} marks`);
        });

        if (markStatuses.length === 0) {
            console.log('  No marks found in database');
        }

        console.log('\n=== Roster Query (ONLY APPROVED MARKS) ===\n');

        // This is the same query used in reportController.js
        const [students] = await connection.execute(`
      SELECT 
        s.student_id,
        s.student_name,
        s.gender,
        s.student_code,
        MAX(CASE WHEN sub.subject_name = 'Mathematics' THEN m.mark END) as maths,
        MAX(CASE WHEN sub.subject_name = 'English' THEN m.mark END) as eng,
        MAX(CASE WHEN sub.subject_name = 'Biology' THEN m.mark END) as bio,
        MAX(CASE WHEN sub.subject_name = 'Chemistry' THEN m.mark END) as chem,
        MAX(CASE WHEN sub.subject_name = 'Physics' THEN m.mark END) as phy
      FROM students s
      LEFT JOIN marks m ON s.student_id = m.student_id 
        AND m.year_id = ? 
        AND m.semester_id = ?
        AND m.status = 'approved'
      LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
      WHERE s.class_id = ?
      GROUP BY s.student_id, s.student_name, s.gender, s.student_code
      ORDER BY s.student_name
    `, [yearId, semesterId, classId]);

        console.log(`Found ${students.length} students in class ${classId}\n`);

        if (students.length > 0) {
            console.log('Student marks (only approved marks shown):');
            students.forEach(student => {
                const maths = student.maths || 0;
                const eng = student.eng || 0;
                const bio = student.bio || 0;
                const chem = student.chem || 0;
                const phy = student.phy || 0;
                const total = maths + eng + bio + chem + phy;
                const average = total / 5;

                console.log(`\n  ${student.student_name} (${student.student_code})`);
                console.log(`    Maths: ${maths}, English: ${eng}, Biology: ${bio}, Chemistry: ${chem}, Physics: ${phy}`);
                console.log(`    Total: ${total}, Average: ${average.toFixed(1)}`);
            });
        }

        console.log('\n=== Summary ===');
        console.log('The roster generation query ONLY includes marks with status = "approved"');
        console.log('If no marks are approved, the roster will show all zeros');
        console.log('Homeroom teacher must approve marks before roster shows actual grades');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

testRosterWithApproval();
