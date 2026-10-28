const Notification = require('../models/Notification');
const { dispatchClosingAlerts } = require('../jobs/closingAlerts');

// @desc    Get logged in user's in-app notifications
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('mess', 'name address')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.status(200).json({
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('[Get Notifications Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching notifications.' });
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.status(200).json({ notification });
  } catch (error) {
    console.error('[Mark Read Error]', error);
    res.status(500).json({ error: error.message || 'Error updating notification.' });
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[Mark All Read Error]', error);
    res.status(500).json({ error: error.message || 'Error updating notifications.' });
  }
};

// @desc    Manually trigger closing alerts scan (Admin or testing)
// @route   POST /api/notifications/trigger-closing-alerts
// @access  Private (Admin only)
exports.triggerClosingAlerts = async (req, res) => {
  try {
    const { messId } = req.body;
    const result = await dispatchClosingAlerts(messId);
    res.status(200).json({
      message: 'Closing-time alerts scan executed successfully.',
      result
    });
  } catch (error) {
    console.error('[Trigger Closing Alerts Error]', error);
    res.status(500).json({ error: error.message || 'Error running closing alerts.' });
  }
};

