const db = require('../config/db');

async function getHomeroomClassId(teacherId) {
    const [homeroomClass] = await db.execute('SELECT class_id FROM classes WHERE homeroom_teacher_id = ?', [
        teacherId,
    ]);
    return homeroomClass[0] || null;
}

async function findMarksForTeacherContext(user, query) {
    const { student_id, class_id, subject_id, year_id = 2, semester_id = 1 } = query;
    let sql = `
            SELECT 
                m.mark_id,
                m.student_id,
                m.subject_id,
                m.teacher_id,
                m.mark,
                s.student_name,
                sub.subject_name,
                t.teacher_name
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN subjects sub ON m.subject_id = sub.subject_id
            LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
            WHERE m.year_id = ? AND m.semester_id = ?
        `;
    const params = [year_id, semester_id];

    if (user.role !== 'admin') {
        const homeroomClass = await getHomeroomClassId(user.teacher_id);
        let isAssignedToThisClassSubject = false;
        if (class_id && subject_id) {
            const [assignRows] = await db.execute(
                `SELECT assignment_id FROM teacher_assignments
                 WHERE teacher_id = ? AND class_id = ? AND subject_id = ? AND year_id = ?`,
                [user.teacher_id, class_id, subject_id, year_id]
            );
            isAssignedToThisClassSubject = assignRows.length > 0;
        }

        if (isAssignedToThisClassSubject) {
            sql += ' AND m.teacher_id = ?';
            params.push(user.teacher_id);
        } else if (homeroomClass) {
            sql += ' AND s.class_id = ?';
            params.push(homeroomClass.class_id);
        } else {
            sql += ' AND m.teacher_id = ?';
            params.push(user.teacher_id);
        }
    }

    if (student_id) {
        sql += ' AND m.student_id = ?';
        params.push(student_id);
    }
    if (subject_id) {
        sql += ' AND m.subject_id = ?';
        params.push(subject_id);
    }
    if (class_id) {
        sql += ' AND s.class_id = ?';
        params.push(class_id);
    }
    sql += ' ORDER BY s.student_name, sub.subject_name';
    const [marks] = await db.execute(sql, params);
    return marks;
}

async function findByClass(classId, year_id, semester_id) {
    const [marks] = await db.execute(
        `
            SELECT 
                m.mark_id,
                m.student_id,
                m.subject_id,
                m.teacher_id,
                m.mark,
                s.student_name,
                sub.subject_name,
                t.teacher_name
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN subjects sub ON m.subject_id = sub.subject_id
            LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
            WHERE s.class_id = ? AND m.year_id = ? AND m.semester_id = ?
            ORDER BY s.student_name, sub.subject_name
            `,
        [classId, year_id, semester_id]
    );
    return marks;
}

async function upsertMark(student_id, subject_id, teacher_id, semester_id, year_id, mark) {
    const [result] = await db.execute(
        `
            INSERT INTO marks (
                student_id, subject_id, teacher_id, semester_id, year_id, mark,
                approved_by_homeroom, approved_by_teacher_id, approved_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL)
            ON DUPLICATE KEY UPDATE
                mark = ?,
                teacher_id = ?,
                approved_by_homeroom = 0,
                approved_by_teacher_id = NULL,
                approved_at = NULL
            `,
        [student_id, subject_id, teacher_id, semester_id, year_id, mark, mark, teacher_id]
    );
    return result;
}

async function updateMarkValue(markId, mark) {
    const [result] = await db.execute(
        `
            UPDATE marks
            SET mark = ?, approved_by_homeroom = 0, approved_by_teacher_id = NULL, approved_at = NULL
            WHERE mark_id = ?
        `,
        [mark, markId]
    );
    return result.affectedRows;
}

async function deleteById(markId) {
    const [result] = await db.execute('DELETE FROM marks WHERE mark_id = ?', [markId]);
    return result.affectedRows;
}

async function findHomeroomClassMeta(teacherId) {
    const [classes] = await db.execute(
        `SELECT class_id, grade_id, section_id FROM classes WHERE homeroom_teacher_id = ?`,
        [teacherId]
    );
    return classes[0] || null;
}

async function findSubmittedMarksForClass(classId, year_id, semester_id) {
    const [marks] = await db.execute(
        `
            SELECT 
                m.mark_id,
                m.student_id,
                m.subject_id,
                m.teacher_id,
                m.mark,
                m.approved_by_homeroom,
                m.approved_at,
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
            ORDER BY sub.subject_name, s.student_name
            `,
        [classId, year_id, semester_id]
    );
    return marks;
}

async function homeroomSummaryForClass(classId, year_id, semester_id) {
    const [summary] = await db.execute(
        `
            SELECT 
                sub.subject_id,
                sub.subject_name,
                t.teacher_name,
                COALESCE(cnt.c, 0) as submitted_count,
                (SELECT COUNT(*) FROM students WHERE class_id = ?) as total_students
            FROM teacher_assignments ta
            JOIN subjects sub ON ta.subject_id = sub.subject_id
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            LEFT JOIN (
                SELECT m.subject_id, COUNT(*) AS c
                FROM marks m
                JOIN students s ON m.student_id = s.student_id
                WHERE s.class_id = ?
                  AND m.year_id = ?
                  AND m.semester_id = ?
                GROUP BY m.subject_id
            ) cnt ON sub.subject_id = cnt.subject_id
            WHERE ta.class_id = ? AND ta.year_id = ?
            ORDER BY sub.subject_name
            `,
        [classId, classId, year_id, semester_id, classId, year_id]
    );
    return summary;
}

