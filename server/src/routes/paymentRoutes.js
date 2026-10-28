const express = require('express');
const router = express.Router();
const { protect, authorize, requireApproved } = require('../middleware/auth');
const {
  createOrder,
  handleCashfreeWebhook,
  simulateSandboxSuccess
} = require('../controllers/paymentController');

// Cashfree Webhook route (must accept webhook from Cashfree gateway)
router.post('/webhook', handleCashfreeWebhook);

// Student initiate order
router.post('/create-order', protect, authorize('student'), requireApproved, createOrder);

// Simulate sandbox payment success for test/dev environments
router.post('/simulate-sandbox-success', protect, authorize('student'), requireApproved, simulateSandboxSuccess);

module.exports = router;

