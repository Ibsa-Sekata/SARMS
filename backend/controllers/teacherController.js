const teacherModel = require('../models/teacherModel');
const settingsModel = require('../models/settingsModel');

function duplicateEntryMessage(error) {
    const msg = String(error.sqlMessage || '');
    if (/username/i.test(msg) || /users\.username/i.test(msg)) {
        return 'This username is already taken. Usernames are case-insensitive; pick a different one.';
    }
    if (/email/i.test(msg)) {
        return 'This email is already used by another account.';
    }
    return 'That value conflicts with an existing account (duplicate username or email).';
}

const getTeachers = async (req, res) => {
    try {
        const teachers = await teacherModel.findAllWithUserDept();
        res.json({ success: true, teachers });
    } catch (error) {
        console.error('Error getting teachers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get teachers',
            error: error.message,
        });
    }
};

const getTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await teacherModel.findById(id);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found',
            });
        }
        res.json({ success: true, teacher });
    } catch (error) {
        console.error('Error getting teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get teacher',
            error: error.message,
        });
    }
};

const getTeacherAssignments = async (req, res) => {
    try {
        const { id } = req.params;
        let { year_id } = req.query;

        if (!year_id) {
            const s = await settingsModel.getCurrentYearIdSetting();
            year_id = s ? parseInt(s, 10) : await settingsModel.getFirstYearId();
        }

        const assignments = await teacherModel.findAssignmentsForTeacherYear(id, year_id);
        res.json({ success: true, assignments });
    } catch (error) {
        console.error('Error getting teacher assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get teacher assignments',
            error: error.message,
        });
    }
};

const createTeacher = async (req, res) => {
    try {
        let { teacher_name, email, department_id, username, password } = req.body;

        teacher_name = typeof teacher_name === 'string' ? teacher_name.trim() : '';
        email = typeof email === 'string' ? email.trim() : '';
        username = typeof username === 'string' ? username.trim() : '';
        password = typeof password === 'string' ? password : '';

        if (!teacher_name || !email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (teacher name, email, username, password)',
            });
        }

        const deptId =
            department_id === '' || department_id === undefined || department_id === null
                ? null
                : Number(department_id);
        if (department_id !== '' && department_id != null && Number.isNaN(deptId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department',
            });
        }

        if (await teacherModel.usernameTaken(username)) {
            return res.status(400).json({
                success: false,
                message:
                    'This username is already in use. Choose a different username (MySQL treats usernames as case-insensitive).',
            });
        }

        const { teacher_id } = await teacherModel.createTeacherWithUser({
            teacher_name,
            email,
            deptId,
            username,
            password,
        });

        res.status(201).json({
            success: true,
            message: 'Teacher created successfully',
            teacher_id,
        });
    } catch (error) {
        console.error('Error creating teacher:', error);
        const isDup =
            error.code === 'ER_DUP_ENTRY' || error.errno === 1062 || error.sqlState === '23000';
        if (isDup) {
            return res.status(400).json({
                success: false,
                message: duplicateEntryMessage(error),
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create teacher',
            error: error.message,
            details: error.sqlMessage || error.toString(),
        });
    }
};

const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        let { teacher_name, email, department_id, username, password } = req.body;

        teacher_name = typeof teacher_name === 'string' ? teacher_name.trim() : '';
        email = typeof email === 'string' ? email.trim() : '';
        username = typeof username === 'string' ? username.trim() : '';
        password = typeof password === 'string' ? password : '';

        if (!teacher_name || !email || !username) {
            return res.status(400).json({
                success: false,
                message: 'Teacher name, email, and username are required',
            });
        }

        const deptId =
            department_id === '' || department_id === undefined || department_id === null
                ? null
                : Number(department_id);
        if (department_id !== '' && department_id != null && Number.isNaN(deptId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department',
            });
        }

        const result = await teacherModel.updateTeacherAndUser(id, {
            teacher_name,
            email,
            deptId,
            username,
            password,
        });
        if (!result.updated) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found',
            });
        }

        res.json({
            success: true,
            message: 'Teacher updated successfully',
        });
    } catch (error) {
        console.error('Error updating teacher:', error);
        const isDup =
            error.code === 'ER_DUP_ENTRY' || error.errno === 1062 || error.sqlState === '23000';
        if (isDup) {
            return res.status(400).json({
                success: false,
                message: duplicateEntryMessage(error),
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update teacher',
            error: error.message,
        });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await teacherModel.deleteTeacherCascade(id);
        if (!result.deleted) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found',
            });
        }
        res.json({
            success: true,
            message: 'Teacher deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete teacher',
            error: error.message,
        });
    }
};

module.exports = {
    getTeachers,
    getTeacher,
    getTeacherAssignments,
    createTeacher,
    updateTeacher,
    deleteTeacher,
};
