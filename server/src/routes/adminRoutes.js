const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPendingUsers,
  getAllUsers,
  updateUserStatus,
  getConfig,
  updateConfig,
  calculateSettlements,
  disburseSettlement,
  getAllPayouts,
  getMarginReport,
  getAllCheckIns
} = require('../controllers/adminController');

// All admin routes require authentication and role = admin
router.use(protect);
router.use(authorize('admin'));

// User verification & management
router.get('/pending-users', getPendingUsers);
router.get('/all-users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

// Pricing config
router.get('/config', getConfig);
router.put('/config', updateConfig);

// Vendor settlements
router.post('/settlements/calculate', calculateSettlements);
router.post('/settlements/disburse', disburseSettlement);
router.get('/settlements/all', getAllPayouts);

// Margin report & analytics
router.get('/margin-report', getMarginReport);

// Global check-in audit
router.get('/all-checkins', getAllCheckIns);

module.exports = router;
