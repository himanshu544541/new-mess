const mongoose = require('mongoose');

// Student dining subscription
const subscriptionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true // Ensures 1 payment maps strictly to 1 subscription (idempotency)
    },
    orderId: {
      type: String,
      required: true,
      unique: true // Strict uniqueness to guard against duplicate subscriptions
    },
    cycleStartDate: {
      type: Date,
      required: true
    },
    cycleEndDate: {
      type: Date,
      required: true
    },
    totalMeals: {
      type: Number,
      default: 60
    },
    mealsUsed: {
      type: Number,
      default: 0
    },
    mealsRemaining: {
      type: Number,
      default: 60
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'exhausted'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Method to verify if subscription is valid for dining right now
subscriptionSchema.methods.isValidForDining = function () {
  const now = new Date();
  if (this.status !== 'active') return false;
  if (this.mealsRemaining <= 0) return false;
  if (now > this.cycleEndDate || now < this.cycleStartDate) return false;
  return true;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);

