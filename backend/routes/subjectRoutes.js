const express = require('express');
const router = express.Router();
const {
    getSubjects,
    getSubject,
    createSubject
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Private
router.get('/', protect, getSubjects);

// @route   GET /api/subjects/:id
// @desc    Get single subject
// @access  Private
router.get('/:id', protect, getSubject);

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private
router.post('/', protect, createSubject);

module.exports = router;