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

module.exports = { getGrades };
