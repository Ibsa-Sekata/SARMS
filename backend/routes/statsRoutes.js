const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAdminOverview } = require('../controllers/statsController');

router.get('/overview', protect, adminOnly, getAdminOverview);

module.exports = router;
