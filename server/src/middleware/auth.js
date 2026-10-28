const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token and attach user to request
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_centralized_mess_2026_dev'
      );

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ error: 'User associated with this token no longer exists.' });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware Error]', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed or expired.' });
    }
  } else {
    return res.status(401).json({ error: 'Not authorized, no Bearer token provided.' });
  }
};

// Middleware to restrict access based on user role (student, vendor, admin)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

// Middleware to enforce approval status
const requireApproved = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Admins are always approved
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.status === 'pending') {
    return res.status(403).json({
      error: 'Account verification pending. Please wait for an administrator to review your registration.',
      status: 'pending'
    });
  }

  if (req.user.status === 'rejected') {
    return res.status(403).json({
      error: `Account registration was rejected. Reason: ${req.user.rejectionReason || 'Details could not be verified'}`,
      status: 'rejected',
      reason: req.user.rejectionReason
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  requireApproved
};

