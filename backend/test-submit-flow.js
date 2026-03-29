const db = require('./config/db');

async function testSubmitFlow() {
    try {
        console.log('=== Testing Submit to Homeroom Flow ===\n');

        // 1. Find a teacher with assignments
        console.log('1. Finding teachers with assignments...');
        const [teachers] = await db.execute(`
            SELECT DISTINCT
                t.teacher_id,
                t.teacher_name,
                ta.subject_id,
                sub.subject_name,
                ta.class_id,
                g.grade_number,
                sec.section_name
            FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            JOIN subjects sub ON ta.subject_id = sub.subject_id
            JOIN classes c ON ta.class_id = c.class_id
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            WHERE ta.year_id = 1
            LIMIT 5
        `);

        console.log(`Found ${teachers.length} teacher assignments:`);
        teachers.forEach(t => {
            console.log(`  - ${t.teacher_name} teaches ${t.subject_name} to Grade ${t.grade_number}${t.section_name} (Class ID: ${t.class_id})`);
        });

        if (teachers.length === 0) {
            console.log('❌ No teacher assignments found!');
            process.exit(1);
        }

        const testTeacher = teachers[0];
        console.log(`\nUsing ${testTeacher.teacher_name} for testing...\n`);

        // 2. Check students in this class
        console.log('2. Checking students in this class...');
        const [students] = await db.execute(`
            SELECT student_id, student_name
            FROM students
            WHERE class_id = ?
            LIMIT 5
        `, [testTeacher.class_id]);

        console.log(`Found ${students.length} students:`);
        students.forEach(s => {
            console.log(`  - ${s.student_name} (ID: ${s.student_id})`);
        });

        // 3. Check existing marks for this teacher/class/subject
        console.log('\n3. Checking existing marks...');
        const [existingMarks] = await db.execute(`
            SELECT 
                m.mark_id,
                m.student_id,
                m.mark,
                m.status,
                s.student_name
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            WHERE m.teacher_id = ?
              AND m.subject_id = ?
              AND m.year_id = 1
              AND m.semester_id = 1
              AND s.class_id = ?
        `, [testTeacher.teacher_id, testTeacher.subject_id, testTeacher.class_id]);

        console.log(`Found ${existingMarks.length} existing marks:`);
        existingMarks.forEach(m => {
            console.log(`  - ${m.student_name}: ${m.mark} [${m.status}]`);
        });

        // 4. Simulate submitting marks (if there are draft marks)
        const draftMarks = existingMarks.filter(m => m.status === 'draft');
        if (draftMarks.length > 0) {
            console.log(`\n4. Simulating "Submit to Homeroom" for ${draftMarks.length} draft marks...`);

            const [result] = await db.execute(`
                UPDATE marks 
                SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
                WHERE teacher_id = ? 
                  AND subject_id = ? 
                  AND year_id = 1
                  AND semester_id = 1
                  AND student_id IN (SELECT student_id FROM students WHERE class_id = ?)
                  AND status = 'draft'
            `, [testTeacher.teacher_id, testTeacher.subject_id, testTeacher.class_id]);

            console.log(`✓ Updated ${result.affectedRows} marks to 'submitted' status`);
        } else {
            console.log('\n4. No draft marks to submit');
        }

        // 5. Check submitted marks
        console.log('\n5. Checking submitted marks...');
        const [submittedMarks] = await db.execute(`
            SELECT 
                m.mark_id,
                m.student_id,
                m.mark,
                m.status,
                m.submitted_at,
                s.student_name
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            WHERE m.teacher_id = ?
              AND m.subject_id = ?
              AND m.year_id = 1
              AND m.semester_id = 1
              AND s.class_id = ?
              AND m.status = 'submitted'
        `, [testTeacher.teacher_id, testTeacher.subject_id, testTeacher.class_id]);

        console.log(`Found ${submittedMarks.length} submitted marks:`);
        submittedMarks.forEach(m => {
            console.log(`  - ${m.student_name}: ${m.mark} [${m.status}] at ${m.submitted_at}`);
        });

        // 6. Check what homeroom teacher would see
        console.log('\n6. Checking what homeroom teacher would see...');
        const [homeroomClass] = await db.execute(`
            SELECT 
                c.class_id,
                c.homeroom_teacher_id,
                t.teacher_name as homeroom_teacher
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            WHERE c.class_id = ?
        `, [testTeacher.class_id]);

        if (homeroomClass.length > 0 && homeroomClass[0].homeroom_teacher_id) {
            console.log(`Homeroom teacher: ${homeroomClass[0].homeroom_teacher} (ID: ${homeroomClass[0].homeroom_teacher_id})`);

            // Query what homeroom teacher would see
            const [homeroomView] = await db.execute(`
                SELECT 
                    m.mark_id,
                    m.student_id,
                    m.subject_id,
                    m.mark,
                    m.status,
                    s.student_name,
                    sub.subject_name,
                    t.teacher_name
                FROM marks m
                JOIN students s ON m.student_id = s.student_id
                JOIN subjects sub ON m.subject_id = sub.subject_id
                JOIN teachers t ON m.teacher_id = t.teacher_id
                WHERE s.class_id = ?
                  AND m.year_id = 1
                  AND m.semester_id = 1
                  AND m.status = 'submitted'
            `, [testTeacher.class_id]);

            console.log(`\nHomeroom teacher would see ${homeroomView.length} submitted marks:`);
            homeroomView.forEach(m => {
                console.log(`  - ${m.student_name} (${m.subject_name}): ${m.mark} by ${m.teacher_name}`);
            });
        } else {
            console.log('❌ No homeroom teacher assigned to this class!');
        }

        console.log('\n=== Test Complete ===');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testSubmitFlow();
