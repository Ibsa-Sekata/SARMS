const express = require('express');
const router = express.Router();
const {
    getClasses,
    getClass,
    getClassStudents,
    createClass,
    updateHomeroomTeacher,
    deleteClass
} = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/classes
// @desc    Get all classes (filtered by teacher access)
// @access  Private
router.get('/', protect, getClasses);

// @route   POST /api/classes
// @desc    Create new class
// @access  Private (Admin only)
router.post('/', protect, createClass);

// @route   GET /api/classes/:id
// @desc    Get single class
// @access  Private
router.get('/:id', protect, getClass);

// @route   PUT /api/classes/:id/homeroom
// @desc    Update homeroom teacher
// @access  Private (Admin only)
router.put('/:id/homeroom', protect, updateHomeroomTeacher);

// @route   GET /api/classes/:id/students
// @desc    Get students in a class
// @access  Private
router.get('/:id/students', protect, getClassStudents);

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Admin only)
router.delete('/:id', protect, deleteClass);

module.exports = router;