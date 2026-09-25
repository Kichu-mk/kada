const express = require('express');
const router = express.Router();
const { getDashboardSummary, getHistory, getDailyReport } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');
const { ensureTenantContext } = require('../middlewares/tenantContext');

router.get('/', protect, ensureTenantContext, getDashboardSummary);
router.get('/history', protect, ensureTenantContext, getHistory);
router.get('/daily-report', protect, ensureTenantContext, getDailyReport);

module.exports = router;
