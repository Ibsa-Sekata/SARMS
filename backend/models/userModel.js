const db = require('../config/db');

async function findByUsernameWithAuthData(username) {
    const [users] = await db.execute(
        `
        SELECT 
            u.user_id,
            u.username,
            u.email,
            u.password,
            u.role,
            t.teacher_id,
            t.teacher_name,
            t.department_id,
            d.department_name
        FROM users u
        LEFT JOIN teachers t ON u.user_id = t.user_id
        LEFT JOIN departments d ON t.department_id = d.department_id
        WHERE u.username = ?
    `,
        [username]
    );
    return users[0] || null;
}

async function findById(userId) {
    const [users] = await db.execute(
        `
        SELECT 
            u.user_id,
            u.username,
            u.email,
            u.role,
            t.teacher_id,
            t.teacher_name,
            t.department_id,
            d.department_name
        FROM users u
        LEFT JOIN teachers t ON u.user_id = t.user_id
        LEFT JOIN departments d ON t.department_id = d.department_id
        WHERE u.user_id = ?
    `,
        [userId]
    );
    return users[0] || null;
}

async function findHomeroomClassForTeacher(teacherId) {
    const [classes] = await db.execute(
        `
        SELECT 
            c.class_id,
            g.grade_number,
            s.section_name
        FROM classes c
        JOIN grades g ON c.grade_id = g.grade_id
        JOIN sections s ON c.section_id = s.section_id
        WHERE c.homeroom_teacher_id = ?
    `,
        [teacherId]
    );
    return classes[0] || null;
}

module.exports = {
    findByUsernameWithAuthData,
    findById,
    findHomeroomClassForTeacher,
};
