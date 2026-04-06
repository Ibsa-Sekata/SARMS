const express = require('express');
const router = express.Router();
const { getGrades, createGrade } = require('../controllers/gradeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/grades
// @desc    Get all grades
// @access  Private
router.get('/', protect, getGrades);

// @route   POST /api/grades
// @desc    Create a grade (admin)
// @access  Private / Admin
router.post('/', protect, adminOnly, createGrade);

module.exports = router;
