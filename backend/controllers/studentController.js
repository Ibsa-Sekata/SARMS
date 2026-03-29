const db = require('../config/db');

// Get all students (filtered by teacher access)
const getStudents = async (req, res) => {
    try {
        const { class_id, year_id, semester_id } = req.query;
        const user = req.user;

        console.log('Getting students for user:', user.role, user.teacher_id);

        let sql, params;

        // Admin can see all students
        if (user.role === 'admin') {
            sql = `
                SELECT 
                    s.student_id,
                    s.student_name,
                    s.gender,
                    s.student_code,
                    s.date_of_birth,
                    s.enrollment_date,
                    c.class_id,
                    g.grade_number,
                    sec.section_name
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.class_id
                LEFT JOIN grades g ON c.grade_id = g.grade_id
                LEFT JOIN sections sec ON c.section_id = sec.section_id
                WHERE 1=1
            `;
            params = [];

            if (class_id) {
                sql += ' AND s.class_id = ?';
                params.push(class_id);
            }
        } else {
            // Teachers can only see students in classes they're assigned to
            sql = `
                SELECT DISTINCT
                    s.student_id,
                    s.student_name,
                    s.gender,
                    s.student_code,
                    s.date_of_birth,
                    s.enrollment_date,
                    c.class_id,
                    g.grade_number,
                    sec.section_name
                FROM students s
                JOIN classes c ON s.class_id = c.class_id
                JOIN grades g ON c.grade_id = g.grade_id
                JOIN sections sec ON c.section_id = sec.section_id
                WHERE s.class_id IN (
                    SELECT DISTINCT class_id 
                    FROM teacher_assignments 
                    WHERE teacher_id = ?
                )
            `;
            params = [user.teacher_id];

            if (class_id) {
                sql += ' AND s.class_id = ?';
                params.push(class_id);
            }
        }

        sql += ' ORDER BY s.student_name';

        const [students] = await db.execute(sql, params);

        console.log(`Found ${students.length} students for user`);

        res.json({
            success: true,
            students: students
        });

    } catch (error) {
        console.error('Error getting students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get students',
            error: error.message
        });
    }
};

// Get students by class (with access control)
const getStudentsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const user = req.user;

        console.log('Getting students for class:', classId, 'user:', user.teacher_id);

        // Check if teacher has access to this class
        if (user.role !== 'admin') {
            const [assignments] = await db.execute(`
                SELECT assignment_id 
                FROM teacher_assignments 
                WHERE teacher_id = ? AND class_id = ?
            `, [user.teacher_id, classId]);

            if (assignments.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to teach this class'
                });
            }
        }

        const [students] = await db.execute(`
            SELECT 
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                s.date_of_birth,
                s.enrollment_date,
                c.class_id,
                g.grade_number,
                sec.section_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN grades g ON c.grade_id = g.grade_id
            LEFT JOIN sections sec ON c.section_id = sec.section_id
            WHERE s.class_id = ?
            ORDER BY s.student_name
        `, [classId]);

        res.json({
            success: true,
            students: students
        });

    } catch (error) {
        console.error('Error getting students by class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get students',
            error: error.message
        });
    }
};

// Get single student
const getStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const [students] = await db.execute(`
            SELECT
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                s.date_of_birth,
                s.enrollment_date,
                c.class_id,
                g.grade_number,
                sec.section_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN grades g ON c.grade_id = g.grade_id
            LEFT JOIN sections sec ON c.section_id = sec.section_id
            WHERE s.student_id = ?
        `, [id]);

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            student: students[0]
        });

    } catch (error) {
        console.error('Error getting student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student',
            error: error.message
        });
    }
};

// Create new student
const createStudent = async (req, res) => {
    try {
        const { student_name, gender, student_code, class_id, date_of_birth } = req.body;

        console.log('Creating student with data:', { student_name, gender, student_code, class_id, date_of_birth });
        console.log('Gender value type:', typeof gender, 'Value:', gender, 'Length:', gender?.length);

        // Validation
        if (!student_name || !gender || !class_id) {
            return res.status(400).json({
                success: false,
                message: 'Student name, gender, and class are required'
            });
        }

        // Validate gender value
        if (gender !== 'M' && gender !== 'F') {
            console.error('Invalid gender value received:', gender);
            return res.status(400).json({
                success: false,
                message: `Gender must be either M or F(received: ${gender})`
            });
        }

        console.log('Inserting student with gender:', gender);

        const [result] = await db.execute(`
            INSERT INTO students (student_name, gender, student_code, class_id, date_of_birth)
            VALUES (?, ?, ?, ?, ?)
        `, [student_name, gender, student_code || null, class_id, date_of_birth || null]);

        console.log('Student created with ID:', result.insertId);

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            student_id: result.insertId
        });

    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create student',
            error: error.message,
            details: error.sqlMessage || error.toString()
        });
    }
};

// Update student
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { student_name, gender, student_code, class_id, date_of_birth } = req.body;

        const [result] = await db.execute(`
            UPDATE students 
            SET student_name = ?, gender = ?, student_code = ?, class_id = ?, date_of_birth = ?
            WHERE student_id = ?
        `, [student_name, gender, student_code, class_id, date_of_birth, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            message: 'Student updated successfully'
        });

    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student',
            error: error.message
        });
    }
};

// Delete student
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute('DELETE FROM students WHERE student_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete student',
            error: error.message
        });
    }
};

module.exports = {
    getStudents,
    getStudent,
    getStudentsByClass,
    createStudent,
    updateStudent,
    deleteStudent
};
