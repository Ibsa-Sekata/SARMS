const db = require('../config/db');

function normalizeSectionName(raw) {
    const ch = String(raw ?? '')
        .trim()
        .toUpperCase()
        .slice(0, 1);
    if (!ch) return null;
    if (!/^[A-Z0-9]$/.test(ch)) return null;
    return ch;
}

async function findAllOrdered() {
    const [sections] = await db.execute(`
        SELECT section_id, section_name
        FROM sections
        ORDER BY section_name
    `);
    return sections;
}

async function findByName(sectionName) {
    const ch = normalizeSectionName(sectionName);
    if (!ch) return null;
    const [rows] = await db.execute('SELECT section_id, section_name FROM sections WHERE section_name = ? LIMIT 1', [
        ch,
    ]);
    return rows[0] || null;
}

async function insert(sectionName) {
    const ch = normalizeSectionName(sectionName);
    if (!ch) {
        const err = new Error('Section must be a single letter (A–Z) or digit (0–9)');
        err.code = 'VALIDATION';
        throw err;
    }
    const [result] = await db.execute('INSERT INTO sections (section_name) VALUES (?)', [ch]);
    return { section_id: result.insertId, section_name: ch };
}

module.exports = { findAllOrdered, findByName, insert, normalizeSectionName };
