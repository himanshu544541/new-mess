const mongoose = require('mongoose');

// Payment transaction model
// Never stores sensitive card or UPI credentials
const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amountPaise: {
      type: Number,
      required: true // Exact integer paise determined by server from Config
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentGateway: {
      type: String,
      default: 'Cashfree'
    },
    cfPaymentId: {
      type: String,
      default: null
    },
    paymentSessionId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['created', 'success', 'failed', 'cancelled'],
      default: 'created',
      index: true
    },
    rawWebhookPayload: {
      type: Object,
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);

