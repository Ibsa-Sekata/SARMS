const db = require('../config/db');

// Get all sections
const getSections = async (req, res) => {
    try {
        const [sections] = await db.execute(`
            SELECT section_id, section_name
            FROM sections
            ORDER BY section_name
        `);

        res.json({
            success: true,
            sections: sections
        });

    } catch (error) {
        console.error('Error getting sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sections',
            error: error.message
        });
    }
};

module.exports = {
    getSections
};
