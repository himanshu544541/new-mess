const cron = require('node-cron');
const Mess = require('../models/Mess');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const { getRandomClosingTemplate } = require('../templates/notificationTemplates');

/**
 * Dispatch closing time alerts to all active student subscribers
 * @param {string} specificMessId Optional mess ID for targeted testing
 */
const dispatchClosingAlerts = async (specificMessId = null) => {
  try {
    const messQuery = { isActive: true, isOpen: true };
    if (specificMessId) {
      messQuery._id = specificMessId;
    }

    const openMesses = await Mess.find(messQuery);
    if (openMesses.length === 0) return { dispatched: 0 };

    // Find all students with active dining subscriptions
    const activeSubs = await Subscription.find({
      status: 'active',
      mealsRemaining: { $gt: 0 },
      cycleEndDate: { $gt: new Date() }
    }).populate('student');

    if (activeSubs.length === 0) return { dispatched: 0 };

    const uniqueStudents = [];
    const seen = new Set();
    for (const sub of activeSubs) {
      if (sub.student && !seen.has(sub.student._id.toString())) {
        seen.add(sub.student._id.toString());
        uniqueStudents.push(sub.student);
      }
    }

    let notificationsCreated = 0;
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    for (const mess of openMesses) {
      // Pick current closing time string
      const nowHours = new Date().getHours();
      const isLunch = nowHours < 16;
      const timingSlot = isLunch ? mess.timings?.lunch : mess.timings?.dinner;
      const closingTimeStr = timingSlot?.split('-')[1]?.trim() || (isLunch ? '03:00 PM' : '10:00 PM');

      for (const student of uniqueStudents) {
        // Prevent duplicate spam within 6 hours for the same mess & student
        const recentAlert = await Notification.findOne({
          recipient: student._id,
          mess: mess._id,
          type: 'closing_alert',
          createdAt: { $gte: sixHoursAgo }
        });

        if (!recentAlert) {
          const { title, message } = getRandomClosingTemplate(mess.name, closingTimeStr);
          await Notification.create({
            recipient: student._id,
            title,
            message,
            type: 'closing_alert',
            mess: mess._id
          });
          notificationsCreated++;
        }
      }
    }

    console.log(`[Closing Alerts Job] Dispatched ${notificationsCreated} closing notifications to active students.`);
    return { dispatched: notificationsCreated };
  } catch (error) {
    console.error('[Closing Alerts Job Error]', error);
    return { error: error.message };
  }
};

// Schedule job to run every 30 minutes in production
const startClosingAlertsCron = () => {
  // Runs at minute 0 and 30 (e.g. 14:30, 21:30)
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Running scheduled mess closing-time alert scan...');
    await dispatchClosingAlerts();
  });
};

module.exports = {
  dispatchClosingAlerts,
  startClosingAlertsCron
};

