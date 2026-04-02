const db = require('../config/db');

async function findAllWithDepartment() {
    const [subjects] = await db.execute(`
        SELECT 
            s.subject_id,
            s.subject_name,
            d.department_id,
            d.department_name
        FROM subjects s
        LEFT JOIN departments d ON s.department_id = d.department_id
        ORDER BY s.subject_name
    `);
    return subjects;
}

async function findById(id) {
    const [subjects] = await db.execute(
        `
        SELECT 
            s.subject_id,
            s.subject_name,
            d.department_id,
            d.department_name
        FROM subjects s
        LEFT JOIN departments d ON s.department_id = d.department_id
        WHERE s.subject_id = ?
    `,
        [id]
    );
    return subjects[0] || null;
}

async function insert(subject_name, department_id) {
    const [result] = await db.execute(
        `
        INSERT INTO subjects (subject_name, department_id)
        VALUES (?, ?)
    `,
        [subject_name, department_id]
    );
    return result.insertId;
}

module.exports = { findAllWithDepartment, findById, insert };
