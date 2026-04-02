const db = require('../config/db');

async function findForAdmin(filters) {
    const { class_id, q } = filters;
    let sql = `
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
        WHERE 1=1
    `;
    const params = [];
    if (class_id) {
        sql += ' AND s.class_id = ?';
        params.push(class_id);
    }
    if (q && String(q).trim()) {
        const like = `%${String(q).trim()}%`;
        sql += " AND (s.student_name LIKE ? OR IFNULL(s.student_code, '') LIKE ?)";
        params.push(like, like);
    }
    sql += ' ORDER BY s.student_id';
    const [students] = await db.execute(sql, params);
    return students;
}

async function findForTeacher(teacherId, filters) {
    const { class_id, q } = filters;
    let sql = `
        SELECT DISTINCT
            s.student_id,
            s.student_name,
            s.gender,
            s.student_code,
            c.class_id,
            g.grade_number,
            sec.section_name
        FROM students s
        JOIN classes c ON s.class_id = c.class_id
        JOIN grades g ON c.grade_id = g.grade_id
        JOIN sections sec ON c.section_id = sec.section_id
        WHERE s.class_id IN (
            SELECT DISTINCT class_id 
            FROM teacher_assignments 
            WHERE teacher_id = ?
        )
    `;
    const params = [teacherId];
    if (class_id) {
        sql += ' AND s.class_id = ?';
        params.push(class_id);
    }
    if (q && String(q).trim()) {
        const like = `%${String(q).trim()}%`;
        sql += " AND (s.student_name LIKE ? OR IFNULL(s.student_code, '') LIKE ?)";
        params.push(like, like);
    }
    sql += ' ORDER BY s.student_id';
    const [students] = await db.execute(sql, params);
    return students;
}

async function hasAssignmentForClass(teacherId, classId) {
    const [assignments] = await db.execute(
        `SELECT assignment_id FROM teacher_assignments WHERE teacher_id = ? AND class_id = ?`,
        [teacherId, classId]
    );
    return assignments.length > 0;
}

async function findByClassId(classId, q) {
    let classSql = `
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
        WHERE s.class_id = ?
    `;
    const classParams = [classId];
    if (q && String(q).trim()) {
        const like = `%${String(q).trim()}%`;
        classSql += " AND (s.student_name LIKE ? OR IFNULL(s.student_code, '') LIKE ?)";
        classParams.push(like, like);
    }
    classSql += ' ORDER BY s.student_id';
    const [students] = await db.execute(classSql, classParams);
    return students;
}

async function findById(id) {
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

async function insert(student_name, gender, student_code, class_id) {
    const [result] = await db.execute(
        `
        INSERT INTO students (student_name, gender, student_code, class_id)
        VALUES (?, ?, ?, ?)
    `,
        [student_name, gender, student_code || null, class_id]
    );
    return result.insertId;
}

async function update(id, student_name, gender, student_code, class_id) {
    const [result] = await db.execute(
        `
        UPDATE students 
        SET student_name = ?, gender = ?, student_code = ?, class_id = ?
        WHERE student_id = ?
    `,
        [student_name, gender, student_code, class_id, id]
    );
    return result.affectedRows;
}

async function remove(id) {
    const [result] = await db.execute('DELETE FROM students WHERE student_id = ?', [id]);
    return result.affectedRows;
}

async function getClassId(studentId) {
    const [student] = await db.execute('SELECT class_id FROM students WHERE student_id = ?', [studentId]);
    return student[0] || null;
}

module.exports = {
    findForAdmin,
    findForTeacher,
    hasAssignmentForClass,
    findByClassId,
    findById,
    insert,
    update,
    remove,
    getClassId,
};
