const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  triggerClosingAlerts
} = require('../controllers/notificationController');

router.use(protect);

// User notifications
router.get('/', getMyNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

// Admin manual closing alert trigger
router.post('/trigger-closing-alerts', authorize('admin'), triggerClosingAlerts);

module.exports = router;

