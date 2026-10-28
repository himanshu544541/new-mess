const express = require('express');
const router = express.Router();
const { protect, authorize, requireApproved } = require('../middleware/auth');
const {
  getAllPartnerMesses,
  getMessById,
  getMyMess,
  updateMyMess,
  updateMenu,
  toggleOpenStatus
} = require('../controllers/messController');

// Public / Student discovery routes
router.get('/', getAllPartnerMesses);
router.get('/:id', getMessById);

// Vendor management routes
router.get('/my/profile', protect, authorize('vendor'), getMyMess);
router.put('/my/profile', protect, authorize('vendor'), requireApproved, updateMyMess);
router.put('/my/menu', protect, authorize('vendor'), requireApproved, updateMenu);
router.patch('/my/toggle-open', protect, authorize('vendor'), requireApproved, toggleOpenStatus);

module.exports = router;

