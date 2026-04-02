const db = require('../config/db');

async function findStudentWithClass(id) {
    const [students] = await db.execute(
        `
            SELECT 
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                c.class_id,
                g.grade_number,
                sec.section_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN grades g ON c.grade_id = g.grade_id
            LEFT JOIN sections sec ON c.section_id = sec.section_id
            WHERE s.student_id = ?
        `,
        [id]
    );
    return students[0] || null;
}

async function findMarksForStudentTerm(studentId, year_id, semester_id) {
    const [marks] = await db.execute(
        `
            SELECT 
                sub.subject_name,
                m.mark
            FROM marks m
            JOIN subjects sub ON m.subject_id = sub.subject_id
            WHERE m.student_id = ? 
                AND m.year_id = ? 
                AND m.semester_id = ?
            ORDER BY sub.subject_name
        `,
        [studentId, year_id, semester_id]
    );
    return marks;
}

async function findClassHeader(classId) {
    const [classInfo] = await db.execute(
        `
            SELECT 
                c.class_id,
                g.grade_number,
                sec.section_name,
                t.teacher_name as homeroom_teacher
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            WHERE c.class_id = ?
        `,
        [classId]
    );
    return classInfo[0] || null;
}

async function findClassStudentsMarksBlob(classId, year_id, semester_id) {
    const [students] = await db.execute(
        `
            SELECT 
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                GROUP_CONCAT(
                    CONCAT(sub.subject_name, ':', COALESCE(m.mark, 0))
                    ORDER BY sub.subject_name
                    SEPARATOR '|'
                ) as marks_data
            FROM students s
            LEFT JOIN marks m ON s.student_id = m.student_id 
                AND m.year_id = ? 
                AND m.semester_id = ?
            LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
            WHERE s.class_id = ?
            GROUP BY s.student_id, s.student_name, s.gender, s.student_code
            ORDER BY s.student_name
        `,
        [year_id, semester_id, classId]
    );
    return students;
}

async function getHomeroomTeacherIdRow(classId) {
    const [homeroomRows] = await db.execute('SELECT homeroom_teacher_id FROM classes WHERE class_id = ?', [
        classId,
    ]);
    return homeroomRows[0] || null;
}

async function findRosterClassInfo(classId, year_id, semester_id) {
    const [classInfo] = await db.execute(
        `
            SELECT 
                c.class_id,
                g.grade_number,
                sec.section_name,
                t.teacher_name as homeroom_teacher,
                ay.year_name,
                sem.semester_name
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            LEFT JOIN academic_years ay ON ay.year_id = ?
            LEFT JOIN semesters sem ON sem.semester_id = ?
            WHERE c.class_id = ?
        `,
        [year_id, semester_id, classId]
    );
    return classInfo[0] || null;
}

async function findRosterSubjectRows(classId, year_id, semester_id) {
    const [subjectRows] = await db.execute(
        `
            SELECT DISTINCT u.subject_id, u.subject_name
            FROM (
                SELECT sub.subject_id, sub.subject_name
                FROM teacher_assignments ta
                JOIN subjects sub ON ta.subject_id = sub.subject_id
                WHERE ta.class_id = ? AND ta.year_id = ?
                UNION
                SELECT sub.subject_id, sub.subject_name
                FROM marks m
                INNER JOIN students s ON s.student_id = m.student_id AND s.class_id = ?
                INNER JOIN subjects sub ON m.subject_id = sub.subject_id
                WHERE m.year_id = ? AND m.semester_id = ?
            ) u
            ORDER BY u.subject_name
            `,
        [classId, year_id, classId, year_id, semester_id]
    );
    return subjectRows;
}

async function ensureGroupConcatLen() {
    await db.execute('SET SESSION group_concat_max_len = 65535');
}

async function findRosterStudentRows(classId, year_id, semester_id) {
    const [students] = await db.execute(
        `
            SELECT 
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                GROUP_CONCAT(
                    CASE WHEN m.mark IS NOT NULL THEN CONCAT(sub.subject_id, ':', m.mark) END
                    ORDER BY sub.subject_name
                    SEPARATOR '|'
                ) AS marks_blob
            FROM students s
            LEFT JOIN marks m ON s.student_id = m.student_id 
                AND m.year_id = ? 
                AND m.semester_id = ?
            LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
            WHERE s.class_id = ?
            GROUP BY s.student_id, s.student_name, s.gender, s.student_code
            ORDER BY s.student_name
            `,
        [year_id, semester_id, classId]
    );
    return students;
}

async function findRosterStudentSummaries(classId, year_id, semester_id) {
    const [rows] = await db.execute(
        `
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
                    AND m.year_id = ?
                    AND m.semester_id = ?
                WHERE s.class_id = ?
                GROUP BY s.student_id
            ) x
            ORDER BY x.student_id
        `,
        [year_id, semester_id, classId]
    );
    return rows;
}

async function deleteMarksForClassTerm(classId, year_id, semester_id) {
    const [delResult] = await db.execute(
        `
                DELETE m FROM marks m
                INNER JOIN students s ON s.student_id = m.student_id
                WHERE s.class_id = ? AND m.year_id = ? AND m.semester_id = ?
                `,
        [classId, year_id, semester_id]
    );
    return delResult.affectedRows || 0;
}

async function getClassStatisticsRow(classId, year_id, semester_id) {
    const [stats] = await db.execute(
        `
            SELECT 
                COUNT(DISTINCT s.student_id) as total_students,
                AVG(
                    (SELECT SUM(m2.mark) 
                     FROM marks m2 
                     WHERE m2.student_id = s.student_id 
                       AND m2.year_id = ? 
                       AND m2.semester_id = ?)
                ) as class_average_total,
                SUM(CASE 
                    WHEN (SELECT AVG(m3.mark) 
                          FROM marks m3 
                          WHERE m3.student_id = s.student_id 
                            AND m3.year_id = ? 
                            AND m3.semester_id = ?) >= 50 
                    THEN 1 ELSE 0 
                END) as passed_count,
                SUM(CASE 
                    WHEN (SELECT AVG(m4.mark) 
                          FROM marks m4 
                          WHERE m4.student_id = s.student_id 
                            AND m4.year_id = ? 
                            AND m4.semester_id = ?) < 50 
                    THEN 1 ELSE 0 
                END) as failed_count
            FROM students s
            WHERE s.class_id = ?
        `,
        [year_id, semester_id, year_id, semester_id, year_id, semester_id, classId]
    );
    return stats[0] || null;
}

module.exports = {
    findStudentWithClass,
    findMarksForStudentTerm,
    findClassHeader,
    findClassStudentsMarksBlob,
    getHomeroomTeacherIdRow,
    findRosterClassInfo,
    findRosterSubjectRows,
    ensureGroupConcatLen,
    findRosterStudentRows,
    findRosterStudentSummaries,
    deleteMarksForClassTerm,
    getClassStatisticsRow,
};
