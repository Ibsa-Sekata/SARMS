const db = require('./config/db');

(async () => {
    const [marks] = await db.execute(`
        SELECT 
            m.*,
            s.student_name,
            s.class_id,
            sub.subject_name,
            t.teacher_name
        FROM marks m
        JOIN students s ON m.student_id = s.student_id
        JOIN subjects sub ON m.subject_id = sub.subject_id
        JOIN teachers t ON m.teacher_id = t.teacher_id
        WHERE m.status = 'submitted'
    `);

    console.log(`Found ${marks.length} submitted marks:`);
    marks.forEach(m => {
        console.log(`  - Class ${m.class_id}: ${m.student_name} (${m.subject_name}): ${m.mark} by ${m.teacher_name}`);
    });

    process.exit(0);
})();
