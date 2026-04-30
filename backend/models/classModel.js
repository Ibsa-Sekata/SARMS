const db = require('../config/db');

async function findAllWithDetails() {
    const [classes] = await db.execute(`SELECT * FROM v_class_enriched ORDER BY class_id`);
    return classes;
}

async function findById(id) {
    const [classes] = await db.execute(`SELECT * FROM v_class_enriched WHERE class_id = ?`, [id]);
    return classes[0] || null;
}

async function findStudentsByClassId(classId) {
    const [students] = await db.execute(
        `
        SELECT 
            s.student_id,
            s.student_name,
            s.gender,
            s.student_code
        FROM students s
        WHERE s.class_id = ?
        ORDER BY s.student_name
    `,
        [classId]
    );
    return students;
}

async function findByGradeAndSection(grade_id, section_id) {
    const [existing] = await db.execute(
        `SELECT class_id FROM classes WHERE grade_id = ? AND section_id = ?`,
        [grade_id, section_id]
    );
    return existing[0] || null;
}

async function findHomeroomClassForTeacher(teacherId) {
    const [teacherClass] = await db.execute(`SELECT * FROM v_class_enriched WHERE homeroom_teacher_id = ?`, [teacherId]);
    return teacherClass[0] || null;
}

async function findHomeroomClassForTeacherExcludingClass(teacherId, excludeClassId) {
    const [teacherClass] = await db.execute(`SELECT * FROM v_class_enriched WHERE homeroom_teacher_id = ? AND class_id != ?`, [teacherId, excludeClassId]);
    return teacherClass[0] || null;
}

async function insert(grade_id, section_id, homeroom_teacher_id) {
    const [result] = await db.execute(
        `
        INSERT INTO classes (grade_id, section_id, homeroom_teacher_id)
        VALUES (?, ?, ?)
    `,
        [grade_id, section_id, homeroom_teacher_id]
    );
    return result.insertId;
}

async function updateHomeroomTeacher(classId, homeroom_teacher_id) {
    const [result] = await db.execute(`UPDATE classes SET homeroom_teacher_id = ? WHERE class_id = ?`, [
        homeroom_teacher_id,
        classId,
    ]);
    return result.affectedRows;
}

async function updateClass(classId, grade_id, section_id, homeroom_teacher_id) {
    const [result] = await db.execute(
        `UPDATE classes SET grade_id = ?, section_id = ?, homeroom_teacher_id = ? WHERE class_id = ?`,
        [grade_id, section_id, homeroom_teacher_id, classId]
    );
    return result.affectedRows;
}

async function countStudents(classId) {
    const [students] = await db.execute('SELECT COUNT(*) as count FROM students WHERE class_id = ?', [classId]);
    return students[0].count;
}

async function countAssignments(classId) {
    const [assignments] = await db.execute(
        'SELECT COUNT(*) as count FROM teacher_assignments WHERE class_id = ?',
        [classId]
    );
    return assignments[0].count;
}

async function remove(classId) {
    const [result] = await db.execute('DELETE FROM classes WHERE class_id = ?', [classId]);
    return result.affectedRows;
}

async function getHomeroomTeacherId(classId) {
    const [homeroomRows] = await db.execute('SELECT homeroom_teacher_id FROM classes WHERE class_id = ?', [
        classId,
    ]);
    return homeroomRows[0] || null;
}

module.exports = {
    findAllWithDetails,
    findById,
    findStudentsByClassId,
    findByGradeAndSection,
    findHomeroomClassForTeacher,
    findHomeroomClassForTeacherExcludingClass,
    insert,
    updateHomeroomTeacher,
    updateClass,
    countStudents,
    countAssignments,
    remove,
    getHomeroomTeacherId,
};
