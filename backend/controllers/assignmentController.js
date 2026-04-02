const assignmentModel = require('../models/assignmentModel');
const settingsModel = require('../models/settingsModel');

async function resolveYearId(year_id) {
    if (year_id) return year_id;
    const s = await settingsModel.getCurrentYearIdSetting();
    if (s) return parseInt(s, 10);
    return settingsModel.getFirstYearId();
}

const getAssignments = async (req, res) => {
    try {
        const { class_id, teacher_id } = req.query;
        const assignments = await assignmentModel.findFiltered(class_id, teacher_id);
        res.json({ success: true, assignments });
    } catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get assignments',
            error: error.message,
        });
    }
};

const createAssignment = async (req, res) => {
    try {
        let { teacher_id, subject_id, class_id, year_id } = req.body;

        if (!teacher_id || !class_id) {
            return res.status(400).json({
                success: false,
                message: 'Teacher and class are required',
            });
        }

        const resolved = await assignmentModel.resolveAssignmentSubject(teacher_id, subject_id);
        if (resolved.error) {
            const payload = {
                success: false,
                message: resolved.error,
            };
            if (resolved.code) payload.code = resolved.code;
            if (resolved.subjects) payload.subjects = resolved.subjects;
            return res.status(400).json(payload);
        }
        subject_id = resolved.subject_id;

        year_id = await resolveYearId(year_id);

        const conflict = await assignmentModel.findConflictingAssignment(subject_id, class_id, year_id);
        if (conflict) {
            return res.status(400).json({
                success: false,
                message: `This subject is already assigned to ${conflict.teacher_name}. Only one teacher can teach a subject in a class. Please remove the existing assignment first.`,
            });
        }

        const assignment_id = await assignmentModel.insert(teacher_id, subject_id, class_id, year_id);
        res.status(201).json({
            success: true,
            message: 'Teacher assigned successfully',
            assignment_id,
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create assignment',
            error: error.message,
            details: error.sqlMessage || error.toString(),
        });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await assignmentModel.remove(id);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found',
            });
        }
        res.json({
            success: true,
            message: 'Assignment deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete assignment',
            error: error.message,
        });
    }
};

module.exports = {
    getAssignments,
    createAssignment,
    deleteAssignment,
};