async function countMarksForSubmitToHomeroom(isAdmin, user, class_id, subject_id, year_id, semester_id) {
    const countSql = isAdmin
        ? `
            SELECT COUNT(*) AS c FROM marks m
            JOIN students s ON s.student_id = m.student_id
            WHERE m.subject_id = ? AND m.year_id = ? AND m.semester_id = ? AND s.class_id = ?
            `
        : `
            SELECT COUNT(*) AS c FROM marks m
            JOIN students s ON s.student_id = m.student_id
            WHERE m.teacher_id = ? AND m.subject_id = ? AND m.year_id = ? AND m.semester_id = ?
              AND s.class_id = ?
            `;
    const countParams = isAdmin
        ? [subject_id, year_id, semester_id, class_id]
        : [user.teacher_id, subject_id, year_id, semester_id, class_id];
    const [[row]] = await db.execute(countSql, countParams);
    return Number(row?.c) || 0;
}

async function getApprovalDataForHomeroom(teacherId, year_id, semester_id) {
    const [classes] = await db.execute(`SELECT class_id FROM classes WHERE homeroom_teacher_id = ?`, [teacherId]);
    if (classes.length === 0) {
        return { error: 'not_homeroom' };
    }
    const classId = classes[0].class_id;
    const [studentCount] = await db.execute('SELECT COUNT(*) as total FROM students WHERE class_id = ?', [classId]);
    const totalStudents = Number(studentCount[0]?.total) || 0;

    const [assignedSubjects] = await db.execute(
        `
            SELECT DISTINCT ta.subject_id, s.subject_name
            FROM teacher_assignments ta
            JOIN subjects s ON ta.subject_id = s.subject_id
            WHERE ta.class_id = ? AND ta.year_id = ?
            `,
        [classId, year_id]
    );

    if (assignedSubjects.length === 0) {
        return { error: 'no_subjects', classId };
    }

    const [submissionStatus] = await db.execute(
        `
            SELECT 
                sub.subject_id,
                sub.subject_name,
                COUNT(m.mark_id) as submitted_count
            FROM subjects sub
            JOIN teacher_assignments ta ON sub.subject_id = ta.subject_id
            LEFT JOIN marks m ON sub.subject_id = m.subject_id 
                AND m.year_id = ?
                AND m.semester_id = ?
                AND m.student_id IN (SELECT student_id FROM students WHERE class_id = ?)
            WHERE ta.class_id = ? AND ta.year_id = ?
            GROUP BY sub.subject_id, sub.subject_name
            `,
        [year_id, semester_id, classId, classId, year_id]
    );

    const [[totalMarks]] = await db.execute(
        `
            SELECT COUNT(*) AS c FROM marks m
            JOIN students s ON m.student_id = s.student_id
            WHERE s.class_id = ? AND m.year_id = ? AND m.semester_id = ?
            `,
        [classId, year_id, semester_id]
    );

    const [[approvedMarks]] = await db.execute(
        `
            SELECT COUNT(*) AS c FROM marks m
            JOIN students s ON m.student_id = s.student_id
            WHERE s.class_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND m.approved_by_homeroom = 1
        `,
        [classId, year_id, semester_id]
    );

    return {
        classId,
        totalStudents,
        submissionStatus,
        approvedCount: Number(totalMarks?.c) || 0,
        approvedMarksCount: Number(approvedMarks?.c) || 0,
    };
}

async function approveMarksForClassTerm(classId, year_id, semester_id, approverTeacherId) {
    const [result] = await db.execute(
        `
            UPDATE marks m
            JOIN students s ON m.student_id = s.student_id
            SET
                m.approved_by_homeroom = 1,
                m.approved_by_teacher_id = ?,
                m.approved_at = NOW()
            WHERE s.class_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
        `,
        [approverTeacherId, classId, year_id, semester_id]
    );
    return result.affectedRows || 0;
}

async function countUnapprovedMarksForClassTerm(classId, year_id, semester_id) {
    const [[row]] = await db.execute(
        `
            SELECT COUNT(*) AS c
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            WHERE s.class_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND (m.approved_by_homeroom IS NULL OR m.approved_by_homeroom = 0)
        `,
        [classId, year_id, semester_id]
    );
    return Number(row?.c) || 0;
}

module.exports = {
    getHomeroomClassId,
    findMarksForTeacherContext,
    findByClass,
    upsertMark,
    updateMarkValue,
    deleteById,
    findHomeroomClassMeta,
    findSubmittedMarksForClass,
    homeroomSummaryForClass,
    countMarksForSubmitToHomeroom,
    getApprovalDataForHomeroom,
    approveMarksForClassTerm,
    countUnapprovedMarksForClassTerm,
};
