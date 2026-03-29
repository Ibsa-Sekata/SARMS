const db = require('../config/db');

// Get all teacher assignments
const getAssignments = async (req, res) => {
    try {
        const { class_id, teacher_id } = req.query;

        let sql = `
            SELECT 
                ta.assignment_id,
                ta.teacher_id,
                ta.subject_id,
                ta.class_id,
                ta.year_id,
                t.teacher_name,
                d.department_name,
                s.subject_name,
                g.grade_number,
                sec.section_name,
                ay.year_name
            FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            LEFT JOIN departments d ON t.department_id = d.department_id
            JOIN subjects s ON ta.subject_id = s.subject_id
            JOIN classes c ON ta.class_id = c.class_id
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            JOIN academic_years ay ON ta.year_id = ay.year_id
            WHERE 1=1
        `;

        const params = [];

        if (class_id) {
            sql += ' AND ta.class_id = ?';
            params.push(class_id);
        }

        if (teacher_id) {
            sql += ' AND ta.teacher_id = ?';
            params.push(teacher_id);
        }

        sql += ' ORDER BY g.grade_number, sec.section_name, s.subject_name';

        const [assignments] = await db.execute(sql, params);

        res.json({
            success: true,
            assignments: assignments
        });

    } catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get assignments',
            error: error.message
        });
    }
};

// Create teacher assignment
const createAssignment = async (req, res) => {
    try {
        let { teacher_id, subject_id, class_id, year_id } = req.body;

        if (!teacher_id || !subject_id || !class_id) {
            return res.status(400).json({
                success: false,
                message: 'Teacher, subject, and class are required'
            });
        }

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

        console.log('Creating assignment with year_id:', year_id);

        // Check if ANY teacher is already assigned to this subject in this class
        const [existingAssignment] = await db.execute(`
            SELECT ta.assignment_id, t.teacher_name 
            FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            WHERE ta.subject_id = ? AND ta.class_id = ? AND ta.year_id = ?
        `, [subject_id, class_id, year_id]);

        if (existingAssignment.length > 0) {
            return res.status(400).json({
                success: false,
                message: `This subject is already assigned to ${existingAssignment[0].teacher_name}. Only one teacher can teach a subject in a class. Please remove the existing assignment first.`
            });
        }

        const [result] = await db.execute(`
            INSERT INTO teacher_assignments (teacher_id, subject_id, class_id, year_id)
            VALUES (?, ?, ?, ?)
        `, [teacher_id, subject_id, class_id, year_id]);

        res.status(201).json({
            success: true,
            message: 'Teacher assigned successfully',
            assignment_id: result.insertId
        });

    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create assignment',
            error: error.message,
            details: error.sqlMessage || error.toString()
        });
    }
};

// Delete teacher assignment
const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM teacher_assignments WHERE assignment_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        res.json({
            success: true,
            message: 'Assignment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete assignment',
            error: error.message
        });
    }
};

module.exports = {
    getAssignments,
    createAssignment,
    deleteAssignment
};
