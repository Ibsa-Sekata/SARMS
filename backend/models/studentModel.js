const db = require('../config/db');

async function findForAdmin(filters) {
    const { class_id, q } = filters;
    let sql = `SELECT * FROM v_student_enriched WHERE 1=1`;
    const params = [];
    if (class_id) {
        sql += ' AND class_id = ?';
        params.push(class_id);
    }
    if (q && String(q).trim()) {
        const like = `%${String(q).trim()}%`;
        sql += " AND (student_name LIKE ? OR IFNULL(student_code, '') LIKE ?)";
        params.push(like, like);
    }
    sql += ' ORDER BY student_id';
    const [students] = await db.execute(sql, params);
    return students;
}

async function findForTeacher(teacherId, filters) {
    const { class_id, q } = filters;
    let sql = `SELECT DISTINCT student_id, student_name, gender, student_code, class_id, grade_number, section_name FROM v_student_enriched WHERE class_id IN (SELECT DISTINCT class_id FROM teacher_assignments WHERE teacher_id = ?)`;
    const params = [teacherId];
    if (class_id) {
        sql += ' AND class_id = ?';
        params.push(class_id);
    }
    if (q && String(q).trim()) {
        const like = `%${String(q).trim()}%`;
        sql += " AND (student_name LIKE ? OR IFNULL(student_code, '') LIKE ?)";
        params.push(like, like);
    }
    sql += ' ORDER BY student_id';
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
    let sql = `SELECT * FROM v_student_enriched WHERE class_id = ?`;
    const params = [classId];
    if (q && String(q).trim()) {
        const like = `%${String(q).trim()}%`;
        sql += " AND (student_name LIKE ? OR IFNULL(student_code, '') LIKE ?)";
        params.push(like, like);
    }
    sql += ' ORDER BY student_id';
    const [students] = await db.execute(sql, params);
    return students;
}

async function findById(id) {
    const [students] = await db.execute(`SELECT * FROM v_student_enriched WHERE student_id = ?`, [id]);
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
