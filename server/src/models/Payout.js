const mongoose = require('mongoose');

// Payout settlement record for partner messes
// All amounts stored in integer paise
const payoutSchema = new mongoose.Schema(
  {
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    totalMeals: {
      type: Number,
      required: true,
      min: 0
    },
    ratePerMealPaise: {
      type: Number,
      required: true,
      default: 6000 // ₹60.00
    },
    amountPaise: {
      type: Number,
      required: true, // totalMeals * ratePerMealPaise
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
      index: true
    },
    isPrepaid: {
      type: Boolean,
      default: false // Set true for early trust payout (e.g. week 1 for first 10 students)
    },
    paidAt: {
      type: Date,
      default: null
    },
    transactionReference: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payout', payoutSchema);

