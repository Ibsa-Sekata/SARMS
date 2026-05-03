// Database initialization utilities
const db = require('../config/db');

async function ensureSettingsTable() {
    try {
        const [tables] = await db.execute(`SHOW TABLES LIKE 'system_settings'`);
        if (tables.length === 0) {
            console.log('⚠️  Creating system_settings table...');
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
            const [years] = await db.execute(`SELECT year_id FROM academic_years ORDER BY year_id LIMIT 1`);
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
            await db.execute(`ALTER TABLE marks ADD COLUMN approved_by_homeroom TINYINT(1) NOT NULL DEFAULT 0`);
            console.log('✅ Added marks.approved_by_homeroom');
        }

        const [approvedByTeacherCol] = await db.execute(`SHOW COLUMNS FROM marks LIKE 'approved_by_teacher_id'`);
        if (approvedByTeacherCol.length === 0) {
            await db.execute(`ALTER TABLE marks ADD COLUMN approved_by_teacher_id INT NULL`);
            console.log('✅ Added marks.approved_by_teacher_id');
        }

        const [approvedAtCol] = await db.execute(`SHOW COLUMNS FROM marks LIKE 'approved_at'`);
        if (approvedAtCol.length === 0) {
            await db.execute(`ALTER TABLE marks ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL`);
            console.log('✅ Added marks.approved_at');
        }

        const [fkRows] = await db.execute(`
            SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'marks'
              AND COLUMN_NAME = 'approved_by_teacher_id' AND REFERENCED_TABLE_NAME = 'teachers'
            LIMIT 1
        `);
        if (fkRows.length === 0) {
            await db.execute(`
                ALTER TABLE marks
                ADD CONSTRAINT fk_marks_approved_by_teacher
                FOREIGN KEY (approved_by_teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL
            `);
            console.log('✅ Added FK marks.approved_by_teacher_id -> teachers.teacher_id');
        }
    } catch (error) {
        console.error('❌ Error ensuring marks approval columns:', error.message);
    }
}

module.exports = { ensureSettingsTable, ensureMarksApprovalColumns };
