const Rating = require('../models/Rating');
const Mess = require('../models/Mess');

// Helper to recalculate average rating on Mess
const updateMessAggregates = async (messId) => {
  const ratings = await Rating.find({ mess: messId });
  const totalRatings = ratings.length;
  const avgRating = totalRatings > 0
    ? Number((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1))
    : 4.5;

  await Mess.findByIdAndUpdate(messId, { avgRating, totalRatings });
};

// @desc    Submit or update private rating for a partner mess
// @route   POST /api/ratings
// @access  Private (Approved Student)
exports.submitRating = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { messId, rating, comment } = req.body;

    if (!messId || !rating) {
      return res.status(400).json({ error: 'messId and rating (1-5) are required.' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found.' });
    }

    // Upsert rating (one per student per mess)
    const review = await Rating.findOneAndUpdate(
      { student: studentId, mess: messId },
      { rating: numRating, comment: comment || '' },
      { new: true, upsert: true }
    );

    // Recalculate average on Mess
    await updateMessAggregates(messId);

    res.status(200).json({
      message: 'Thank you! Your private rating was submitted to university administration.',
      review
    });
  } catch (error) {
    console.error('[Submit Rating Error]', error);
    res.status(500).json({ error: error.message || 'Error submitting rating.' });
  }
};

// @desc    Get student's own rating for a mess
// @route   GET /api/ratings/my-rating/:messId
// @access  Private (Student)
exports.getMyRating = async (req, res) => {
  try {
    const review = await Rating.findOne({
      student: req.user._id,
      mess: req.params.messId
    });

    res.status(200).json({ review });
  } catch (error) {
    console.error('[Get My Rating Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching review.' });
  }
};

// @desc    Get all individual private ratings (Admin only)
// @route   GET /api/ratings/admin/all
// @access  Private (Admin only)
exports.getAdminRatings = async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate('student mess', 'name email address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: ratings.length,
      ratings
    });
  } catch (error) {
    console.error('[Admin Ratings Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching all ratings.' });
  }
};

// @desc    Get vendor aggregate rating summary (Vendor only: strictly no individual comments)
// @route   GET /api/ratings/vendor/summary
// @access  Private (Vendor only)
exports.getVendorRatingSummary = async (req, res) => {
  try {
    const mess = await Mess.findOne({ vendor: req.user._id });
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found.' });
    }

    // Vendor sees only aggregate numbers, NEVER individual ratings or student comments
    res.status(200).json({
      messName: mess.name,
      avgRating: mess.avgRating || 4.5,
      totalRatings: mess.totalRatings || 0,
      privacyNote: 'Individual reviews & student comments are kept private by platform policy.'
    });
  } catch (error) {
    console.error('[Vendor Rating Summary Error]', error);
    res.status(500).json({ error: error.message || 'Error fetching ratings summary.' });
  }
};

