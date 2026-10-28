const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Mess = require('../models/Mess');
const Config = require('../models/Config');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const CheckIn = require('../models/CheckIn');
const Payout = require('../models/Payout');

// @desc    Get all pending users (students and vendors) waiting for verification
// @route   GET /api/admin/pending-users
// @access  Private (Admin only)
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 });

    const enrichedUsers = await Promise.all(
      pendingUsers.map(async (u) => {
        let details = null;
        if (u.role === 'student') {
          details = await StudentProfile.findOne({ user: u._id });
        } else if (u.role === 'vendor') {
          details = await Mess.findOne({ vendor: u._id });
        }
        return {
          ...u.toObject(),
          details
        };
      })
    );

    res.status(200).json({
      count: enrichedUsers.length,
      users: enrichedUsers
    });
  } catch (error) {
    console.error('[Admin Pending Users Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching pending users.' });
  }
};

// @desc    Get all platform users
// @route   GET /api/admin/all-users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        let details = null;
        if (u.role === 'student') {
          details = await StudentProfile.findOne({ user: u._id });
        } else if (u.role === 'vendor') {
          details = await Mess.findOne({ vendor: u._id });
        }
        return {
          ...u.toObject(),
          details
        };
      })
    );

    res.status(200).json({
      count: enrichedUsers.length,
      users: enrichedUsers
    });
  } catch (error) {
    console.error('[Admin All Users Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching all users.' });
  }
};

