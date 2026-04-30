const db = require('../config/db');

async function findStudentWithClass(id) {
    const [students] = await db.execute(`SELECT * FROM v_student_enriched WHERE student_id = ?`, [id]);
    return students[0] || null;
}

async function findMarksForStudentTerm(studentId, year_id, semester_id) {
    const [marks] = await db.execute(`SELECT * FROM v_marks_detail WHERE student_id = ? AND year_id = ? AND semester_id = ? ORDER BY subject_name`, [studentId, year_id, semester_id]);
    return marks;
}

async function findClassHeader(classId) {
    const [classInfo] = await db.execute(`SELECT * FROM v_class_enriched WHERE class_id = ?`, [classId]);
    return classInfo[0] || null;
}

async function findClassStudentsMarksBlob(classId, year_id, semester_id) {
    const [students] = await db.execute(
        `SELECT student_id, student_name, gender, student_code,
                GROUP_CONCAT(CONCAT(subject_name, ':', COALESCE(mark, 0)) ORDER BY subject_name SEPARATOR '|') AS marks_data
         FROM v_marks_detail
         WHERE class_id = ? AND year_id = ? AND semester_id = ?
         GROUP BY student_id, student_name, gender, student_code
         ORDER BY student_name`,
        [classId, year_id, semester_id]
    );
    return students;
}

async function getHomeroomTeacherIdRow(classId) {
    const [homeroomRows] = await db.execute('SELECT homeroom_teacher_id FROM classes WHERE class_id = ?', [classId]);
    return homeroomRows[0] || null;
}

async function findStudentsByClass(classId) {
    const [students] = await db.execute(`SELECT * FROM v_student_enriched WHERE class_id = ? ORDER BY student_name`, [classId]);
    return students;
}

async function findRosterClassInfo(classId, year_id, semester_id) {
    const [classInfo] = await db.execute(`SELECT * FROM v_class_enriched WHERE class_id = ?`, [classId]);
    return classInfo[0] || null;
}

async function findRosterSubjectRows(classId, year_id, semester_id) {
    // Get subjects from teacher assignments for this class/year (source of truth)
    const [subjectRows] = await db.execute(
        `SELECT DISTINCT ta.subject_id, sub.subject_name
         FROM teacher_assignments ta
         JOIN subjects sub ON ta.subject_id = sub.subject_id
         WHERE ta.class_id = ? AND ta.year_id = ?
         ORDER BY sub.subject_name`,
        [classId, year_id]
    );
    return subjectRows;
}

async function ensureGroupConcatLen() {
    // No-op: GROUP_CONCAT is handled inside the v_roster_students view
}

async function findRosterStudentRows(classId, year_id, semester_id) {
    // Get all students in the class with their marks for this term from v_marks_detail
    const [students] = await db.execute(
        `SELECT
            s.student_id,
            s.student_name,
            s.gender,
            s.student_code,
            GROUP_CONCAT(
                CASE WHEN m.mark_id IS NOT NULL THEN CONCAT(m.subject_id, ':', m.mark) END
                ORDER BY m.subject_id
                SEPARATOR '|'
            ) AS marks_blob
         FROM v_student_enriched s
         LEFT JOIN v_marks_detail m
             ON s.student_id = m.student_id
             AND m.year_id = ?
             AND m.semester_id = ?
         WHERE s.class_id = ?
         GROUP BY s.student_id, s.student_name, s.gender, s.student_code
         ORDER BY s.student_name`,
        [year_id, semester_id, classId]
    );
    return students;
}

async function findRosterStudentSummaries(classId, year_id, semester_id) {
    // Uses stored procedure: sp_get_roster_student_summaries
    // Which internally uses function: fn_student_status
    const [rows] = await db.execute(
        'CALL sp_get_roster_student_summaries(?, ?, ?)',
        [classId, year_id, semester_id]
    );
    // CALL returns results in rows[0]
    return rows[0];
}

async function deleteMarksForClassTerm(classId, year_id, semester_id) {
    const [delResult] = await db.execute(
        `CALL sp_delete_marks_class_term(?, ?, ?, @deleted)`,
        [classId, year_id, semester_id]
    );
    const [[delRows]] = await db.execute('SELECT @deleted AS deleted');
    return Number(delRows?.deleted) || 0;
}

async function getClassStatisticsRow(classId, year_id, semester_id) {
    // Uses stored procedure: sp_get_class_statistics
    // Which internally uses function: fn_student_status and fn_pass_percentage
    const [rows] = await db.execute(
        'CALL sp_get_class_statistics(?, ?, ?)',
        [classId, year_id, semester_id]
    );
    // CALL returns results in rows[0]
    return rows[0][0] || null;
}

module.exports = {
    findStudentWithClass,
    findMarksForStudentTerm,
    findClassHeader,
    findClassStudentsMarksBlob,
    getHomeroomTeacherIdRow,
    findStudentsByClass,
    findRosterClassInfo,
    findRosterSubjectRows,
    ensureGroupConcatLen,
    findRosterStudentRows,
    findRosterStudentSummaries,
    deleteMarksForClassTerm,
    getClassStatisticsRow,
};
