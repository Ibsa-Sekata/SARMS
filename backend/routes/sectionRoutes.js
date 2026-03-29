const express = require('express');
const router = express.Router();
const { getSections } = require('../controllers/sectionController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/sections
// @desc    Get all sections
// @access  Private
router.get('/', protect, getSections);

module.exports = router;
