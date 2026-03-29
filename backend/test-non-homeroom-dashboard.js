const db = require('./config/db');

async function testNonHomeroomDashboard() {
    try {
        console.log('=== Testing Non-Homeroom Teacher Dashboard Data ===\n');

        // 1. Get all teachers
        console.log('1. All Teachers:');
        const [teachers] = await db.execute(`
            SELECT 
                t.teacher_id,
                t.teacher_name,
                t.department_id,
                d.department_name,
                u.username,
                u.role
            FROM teachers t
            LEFT JOIN departments d ON t.department_id = d.department_id
            LEFT JOIN users u ON t.user_id = u.user_id
            ORDER BY t.teacher_id
        `);
        console.table(teachers);

        // 2. Check which teachers are homeroom teachers
        console.log('\n2. Homeroom Teacher Assignments:');
        const [homeroomTeachers] = await db.execute(`
            SELECT 
                c.class_id,
                c.homeroom_teacher_id,
                t.teacher_name,
                g.grade_number,
                s.section_name
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            LEFT JOIN grades g ON c.grade_id = g.grade_id
            LEFT JOIN sections s ON c.section_id = s.section_id
            WHERE c.homeroom_teacher_id IS NOT NULL
        `);
        console.table(homeroomTeachers);

        // 3. Check teacher_assignments table
        console.log('\n3. Teacher Subject Assignments:');
        const [assignments] = await db.execute(`
            SELECT 
                ta.assignment_id,
                ta.teacher_id,
                t.teacher_name,
                c.class_id,
                g.grade_number,
                sec.section_name,
                s.subject_name,
                ay.year_name
            FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            JOIN classes c ON ta.class_id = c.class_id
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            JOIN subjects s ON ta.subject_id = s.subject_id
            JOIN academic_years ay ON ta.year_id = ay.year_id
            ORDER BY ta.teacher_id, c.class_id
        `);
        console.table(assignments);

        // 4. Identify non-homeroom teachers
        console.log('\n4. Non-Homeroom Teachers (teachers without homeroom class):');
        const [nonHomeroomTeachers] = await db.execute(`
            SELECT 
                t.teacher_id,
                t.teacher_name,
                d.department_name,
                COUNT(ta.assignment_id) as assignment_count
            FROM teachers t
            LEFT JOIN departments d ON t.department_id = d.department_id
            LEFT JOIN classes c ON c.homeroom_teacher_id = t.teacher_id
            LEFT JOIN teacher_assignments ta ON ta.teacher_id = t.teacher_id
            WHERE c.class_id IS NULL
            GROUP BY t.teacher_id, t.teacher_name, d.department_name
        `);
        console.table(nonHomeroomTeachers);

        // 5. For each non-homeroom teacher, check what data they can access
        console.log('\n5. Data Access for Non-Homeroom Teachers:');
        for (const teacher of nonHomeroomTeachers) {
            console.log(`\n--- Teacher: ${teacher.teacher_name} (ID: ${teacher.teacher_id}) ---`);

            // Check students they can see
            const [students] = await db.execute(`
                SELECT DISTINCT
                    s.student_id,
                    s.student_name,
                    c.class_id,
                    g.grade_number,
                    sec.section_name
                FROM students s
                JOIN classes c ON s.class_id = c.class_id
                JOIN grades g ON c.grade_id = g.grade_id
                JOIN sections sec ON c.section_id = sec.section_id
                WHERE s.class_id IN (
                    SELECT DISTINCT class_id 
                    FROM teacher_assignments 
                    WHERE teacher_id = ?
                )
            `, [teacher.teacher_id]);

            console.log(`  Students accessible: ${students.length}`);
            if (students.length > 0) {
                console.table(students);
            }

            // Check their assignments
            const [teacherAssignments] = await db.execute(`
                SELECT 
                    c.class_id,
                    g.grade_number,
                    sec.section_name,
                    s.subject_name
                FROM teacher_assignments ta
                JOIN classes c ON ta.class_id = c.class_id
                JOIN grades g ON c.grade_id = g.grade_id
                JOIN sections sec ON c.section_id = sec.section_id
                JOIN subjects s ON ta.subject_id = s.subject_id
                WHERE ta.teacher_id = ?
            `, [teacher.teacher_id]);

            console.log(`  Class assignments: ${teacherAssignments.length}`);
            if (teacherAssignments.length > 0) {
                console.table(teacherAssignments);
            }
        }

        console.log('\n=== Test Complete ===');
        process.exit(0);

    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
}

testNonHomeroomDashboard();
