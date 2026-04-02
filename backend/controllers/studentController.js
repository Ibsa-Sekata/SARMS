const studentModel = require('../models/studentModel');

const getStudents = async (req, res) => {
    try {
        const { class_id, q } = req.query;
        const user = req.user;
        const filters = { class_id, q };

        const students =
            user.role === 'admin'
                ? await studentModel.findForAdmin(filters)
                : await studentModel.findForTeacher(user.teacher_id, filters);

        res.json({ success: true, students });
    } catch (error) {
        console.error('Error getting students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get students',
            error: error.message,
        });
    }
};

const getStudentsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { q } = req.query;
        const user = req.user;

        if (user.role !== 'admin') {
            const ok = await studentModel.hasAssignmentForClass(user.teacher_id, classId);
            if (!ok) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to teach this class',
                });
            }
        }

        const students = await studentModel.findByClassId(classId, q);
        res.json({ success: true, students });
    } catch (error) {
        console.error('Error getting students by class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get students',
            error: error.message,
        });
    }
};

const getStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await studentModel.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        res.json({ success: true, student });
    } catch (error) {
        console.error('Error getting student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student',
            error: error.message,
        });
    }
};

const createStudent = async (req, res) => {
    try {
        const { student_name, gender, student_code, class_id } = req.body;

        if (!student_name || !gender || !class_id) {
            return res.status(400).json({
                success: false,
                message: 'Student name, gender, and class are required',
            });
        }

        if (gender !== 'M' && gender !== 'F') {
            return res.status(400).json({
                success: false,
                message: `Gender must be either M or F(received: ${gender})`,
            });
        }

        const student_id = await studentModel.insert(student_name, gender, student_code, class_id);
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            student_id,
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create student',
            error: error.message,
            details: error.sqlMessage || error.toString(),
        });
    }
};

const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { student_name, gender, student_code, class_id } = req.body;
        const affected = await studentModel.update(id, student_name, gender, student_code, class_id);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        res.json({
            success: true,
            message: 'Student updated successfully',
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student',
            error: error.message,
        });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await studentModel.remove(id);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        res.json({
            success: true,
            message: 'Student deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete student',
            error: error.message,
        });
    }
};

module.exports = {
    getStudents,
    getStudent,
    getStudentsByClass,
    createStudent,
    updateStudent,
    deleteStudent,
};
