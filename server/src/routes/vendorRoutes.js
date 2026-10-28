const express = require('express');
const router = express.Router();
const { protect, authorize, requireApproved } = require('../middleware/auth');
const {
  getVendorDashboardStats,
  exportCheckInsCSV,
  getPayoutHistory
} = require('../controllers/vendorController');

router.use(protect);
router.use(authorize('vendor'));
router.use(requireApproved);

// Vendor metrics & dashboard data
router.get('/stats', getVendorDashboardStats);

// Download CSV audit log of all meals served
router.get('/export-csv', exportCheckInsCSV);

// Payout settlement history
router.get('/payouts', getPayoutHistory);

module.exports = router;

