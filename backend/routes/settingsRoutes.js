const express = require('express');
const router = express.Router();
const {
    getSettings,
    getCurrentContext,
    updateSetting,
    updateCurrentContext,
    getAcademicYears,
    getSemesters
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/settings
// @desc    Get all system settings
// @access  Private
router.get('/', protect, getSettings);

// @route   GET /api/settings/context
// @desc    Get current academic context (year and semester)
// @access  Private
router.get('/context', protect, getCurrentContext);

// @route   PUT /api/settings
// @desc    Update system setting
// @access  Private (Admin only)
router.put('/', protect, updateSetting);

// @route   PUT /api/settings/context
// @desc    Update current academic context
// @access  Private (Admin only)
router.put('/context', protect, updateCurrentContext);

// @route   GET /api/settings/years
// @desc    Get all academic years
// @access  Private
router.get('/years', protect, getAcademicYears);

// @route   GET /api/settings/semesters
// @desc    Get all semesters
// @access  Private
router.get('/semesters', protect, getSemesters);

module.exports = router;
