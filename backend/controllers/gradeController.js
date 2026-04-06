const gradeModel = require('../models/gradeModel');

const getGrades = async (req, res) => {
    try {
        const grades = await gradeModel.findAllOrdered();
        res.json({ success: true, grades });
    } catch (error) {
        console.error('Error getting grades:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get grades',
            error: error.message,
        });
    }
};

const createGrade = async (req, res) => {
    try {
        const { grade_number } = req.body;
        if (grade_number === undefined || grade_number === null || String(grade_number).trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'grade_number is required',
            });
        }
        const n = parseInt(grade_number, 10);
        if (!Number.isFinite(n) || n < 1 || n > 99) {
            return res.status(400).json({
                success: false,
                message: 'grade_number must be an integer between 1 and 99',
            });
        }

        const existing = await gradeModel.findByNumber(n);
        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Grade already exists',
                grade_id: existing.grade_id,
                grade_number: existing.grade_number,
                existing: true,
            });
        }

        const grade_id = await gradeModel.insert(n);
        return res.status(201).json({
            success: true,
            message: 'Grade created',
            grade_id,
            grade_number: n,
            existing: false,
        });
    } catch (error) {
        console.error('Error creating grade:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            const n = parseInt(req.body.grade_number, 10);
            const row = await gradeModel.findByNumber(n);
            if (row) {
                return res.status(200).json({
                    success: true,
                    message: 'Grade already exists',
                    grade_id: row.grade_id,
                    grade_number: row.grade_number,
                    existing: true,
                });
            }
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to create grade',
            error: error.message,
        });
    }
};

module.exports = { getGrades, createGrade };
