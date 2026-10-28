const Mess = require('../models/Mess');
const CheckIn = require('../models/CheckIn');
const Payout = require('../models/Payout');
const StudentProfile = require('../models/StudentProfile');
const Config = require('../models/Config');
const { getCurrentMealSlotAndDate } = require('../utils/qrToken');

// @desc    Get vendor analytics, metrics, and payout summaries
// @route   GET /api/vendor/stats
// @access  Private (Vendor only)
exports.getVendorDashboardStats = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const mess = await Mess.findOne({ vendor: vendorId });
    if (!mess) {
      return res.status(404).json({ error: 'Mess profile not found for this vendor account.' });
    }

    const { dateStr: todayDateStr } = getCurrentMealSlotAndDate();

    // Calculate Week and Month starts in IST
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch metrics in parallel
    const [
      mealsToday,
      mealsThisWeek,
      mealsThisMonth,
      totalMealsAllTime,
      uniqueStudentIds,
      unpaidCheckIns,
      recentCheckIns,
      payoutHistory,
      config
    ] = await Promise.all([
      CheckIn.countDocuments({ mess: mess._id, date: todayDateStr, status: 'allowed' }),
      CheckIn.countDocuments({ mess: mess._id, scannedAt: { $gte: startOfWeek }, status: 'allowed' }),
      CheckIn.countDocuments({ mess: mess._id, scannedAt: { $gte: startOfMonth }, status: 'allowed' }),
      CheckIn.countDocuments({ mess: mess._id, status: 'allowed' }),
      CheckIn.distinct('student', { mess: mess._id, status: 'allowed' }),
      CheckIn.find({ mess: mess._id, isPaidOut: false, status: 'allowed' }),
      CheckIn.find({ mess: mess._id })
        .populate('student', 'name email')
        .sort({ scannedAt: -1 })
        .limit(15),
      Payout.find({ mess: mess._id }).sort({ createdAt: -1 }),
      Config.getSystemConfig()
    ]);

    const vendorRatePaise = config.vendorRatePerMealPaise || 6000;

    // Calculate estimated unpaid earnings
    const estimatedUnpaidPaise = unpaidCheckIns.reduce(
      (sum, ci) => sum + (ci.vendorRatePaise || vendorRatePaise),
      0
    );

    // Calculate total already paid out to date
    const totalPaidPaise = payoutHistory
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amountPaise, 0);

    res.status(200).json({
      mess: {
        id: mess._id,
        name: mess.name,
        isOpen: mess.isOpen,
        fssaiNumber: mess.fssaiNumber
      },
      metrics: {
        mealsToday,
        mealsThisWeek,
        mealsThisMonth,
        totalMealsAllTime,
        uniqueStudents: uniqueStudentIds.length,
        ratePerMealPaise: vendorRatePaise,
        ratePerMealRupees: vendorRatePaise / 100,
        estimatedUnpaidPaise,
        estimatedUnpaidRupees: estimatedUnpaidPaise / 100,
        totalPaidPaise,
        totalPaidRupees: totalPaidPaise / 100
      },
      recentCheckIns,
      payoutHistory
    });
  } catch (error) {
    console.error('[Vendor Stats Error]', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve vendor statistics.' });
  }
};

// @desc    Download CSV audit log of all meals served at this mess
// @route   GET /api/vendor/export-csv
// @access  Private (Vendor only)
exports.exportCheckInsCSV = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const mess = await Mess.findOne({ vendor: vendorId });
    if (!mess) {
      return res.status(404).json({ error: 'Mess profile not found.' });
    }

    const checkIns = await CheckIn.find({ mess: mess._id })
      .populate('student', 'name email')
      .sort({ scannedAt: -1 });

    // Populate student profiles to get college
    const enrichedCheckIns = await Promise.all(
      checkIns.map(async (ci) => {
        let college = 'N/A';
        let phone = 'N/A';
        if (ci.student) {
          const profile = await StudentProfile.findOne({ user: ci.student._id });
          if (profile) {
            college = profile.college || 'N/A';
            phone = profile.phone || 'N/A';
          }
        }
        return {
          ...ci.toObject(),
          college,
          phone
        };
      })
    );

    // Build CSV Headers & Rows
    const csvHeader = [
      'CheckIn ID',
      'Date',
      'Time (IST)',
      'Meal Slot',
      'Student Name',
      'Student Email',
      'College / Institute',
      'Student Phone',
      'Vendor Rate (INR)',
      'CheckIn Status',
      'Payout Settled'
    ].join(',');

    const csvRows = enrichedCheckIns.map((ci) => {
      const timeStr = new Date(ci.scannedAt).toLocaleTimeString('en-IN', { hour12: true });
      const escape = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

      return [
        escape(ci._id),
        escape(ci.date),
        escape(timeStr),
        escape(ci.mealSlot?.toUpperCase()),
        escape(ci.student?.name || 'Unknown Student'),
        escape(ci.student?.email || ''),
        escape(ci.college),
        escape(ci.phone),
        ((ci.vendorRatePaise || 6000) / 100).toFixed(2),
        escape(ci.status?.toUpperCase()),
        ci.isPaidOut ? 'PAID' : 'PENDING'
      ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\r\n');

    const sanitizedMessName = mess.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `meal_log_${sanitizedMessName}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('[Export CSV Error]', error);
    res.status(500).json({ error: error.message || 'Failed to generate CSV export.' });
  }
};

// @desc    Get payout settlement history
// @route   GET /api/vendor/payouts
// @access  Private (Vendor only)
exports.getPayoutHistory = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const mess = await Mess.findOne({ vendor: vendorId });
    if (!mess) {
      return res.status(404).json({ error: 'Mess profile not found.' });
    }

    const payouts = await Payout.find({ mess: mess._id }).sort({ createdAt: -1 });

    res.status(200).json({
      count: payouts.length,
      payouts
    });
  } catch (error) {
    console.error('[Get Payout History Error]', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve payout history.' });
  }
};

