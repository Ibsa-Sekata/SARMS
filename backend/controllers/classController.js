const db = require('../config/db');

// Get all classes
const getClasses = async (req, res) => {
    try {
        const [classes] = await db.execute(`
            SELECT 
                c.class_id,
                g.grade_number,
                sec.section_name,
                t.teacher_id,
                t.teacher_name as homeroom_teacher
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            ORDER BY g.grade_number, sec.section_name
        `);

        res.json({
            success: true,
            classes: classes
        });

    } catch (error) {
        console.error('Error getting classes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get classes',
            error: error.message
        });
    }
};

// Get single class
const getClass = async (req, res) => {
    try {
        const { id } = req.params;

        const [classes] = await db.execute(`
            SELECT 
                c.class_id,
                g.grade_number,
                sec.section_name,
                t.teacher_id,
                t.teacher_name as homeroom_teacher
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            WHERE c.class_id = ?
        `, [id]);

        if (classes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.json({
            success: true,
            class: classes[0]
        });

    } catch (error) {
        console.error('Error getting class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get class',
            error: error.message
        });
    }
};

// Get students in a class
const getClassStudents = async (req, res) => {
    try {
        const { id } = req.params;

        const [students] = await db.execute(`
            SELECT 
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                s.date_of_birth
            FROM students s
            WHERE s.class_id = ?
            ORDER BY s.student_name
        `, [id]);

        res.json({
            success: true,
            students: students
        });

    } catch (error) {
        console.error('Error getting class students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get class students',
            error: error.message
        });
    }
};

// Create new class
const createClass = async (req, res) => {
    try {
        const { grade_id, section_id, homeroom_teacher_id } = req.body;

        // Validate required fields
        if (!grade_id || !section_id || !homeroom_teacher_id) {
            return res.status(400).json({
                success: false,
                message: 'Grade, section, and homeroom teacher are required'
            });
        }

        // Check if class already exists
        const [existing] = await db.execute(`
            SELECT class_id FROM classes WHERE grade_id = ? AND section_id = ?
        `, [grade_id, section_id]);

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Class already exists for this grade and section'
            });
        }

        // Check if teacher is already a homeroom teacher for another class
        const [teacherClass] = await db.execute(`
            SELECT c.class_id, g.grade_number, sec.section_name
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            WHERE c.homeroom_teacher_id = ?
        `, [homeroom_teacher_id]);

        if (teacherClass.length > 0) {
            return res.status(400).json({
                success: false,
                message: `This teacher is already a homeroom teacher for Grade ${teacherClass[0].grade_number}${teacherClass[0].section_name}. A teacher can only be homeroom teacher for one class.`
            });
        }

        const [result] = await db.execute(`
            INSERT INTO classes (grade_id, section_id, homeroom_teacher_id)
            VALUES (?, ?, ?)
        `, [grade_id, section_id, homeroom_teacher_id]);

        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            class_id: result.insertId
        });

    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create class',
            error: error.message
        });
    }
};

// Update homeroom teacher
const updateHomeroomTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { homeroom_teacher_id } = req.body;

        if (!homeroom_teacher_id) {
            return res.status(400).json({
                success: false,
                message: 'Homeroom teacher is required'
            });
        }

        // Check if teacher is already a homeroom teacher for another class
        const [teacherClass] = await db.execute(`
            SELECT c.class_id, g.grade_number, sec.section_name
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            WHERE c.homeroom_teacher_id = ? AND c.class_id != ?
        `, [homeroom_teacher_id, id]);

        if (teacherClass.length > 0) {
            return res.status(400).json({
                success: false,
                message: `This teacher is already a homeroom teacher for Grade ${teacherClass[0].grade_number}${teacherClass[0].section_name}. A teacher can only be homeroom teacher for one class.`
            });
        }

        const [result] = await db.execute(`
            UPDATE classes SET homeroom_teacher_id = ? WHERE class_id = ?
        `, [homeroom_teacher_id, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.json({
            success: true,
            message: 'Homeroom teacher updated successfully'
        });

    } catch (error) {
        console.error('Error updating homeroom teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update homeroom teacher',
            error: error.message
        });
    }
};

// Delete class
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class has students
        const [students] = await db.execute(
            'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
            [id]
        );

        if (students[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class. It has ${students[0].count} student(s). Please remove or reassign students first.`
            });
        }

        // Check if class has teacher assignments
        const [assignments] = await db.execute(
            'SELECT COUNT(*) as count FROM teacher_assignments WHERE class_id = ?',
            [id]
        );

        if (assignments[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class. It has ${assignments[0].count} teacher assignment(s). Please remove assignments first.`
            });
        }

        const [result] = await db.execute('DELETE FROM classes WHERE class_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.json({
            success: true,
            message: 'Class deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete class',
            error: error.message
        });
    }
};

module.exports = {
    getClasses,
    getClass,
    getClassStudents,
    createClass,
    updateHomeroomTeacher,
    deleteClass
};
