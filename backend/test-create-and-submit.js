const db = require('./config/db');

async function testCreateAndSubmit() {
    try {
        console.log('=== Testing Create and Submit Marks ===\n');

        // Use Mathematics teacher (ibsa4) for Grade 9A
        const teacher_id = 9; // ibsa4
        const subject_id = 1; // Mathematics
        const class_id = 2; // Grade 9A
        const year_id = 1;
        const semester_id = 1;

        console.log('1. Getting students in Grade 9A...');
        const [students] = await db.execute(`
            SELECT student_id, student_name
            FROM students
            WHERE class_id = ?
        `, [class_id]);

        console.log(`Found ${students.length} students`);

        // 2. Check existing marks first
        console.log('\n2. Checking existing marks...');
        const [existingBefore] = await db.execute(`
            SELECT 
                m.mark_id,
                s.student_name,
                m.mark,
                m.status
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            WHERE m.teacher_id = ?
              AND m.subject_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND s.class_id = ?
        `, [teacher_id, subject_id, year_id, semester_id, class_id]);

        console.log(`Found ${existingBefore.length} existing marks`);
        if (existingBefore.length > 0) {
            console.log('Deleting them...');
            await db.execute(`
                DELETE FROM marks
                WHERE teacher_id = ?
                  AND subject_id = ?
                  AND year_id = ?
                  AND semester_id = ?
                  AND student_id IN (SELECT student_id FROM students WHERE class_id = ?)
            `, [teacher_id, subject_id, year_id, semester_id, class_id]);
            console.log('✓ Deleted');
        };

        // 3. Create/Update draft marks
        console.log('\n3. Creating draft marks...');
        for (const student of students) {
            const mark = Math.floor(Math.random() * 50) + 50; // Random mark 50-100
            await db.execute(`
                INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark, status)
                VALUES (?, ?, ?, ?, ?, ?, 'draft')
                ON DUPLICATE KEY UPDATE mark = ?, status = 'draft', submitted_at = NULL
            `, [student.student_id, subject_id, teacher_id, semester_id, year_id, mark, mark]);
            console.log(`  - Created draft mark for ${student.student_name}: ${mark}`);
        }

        // 4. Check draft marks
        console.log('\n4. Checking draft marks...');
        const [draftMarks] = await db.execute(`
            SELECT 
                m.mark_id,
                s.student_name,
                m.mark,
                m.status
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            WHERE m.teacher_id = ?
              AND m.subject_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND s.class_id = ?
        `, [teacher_id, subject_id, year_id, semester_id, class_id]);

        console.log(`Found ${draftMarks.length} draft marks:`);
        draftMarks.forEach(m => {
            console.log(`  - ${m.student_name}: ${m.mark} [${m.status}]`);
        });

        // 5. Submit to homeroom (change status to 'submitted')
        console.log('\n5. Submitting to homeroom teacher...');
        const [result] = await db.execute(`
            UPDATE marks 
            SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
            WHERE teacher_id = ? 
              AND subject_id = ? 
              AND year_id = ?
              AND semester_id = ?
              AND student_id IN (SELECT student_id FROM students WHERE class_id = ?)
              AND status = 'draft'
        `, [teacher_id, subject_id, year_id, semester_id, class_id]);

        console.log(`✓ Submitted ${result.affectedRows} marks`);

        // 6. Verify submitted marks
        console.log('\n6. Verifying submitted marks...');
        const [submittedMarks] = await db.execute(`
            SELECT 
                m.mark_id,
                s.student_name,
                m.mark,
                m.status,
                m.submitted_at
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            WHERE m.teacher_id = ?
              AND m.subject_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND s.class_id = ?
              AND m.status = 'submitted'
        `, [teacher_id, subject_id, year_id, semester_id, class_id]);

        console.log(`Found ${submittedMarks.length} submitted marks:`);
        submittedMarks.forEach(m => {
            console.log(`  - ${m.student_name}: ${m.mark} [${m.status}] at ${m.submitted_at}`);
        });

        // 7. Check what homeroom teacher would see
        console.log('\n7. Checking homeroom teacher view...');
        const [homeroomView] = await db.execute(`
            SELECT 
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
        `, [class_id, class_id, year_id, semester_id]);

        console.log('\nHomeroom teacher would see:');
        homeroomView.forEach(v => {
            console.log(`  - ${v.subject_name} by ${v.teacher_name}: ${v.submitted_count}/${v.total_students} students`);
        });

        console.log('\n✅ Test Complete! Marks are ready for homeroom approval.');
        console.log('\nNow login as homeroom teacher (ibsa0) and check the Approval page!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testCreateAndSubmit();
