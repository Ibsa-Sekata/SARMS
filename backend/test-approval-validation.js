const mysql = require('mysql2/promise');

async function testApprovalValidation() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'IbsaMysql1',
        database: 'school_system'
    });

    try {
        console.log('=== Testing Approval Validation ===\n');

        // Get homeroom teacher's class
        const [classes] = await connection.execute(`
      SELECT class_id, homeroom_teacher_id
      FROM classes
      WHERE homeroom_teacher_id IS NOT NULL
      LIMIT 1
    `);

        if (classes.length === 0) {
            console.log('No homeroom teacher found');
            return;
        }

        const classId = classes[0].class_id;
        const teacherId = classes[0].homeroom_teacher_id;
        const yearId = 1;
        const semesterId = 1;

        console.log(`Testing for Class ID: ${classId}, Teacher ID: ${teacherId}\n`);

        // Get total students in class
        const [studentCount] = await connection.execute(
            'SELECT COUNT(*) as total FROM students WHERE class_id = ?',
            [classId]
        );
        const totalStudents = studentCount[0].total;
        console.log(`Total students in class: ${totalStudents}\n`);

        // Get all subjects assigned to this class
        const [assignedSubjects] = await connection.execute(`
      SELECT DISTINCT ta.subject_id, s.subject_name, t.teacher_name
      FROM teacher_assignments ta
      JOIN subjects s ON ta.subject_id = s.subject_id
      JOIN teachers t ON ta.teacher_id = t.teacher_id
      WHERE ta.class_id = ? AND ta.year_id = ?
    `, [classId, yearId]);

        console.log('Subjects assigned to this class:');
        assignedSubjects.forEach(sub => {
            console.log(`  - ${sub.subject_name} (Teacher: ${sub.teacher_name})`);
        });
        console.log('');

        // Check submission status for each subject
        console.log('Submission Status:');
        const [submissionStatus] = await connection.execute(`
      SELECT 
        sub.subject_id,
        sub.subject_name,
        t.teacher_name,
        COALESCE(submitted.count, 0) as submitted_count,
        ? as total_students
      FROM teacher_assignments ta
      JOIN subjects sub ON ta.subject_id = sub.subject_id
      JOIN teachers t ON ta.teacher_id = t.teacher_id
      LEFT JOIN (
        SELECT subject_id, COUNT(*) as count
        FROM marks m
        JOIN students s ON m.student_id = s.student_id
        WHERE s.class_id = ?
          AND m.year_id = ?
          AND m.semester_id = ?
          AND m.status = 'submitted'
        GROUP BY subject_id
      ) submitted ON sub.subject_id = submitted.subject_id
      WHERE ta.class_id = ? AND ta.year_id = ?
      ORDER BY sub.subject_name
    `, [totalStudents, classId, yearId, semesterId, classId, yearId]);

        let allComplete = true;
        submissionStatus.forEach(subject => {
            const isComplete = subject.submitted_count === subject.total_students;
            const status = isComplete ? '✓ COMPLETE' : '✗ INCOMPLETE';
            console.log(`  ${status} - ${subject.subject_name}: ${subject.submitted_count}/${subject.total_students} students (Teacher: ${subject.teacher_name})`);
            if (!isComplete) allComplete = false;
        });

        console.log('\n=== Validation Result ===');
        if (allComplete) {
            console.log('✓ All subjects have marks for all students - APPROVAL ALLOWED');
        } else {
            console.log('✗ Not all subjects have marks for all students - APPROVAL BLOCKED');
            const incompleteSubjects = submissionStatus.filter(
                s => s.submitted_count < s.total_students
            );
            console.log('\nIncomplete subjects:');
            incompleteSubjects.forEach(s => {
                console.log(`  - ${s.subject_name}: ${s.submitted_count}/${s.total_students} students`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

testApprovalValidation();
