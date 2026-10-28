const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Mess = require('../models/Mess');

// Utility to sign JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_centralized_mess_2026_dev',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new student with ID proof upload
// @route   POST /api/auth/register-student
// @access  Public
exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password, college, hostelOrPg, phone } = req.body;

    if (!name || !email || !password || !college || !hostelOrPg || !phone) {
      return res.status(400).json({ error: 'Please provide all required student details.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an ID card or residence proof file.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with status 'pending'
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'student',
      status: 'pending'
    });

    // Create student profile with uploaded proof URL
    const idProofUrl = `/uploads/${req.file.filename}`;
    const profile = await StudentProfile.create({
      user: user._id,
      college,
      hostelOrPg,
      phone,
      idProofUrl
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Student registration successful. Account is pending admin approval.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      profile
    });
  } catch (error) {
    console.error('[Register Student Error]', error);
    res.status(500).json({ error: error.message || 'Server error during student registration.' });
  }
};

// @desc    Register a new vendor (mess owner)
// @route   POST /api/auth/register-vendor
// @access  Public
exports.registerVendor = async (req, res) => {
  try {
    const { name, email, password, messName, address, fssaiNumber, lunchTiming, dinnerTiming } = req.body;

    if (!name || !email || !password || !messName || !address || !fssaiNumber) {
      return res.status(400).json({ error: 'Please provide all required vendor and mess information.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create vendor user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'vendor',
      status: 'pending'
    });

    // Create mess record
    const mess = await Mess.create({
      vendor: user._id,
      name: messName,
      address,
      fssaiNumber,
      timings: {
        lunch: lunchTiming || '12:30 PM - 03:00 PM',
        dinner: dinnerTiming || '07:30 PM - 10:00 PM'
      }
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Vendor registration submitted. Mess profile is pending admin verification.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      mess
    });
  } catch (error) {
    console.error('[Register Vendor Error]', error);
    res.status(500).json({ error: error.message || 'Server error during vendor registration.' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let extraDetails = {};
    if (user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: user._id });
      extraDetails.profile = profile;
    } else if (user.role === 'vendor') {
      const mess = await Mess.findOne({ vendor: user._id });
      extraDetails.mess = mess;
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        rejectionReason: user.rejectionReason
      },
      ...extraDetails
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: error.message || 'Server error during login.' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let extraDetails = {};
    if (user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: user._id });
      extraDetails.profile = profile;
    } else if (user.role === 'vendor') {
      const mess = await Mess.findOne({ vendor: user._id });
      extraDetails.mess = mess;
    }

    res.status(200).json({
      user,
      ...extraDetails
    });
  } catch (error) {
    console.error('[GetMe Error]', error);
    res.status(500).json({ error: error.message || 'Server error fetching user profile.' });
  }
};

