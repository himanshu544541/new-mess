const Subscription = require('../models/Subscription');
const Config = require('../models/Config');

// @desc    Get current student's subscription status
// @route   GET /api/subscriptions/my-status
// @access  Private (Student)
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      student: req.user._id,
      status: 'active'
    }).sort({ createdAt: -1 });

    const config = await Config.getSystemConfig();

    if (!subscription) {
      return res.status(200).json({
        hasActiveSubscription: false,
        subscription: null,
        planPricing: {
          monthlyFeePaise: config.studentMonthlyFeePaise,
          monthlyFeeRupees: config.studentMonthlyFeePaise / 100,
          mealsPerMonth: config.mealsPerMonth,
          cycleDays: config.cycleDays,
          ratePerMealPaise: Math.round(config.studentMonthlyFeePaise / config.mealsPerMonth),
          ratePerMealRupees: (config.studentMonthlyFeePaise / (config.mealsPerMonth * 100)).toFixed(2)
        }
      });
    }

    // Check if expired by time or exhausted by meals
    const now = new Date();
    if (now > subscription.cycleEndDate) {
      subscription.status = 'expired';
      await subscription.save();
    } else if (subscription.mealsRemaining <= 0) {
      subscription.status = 'exhausted';
      await subscription.save();
    }

    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(subscription.cycleEndDate) - now) / (1000 * 60 * 60 * 24))
    );

    res.status(200).json({
      hasActiveSubscription: subscription.status === 'active',
      subscription,
      daysRemaining,
      planPricing: {
        monthlyFeePaise: config.studentMonthlyFeePaise,
        monthlyFeeRupees: config.studentMonthlyFeePaise / 100,
        mealsPerMonth: config.mealsPerMonth,
        cycleDays: config.cycleDays
      }
    });
  } catch (error) {
    console.error('[Get Subscription Status Error]', error);
    res.status(500).json({ error: error.message || 'Failed to fetch subscription status.' });
  }
};

// @desc    Get public pricing configuration
// @route   GET /api/subscriptions/pricing
// @access  Public
exports.getPublicPricing = async (req, res) => {
  try {
    const config = await Config.getSystemConfig();

    res.status(200).json({
      studentMonthlyFeePaise: config.studentMonthlyFeePaise,
      studentMonthlyFeeRupees: config.studentMonthlyFeePaise / 100,
      mealsPerMonth: config.mealsPerMonth,
      cycleDays: config.cycleDays,
      ratePerMealPaise: Math.round(config.studentMonthlyFeePaise / config.mealsPerMonth),
      ratePerMealRupees: (config.studentMonthlyFeePaise / (config.mealsPerMonth * 100)).toFixed(2),
      vendorRatePerMealPaise: config.vendorRatePerMealPaise,
      vendorRatePerMealRupees: config.vendorRatePerMealPaise / 100,
      platformFeePerMealPaise: config.platformFeePerMealPaise,
      platformFeePerMealRupees: (config.platformFeePerMealPaise / 100).toFixed(2),
      oldSingleMessComparisonRatePaise: config.oldSingleMessComparisonRatePaise,
      oldSingleMessComparisonRateRupees: (config.oldSingleMessComparisonRatePaise / 100).toFixed(2)
    });
  } catch (error) {
    console.error('[Get Public Pricing Error]', error);
    res.status(500).json({ error: error.message || 'Failed to load pricing.' });
  }
};

