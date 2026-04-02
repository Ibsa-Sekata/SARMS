const express = require('express');
const router = express.Router();
const {
    getTeachers,
    getTeacher,
    getTeacherAssignments,
    createTeacher,
    updateTeacher,
    deleteTeacher
} = require('../controllers/teacherController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private
router.get('/', protect, getTeachers);

// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private (Admin only)
router.post('/', protect, adminOnly, createTeacher);

// @route   PUT /api/teachers/:id
// @desc    Update teacher
// @access  Private (Admin only)
router.put('/:id', protect, adminOnly, updateTeacher);

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
router.delete('/:id', protect, adminOnly, deleteTeacher);

module.exports = router;