// @desc    Update user approval status (Approve or Reject)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved, rejected, or pending.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.status = status;
    if (status === 'rejected') {
      user.rejectionReason = rejectionReason || 'Information provided could not be verified.';
    } else if (status === 'approved') {
      user.rejectionReason = '';
    }

    await user.save();

    res.status(200).json({
      message: `User ${user.name} (${user.role}) has been ${status}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    console.error('[Admin Update User Status Error]', error);
    res.status(500).json({ error: error.message || 'Error updating user verification status.' });
  }
};

// ==========================================
// PHASE 7: PRICING CONFIG CONTROLLER
// ==========================================

// @desc    Get dynamic pricing config
// @route   GET /api/admin/config
// @access  Private (Admin only)
exports.getConfig = async (req, res) => {
  try {
    const config = await Config.getSystemConfig();
    res.status(200).json({ config });
  } catch (error) {
    console.error('[Admin Get Config Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching config.' });
  }
};

// @desc    Update dynamic pricing config
// @route   PUT /api/admin/config
// @access  Private (Admin only)
exports.updateConfig = async (req, res) => {
  try {
    const {
      studentMonthlyFeeRupees,
      vendorRatePerMealRupees,
      mealsPerMonth,
      cycleDays,
      gatewayFeePercent
    } = req.body;

    const config = await Config.getSystemConfig();

    if (studentMonthlyFeeRupees !== undefined) {
      config.studentMonthlyFeePaise = Math.round(Number(studentMonthlyFeeRupees) * 100);
    }
    if (vendorRatePerMealRupees !== undefined) {
      config.vendorRatePerMealPaise = Math.round(Number(vendorRatePerMealRupees) * 100);
    }
    if (mealsPerMonth !== undefined) {
      config.mealsPerMonth = Number(mealsPerMonth);
    }
    if (cycleDays !== undefined) {
      config.cycleDays = Number(cycleDays);
    }
    if (gatewayFeePercent !== undefined) {
      config.gatewayFeePercent = Number(gatewayFeePercent);
    }

    // Auto-update platform fee per meal = student per-meal rate - vendor rate
    const studentPerMealPaise = Math.round(config.studentMonthlyFeePaise / config.mealsPerMonth);
    config.platformFeePerMealPaise = Math.max(0, studentPerMealPaise - config.vendorRatePerMealPaise);

    await config.save();

    res.status(200).json({
      message: 'System pricing configuration updated successfully.',
      config
    });
  } catch (error) {
    console.error('[Admin Update Config Error]', error);
    res.status(500).json({ error: error.message || 'Error updating config.' });
  }
};

// ==========================================
// PHASE 7: VENDOR SETTLEMENTS CONTROLLER
// ==========================================

// @desc    Calculate vendor payout settlements for a chosen date range
// @route   POST /api/admin/settlements/calculate
// @access  Private (Admin only)
exports.calculateSettlements = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const query = {
      isPaidOut: false,
      status: 'allowed'
    };

    if (startDate && endDate) {
      query.scannedAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const unsettledCheckIns = await CheckIn.find(query).populate('mess vendor');

    const config = await Config.getSystemConfig();
    const defaultRatePaise = config.vendorRatePerMealPaise || 6000;

    // Group unsettled check-ins by mess
    const messMap = {};
    for (const ci of unsettledCheckIns) {
      if (!ci.mess) continue;
      const messId = ci.mess._id.toString();
      if (!messMap[messId]) {
        messMap[messId] = {
          messId: ci.mess._id,
          messName: ci.mess.name,
          vendorId: ci.vendor ? ci.vendor._id : null,
          vendorName: ci.vendor ? ci.vendor.name : 'Vendor',
          unsettledMeals: 0,
          totalAmountPaise: 0,
          checkInIds: []
        };
      }
      messMap[messId].unsettledMeals += 1;
      messMap[messId].totalAmountPaise += ci.vendorRatePaise || defaultRatePaise;
      messMap[messId].checkInIds.push(ci._id);
    }

    const settlementList = Object.values(messMap).map((item) => ({
      ...item,
      totalAmountRupees: item.totalAmountPaise / 100
    }));

    res.status(200).json({
      count: settlementList.length,
      settlementProposals: settlementList
    });
  } catch (error) {
    console.error('[Admin Calculate Settlements Error]', error);
    res.status(500).json({ error: error.message || 'Error calculating settlements.' });
  }
};

// @desc    Disburse and mark vendor payout as paid (supports prepaid trust flag)
// @route   POST /api/admin/settlements/disburse
// @access  Private (Admin only)
exports.disburseSettlement = async (req, res) => {
  try {
    const {
      messId,
      startDate,
      endDate,
      isPrepaid,
      transactionReference,
      notes
    } = req.body;

    if (!messId) {
      return res.status(400).json({ error: 'messId is required.' });
    }

    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found.' });
    }

    const query = {
      mess: messId,
      isPaidOut: false,
      status: 'allowed'
    };

    if (startDate && endDate) {
      query.scannedAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const checkInsToSettle = await CheckIn.find(query);

    if (checkInsToSettle.length === 0) {
      return res.status(400).json({ error: 'No unsettled check-ins found for this mess in the selected period.' });
    }

    const config = await Config.getSystemConfig();
    const ratePerMealPaise = config.vendorRatePerMealPaise || 6000;

    const totalMeals = checkInsToSettle.length;
    const amountPaise = checkInsToSettle.reduce((sum, ci) => sum + (ci.vendorRatePaise || ratePerMealPaise), 0);

    // Create settled Payout record
    const payout = await Payout.create({
      mess: mess._id,
      vendor: mess.vendor,
      periodStart: startDate ? new Date(startDate) : new Date(checkInsToSettle[checkInsToSettle.length - 1].scannedAt),
      periodEnd: endDate ? new Date(endDate) : new Date(),
      totalMeals,
      ratePerMealPaise,
      amountPaise,
      status: 'paid',
      isPrepaid: Boolean(isPrepaid), // week 1 early trust payout
      paidAt: new Date(),
      transactionReference: transactionReference || `TXN_SETTLE_${Date.now()}`,
      notes: notes || (isPrepaid ? 'Early trust prepaid payout (Week 1)' : 'Standard periodic settlement')
    });

    // Mark matching check-ins as settled
    const checkInIds = checkInsToSettle.map((ci) => ci._id);
    await CheckIn.updateMany(
      { _id: { $in: checkInIds } },
      { $set: { isPaidOut: true, payoutId: payout._id } }
    );

    res.status(200).json({
      message: `Settlement of ₹${amountPaise / 100} (${totalMeals} meals) marked as PAID to ${mess.name}.`,
      payout,
      settledMealsCount: totalMeals
    });
  } catch (error) {
    console.error('[Admin Disburse Settlement Error]', error);
    res.status(500).json({ error: error.message || 'Error processing settlement payout.' });
  }
};

// @desc    Get all historical payout settlements
// @route   GET /api/admin/settlements/all
// @access  Private (Admin only)
exports.getAllPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate('mess vendor', 'name email address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: payouts.length,
      payouts
    });
  } catch (error) {
    console.error('[Admin Get All Payouts Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching payouts.' });
  }
};

// ==========================================
// PHASE 7: PLATFORM MARGIN REPORT CONTROLLER
// ==========================================

// @desc    Get complete platform margin report (gross collections - vendor payouts - gateway fee = net profit)
// @route   GET /api/admin/margin-report
// @access  Private (Admin only)
exports.getMarginReport = async (req, res) => {
  try {
    const config = await Config.getSystemConfig();

    // 1. Total Student Collections (Gross Revenue)
    const successfulPayments = await Payment.find({ status: 'success' });
    const grossStudentRevenuePaise = successfulPayments.reduce(
      (sum, p) => sum + p.amountPaise,
      0
    );

    // 2. Total Meals Accrued (All verified meals served)
    const allAllowedCheckIns = await CheckIn.find({ status: 'allowed' });
    const totalMealsServed = allAllowedCheckIns.length;
    const vendorRatePaise = config.vendorRatePerMealPaise || 6000;

    const totalVendorAccruedPaise = allAllowedCheckIns.reduce(
      (sum, ci) => sum + (ci.vendorRatePaise || vendorRatePaise),
      0
    );

    // 3. Total Settled Disbursed Payouts
    const allPayouts = await Payout.find({ status: 'paid' });
    const totalDisbursedPayoutsPaise = allPayouts.reduce(
      (sum, p) => sum + p.amountPaise,
      0
    );

    // 4. Estimated Payment Gateway Fees
    const gatewayFeePercent = config.gatewayFeePercent || 2.0;
    const estimatedGatewayFeePaise = Math.round(
      (grossStudentRevenuePaise * gatewayFeePercent) / 100
    );

    // 5. Net Platform Margin
    // Net Margin = Gross Student Revenue - Vendor Accrued Payouts - Estimated Gateway Fees
    const netPlatformMarginPaise =
      grossStudentRevenuePaise - totalVendorAccruedPaise - estimatedGatewayFeePaise;

    const netMarginPercentage =
      grossStudentRevenuePaise > 0
        ? ((netPlatformMarginPaise / grossStudentRevenuePaise) * 100).toFixed(2)
        : '0.00';

    // Per-Meal Unit Economics Breakdown
    const studentMealCount = config.mealsPerMonth || 60;
    const studentPerMealPaise = Math.round(config.studentMonthlyFeePaise / studentMealCount);
    const unitGrossRevenuePaise = studentPerMealPaise; // 6333 paise (₹63.33)
    const unitVendorCostPaise = vendorRatePaise; // 6000 paise (₹60.00)
    const unitGatewayFeePaise = Math.round((unitGrossRevenuePaise * gatewayFeePercent) / 100);
    const unitNetMarginPaise = unitGrossRevenuePaise - unitVendorCostPaise - unitGatewayFeePaise;

    // Additional Platform Stats
    const totalStudents = await User.countDocuments({ role: 'student', status: 'approved' });
    const totalVendors = await User.countDocuments({ role: 'vendor', status: 'approved' });
    const totalActiveSubscriptions = await Subscription.countDocuments({ status: 'active' });

    res.status(200).json({
      summary: {
        grossRevenuePaise: grossStudentRevenuePaise,
        grossRevenueRupees: grossStudentRevenuePaise / 100,
        vendorAccruedPaise: totalVendorAccruedPaise,
        vendorAccruedRupees: totalVendorAccruedPaise / 100,
        disbursedPayoutsPaise: totalDisbursedPayoutsPaise,
        disbursedPayoutsRupees: totalDisbursedPayoutsPaise / 100,
        unsettledVendorPaise: totalVendorAccruedPaise - totalDisbursedPayoutsPaise,
        unsettledVendorRupees: (totalVendorAccruedPaise - totalDisbursedPayoutsPaise) / 100,
        gatewayFeePercent,
        estimatedGatewayFeePaise,
        estimatedGatewayFeeRupees: estimatedGatewayFeePaise / 100,
        netPlatformMarginPaise,
        netPlatformMarginRupees: netPlatformMarginPaise / 100,
        netMarginPercentage
      },
      unitEconomics: {
        studentPerMealRupees: (unitGrossRevenuePaise / 100).toFixed(2),
        vendorRateRupees: (unitVendorCostPaise / 100).toFixed(2),
        gatewayFeeRupees: (unitGatewayFeePaise / 100).toFixed(2),
        netMarginPerMealRupees: (unitNetMarginPaise / 100).toFixed(2)
      },
      platformStats: {
        totalStudents,
        totalVendors,
        totalActiveSubscriptions,
        totalMealsServed
      }
    });
  } catch (error) {
    console.error('[Admin Margin Report Error]', error);
    res.status(500).json({ error: error.message || 'Error generating margin report.' });
  }
};

// @desc    Get all checkins across all partner messes
// @route   GET /api/admin/all-checkins
// @access  Private (Admin only)
exports.getAllCheckIns = async (req, res) => {
  try {
    const checkIns = await CheckIn.find()
      .populate('student mess vendor', 'name email address')
      .sort({ scannedAt: -1 })
      .limit(50);

    res.status(200).json({
      count: checkIns.length,
      checkIns
    });
  } catch (error) {
    console.error('[Admin All CheckIns Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching check-ins.' });
  }
};
