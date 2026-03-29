const db = require('./config/db');

async function testBackendFunction() {
    try {
        console.log('=== Testing Backend Function Directly ===\n');

        // Simulate the backend function
        const teacher_id = 7; // ibsa0
        const year_id = 1;
        const semester_id = 1;

        console.log(`Testing for teacher_id: ${teacher_id}, year: ${year_id}, semester: ${semester_id}\n`);

        // Step 1: Get homeroom teacher's class
        console.log('1. Getting homeroom teacher class...');
        const [classes] = await db.execute(`
            SELECT class_id, grade_id, section_id
            FROM classes
            WHERE homeroom_teacher_id = ?
        `, [teacher_id]);

        if (classes.length === 0) {
            console.log('❌ Teacher is not a homeroom teacher!');
            process.exit(1);
        }

        const classId = classes[0].class_id;
        console.log(`✓ Homeroom class ID: ${classId}`);

        // Step 2: Get submitted marks
        console.log('\n2. Getting submitted marks...');
        const [marks] = await db.execute(`
            SELECT 
                m.mark_id,
                m.student_id,
                m.subject_id,
                m.teacher_id,
                m.mark,
                m.status,
                m.submitted_at,
                s.student_name,
                s.student_code,
                sub.subject_name,
                t.teacher_name,
                t.teacher_id as subject_teacher_id
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN subjects sub ON m.subject_id = sub.subject_id
            JOIN teachers t ON m.teacher_id = t.teacher_id
            WHERE s.class_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND m.status = 'submitted'
            ORDER BY sub.subject_name, s.student_name
        `, [classId, year_id, semester_id]);

        console.log(`Found ${marks.length} submitted marks`);
        if (marks.length > 0) {
            marks.forEach(m => {
                console.log(`  - ${m.student_name} (${m.subject_name}): ${m.mark} by ${m.teacher_name}`);
            });
        }

        // Step 3: Get summary
        console.log('\n3. Getting summary...');
        const [summary] = await db.execute(`
            SELECT 
                sub.subject_id,
                sub.subject_name,
                t.teacher_name,
                COUNT(m.mark_id) as submitted_count,
                (SELECT COUNT(*) FROM students WHERE class_id = ?) as total_students
            FROM marks m
            JOIN subjects sub ON m.subject_id = sub.subject_id
            JOIN teachers t ON m.teacher_id = t.teacher_id
            JOIN students s ON m.student_id = s.student_id
            WHERE s.class_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND m.status = 'submitted'
            GROUP BY sub.subject_id, sub.subject_name, t.teacher_name
        `, [classId, classId, year_id, semester_id]);

        console.log(`Found ${summary.length} subjects in summary`);
        if (summary.length > 0) {
            summary.forEach(s => {
                console.log(`  - ${s.subject_name} by ${s.teacher_name}: ${s.submitted_count}/${s.total_students}`);
            });
        }

        // Step 4: Simulate API response
        console.log('\n4. API would return:');
        const response = {
            success: true,
            class_id: classId,
            marks: marks,
            summary: summary
        };
        console.log(JSON.stringify(response, null, 2));

        if (marks.length === 0 && summary.length === 0) {
            console.log('\n❌ PROBLEM: No data to show on approval page!');
        } else {
            console.log('\n✅ Backend function is working correctly!');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testBackendFunction();
