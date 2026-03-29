const express = require('express');
const router = express.Router();
const {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentsByClass
} = require('../controllers/studentController');
const { protect, isHomeroomTeacher } = require('../middleware/authMiddleware');

// @route   GET /api/students
// @desc    Get all students (filtered by teacher access)
// @access  Private
router.get('/', protect, getStudents);

// @route   GET /api/students/class/:classId
// @desc    Get students by class
// @access  Private
router.get('/class/:classId', protect, getStudentsByClass);

// @route   GET /api/students/:id
// @desc    Get single student
// @access  Private
router.get('/:id', protect, getStudent);

// @route   POST /api/students
// @desc    Create new student (admin or homeroom teachers)
// @access  Private
router.post('/', protect, createStudent);

// @route   PUT /api/students/:id
// @desc    Update student (admin or homeroom teachers)
// @access  Private
router.put('/:id', protect, updateStudent);

// @route   DELETE /api/students/:id
// @desc    Delete student (admin or homeroom teachers)
// @access  Private
router.delete('/:id', protect, deleteStudent);

module.exports = router;