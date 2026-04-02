const subjectModel = require('../models/subjectModel');

const getSubjects = async (req, res) => {
    try {
        const subjects = await subjectModel.findAllWithDepartment();
        res.json({ success: true, subjects });
    } catch (error) {
        console.error('Error getting subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subjects',
            error: error.message,
        });
    }
};

const getSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await subjectModel.findById(id);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found',
            });
        }
        res.json({ success: true, subject });
    } catch (error) {
        console.error('Error getting subject:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subject',
            error: error.message,
        });
    }
};

const createSubject = async (req, res) => {
    try {
        const { subject_name, department_id } = req.body;

        if (!subject_name) {
            return res.status(400).json({
                success: false,
                message: 'Subject name is required',
            });
        }

        const subject_id = await subjectModel.insert(subject_name, department_id);
        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            subject_id,
        });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subject',
            error: error.message,
        });
    }
};

module.exports = {
    getSubjects,
    getSubject,
    createSubject,
};
