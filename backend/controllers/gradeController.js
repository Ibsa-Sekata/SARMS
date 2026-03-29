const db = require('../config/db');

// Get all grades
const getGrades = async (req, res) => {
    try {
        const [grades] = await db.execute(`
            SELECT grade_id, grade_number
            FROM grades
            ORDER BY grade_number
        `);

        res.json({
            success: true,
            grades: grades
        });

    } catch (error) {
        console.error('Error getting grades:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get grades',
            error: error.message
        });
    }
};

module.exports = {
    getGrades
};
