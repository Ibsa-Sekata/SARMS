const express = require('express');
const router = express.Router();
const {
    getAssignments,
    createAssignment,
    deleteAssignment
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/teacher-assignments
// @desc    Get all teacher assignments
// @access  Private
router.get('/', protect, getAssignments);

// @route   POST /api/teacher-assignments
// @desc    Create teacher assignment
// @access  Private (Admin only)
router.post('/', protect, createAssignment);

// @route   DELETE /api/teacher-assignments/:id
// @desc    Delete teacher assignment
// @access  Private (Admin only)
router.delete('/:id', protect, deleteAssignment);

module.exports = router;
