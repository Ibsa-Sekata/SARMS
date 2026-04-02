const sectionModel = require('../models/sectionModel');

const getSections = async (req, res) => {
    try {
        const sections = await sectionModel.findAllOrdered();
        res.json({ success: true, sections });
    } catch (error) {
        console.error('Error getting sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sections',
            error: error.message,
        });
    }
};

module.exports = { getSections };
