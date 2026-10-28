const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Mess = require('../models/Mess');
const Config = require('../models/Config');
const Subscription = require('../models/Subscription');
const CheckIn = require('../models/CheckIn');
const {
  generateStudentQRToken,
  verifyStudentQRToken,
  getCurrentMealSlotAndDate
} = require('../utils/qrToken');

// @desc    Generate a short-lived (60s) signed dynamic QR token for a student
// @route   GET /api/checkins/generate-qr
// @access  Private (Student)
exports.generateStudentQR = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Check for an active subscription
    const subscription = await Subscription.findOne({
      student: studentId,
      status: 'active'
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(403).json({
        error: 'No active dining subscription found. Please subscribe to generate your meal QR code.',
        code: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }

    if (!subscription.isValidForDining()) {
      return res.status(403).json({
        error: 'Subscription has expired or all 60 meals have been exhausted.',
        code: 'EXPIRED_OR_EXHAUSTED'
      });
    }

    const profile = await StudentProfile.findOne({ user: studentId });

    // Generate signed JWT token with 60s expiration
    const qrToken = generateStudentQRToken(studentId, subscription._id);

    const { mealSlot, dateStr } = getCurrentMealSlotAndDate();

    // Check if student has already checked in for the current slot today
    const alreadyDined = await CheckIn.findOne({
      student: studentId,
      mealSlot,
      date: dateStr
    });

    res.status(200).json({
      qrToken,
      expiresInSeconds: 60,
      timestamp: Date.now(),
      student: {
        id: req.user._id,
        name: req.user.name,
        college: profile ? profile.college : 'College Student',
        hostelOrPg: profile ? profile.hostelOrPg : ''
      },
      subscription: {
        mealsRemaining: subscription.mealsRemaining,
        totalMeals: subscription.totalMeals,
        cycleEndDate: subscription.cycleEndDate
      },
      currentSlot: mealSlot,
      date: dateStr,
      alreadyDinedThisSlot: Boolean(alreadyDined)
    });
  } catch (error) {
    console.error('[Generate QR Error]', error);
    res.status(500).json({ error: error.message || 'Failed to generate QR token.' });
  }
};

// @desc    Scan and verify student QR code at the mess counter
// @route   POST /api/checkins/scan
// @access  Private (Vendor)
exports.scanStudentQR = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { qrToken, overrideMealSlot, overrideDate } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        status: 'DENIED',
        reason: 'QR token was not provided by scanner.'
      });
    }

    // 1. Find Vendor's Mess
    const mess = await Mess.findOne({ vendor: vendorId });
    if (!mess) {
      return res.status(404).json({
        status: 'DENIED',
        reason: 'Vendor mess profile not found.'
      });
    }

    if (!mess.isOpen) {
      return res.status(400).json({
        status: 'DENIED',
        reason: `Dining hall "${mess.name}" is currently marked as CLOSED.`
      });
    }

    // 2. Cryptographically verify QR token signature and expiration
    const tokenResult = verifyStudentQRToken(qrToken);
    if (!tokenResult.valid) {
      return res.status(400).json({
        status: 'DENIED',
        reason: tokenResult.error || 'Invalid or expired QR token. Please have student refresh their screen.'
      });
    }

    const { studentId, subscriptionId } = tokenResult.payload;

    // 3. Confirm student exists and is active
    const student = await User.findById(studentId);
    if (!student || student.status !== 'approved') {
      return res.status(400).json({
        status: 'DENIED',
        reason: 'Student account is unverified or suspended.'
      });
    }

    const profile = await StudentProfile.findOne({ user: studentId });

    // 4. Confirm student has active subscription with meals remaining
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || subscription.status !== 'active') {
      return res.status(400).json({
        status: 'DENIED',
        reason: 'Student does not have an active subscription for this dining pass.'
      });
    }

    if (subscription.mealsRemaining <= 0) {
      return res.status(400).json({
        status: 'DENIED',
        reason: 'No meals remaining. All 60 meals in this cycle have been exhausted.'
      });
    }

    const now = new Date();
    if (now > subscription.cycleEndDate) {
      subscription.status = 'expired';
      await subscription.save();
      return res.status(400).json({
        status: 'DENIED',
        reason: 'Subscription 30-day cycle has expired.'
      });
    }

    // 5. Determine meal slot and date
    const { mealSlot: detectedSlot, dateStr: detectedDate, istTimeString } = getCurrentMealSlotAndDate();
    const mealSlot = overrideMealSlot || detectedSlot;
    const date = overrideDate || detectedDate;

    // 6. Pre-check in MongoDB for duplicate check-in
    const existingCheckIn = await CheckIn.findOne({
      student: student._id,
      mealSlot,
      date
    });

    if (existingCheckIn) {
      return res.status(400).json({
        status: 'DENIED',
        reason: `DUPLICATE CHECK-IN: Student already redeemed their ${mealSlot.toUpperCase()} meal today (${date}).`,
        alreadyDinedAt: existingCheckIn.scannedAt
      });
    }

    // 7. Get platform config for vendor rate per meal (6000 paise = ₹60.00)
    const config = await Config.getSystemConfig();
    const vendorRatePaise = config.vendorRatePerMealPaise || 6000;

    // 8. Attempt database insert enforcing unique compound index (student, mealSlot, date)
    let checkIn;
    try {
      checkIn = await CheckIn.create({
        student: student._id,
        mess: mess._id,
        vendor: vendorId,
        subscription: subscription._id,
        mealSlot,
        date,
        status: 'allowed',
        vendorRatePaise,
        scannedAt: new Date()
      });
    } catch (dbErr) {
      // MongoDB duplicate key error code 11000
      if (dbErr.code === 11000) {
        return res.status(400).json({
          status: 'DENIED',
          reason: `DUPLICATE CHECK-IN ENFORCED BY DATABASE: Student already redeemed ${mealSlot.toUpperCase()} for ${date}.`
        });
      }
      throw dbErr;
    }

    // 9. On successful insert, deduct 1 meal from student balance
    subscription.mealsRemaining -= 1;
    subscription.mealsUsed += 1;
    if (subscription.mealsRemaining === 0) {
      subscription.status = 'exhausted';
    }
    await subscription.save();

    // 10. Return big green ALLOWED response
    res.status(200).json({
      status: 'ALLOWED',
      message: 'MEAL ALLOWED! Check-in recorded successfully.',
      student: {
        id: student._id,
        name: student.name,
        college: profile ? profile.college : 'College Student',
        hostelOrPg: profile ? profile.hostelOrPg : ''
      },
      mess: {
        id: mess._id,
        name: mess.name
      },
      mealSlot: mealSlot.toUpperCase(),
      date,
      time: istTimeString,
      mealsRemaining: subscription.mealsRemaining,
      totalMeals: subscription.totalMeals,
      vendorPayoutPaise: vendorRatePaise,
      vendorPayoutRupees: vendorRatePaise / 100,
      scannedAt: checkIn.scannedAt
    });
  } catch (error) {
    console.error('[Scan QR Error]', error);
    res.status(500).json({
      status: 'DENIED',
      reason: error.message || 'Internal server error validating check-in.'
    });
  }
};

// @desc    Get check-in history for the vendor's mess
// @route   GET /api/checkins/recent
// @access  Private (Vendor)
exports.getRecentCheckIns = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const mess = await Mess.findOne({ vendor: vendorId });
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found.' });
    }

    const checkIns = await CheckIn.find({ mess: mess._id })
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      count: checkIns.length,
      checkIns
    });
  } catch (error) {
    console.error('[Get Recent CheckIns Error]', error);
    res.status(500).json({ error: error.message || 'Failed to fetch check-ins.' });
  }
};

