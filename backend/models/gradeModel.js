const db = require('../config/db');

async function findAllOrdered() {
    const [grades] = await db.execute(`
        SELECT grade_id, grade_number
        FROM grades
        ORDER BY grade_number
    `);
    return grades;
}

module.exports = { findAllOrdered };
