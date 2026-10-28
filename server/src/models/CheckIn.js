const mongoose = require('mongoose');

// Meal check-in record
// Strict compound index on (student, mealSlot, date) ensures no duplicate check-ins at database level
const checkInSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true
    },
    mealSlot: {
      type: String,
      enum: ['lunch', 'dinner'],
      required: true
    },
    date: {
      type: String,
      required: true // 'YYYY-MM-DD' format (IST date)
    },
    status: {
      type: String,
      enum: ['allowed', 'denied'],
      default: 'allowed'
    },
    vendorRatePaise: {
      type: Number,
      required: true,
      default: 6000 // ₹60.00 in integer paise
    },
    isPaidOut: {
      type: Boolean,
      default: false
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout',
      default: null
    },
    scannedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index strictly enforced by MongoDB engine:
// A student can ONLY check in once per mealSlot (lunch/dinner) on any single calendar date
checkInSchema.index({ student: 1, mealSlot: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);

