// Database initialization utilities
const db = require('../config/db');

async function ensureSettingsTable() {
    try {
        // Check if system_settings table exists
        const [tables] = await db.execute(`
            SHOW TABLES LIKE 'system_settings'
        `);

        if (tables.length === 0) {
            console.log('⚠️  Creating system_settings table...');

            // Create system_settings table
            await db.execute(`
                CREATE TABLE system_settings (
                    setting_id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(50) UNIQUE NOT NULL,
                    setting_value VARCHAR(255) NOT NULL,
                    description VARCHAR(255),
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            console.log('✅ system_settings table created');

            // Insert default settings
            const [years] = await db.execute(`
                SELECT year_id FROM academic_years ORDER BY year_id LIMIT 1
            `);

            const defaultYearId = years.length > 0 ? years[0].year_id : 2;

            await db.execute(`
                INSERT INTO system_settings (setting_key, setting_value, description) VALUES
                ('current_year_id', ?, 'Current academic year ID'),
                ('current_semester_id', '1', 'Current semester ID')
            `, [defaultYearId]);

            console.log('✅ Default settings initialized');
        }
    } catch (error) {
        console.error('❌ Error ensuring settings table:', error.message);
    }
}

async function ensureMarksApprovalColumns() {
    try {
        const [marksTable] = await db.execute(`SHOW TABLES LIKE 'marks'`);
        if (marksTable.length === 0) return;

        const [approvedCol] = await db.execute(`SHOW COLUMNS FROM marks LIKE 'approved_by_homeroom'`);
        if (approvedCol.length === 0) {
            await db.execute(`
                ALTER TABLE marks
                ADD COLUMN approved_by_homeroom TINYINT(1) NOT NULL DEFAULT 0
            `);
            console.log('✅ Added marks.approved_by_homeroom');
        }

        const [approvedByTeacherCol] = await db.execute(
            `SHOW COLUMNS FROM marks LIKE 'approved_by_teacher_id'`
        );
        if (approvedByTeacherCol.length === 0) {
            await db.execute(`
                ALTER TABLE marks
                ADD COLUMN approved_by_teacher_id INT NULL
            `);
            console.log('✅ Added marks.approved_by_teacher_id');
        }

        const [approvedAtCol] = await db.execute(`SHOW COLUMNS FROM marks LIKE 'approved_at'`);
        if (approvedAtCol.length === 0) {
            await db.execute(`
                ALTER TABLE marks
                ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL
            `);
            console.log('✅ Added marks.approved_at');
        }

        const [fkRows] = await db.execute(`
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'marks'
              AND COLUMN_NAME = 'approved_by_teacher_id'
              AND REFERENCED_TABLE_NAME = 'teachers'
            LIMIT 1
        `);
        if (fkRows.length === 0) {
            await db.execute(`
                ALTER TABLE marks
                ADD CONSTRAINT fk_marks_approved_by_teacher
                FOREIGN KEY (approved_by_teacher_id) REFERENCES teachers(teacher_id)
                ON DELETE SET NULL
            `);
            console.log('✅ Added FK marks.approved_by_teacher_id -> teachers.teacher_id');
        }
    } catch (error) {
        console.error('❌ Error ensuring marks approval columns:', error.message);
    }
}

async function ensureRosterSnapshotsTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS roster_snapshots (
                roster_snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                year_id INT NOT NULL,
                semester_id INT NOT NULL,
                generated_by_user_id INT NULL,
                generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                payload JSON NOT NULL,
                UNIQUE KEY uq_roster_class_term (class_id, year_id, semester_id),
                INDEX idx_roster_snapshots_term (year_id, semester_id),
                CONSTRAINT fk_roster_snapshots_class
                    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
                CONSTRAINT fk_roster_snapshots_year
                    FOREIGN KEY (year_id) REFERENCES academic_years(year_id) ON DELETE CASCADE,
                CONSTRAINT fk_roster_snapshots_semester
                    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE CASCADE,
                CONSTRAINT fk_roster_snapshots_user
                    FOREIGN KEY (generated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
            )
        `);
    } catch (error) {
        console.error('❌ Error ensuring roster_snapshots table:', error.message);
    }
}

async function ensureReportViewsAndProcedures() {
    try {
        const [spRow] = await db.query(
            `
            SELECT ROUTINE_NAME
            FROM information_schema.ROUTINES
            WHERE ROUTINE_SCHEMA = DATABASE()
              AND ROUTINE_TYPE = 'PROCEDURE'
              AND ROUTINE_NAME = 'sp_get_roster_student_summaries'
            LIMIT 1
        `
        );
        if (spRow.length > 0) return;

        console.log('⚠️  Creating report views and procedures (run database/views_and_procedures.sql for full control)...');

        await db.query(`DROP VIEW IF EXISTS v_class_enriched`);
        await db.query(`
            CREATE VIEW v_class_enriched AS
            SELECT
                c.class_id,
                c.grade_id,
                c.section_id,
                c.homeroom_teacher_id,
                g.grade_number,
                sec.section_name,
                t.teacher_name AS homeroom_teacher
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
        `);

        await db.query(`DROP VIEW IF EXISTS v_student_enriched`);
        await db.query(`
            CREATE VIEW v_student_enriched AS
            SELECT
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                s.class_id,
                v.grade_number,
                v.section_name
            FROM students s
            LEFT JOIN v_class_enriched v ON s.class_id = v.class_id
        `);

        await db.query(`DROP PROCEDURE IF EXISTS sp_get_roster_student_summaries`);
        await db.query(`
            CREATE PROCEDURE sp_get_roster_student_summaries(
                IN p_class_id INT,
                IN p_year_id INT,
                IN p_semester_id INT
            )
            BEGIN
                SELECT
                    x.student_id,
                    x.total_marks,
                    x.average_marks,
                    DENSE_RANK() OVER (ORDER BY x.total_marks DESC) AS class_rank,
                    CASE
                        WHEN x.average_marks >= 50 THEN 'PASS'
                        ELSE 'FAIL'
                    END AS status
                FROM (
                    SELECT
                        s.student_id,
                        COALESCE(SUM(m.mark), 0) AS total_marks,
                        COALESCE(ROUND(AVG(m.mark), 2), 0) AS average_marks
                    FROM students s
                    LEFT JOIN marks m
                        ON m.student_id = s.student_id
                        AND m.year_id = p_year_id
                        AND m.semester_id = p_semester_id
                    WHERE s.class_id = p_class_id
                    GROUP BY s.student_id
                ) x
                ORDER BY x.student_id;
            END
        `);

        await db.query(`DROP PROCEDURE IF EXISTS sp_get_class_statistics`);
        await db.query(`
            CREATE PROCEDURE sp_get_class_statistics(
                IN p_class_id INT,
                IN p_year_id INT,
                IN p_semester_id INT
            )
            BEGIN
                SELECT
                    COUNT(DISTINCT s.student_id) AS total_students,
                    AVG(
                        (SELECT SUM(m2.mark)
                         FROM marks m2
                         WHERE m2.student_id = s.student_id
                           AND m2.year_id = p_year_id
                           AND m2.semester_id = p_semester_id)
                    ) AS class_average_total,
                    SUM(CASE
                        WHEN (SELECT AVG(m3.mark)
                              FROM marks m3
                              WHERE m3.student_id = s.student_id
                                AND m3.year_id = p_year_id
                                AND m3.semester_id = p_semester_id) >= 50
                        THEN 1 ELSE 0
                    END) AS passed_count,
                    SUM(CASE
                        WHEN (SELECT AVG(m4.mark)
                              FROM marks m4
                              WHERE m4.student_id = s.student_id
                                AND m4.year_id = p_year_id
                                AND m4.semester_id = p_semester_id) < 50
                        THEN 1 ELSE 0
                    END) AS failed_count
                FROM students s
                WHERE s.class_id = p_class_id;
            END
        `);

        await db.query(`DROP PROCEDURE IF EXISTS sp_delete_marks_class_term`);
        await db.query(`
            CREATE PROCEDURE sp_delete_marks_class_term(
                IN p_class_id INT,
                IN p_year_id INT,
                IN p_semester_id INT
            )
            BEGIN
                DELETE m FROM marks m
                INNER JOIN students s ON s.student_id = m.student_id
                WHERE s.class_id = p_class_id
                  AND m.year_id = p_year_id
                  AND m.semester_id = p_semester_id;
                SELECT ROW_COUNT() AS deleted_count;
            END
        `);

        console.log('✅ Report views and procedures created');
    } catch (error) {
        console.error('❌ Error ensuring report views/procedures:', error.message);
    }
}

module.exports = {
    ensureSettingsTable,
    ensureMarksApprovalColumns,
    ensureRosterSnapshotsTable,
    ensureReportViewsAndProcedures,
};
