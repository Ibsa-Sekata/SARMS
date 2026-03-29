const express = require('express');
const router = express.Router();
const {
    generateStudentReport,
    generateClassReport,
    getClassStatistics,
    generateStudentRoster
} = require('../controllers/reportController');
const { protect, isHomeroomTeacher } = require('../middleware/authMiddleware');

// @route   GET /api/reports/student/:id
// @desc    Generate individual student report
// @access  Private
router.get('/student/:id', protect, generateStudentReport);

// @route   GET /api/reports/class/:id
// @desc    Generate reports for all students in class
// @access  Private
router.get('/class/:id', protect, isHomeroomTeacher, generateClassReport);

// @route   GET /api/reports/class/:id/statistics
// @desc    Get class performance statistics
// @access  Private
router.get('/class/:id/statistics', protect, isHomeroomTeacher, getClassStatistics);

// @route   GET /api/reports/roster/:classId
// @desc    Generate student roster for a class
// @access  Private
router.get('/roster/:classId', protect, isHomeroomTeacher, generateStudentRoster);

module.exports = router;