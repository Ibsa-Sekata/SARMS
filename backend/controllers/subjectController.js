const db = require('../config/db');

// Get all subjects
const getSubjects = async (req, res) => {
    try {
        const [subjects] = await db.execute(`
            SELECT 
                s.subject_id,
                s.subject_name,
                d.department_id,
                d.department_name
            FROM subjects s
            LEFT JOIN departments d ON s.department_id = d.department_id
            ORDER BY s.subject_name
        `);

        res.json({
            success: true,
            subjects: subjects
        });

    } catch (error) {
        console.error('Error getting subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subjects',
            error: error.message
        });
    }
};

// Get single subject
const getSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const [subjects] = await db.execute(`
            SELECT 
                s.subject_id,
                s.subject_name,
                d.department_id,
                d.department_name
            FROM subjects s
            LEFT JOIN departments d ON s.department_id = d.department_id
            WHERE s.subject_id = ?
        `, [id]);

        if (subjects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.json({
            success: true,
            subject: subjects[0]
        });

    } catch (error) {
        console.error('Error getting subject:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subject',
            error: error.message
        });
    }
};

// Create new subject
const createSubject = async (req, res) => {
    try {
        const { subject_name, department_id } = req.body;

        if (!subject_name) {
            return res.status(400).json({
                success: false,
                message: 'Subject name is required'
            });
        }

        const [result] = await db.execute(`
            INSERT INTO subjects (subject_name, department_id)
            VALUES (?, ?)
        `, [subject_name, department_id]);

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            subject_id: result.insertId
        });

    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subject',
            error: error.message
        });
    }
};

module.exports = {
    getSubjects,
    getSubject,
    createSubject
};
