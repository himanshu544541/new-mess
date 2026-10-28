const mongoose = require('mongoose');

// In-app notifications (closing-time alerts, quirky meal reminders, subscription alerts)
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['closing_alert', 'funny_reminder', 'subscription', 'system'],
      default: 'closing_alert'
    },
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);

