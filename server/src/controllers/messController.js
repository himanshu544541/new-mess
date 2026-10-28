const Mess = require('../models/Mess');
const User = require('../models/User');

// @desc    Get all active partner messes for students to discover
// @route   GET /api/messes
// @access  Public / Authenticated
exports.getAllPartnerMesses = async (req, res) => {
  try {
    const { search, openOnly } = req.query;

    let query = { isActive: true };

    if (openOnly === 'true') {
      query.isOpen = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const messes = await Mess.find(query)
      .populate('vendor', 'name email status')
      .sort({ isOpen: -1, createdAt: -1 });

    // Filter to only include messes whose vendor is approved (unless admin)
    const approvedMesses = messes.filter(m => m.vendor && m.vendor.status === 'approved');

    res.status(200).json({
      count: approvedMesses.length,
      messes: approvedMesses
    });
  } catch (error) {
    console.error('[Get All Messes Error]', error);
    res.status(500).json({ error: error.message || 'Failed to fetch partner messes.' });
  }
};

// @desc    Get single mess details by ID
// @route   GET /api/messes/:id
// @access  Public / Authenticated
exports.getMessById = async (req, res) => {
  try {
    const mess = await Mess.findById(req.params.id).populate('vendor', 'name email status');
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found.' });
    }

    res.status(200).json({ mess });
  } catch (error) {
    console.error('[Get Mess By Id Error]', error);
    res.status(500).json({ error: error.message || 'Failed to fetch mess details.' });
  }
};

// @desc    Get current vendor's mess profile
// @route   GET /api/messes/my/profile
// @access  Private (Vendor only)
exports.getMyMess = async (req, res) => {
  try {
    const mess = await Mess.findOne({ vendor: req.user._id });
    if (!mess) {
      return res.status(404).json({ error: 'Mess profile not found for this vendor account.' });
    }

    res.status(200).json({ mess });
  } catch (error) {
    console.error('[Get My Mess Error]', error);
    res.status(500).json({ error: error.message || 'Failed to fetch your mess profile.' });
  }
};

// @desc    Update current vendor's mess details
// @route   PUT /api/messes/my/profile
// @access  Private (Vendor only)
exports.updateMyMess = async (req, res) => {
  try {
    const { name, address, description, fssaiNumber, lunchTiming, dinnerTiming } = req.body;

    const mess = await Mess.findOne({ vendor: req.user._id });
    if (!mess) {
      return res.status(404).json({ error: 'Mess profile not found.' });
    }

    if (name) mess.name = name;
    if (address) mess.address = address;
    if (description !== undefined) mess.description = description;
    if (fssaiNumber) mess.fssaiNumber = fssaiNumber;
    if (lunchTiming || dinnerTiming) {
      mess.timings = {
        lunch: lunchTiming || mess.timings.lunch,
        dinner: dinnerTiming || mess.timings.dinner
      };
    }

    await mess.save();

    res.status(200).json({
      message: 'Mess details updated successfully.',
      mess
    });
  } catch (error) {
    console.error('[Update My Mess Error]', error);
    res.status(500).json({ error: error.message || 'Failed to update mess profile.' });
  }
};

// @desc    Update lunch and dinner menus
// @route   PUT /api/messes/my/menu
// @access  Private (Vendor only)
exports.updateMenu = async (req, res) => {
  try {
    const { lunch, dinner } = req.body;

    const mess = await Mess.findOne({ vendor: req.user._id });
    if (!mess) {
      return res.status(404).json({ error: 'Mess profile not found.' });
    }

    if (Array.isArray(lunch)) {
      mess.menu.lunch = lunch.map(i => String(i).trim()).filter(Boolean);
    }
    if (Array.isArray(dinner)) {
      mess.menu.dinner = dinner.map(i => String(i).trim()).filter(Boolean);
    }

    await mess.save();

    res.status(200).json({
      message: "Today's menu updated successfully.",
      menu: mess.menu
    });
  } catch (error) {
    console.error('[Update Menu Error]', error);
    res.status(500).json({ error: error.message || 'Failed to update menu.' });
  }
};

// @desc    Toggle open/closed status for live dining
// @route   PATCH /api/messes/my/toggle-open
// @access  Private (Vendor only)
exports.toggleOpenStatus = async (req, res) => {
  try {
    const mess = await Mess.findOne({ vendor: req.user._id });
    if (!mess) {
      return res.status(404).json({ error: 'Mess profile not found.' });
    }

    mess.isOpen = !mess.isOpen;
    await mess.save();

    res.status(200).json({
      message: `Mess is now marked as ${mess.isOpen ? 'OPEN' : 'CLOSED'} for dining.`,
      isOpen: mess.isOpen
    });
  } catch (error) {
    console.error('[Toggle Open Error]', error);
    res.status(500).json({ error: error.message || 'Failed to toggle open status.' });
  }
};

