const db = require('../config/db');

function toCount(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'bigint') return Number(value);
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

async function getAdminOverviewCounts() {
    const [rows] = await db.execute(`
        SELECT
            (SELECT COUNT(*) FROM teachers) AS teachers,
            (SELECT COUNT(*) FROM students) AS students,
            (SELECT COUNT(*) FROM classes) AS classes,
            (SELECT COUNT(*) FROM departments) AS departments
    `);
    const base = rows[0] || {};

    let teacher_assignments = 0;
    try {
        const [aRows] = await db.execute('SELECT COUNT(*) AS c FROM teacher_assignments');
        teacher_assignments = toCount(aRows[0]?.c);
    } catch (e) {
        console.warn('teacher_assignments count skipped:', e.message);
    }

    let marks_total = 0;
    try {
        const [mRows] = await db.execute('SELECT COUNT(*) AS c FROM marks');
        marks_total = toCount(mRows[0]?.c);
    } catch (e) {
        console.warn('marks count skipped:', e.message);
    }

    return {
        teachers: toCount(base.teachers),
        students: toCount(base.students),
        classes: toCount(base.classes),
        departments: toCount(base.departments),
        teacher_assignments,
        marks_total,
    };
}

module.exports = { getAdminOverviewCounts, toCount };
