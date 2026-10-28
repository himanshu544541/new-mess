const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_centralized_mess_2026_dev';

/**
 * Generate a short-lived (60s) signed QR token for a student
 * @param {string} studentId
 * @param {string} subscriptionId
 */
const generateStudentQRToken = (studentId, subscriptionId) => {
  return jwt.sign(
    {
      studentId: studentId.toString(),
      subscriptionId: subscriptionId.toString(),
      type: 'meal_qr',
      generatedAt: Date.now()
    },
    JWT_SECRET,
    { expiresIn: '60s' }
  );
};

/**
 * Verify and decode a QR token
 * @param {string} token
 */
const verifyStudentQRToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'meal_qr') {
      throw new Error('Invalid token payload type.');
    }
    return { valid: true, payload: decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        expired: true,
        error: 'QR code has expired. It auto-refreshes every 60 seconds.'
      };
    }
    return {
      valid: false,
      expired: false,
      error: 'Invalid QR token signature or corrupt code.'
    };
  }
};

/**
 * Determine current meal slot ('lunch' or 'dinner') and date in IST (Asia/Kolkata)
 */
const getCurrentMealSlotAndDate = (customDate = null) => {
  const d = customDate ? new Date(customDate) : new Date();

  // Convert to Indian Standard Time (UTC + 5:30)
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const istTime = new Date(utc + istOffset);

  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Year-Month-Day in IST
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Slot determination:
  // Before 16:00 (4:00 PM) is Lunch, 16:00 onwards is Dinner
  const mealSlot = totalMinutes < 16 * 60 ? 'lunch' : 'dinner';

  return {
    mealSlot,
    dateStr,
    istTimeString: istTime.toLocaleTimeString('en-IN', { hour12: true })
  };
};

module.exports = {
  generateStudentQRToken,
  verifyStudentQRToken,
  getCurrentMealSlotAndDate
};

