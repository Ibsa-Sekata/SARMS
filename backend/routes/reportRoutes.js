const express = require('express');
const router = express.Router();
const {
    generateStudentReport,
    generateClassReport,
    getClassStatistics,
    generateStudentRoster,
    getStoredStudentRoster,
} = require('../controllers/reportController');
const { protect, isHomeroomTeacher } = require('../middleware/authMiddleware');

router.get('/student/:id', protect, generateStudentReport);
router.get('/class/:id', protect, isHomeroomTeacher, generateClassReport);
router.get('/class/:id/statistics', protect, isHomeroomTeacher, getClassStatistics);
router.get('/roster/:classId/stored', protect, isHomeroomTeacher, getStoredStudentRoster);
router.get('/roster/:classId', protect, isHomeroomTeacher, generateStudentRoster);

module.exports = router;
