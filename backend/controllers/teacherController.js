const db = require('../config/db');

// Get all teachers
const getTeachers = async (req, res) => {
    try {
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
            ORDER BY t.teacher_name
        `);

        res.json({
            success: true,
            teachers: teachers
        });

    } catch (error) {
        console.error('Error getting teachers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get teachers',
            error: error.message
        });
    }
};

// Get single teacher
const getTeacher = async (req, res) => {
    try {
        const { id } = req.params;

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
            WHERE t.teacher_id = ?
        `, [id]);

        if (teachers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            teacher: teachers[0]
        });

    } catch (error) {
        console.error('Error getting teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get teacher',
            error: error.message
        });
    }
};

// Get teacher's class and subject assignments
const getTeacherAssignments = async (req, res) => {
    try {
        const { id } = req.params;
        let { year_id } = req.query;

        // If year_id not provided, get current year from system settings
        if (!year_id) {
            const [settings] = await db.execute(`
                SELECT setting_value 
                FROM system_settings 
                WHERE setting_key = 'current_year_id'
            `);

            if (settings.length > 0) {
                year_id = parseInt(settings[0].setting_value);
            } else {
                // Fallback: get the first academic year
                const [years] = await db.execute('SELECT year_id FROM academic_years ORDER BY year_id LIMIT 1');
                year_id = years.length > 0 ? years[0].year_id : 1;
            }
        }

        console.log('Getting assignments for teacher:', id, 'year_id:', year_id);

        const [assignments] = await db.execute(`
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
        `, [id, year_id]);

        console.log('Found', assignments.length, 'assignments for teacher', id);

        res.json({
            success: true,
            assignments: assignments
        });

    } catch (error) {
        console.error('Error getting teacher assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get teacher assignments',
            error: error.message
        });
    }
};

// Create new teacher with user account
const createTeacher = async (req, res) => {
    let connection;
    try {
        const { teacher_name, email, department_id, username, password } = req.body;

        console.log('Creating teacher with data:', { teacher_name, email, department_id, username });

        // Validation
        if (!teacher_name || !email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (teacher_name, email, username, password)'
            });
        }

        // Get connection from pool
        connection = await db.getConnection();

        try {
            await connection.query('START TRANSACTION');
            console.log('Transaction started');

            // Create user account
            const [userResult] = await connection.query(`
                INSERT INTO users (username, password, email, role)
                VALUES (?, ?, ?, 'teacher')
            `, [username, password, email]);

            const userId = userResult.insertId;
            console.log('User created with ID:', userId);

            // Create teacher record
            const [teacherResult] = await connection.query(`
                INSERT INTO teachers (teacher_name, email, department_id, user_id)
                VALUES (?, ?, ?, ?)
            `, [teacher_name, email, department_id || null, userId]);

            console.log('Teacher created with ID:', teacherResult.insertId);

            await connection.query('COMMIT');
            console.log('Transaction committed');

            res.status(201).json({
                success: true,
                message: 'Teacher created successfully',
                teacher_id: teacherResult.insertId
            });

        } catch (error) {
            console.error('Transaction error:', error);
            await connection.query('ROLLBACK');
            console.log('Transaction rolled back');
            throw error;
        } finally {
            connection.release();
            console.log('Connection released');
        }

    } catch (error) {
        console.error('Error creating teacher:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create teacher',
            error: error.message,
            details: error.sqlMessage || error.toString()
        });
    }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;

        // Get teacher's user_id before deleting
        const [teacher] = await db.execute(
            'SELECT user_id FROM teachers WHERE teacher_id = ?',
            [id]
        );

        if (teacher.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Delete teacher (this will cascade delete user account due to FK constraint)
        const [result] = await db.execute('DELETE FROM teachers WHERE teacher_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            message: 'Teacher deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete teacher',
            error: error.message
        });
    }
};

module.exports = {
    getTeachers,
    getTeacher,
    getTeacherAssignments,
    createTeacher,
    deleteTeacher
};
