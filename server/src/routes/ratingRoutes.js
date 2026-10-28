const express = require('express');
const router = express.Router();
const { protect, authorize, requireApproved } = require('../middleware/auth');
const {
  submitRating,
  getMyRating,
  getAdminRatings,
  getVendorRatingSummary
} = require('../controllers/ratingController');

// Student submits rating
router.post('/', protect, authorize('student'), requireApproved, submitRating);

// Student fetches their own rating for a mess
router.get('/my-rating/:messId', protect, authorize('student'), requireApproved, getMyRating);

// Vendor fetches aggregate rating summary only (strictly NO comments)
router.get('/vendor/summary', protect, authorize('vendor'), requireApproved, getVendorRatingSummary);

// Admin fetches all individual private ratings & comments
router.get('/admin/all', protect, authorize('admin'), getAdminRatings);

module.exports = router;

