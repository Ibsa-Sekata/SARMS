const express = require('express');
const router = express.Router();
const {
    getTeachers,
    getTeacher,
    getTeacherAssignments,
    createTeacher,
    deleteTeacher
} = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private
router.get('/', protect, getTeachers);

// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private (Admin only)
router.post('/', protect, createTeacher);

// @route   GET /api/teachers/:id
// @desc    Get single teacher
// @access  Private
router.get('/:id', protect, getTeacher);

// @route   GET /api/teachers/:id/assignments
// @desc    Get teacher's class and subject assignments
// @access  Private
router.get('/:id/assignments', protect, getTeacherAssignments);

// @route   DELETE /api/teachers/:id
// @desc    Delete teacher
// @access  Private (Admin only)
router.delete('/:id', protect, deleteTeacher);

module.exports = router;