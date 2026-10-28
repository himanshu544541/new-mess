const express = require('express');
const router = express.Router();
const { protect, authorize, requireApproved } = require('../middleware/auth');
const {
  getMySubscription,
  getPublicPricing
} = require('../controllers/subscriptionController');

// Public pricing configuration
router.get('/pricing', getPublicPricing);

// Student subscription status
router.get('/my-status', protect, authorize('student'), requireApproved, getMySubscription);

module.exports = router;

