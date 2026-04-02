const classModel = require('../models/classModel');

const getClasses = async (req, res) => {
    try {
        const classes = await classModel.findAllWithDetails();
        res.json({ success: true, classes });
    } catch (error) {
        console.error('Error getting classes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get classes',
            error: error.message,
        });
    }
};

const getClass = async (req, res) => {
    try {
        const { id } = req.params;
        const cls = await classModel.findById(id);
        if (!cls) {
            return res.status(404).json({
                success: false,
                message: 'Class not found',
            });
        }
        res.json({ success: true, class: cls });
    } catch (error) {
        console.error('Error getting class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get class',
            error: error.message,
        });
    }
};

const getClassStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const students = await classModel.findStudentsByClassId(id);
        res.json({ success: true, students });
    } catch (error) {
        console.error('Error getting class students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get class students',
            error: error.message,
        });
    }
};

const createClass = async (req, res) => {
    try {
        const { grade_id, section_id, homeroom_teacher_id } = req.body;

        if (!grade_id || !section_id || !homeroom_teacher_id) {
            return res.status(400).json({
                success: false,
                message: 'Grade, section, and homeroom teacher are required',
            });
        }

        const existing = await classModel.findByGradeAndSection(grade_id, section_id);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Class already exists for this grade and section',
            });
        }

        const teacherClass = await classModel.findHomeroomClassForTeacher(homeroom_teacher_id);
        if (teacherClass) {
            return res.status(400).json({
                success: false,
                message: `This teacher is already a homeroom teacher for Grade ${teacherClass.grade_number}${teacherClass.section_name}. A teacher can only be homeroom teacher for one class.`,
            });
        }

        const class_id = await classModel.insert(grade_id, section_id, homeroom_teacher_id);
        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            class_id,
        });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create class',
            error: error.message,
        });
    }
};

const updateHomeroomTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { homeroom_teacher_id } = req.body;

        if (!homeroom_teacher_id) {
            return res.status(400).json({
                success: false,
                message: 'Homeroom teacher is required',
            });
        }

        const teacherClass = await classModel.findHomeroomClassForTeacherExcludingClass(
            homeroom_teacher_id,
            id
        );
        if (teacherClass) {
            return res.status(400).json({
                success: false,
                message: `This teacher is already a homeroom teacher for Grade ${teacherClass.grade_number}${teacherClass.section_name}. A teacher can only be homeroom teacher for one class.`,
            });
        }

        const affected = await classModel.updateHomeroomTeacher(id, homeroom_teacher_id);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found',
            });
        }

        res.json({
            success: true,
            message: 'Homeroom teacher updated successfully',
        });
    } catch (error) {
        console.error('Error updating homeroom teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update homeroom teacher',
            error: error.message,
        });
    }
};

const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { grade_id, section_id, homeroom_teacher_id } = req.body;

        if (!grade_id || !section_id || !homeroom_teacher_id) {
            return res.status(400).json({
                success: false,
                message: 'Grade, section, and homeroom teacher are required',
            });
        }

        const existing = await classModel.findByGradeAndSection(grade_id, section_id);
        if (existing && Number(existing.class_id) !== Number(id)) {
            return res.status(400).json({
                success: false,
                message: 'Class already exists for this grade and section',
            });
        }

        const teacherClass = await classModel.findHomeroomClassForTeacherExcludingClass(
            homeroom_teacher_id,
            id
        );
        if (teacherClass) {
            return res.status(400).json({
                success: false,
                message: `This teacher is already a homeroom teacher for Grade ${teacherClass.grade_number}${teacherClass.section_name}. A teacher can only be homeroom teacher for one class.`,
            });
        }

        const affected = await classModel.updateClass(id, grade_id, section_id, homeroom_teacher_id);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found',
            });
        }

        return res.json({
            success: true,
            message: 'Class updated successfully',
        });
    } catch (error) {
        console.error('Error updating class:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update class',
            error: error.message,
        });
    }
};

const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        const sc = await classModel.countStudents(id);
        if (sc > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class. It has ${sc} student(s). Please remove or reassign students first.`,
            });
        }

        const ac = await classModel.countAssignments(id);
        if (ac > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class. It has ${ac} teacher assignment(s). Please remove assignments first.`,
            });
        }

        const affected = await classModel.remove(id);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found',
            });
        }

        res.json({
            success: true,
            message: 'Class deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete class',
            error: error.message,
        });
    }
};

module.exports = {
    getClasses,
    getClass,
    getClassStudents,
    createClass,
    updateClass,
    updateHomeroomTeacher,
    deleteClass,
};
