const db = require('../config/db');

async function findAllOrdered() {
    const [grades] = await db.execute(`
        SELECT grade_id, grade_number
        FROM grades
        ORDER BY grade_number
    `);
    return grades;
}

async function findByNumber(gradeNumber) {
    const [rows] = await db.execute('SELECT grade_id, grade_number FROM grades WHERE grade_number = ? LIMIT 1', [
        gradeNumber,
    ]);
    return rows[0] || null;
}

async function insert(gradeNumber) {
    const [result] = await db.execute('INSERT INTO grades (grade_number) VALUES (?)', [gradeNumber]);
    return result.insertId;
}

module.exports = { findAllOrdered, findByNumber, insert };
