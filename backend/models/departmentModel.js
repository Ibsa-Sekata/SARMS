const db = require('../config/db');

async function findAllOrdered() {
    const [departments] = await db.execute(`
        SELECT department_id, department_name
        FROM departments
        ORDER BY department_id
    `);
    return departments;
}

async function insertWithSubjects(departmentName, subjectNames) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.execute(`INSERT INTO departments (department_name) VALUES (?)`, [
            departmentName,
        ]);
        const department_id = result.insertId;
        const createdSubjects = [];
        for (const name of subjectNames) {
            const [subRes] = await connection.execute(
                `INSERT INTO subjects (subject_name, department_id) VALUES (?, ?)`,
                [name, department_id]
            );
            createdSubjects.push({ subject_id: subRes.insertId, subject_name: name });
        }
        await connection.commit();
        return { department_id, createdSubjects };
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

async function insertDepartmentOnly(name) {
    const [result] = await db.execute(`INSERT INTO departments (department_name) VALUES (?)`, [name]);
    return result.insertId;
}

async function countTeachers(departmentId) {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM teachers WHERE department_id = ?', [
        departmentId,
    ]);
    return rows[0].count;
}

async function countSubjects(departmentId) {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM subjects WHERE department_id = ?', [
        departmentId,
    ]);
    return rows[0].count;
}

async function deleteById(id) {
    const [result] = await db.execute('DELETE FROM departments WHERE department_id = ?', [id]);
    return result.affectedRows;
}

async function updateNameById(id, name) {
    const [result] = await db.execute('UPDATE departments SET department_name = ? WHERE department_id = ?', [
        name,
        id,
    ]);
    return result.affectedRows;
}

async function updateDepartmentWithSubjects(id, name, addSubjectNames = [], removeSubjectIds = []) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [deptUpdate] = await connection.execute(
            'UPDATE departments SET department_name = ? WHERE department_id = ?',
            [name, id]
        );
        if (deptUpdate.affectedRows === 0) {
            await connection.rollback();
            return { affected: 0, addedSubjects: 0, removedSubjects: 0 };
        }

        let removedSubjects = 0;
        if (removeSubjectIds.length > 0) {
            const placeholders = removeSubjectIds.map(() => '?').join(', ');
            const [removeRes] = await connection.execute(
                `DELETE FROM subjects
                 WHERE department_id = ? AND subject_id IN (${placeholders})`,
                [id, ...removeSubjectIds]
            );
            removedSubjects = removeRes.affectedRows || 0;
        }

        let addedSubjects = 0;
        for (const subjectName of addSubjectNames) {
            const [insertRes] = await connection.execute(
                'INSERT INTO subjects (subject_name, department_id) VALUES (?, ?)',
                [subjectName, id]
            );
            if (insertRes.insertId) addedSubjects += 1;
        }

        await connection.commit();
        return {
            affected: deptUpdate.affectedRows,
            addedSubjects,
            removedSubjects,
        };
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

module.exports = {
    findAllOrdered,
    insertWithSubjects,
    insertDepartmentOnly,
    countTeachers,
    countSubjects,
    updateNameById,
    updateDepartmentWithSubjects,
    deleteById,
};
