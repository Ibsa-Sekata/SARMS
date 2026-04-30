const db = require('../config/db');

async function getHomeroomClassId(teacherId) {
    const [homeroomClass] = await db.execute('SELECT class_id FROM classes WHERE homeroom_teacher_id = ?', [
        teacherId,
    ]);
    return homeroomClass[0] || null;
}

async function findMarksForTeacherContext(user, query) {
    const { student_id, class_id, subject_id, year_id = 2, semester_id = 1 } = query;
    let sql = `SELECT * FROM v_marks_detail WHERE year_id = ? AND semester_id = ?`;
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
            sql += ' AND teacher_id = ?';
            params.push(user.teacher_id);
        } else if (homeroomClass) {
            sql += ' AND class_id = ?';
            params.push(homeroomClass.class_id);
        } else {
            sql += ' AND teacher_id = ?';
            params.push(user.teacher_id);
        }
    }

    if (student_id) {
        sql += ' AND student_id = ?';
        params.push(student_id);
    }
    if (subject_id) {
        sql += ' AND subject_id = ?';
        params.push(subject_id);
    }
    if (class_id) {
        sql += ' AND class_id = ?';
        params.push(class_id);
    }
    sql += ' ORDER BY student_name, subject_name';
    const [marks] = await db.execute(sql, params);
    return marks;
}

async function findByClass(classId, year_id, semester_id) {
    const [marks] = await db.execute(`SELECT * FROM v_marks_detail WHERE class_id = ? AND year_id = ? AND semester_id = ? ORDER BY student_name, subject_name`, [classId, year_id, semester_id]);
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
    const [marks] = await db.execute(`SELECT * FROM v_marks_detail WHERE class_id = ? AND year_id = ? AND semester_id = ? ORDER BY subject_name, student_name`, [classId, year_id, semester_id]);
    return marks;
}

async function homeroomSummaryForClass(classId, year_id, semester_id) {
    const [summary] = await db.execute(
        `CALL sp_homeroom_summary(?, ?, ?)`,
        [classId, year_id, semester_id]
    );
    return summary[0] || [];
}

async function countMarksForSubmitToHomeroom(isAdmin, user, class_id, subject_id, year_id, semester_id) {
    const countSql = isAdmin
        ? `SELECT COUNT(*) AS c FROM v_marks_detail WHERE subject_id = ? AND year_id = ? AND semester_id = ? AND class_id = ?`
        : `SELECT COUNT(*) AS c FROM v_marks_detail WHERE teacher_id = ? AND subject_id = ? AND year_id = ? AND semester_id = ? AND class_id = ?`;
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

    const [assignedSubjects] = await db.execute(`SELECT DISTINCT subject_id, subject_name FROM v_marks_detail WHERE class_id = ? AND year_id = ?`, [classId, year_id]);

    if (assignedSubjects.length === 0) {
        return { error: 'no_subjects', classId };
    }

    const [submissionStatus] = await db.execute(`SELECT subject_id, subject_name, COUNT(mark_id) as submitted_count FROM v_marks_detail WHERE class_id = ? AND year_id = ? GROUP BY subject_id, subject_name`, [classId, year_id]);

    const [[totalMarks]] = await db.execute(`SELECT COUNT(*) AS c FROM v_marks_detail WHERE class_id = ? AND year_id = ? AND semester_id = ?`, [classId, year_id, semester_id]);

    const [[approvedMarks]] = await db.execute(`SELECT COUNT(*) AS c FROM v_marks_detail WHERE class_id = ? AND year_id = ? AND semester_id = ? AND approved_by_homeroom = 1`, [classId, year_id, semester_id]);

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
        `CALL sp_approve_class_marks(?, ?, ?, ?, @updated_count)`,
        [classId, year_id, semester_id, approverTeacherId]
    );
    const [[countResult]] = await db.execute('SELECT @updated_count AS count');
    return Number(countResult?.count) || 0;
}

async function countUnapprovedMarksForClassTerm(classId, year_id, semester_id) {
    const [[row]] = await db.execute(`SELECT COUNT(*) AS c FROM v_marks_detail WHERE class_id = ? AND year_id = ? AND semester_id = ? AND (approved_by_homeroom IS NULL OR approved_by_homeroom = 0)`, [classId, year_id, semester_id]);
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
