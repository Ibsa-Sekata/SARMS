const express = require('express');
const router = express.Router();
const {
    getMarks,
    createMark,
    updateMark,
    deleteMark,
    submitMarks,
    getMarksByClass,
    submitToHomeroom,
    getSubmittedMarksForHomeroom,
    approveAllMarks
} = require('../controllers/markController');
const { protect, isSubjectTeacher, isHomeroomTeacher } = require('../middleware/authMiddleware');

// @route   GET /api/marks
// @desc    Get marks (filtered by teacher access)
// @access  Private
router.get('/', protect, getMarks);

// @route   GET /api/marks/class/:classId
// @desc    Get marks by class
// @access  Private
router.get('/class/:classId', protect, getMarksByClass);

// @route   POST /api/marks
// @desc    Create new mark
// @access  Private
router.post('/', protect, createMark);

// @route   POST /api/marks/batch
// @desc    Submit all marks for a class (subject teachers)
// @access  Private
router.post('/batch', protect, submitMarks);

// @route   POST /api/marks/submit-to-homeroom
// @desc    Submit marks to homeroom teacher
// @access  Private
router.post('/submit-to-homeroom', protect, submitToHomeroom);

// @route   GET /api/marks/homeroom/submitted
// @desc    Get all submitted marks for homeroom teacher's class
// @access  Private (Homeroom Teacher only)
router.get('/homeroom/submitted', protect, isHomeroomTeacher, getSubmittedMarksForHomeroom);

// @route   POST /api/marks/homeroom/approve-all
// @desc    Validate all subject marks are complete for class-term
// @access  Private (Homeroom Teacher only)
router.post('/homeroom/approve-all', protect, isHomeroomTeacher, approveAllMarks);

// @route   PUT /api/marks/:id
// @desc    Update mark
// @access  Private
router.put('/:id', protect, updateMark);

// @route   DELETE /api/marks/:id
// @desc    Delete mark
// @access  Private
router.delete('/:id', protect, deleteMark);

module.exports = router;