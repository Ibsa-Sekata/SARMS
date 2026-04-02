const db = require('../config/db');

/**
 * Persist one roster per (class_id, year_id, semester_id). Latest generation overwrites.
 */
async function upsertSnapshot({ classId, yearId, semesterId, userId, payload }) {
    const json = JSON.stringify(payload);
    await db.execute(
        `
        INSERT INTO roster_snapshots (class_id, year_id, semester_id, generated_by_user_id, payload)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            generated_by_user_id = VALUES(generated_by_user_id),
            generated_at = CURRENT_TIMESTAMP,
            payload = VALUES(payload)
        `,
        [classId, yearId, semesterId, userId || null, json]
    );
}

async function findByClassTerm(classId, yearId, semesterId) {
    const [rows] = await db.execute(
        `
        SELECT roster_snapshot_id, class_id, year_id, semester_id, generated_by_user_id, generated_at, payload
        FROM roster_snapshots
        WHERE class_id = ? AND year_id = ? AND semester_id = ?
        LIMIT 1
        `,
        [classId, yearId, semesterId]
    );
    if (!rows.length) return null;
    const row = rows[0];
    let payload = row.payload;
    if (Buffer.isBuffer(payload)) {
        try {
            payload = JSON.parse(payload.toString('utf8'));
        } catch {
            payload = null;
        }
    } else if (payload != null && typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            payload = null;
        }
    }
    return {
        roster_snapshot_id: row.roster_snapshot_id,
        generated_at: row.generated_at,
        generated_by_user_id: row.generated_by_user_id,
        payload,
    };
}

module.exports = { upsertSnapshot, findByClassTerm };
