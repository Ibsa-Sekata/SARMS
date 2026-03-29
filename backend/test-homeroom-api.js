const db = require('./config/db');

async function testHomeroomAPI() {
    try {
        console.log('=== Testing Homeroom Approval API ===\n');

        // 1. Find homeroom teachers
        console.log('1. Finding homeroom teachers...');
        const [homeroomTeachers] = await db.execute(`
            SELECT 
                t.teacher_id,
                t.teacher_name,
                c.class_id,
                g.grade_number,
                sec.section_name
            FROM teachers t
            JOIN classes c ON c.homeroom_teacher_id = t.teacher_id
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
        `);

        if (homeroomTeachers.length === 0) {
            console.log('❌ No homeroom teachers found!');
            console.log('   Please assign a teacher as homeroom teacher:');
            console.log('   UPDATE classes SET homeroom_teacher_id = <teacher_id> WHERE class_id = <class_id>;');
            process.exit(1);
        }

        console.log(`Found ${homeroomTeachers.length} homeroom teacher(s):`);
        homeroomTeachers.forEach(ht => {
            console.log(`  - ${ht.teacher_name} (ID: ${ht.teacher_id}) for Grade ${ht.grade_number}${ht.section_name} (Class ID: ${ht.class_id})`);
        });

        const testTeacher = homeroomTeachers[0];
        console.log(`\nUsing ${testTeacher.teacher_name} for testing...\n`);

        // 2. Check submitted marks for this homeroom teacher's class
        console.log('2. Checking submitted marks for this class...');
        const [submittedMarks] = await db.execute(`
            SELECT 
                m.mark_id,
                m.student_id,
                m.subject_id,
                m.teacher_id,
                m.mark,
                m.status,
                m.submitted_at,
                m.year_id,
                m.semester_id,
                s.student_name,
                s.student_code,
                sub.subject_name,
                t.teacher_name
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN subjects sub ON m.subject_id = sub.subject_id
            JOIN teachers t ON m.teacher_id = t.teacher_id
            WHERE s.class_id = ?
              AND m.status = 'submitted'
        `, [testTeacher.class_id]);

        console.log(`Found ${submittedMarks.length} submitted marks for this class:`);
        if (submittedMarks.length > 0) {
            submittedMarks.forEach(mark => {
                console.log(`  - ${mark.student_name} (${mark.subject_name}): ${mark.mark} [Year: ${mark.year_id}, Semester: ${mark.semester_id}]`);
            });
        } else {
            console.log('  ❌ No submitted marks found!');
            console.log('  Checking all marks for this class...');

            const [allMarks] = await db.execute(`
                SELECT 
                    m.status,
                    COUNT(*) as count
                FROM marks m
                JOIN students s ON m.student_id = s.student_id
                WHERE s.class_id = ?
                GROUP BY m.status
            `, [testTeacher.class_id]);

            console.log('  Marks by status:');
            allMarks.forEach(row => {
                console.log(`    - ${row.status}: ${row.count}`);
            });
        }

        // 3. Check current settings
        console.log('\n3. Checking current academic settings...');
        const [settings] = await db.execute('SELECT * FROM system_settings WHERE setting_key IN (\'current_year_id\', \'current_semester_id\')');

        let year_id = 1, semester_id = 1;
        if (settings.length > 0) {
            const yearSetting = settings.find(s => s.setting_key === 'current_year_id');
            const semesterSetting = settings.find(s => s.setting_key === 'current_semester_id');
            year_id = yearSetting ? parseInt(yearSetting.setting_value) : 1;
            semester_id = semesterSetting ? parseInt(semesterSetting.setting_value) : 1;
            console.log(`  Current Year ID: ${year_id}`);
            console.log(`  Current Semester ID: ${semester_id}`);
        } else {
            console.log('  ❌ No settings found! Using defaults (Year: 1, Semester: 1)');
        }

        // 4. Simulate the API query
        console.log('\n4. Simulating API query...');

        const [apiMarks] = await db.execute(`
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
        `, [testTeacher.class_id, year_id, semester_id]);

        console.log(`API would return ${apiMarks.length} marks`);

        if (apiMarks.length === 0) {
            console.log('\n❌ PROBLEM FOUND: No marks match the current year/semester!');
            console.log(`   Current settings: Year ${year_id}, Semester ${semester_id}`);
            console.log(`   But submitted marks are for different year/semester`);
            console.log('\n   SOLUTION: Either:');
            console.log(`   A) Update settings to match the marks:`);
            if (submittedMarks.length > 0) {
                console.log(`      UPDATE settings SET current_year_id = ${submittedMarks[0].year_id}, current_semester_id = ${submittedMarks[0].semester_id};`);
            }
            console.log(`   B) Or submit new marks for Year ${year_id}, Semester ${semester_id}`);
        } else {
            console.log('✓ API query is working correctly!');
        }

        // 5. Get summary
        console.log('\n5. Getting summary...');
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
        `, [testTeacher.class_id, testTeacher.class_id, year_id, semester_id]);

        console.log(`Summary would show ${summary.length} subject(s):`);
        summary.forEach(s => {
            console.log(`  - ${s.subject_name} by ${s.teacher_name}: ${s.submitted_count}/${s.total_students} students`);
        });

        console.log('\n=== Test Complete ===');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testHomeroomAPI();
