const express = require('express');
const router = express.Router();
const { protect, authorize, requireApproved } = require('../middleware/auth');
const {
  generateStudentQR,
  scanStudentQR,
  getRecentCheckIns
} = require('../controllers/checkInController');

// Student dynamic QR generation
router.get('/generate-qr', protect, authorize('student'), requireApproved, generateStudentQR);

// Vendor QR scan
router.post('/scan', protect, authorize('vendor'), requireApproved, scanStudentQR);

// Vendor recent check-in list
router.get('/recent', protect, authorize('vendor'), requireApproved, getRecentCheckIns);

module.exports = router;

