const express = require('express');
const router = express.Router();
const {
    login,
    logout,
    getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/login
// @desc    Login teacher
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/logout
// @desc    Logout teacher
// @access  Private
router.post('/logout', protect, logout);

// @route   GET /api/auth/me
// @desc    Get current logged in teacher
// @access  Private
router.get('/me', protect, getMe);

module.exports = router;