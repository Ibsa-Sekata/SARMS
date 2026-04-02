const db = require('../config/db');

async function resolveSubjectIdLegacy(teacherId) {
    const [trows] = await db.execute(
        `
        SELECT t.department_id, d.department_name
        FROM teachers t
        LEFT JOIN departments d ON t.department_id = d.department_id
        WHERE t.teacher_id = ?
        `,
        [teacherId]
    );
    if (trows.length === 0) {
        return { error: 'Teacher not found' };
    }
    const { department_id: deptId, department_name: deptName } = trows[0];
    if (!deptId && !deptName) {
        return {
            error: 'This teacher has no department. Assign a department to the teacher before adding class assignments.',
        };
    }

    const name = deptName ? String(deptName).trim() : '';

    if (deptId && name) {
        const [byDeptAndName] = await db.execute(
            `
            SELECT subject_id FROM subjects
            WHERE department_id = ?
              AND LOWER(TRIM(subject_name)) = LOWER(?)
            ORDER BY subject_id
            LIMIT 1
            `,
            [deptId, name]
        );
        if (byDeptAndName.length > 0) {
            return { subject_id: byDeptAndName[0].subject_id };
        }
    }

    if (deptId) {
        const [byDept] = await db.execute(
            `
            SELECT subject_id FROM subjects
            WHERE department_id = ?
            ORDER BY subject_name, subject_id
            LIMIT 1
            `,
            [deptId]
        );
        if (byDept.length > 0) {
            return { subject_id: byDept[0].subject_id };
        }
    }

    if (name) {
        const [byNameOnly] = await db.execute(
            `
            SELECT subject_id FROM subjects
            WHERE LOWER(TRIM(subject_name)) = LOWER(?)
            ORDER BY subject_id
            LIMIT 1
            `,
            [name]
        );
        if (byNameOnly.length > 0) {
            return { subject_id: byNameOnly[0].subject_id };
        }
    }

    return {
        error:
            'No subject matches this teacher’s department. Add subjects under the department, or link a subject to this department.',
    };
}

async function resolveAssignmentSubject(teacherId, requestedSubjectId) {
    const [trows] = await db.execute(
        `
        SELECT t.department_id, d.department_name
        FROM teachers t
        LEFT JOIN departments d ON t.department_id = d.department_id
        WHERE t.teacher_id = ?
        `,
        [teacherId]
    );
    if (trows.length === 0) {
        return { error: 'Teacher not found' };
    }
    const { department_id: deptId, department_name: deptName } = trows[0];
    if (!deptId && !deptName) {
        return {
            error: 'This teacher has no department. Assign a department to the teacher before adding class assignments.',
        };
    }

    if (deptId) {
        const [deptSubjects] = await db.execute(
            `
            SELECT subject_id, subject_name FROM subjects
            WHERE department_id = ?
            ORDER BY subject_name, subject_id
            `,
            [deptId]
        );

        if (deptSubjects.length === 1) {
            const sid = deptSubjects[0].subject_id;
            if (
                requestedSubjectId != null &&
                String(requestedSubjectId).trim() !== '' &&
                Number(requestedSubjectId) !== Number(sid)
            ) {
                return {
                    error: 'This department has only one subject; the assignment must use that subject.',
                };
            }
            return { subject_id: sid };
        }

        if (deptSubjects.length > 1) {
            if (requestedSubjectId == null || String(requestedSubjectId).trim() === '') {
                return {
                    error:
                        'This teacher’s department has multiple subjects. Choose which subject to assign for this class.',
                    code: 'SUBJECT_CHOICE_REQUIRED',
                    subjects: deptSubjects,
                };
            }
            const found = deptSubjects.find((s) => Number(s.subject_id) === Number(requestedSubjectId));
            if (!found) {
                return {
                    error: 'Selected subject does not belong to this teacher’s department.',
                };
            }
            return { subject_id: found.subject_id };
        }
    }

    return resolveSubjectIdLegacy(teacherId);
}

async function findFiltered(class_id, teacher_id) {
    let sql = `
            SELECT 
                ta.assignment_id,
                ta.teacher_id,
                ta.subject_id,
                ta.class_id,
                ta.year_id,
                t.teacher_name,
                d.department_name,
                s.subject_name,
                g.grade_number,
                sec.section_name,
                ay.year_name
            FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            LEFT JOIN departments d ON t.department_id = d.department_id
            JOIN subjects s ON ta.subject_id = s.subject_id
            JOIN classes c ON ta.class_id = c.class_id
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            JOIN academic_years ay ON ta.year_id = ay.year_id
            WHERE 1=1
        `;
    const params = [];
    if (class_id) {
        sql += ' AND ta.class_id = ?';
        params.push(class_id);
    }
    if (teacher_id) {
        sql += ' AND ta.teacher_id = ?';
        params.push(teacher_id);
    }
    sql += ' ORDER BY g.grade_number, sec.section_name, s.subject_name';
    const [assignments] = await db.execute(sql, params);
    return assignments;
}

async function findConflictingAssignment(subject_id, class_id, year_id) {
    const [existingAssignment] = await db.execute(
        `
            SELECT ta.assignment_id, t.teacher_name 
            FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            WHERE ta.subject_id = ? AND ta.class_id = ? AND ta.year_id = ?
        `,
        [subject_id, class_id, year_id]
    );
    return existingAssignment[0] || null;
}

async function insert(teacher_id, subject_id, class_id, year_id) {
    const [result] = await db.execute(
        `
            INSERT INTO teacher_assignments (teacher_id, subject_id, class_id, year_id)
            VALUES (?, ?, ?, ?)
        `,
        [teacher_id, subject_id, class_id, year_id]
    );
    return result.insertId;
}

async function remove(assignmentId) {
    const [result] = await db.execute('DELETE FROM teacher_assignments WHERE assignment_id = ?', [assignmentId]);
    return result.affectedRows;
}

async function findTeacherAssignment(teacher_id, subject_id, class_id, year_id) {
    const [rows] = await db.execute(
        `
        SELECT assignment_id 
        FROM teacher_assignments 
        WHERE teacher_id = ? AND subject_id = ? AND class_id = ? AND year_id = ?
    `,
        [teacher_id, subject_id, class_id, year_id]
    );
    return rows[0] || null;
}

module.exports = {
    resolveSubjectIdLegacy,
    resolveAssignmentSubject,
    findFiltered,
    findConflictingAssignment,
    insert,
    remove,
    findTeacherAssignment,
};
