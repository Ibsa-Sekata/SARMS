const express = require('express');
const router = express.Router();
const {
    getDepartments,
    createDepartment,
    deleteDepartment
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', protect, getDepartments);

// @route   POST /api/departments
// @desc    Create new department
// @access  Private (Admin only)
router.post('/', protect, createDepartment);

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private (Admin only)
router.delete('/:id', protect, deleteDepartment);

module.exports = router;
