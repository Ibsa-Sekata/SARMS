const statsModel = require('../models/statsModel');

const getAdminOverview = async (req, res) => {
    try {
        const counts = await statsModel.getAdminOverviewCounts();
        res.json({
            success: true,
            overview: {
                ...counts,
                marks_draft: 0,
                marks_submitted: 0,
                marks_approved: counts.marks_total,
            },
        });
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load overview statistics',
            error: error.message,
        });
    }
};

module.exports = { getAdminOverview };
