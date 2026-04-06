const express = require('express');
const router = express.Router();
const { getSections, createSection } = require('../controllers/sectionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/sections
// @desc    Get all sections
// @access  Private
router.get('/', protect, getSections);

// @route   POST /api/sections
// @desc    Create a section (admin)
// @access  Private / Admin
router.post('/', protect, adminOnly, createSection);

module.exports = router;
