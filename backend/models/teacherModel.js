const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function findAllWithUserDept() {
    const [teachers] = await db.execute(`
        SELECT 
            t.teacher_id,
            t.teacher_name,
            t.email,
            d.department_id,
            d.department_name,
            u.username,
            u.role
        FROM teachers t
        LEFT JOIN departments d ON t.department_id = d.department_id
        LEFT JOIN users u ON t.user_id = u.user_id
        ORDER BY t.teacher_id
    `);
    return teachers;
}

async function findById(id) {
    const [teachers] = await db.execute(
        `
        SELECT 
            t.teacher_id,
            t.teacher_name,
            t.email,
            d.department_id,
            d.department_name,
            u.username,
            u.role
        FROM teachers t
        LEFT JOIN departments d ON t.department_id = d.department_id
        LEFT JOIN users u ON t.user_id = u.user_id
        WHERE t.teacher_id = ?
    `,
        [id]
    );
    return teachers[0] || null;
}

async function findAssignmentsForTeacherYear(teacherId, yearId) {
    const [assignments] = await db.execute(
        `
            SELECT 
                ta.assignment_id,
                ta.teacher_id,
                ta.class_id,
                ta.subject_id,
                c.class_id,
                g.grade_number,
                sec.section_name,
                s.subject_name,
                ay.year_name
            FROM teacher_assignments ta
            JOIN classes c ON ta.class_id = c.class_id
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            JOIN subjects s ON ta.subject_id = s.subject_id
            JOIN academic_years ay ON ta.year_id = ay.year_id
            WHERE ta.teacher_id = ? AND ta.year_id = ?
            ORDER BY g.grade_number, sec.section_name, s.subject_name
        `,
        [teacherId, yearId]
    );
    return assignments;
}

async function usernameTaken(username) {
    const [taken] = await db.execute('SELECT user_id FROM users WHERE username = ? LIMIT 1', [username]);
    return taken.length > 0;
}

async function createTeacherWithUser({ teacher_name, email, deptId, username, password }) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const hashedPassword = await bcrypt.hash(password, 10);
        const [userResult] = await connection.execute(
            `INSERT INTO users (username, password, email, role)
             VALUES (?, ?, ?, 'teacher')`,
            [username, hashedPassword, email]
        );
        const userId = Number(userResult.insertId);
        const [teacherResult] = await connection.execute(
            `INSERT INTO teachers (teacher_name, email, department_id, user_id)
             VALUES (?, ?, ?, ?)`,
            [teacher_name, email, deptId, userId]
        );
        await connection.commit();
        return { userId, teacher_id: teacherResult.insertId };
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

async function deleteTeacherCascade(teacherId) {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute('SELECT user_id FROM teachers WHERE teacher_id = ?', [teacherId]);
        if (rows.length === 0) {
            return { deleted: false };
        }
        const userId = rows[0].user_id;
        if (userId) {
            await connection.execute('DELETE FROM users WHERE user_id = ?', [userId]);
        } else {
            const [result] = await connection.execute('DELETE FROM teachers WHERE teacher_id = ?', [teacherId]);
            if (result.affectedRows === 0) {
                return { deleted: false };
            }
        }
        return { deleted: true };
    } finally {
        connection.release();
    }
}

async function updateTeacherAndUser(teacherId, { teacher_name, email, deptId, username, password }) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            'SELECT user_id FROM teachers WHERE teacher_id = ? LIMIT 1',
            [teacherId]
        );
        if (rows.length === 0) {
            await connection.rollback();
            return { updated: false };
        }
        const userId = rows[0].user_id;
        if (!userId) {
            await connection.rollback();
            throw new Error('Teacher account is missing linked user record');
        }

        const [usernameRows] = await connection.execute(
            'SELECT user_id FROM users WHERE username = ? AND user_id <> ? LIMIT 1',
            [username, userId]
        );
        if (usernameRows.length > 0) {
            const err = new Error('Duplicate username');
            err.code = 'ER_DUP_ENTRY';
            throw err;
        }

        const [emailRows] = await connection.execute(
            'SELECT user_id FROM users WHERE email = ? AND user_id <> ? LIMIT 1',
            [email, userId]
        );
        if (emailRows.length > 0) {
            const err = new Error('Duplicate email');
            err.code = 'ER_DUP_ENTRY';
            throw err;
        }

        if (password && String(password).trim()) {
            const hashedPassword = await bcrypt.hash(String(password), 10);
            await connection.execute(
                'UPDATE users SET username = ?, email = ?, password = ? WHERE user_id = ?',
                [username, email, hashedPassword, userId]
            );
        } else {
            await connection.execute('UPDATE users SET username = ?, email = ? WHERE user_id = ?', [
                username,
                email,
                userId,
            ]);
        }

        await connection.execute(
            'UPDATE teachers SET teacher_name = ?, email = ?, department_id = ? WHERE teacher_id = ?',
            [teacher_name, email, deptId, teacherId]
        );
        await connection.commit();
        return { updated: true };
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

module.exports = {
    findAllWithUserDept,
    findById,
    findAssignmentsForTeacherYear,
    usernameTaken,
    createTeacherWithUser,
    deleteTeacherCascade,
    updateTeacherAndUser,
};
