const db = require('./config/db');

async function testMarkSubmission() {
    try {
        console.log('=== Testing Mark Submission Flow ===\n');

        // 1. Check if status column exists
        console.log('1. Checking marks table structure...');
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'school_system'
            AND TABLE_NAME = 'marks'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('Marks table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (default: ${col.COLUMN_DEFAULT})`);
        });

        const hasStatus = columns.some(col => col.COLUMN_NAME === 'status');
        const hasSubmittedAt = columns.some(col => col.COLUMN_NAME === 'submitted_at');

        if (!hasStatus || !hasSubmittedAt) {
            console.log('\n⚠️  Missing status columns! Please run:');
            console.log('   mysql -u root -p school_system < database/add_mark_status.sql');
            console.log('   mysql -u root -p school_system < database/update_mark_status_enum.sql');
            console.log('   mysql -u root -p school_system < database/add_approved_at_column.sql\n');
        } else {
            console.log('✓ All required columns exist!\n');
        }

        // 2. Check for submitted marks
        console.log('2. Checking submitted marks (status = submitted)...');
        const [submittedMarks] = await db.execute(`
            SELECT 
                m.mark_id,
                m.status,
                m.submitted_at,
                s.student_name,
                sub.subject_name,
                t.teacher_name,
                st.class_id
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN subjects sub ON m.subject_id = sub.subject_id
            JOIN teachers t ON m.teacher_id = t.teacher_id
            JOIN students st ON m.student_id = st.student_id
            WHERE m.status = 'submitted'
            LIMIT 10
        `);

        console.log(`Found ${submittedMarks.length} submitted marks:`);
        submittedMarks.forEach(mark => {
            console.log(`  - ${mark.student_name} (${mark.subject_name}): ${mark.status} by ${mark.teacher_name}`);
        });

        // 3. Check all marks
        console.log('\n3. Checking all marks...');
        const [allMarks] = await db.execute(`
            SELECT 
                m.status,
                COUNT(*) as count
            FROM marks m
            GROUP BY m.status
        `);

        console.log('Marks by status:');
        allMarks.forEach(row => {
            console.log(`  - ${row.status || 'NULL'}: ${row.count}`);
        });

        console.log('\n=== Test Complete ===');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testMarkSubmission();
