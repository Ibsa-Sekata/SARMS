const db = require('../config/db');

async function findAllKeyValue() {
    const [settings] = await db.execute(`
        SELECT setting_key, setting_value, description
        FROM system_settings
    `);
    return settings;
}

async function findContextKeys() {
    const [settings] = await db.execute(`
        SELECT setting_key, setting_value
        FROM system_settings
        WHERE setting_key IN ('current_year_id', 'current_semester_id')
    `);
    return settings;
}

async function findYearById(yearId) {
    const [years] = await db.execute(
        `
        SELECT year_id, year_name
        FROM academic_years
        WHERE year_id = ?
    `,
        [yearId]
    );
    return years[0] || null;
}

async function findYearByName(yearName) {
    const [years] = await db.execute('SELECT year_id FROM academic_years WHERE year_name = ?', [yearName]);
    return years[0] || null;
}

async function insertYear(yearName) {
    const [result] = await db.execute('INSERT INTO academic_years (year_name) VALUES (?)', [yearName]);
    return result.insertId;
}

async function upsertSetting(key, value, description) {
    await db.execute(
        `
        INSERT INTO system_settings (setting_key, setting_value, description)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value = ?
    `,
        [key, value, description, value]
    );
}

async function updateSettingValue(setting_key, setting_value) {
    const [result] = await db.execute(
        `
        UPDATE system_settings
        SET setting_value = ?
        WHERE setting_key = ?
    `,
        [setting_value, setting_key]
    );
    return result.affectedRows;
}

async function findAcademicYearsOrdered() {
    const [years] = await db.execute(`
        SELECT year_id, year_name
        FROM academic_years
        ORDER BY year_name DESC
    `);
    return years;
}

async function getCurrentYearIdSetting() {
    const [settings] = await db.execute(`
        SELECT setting_value 
        FROM system_settings 
        WHERE setting_key = 'current_year_id'
    `);
    return settings[0]?.setting_value;
}

async function getFirstYearId() {
    const [years] = await db.execute('SELECT year_id FROM academic_years ORDER BY year_id LIMIT 1');
    return years.length > 0 ? years[0].year_id : 1;
}

module.exports = {
    findAllKeyValue,
    findContextKeys,
    findYearById,
    findYearByName,
    insertYear,
    upsertSetting,
    updateSettingValue,
    findAcademicYearsOrdered,
    getCurrentYearIdSetting,
    getFirstYearId,
};
