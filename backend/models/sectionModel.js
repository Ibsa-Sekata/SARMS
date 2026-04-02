const db = require('../config/db');

async function findAllOrdered() {
    const [sections] = await db.execute(`
        SELECT section_id, section_name
        FROM sections
        ORDER BY section_name
    `);
    return sections;
}

module.exports = { findAllOrdered };
