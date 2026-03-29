const express = require('express');
const router = express.Router();
const { getGrades } = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/grades
// @desc    Get all grades
// @access  Private
router.get('/', protect, getGrades);

module.exports = router;
