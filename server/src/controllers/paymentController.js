const crypto = require('crypto');
const Config = require('../models/Config');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const StudentProfile = require('../models/StudentProfile');
const { createCashfreeOrder, verifyCashfreeSignature } = require('../utils/cashfree');

// Fulfill and activate subscription idempotently
const fulfillPaymentSuccess = async (orderId, cfPaymentId = null, rawPayload = null) => {
  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    throw new Error(`Payment order ${orderId} not found`);
  }

  // Idempotency check 1: if payment already marked success, check if subscription exists
  if (payment.status === 'success') {
    const existingSub = await Subscription.findOne({ payment: payment._id });
    return {
      idempotent: true,
      message: 'Payment and subscription were already successfully processed.',
      subscription: existingSub
    };
  }

  // Fetch current platform configuration for cycle days and meals
  const config = await Config.getSystemConfig();

  // Mark payment success
  payment.status = 'success';
  payment.cfPaymentId = cfPaymentId || `sim_pay_${Date.now()}`;
  payment.rawWebhookPayload = rawPayload;
  payment.processedAt = new Date();
  await payment.save();

  // Idempotency check 2: check if subscription already exists for this orderId
  let subscription = await Subscription.findOne({ orderId: payment.orderId });
  if (!subscription) {
    const cycleStartDate = new Date();
    const cycleEndDate = new Date(Date.now() + config.cycleDays * 24 * 60 * 60 * 1000);

    // Deactivate any previous active subscriptions for this student
    await Subscription.updateMany(
      { student: payment.student, status: 'active' },
      { $set: { status: 'expired' } }
    );

    subscription = await Subscription.create({
      student: payment.student,
      payment: payment._id,
      orderId: payment.orderId,
      cycleStartDate,
      cycleEndDate,
      totalMeals: config.mealsPerMonth, // 60 meals
      mealsUsed: 0,
      mealsRemaining: config.mealsPerMonth,
      status: 'active'
    });
  }

  return {
    idempotent: false,
    message: 'Subscription successfully activated for 30 days (60 meals).',
    subscription
  };
};

// @desc    Initiate a monthly subscription payment with Cashfree Sandbox
// @route   POST /api/payments/create-order
// @access  Private (Approved Student only)
exports.createOrder = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Retrieve system pricing directly from database Config - NEVER trust client amounts
    const config = await Config.getSystemConfig();
    const amountPaise = config.studentMonthlyFeePaise; // 380000 paise = ₹3,800.00
    const amountRupees = amountPaise / 100;

    // Check student profile for contact phone
    const profile = await StudentProfile.findOne({ user: studentId });

    // Generate unique order ID
    const orderId = `CMS_SUB_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Create Payment record with 'created' state
    const payment = await Payment.create({
      orderId,
      student: studentId,
      amountPaise,
      currency: 'INR',
      status: 'created'
    });

    // Call Cashfree API / Sandbox simulator
    const cfResponse = await createCashfreeOrder({
      orderId,
      orderAmount: amountRupees,
      customerDetails: {
        id: studentId,
        name: req.user.name,
        email: req.user.email,
        phone: profile ? profile.phone : '9999999999'
      }
    });

    payment.paymentSessionId = cfResponse.payment_session_id;
    await payment.save();

    res.status(201).json({
      message: 'Cashfree order created successfully.',
      orderId: payment.orderId,
      amountPaise: payment.amountPaise,
      amountRupees: amountRupees,
      meals: config.mealsPerMonth,
      cycleDays: config.cycleDays,
      paymentSessionId: payment.paymentSessionId,
      cashfreeEnv: process.env.CASHFREE_ENV || 'SANDBOX'
    });
  } catch (error) {
    console.error('[Create Payment Order Error]', error);
    res.status(500).json({ error: error.message || 'Failed to initialize payment order.' });
  }
};

// @desc    Cashfree Webhook Handler with Signature Verification and Idempotency
// @route   POST /api/payments/webhook
// @access  Public (Webhook)
exports.handleCashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // Verify webhook signature in production or if signature is sent
    if (signature && timestamp && process.env.NODE_ENV === 'production') {
      const isValid = verifyCashfreeSignature(rawBody, signature, timestamp);
      if (!isValid) {
        console.warn('[Cashfree Webhook] Invalid signature rejected');
        return res.status(400).json({ error: 'Invalid webhook signature.' });
      }
    }

    const payload = req.body;
    const orderData = payload.data?.order || payload.order || payload;
    const paymentData = payload.data?.payment || payload.payment || {};

    const orderId = orderData.order_id || payload.orderId;
    const paymentStatus = paymentData.payment_status || payload.status || 'SUCCESS';
    const cfPaymentId = paymentData.cf_payment_id || payload.cfPaymentId;

    if (!orderId) {
      return res.status(400).json({ error: 'order_id missing from webhook payload.' });
    }

    if (paymentStatus === 'SUCCESS') {
      const result = await fulfillPaymentSuccess(orderId, cfPaymentId, payload);
      return res.status(200).json(result);
    } else {
      await Payment.findOneAndUpdate(
        { orderId },
        { status: 'failed', rawWebhookPayload: payload, processedAt: new Date() }
      );
      return res.status(200).json({ message: 'Payment marked as failed/cancelled.' });
    }
  } catch (error) {
    console.error('[Cashfree Webhook Error]', error);
    res.status(500).json({ error: error.message || 'Error processing payment webhook.' });
  }
};

// @desc    Developer / Sandbox simulated payment success
// @route   POST /api/payments/simulate-sandbox-success
// @access  Private (Student only)
exports.simulateSandboxSuccess = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Please provide orderId to simulate payment.' });
    }

    const payment = await Payment.findOne({ orderId, student: req.user._id });
    if (!payment) {
      return res.status(404).json({ error: 'Order not found for your account.' });
    }

    const result = await fulfillPaymentSuccess(orderId, `SIM_PAY_${Date.now()}`, {
      simulated: true,
      timestamp: new Date().toISOString()
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('[Simulate Sandbox Success Error]', error);
    res.status(500).json({ error: error.message || 'Payment simulation failed.' });
  }
};

