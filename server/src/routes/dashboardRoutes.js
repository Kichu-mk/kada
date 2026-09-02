const express = require('express');
const router = express.Router();
const { getDashboardSummary, getHistory, getDailyReport } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

router.get('/', protect, getDashboardSummary);
router.get('/history', protect, getHistory);
router.get('/daily-report', protect, getDailyReport);

module.exports = router;
