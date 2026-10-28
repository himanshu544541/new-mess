const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  registerStudent,
  registerVendor,
  login,
  getMe
} = require('../controllers/authController');

// Student registration with ID proof upload
router.post('/register-student', upload.single('idProof'), registerStudent);

// Vendor registration
router.post('/register-vendor', registerVendor);

// User login (student, vendor, admin)
router.post('/login', login);

// Current user profile
router.get('/me', protect, getMe);

module.exports = router;

