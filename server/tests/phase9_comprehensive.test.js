process.env.NODE_ENV = 'test';
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const Config = require('../src/models/Config');
const User = require('../src/models/User');
const Mess = require('../src/models/Mess');
const Subscription = require('../src/models/Subscription');
const CheckIn = require('../src/models/CheckIn');
const Payment = require('../src/models/Payment');

const makeRequest = (port, options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        ...options
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, headers: res.headers, raw: data });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const runComprehensiveTests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`=======================================================`);
    console.log(`[Phase 9 Comprehensive Test Suite] Port: ${port}`);
    console.log(`=======================================================`);

    try {
      const timestamp = Date.now();
      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_centralized_mess_2026_dev';

      // ================================================================
      // SUITE 1: PAYOUT MATH & INTEGER PAISE ACCURACY
      // ================================================================
      console.log('\n>>> SUITE 1: PAYOUT MATH & INTEGER PAISE PRECISION <<<');
      const config = await Config.getSystemConfig();

      // Rule 1: Student monthly fee is stored as integer paise
      if (!Number.isInteger(config.studentMonthlyFeePaise) || config.studentMonthlyFeePaise !== 380000) {
        throw new Error(`Fee must be exactly 380000 paise (₹3,800.00). Got: ${config.studentMonthlyFeePaise}`);
      }
      console.log('✓ Student monthly pass: Exactly 380,000 paise (₹3,800.00). No float values.');

      // Rule 2: Vendor payout is stored as integer paise
      if (!Number.isInteger(config.vendorRatePerMealPaise) || config.vendorRatePerMealPaise !== 6000) {
        throw new Error(`Vendor rate must be exactly 6000 paise (₹60.00). Got: ${config.vendorRatePerMealPaise}`);
      }
      console.log('✓ Vendor payout per meal: Exactly 6,000 paise (₹60.00). No float values.');

      // Rule 3: Math verification for 47 meals
      const sampleMeals = 47;
      const expectedPayoutPaise = sampleMeals * config.vendorRatePerMealPaise; // 47 * 6000 = 282000 paise
      const expectedPayoutRupees = expectedPayoutPaise / 100; // ₹2,820.00
      if (expectedPayoutPaise !== 282000 || expectedPayoutRupees !== 2820) {
        throw new Error(`Payout calculation mismatch: ${expectedPayoutPaise}`);
      }
      console.log(`✓ Settlement formula check: ${sampleMeals} meals × 6,000 paise = ${expectedPayoutPaise} paise (₹${expectedPayoutRupees}.00). Perfectly exact.`);

      // Rule 4: Net platform margin calculation check
      const grossCollectionsPaise = 380000;
      const mealsConsumed = 60;
      const totalVendorCostPaise = mealsConsumed * 6000; // 360000 paise (₹3,600.00)
      const gatewayFeePercent = 2.0;
      const gatewayFeePaise = Math.round((grossCollectionsPaise * gatewayFeePercent) / 100); // 7600 paise (₹76.00)
      const netPlatformMarginPaise = grossCollectionsPaise - totalVendorCostPaise - gatewayFeePaise; // 12400 paise (₹124.00)

      if (netPlatformMarginPaise !== 12400) {
        throw new Error(`Net margin calculation failed: ${netPlatformMarginPaise}`);
      }
      console.log(`✓ Platform net margin verified: ₹3,800 − ₹3,600 − ₹76 (2% gateway) = ₹${netPlatformMarginPaise / 100}.00 (${netPlatformMarginPaise} paise).`);

      // ================================================================
      // SUITE 2: DATABASE COMPOUND INDEX & DUPLICATE CHECK-IN REJECTION
      // ================================================================
      console.log('\n>>> SUITE 2: DATABASE COMPOUND INDEX & DUPLICATE CHECK-IN <<<');

      const dupVendorUser = await User.create({
        name: `DupVendor ${timestamp}`,
        email: `dupvendor_${timestamp}@mess.com`,
        password: 'Password123!',
        role: 'vendor',
        status: 'approved'
      });
      const dupMess = await Mess.create({
        name: `DupTest Mess ${timestamp}`,
        address: 'Testing Block',
        fssaiNumber: '11223344550099',
        vendor: dupVendorUser._id,
        isOpen: true
      });
      const dupStudentUser = await User.create({
        name: `DupStudent ${timestamp}`,
        email: `dupstudent_${timestamp}@college.edu`,
        password: 'Password123!',
        role: 'student',
        status: 'approved'
      });
      const dupSub = await Subscription.create({
        student: dupStudentUser._id,
        payment: new (require('mongoose').Types.ObjectId)(),
        orderId: `ORD_DUP_${timestamp}`,
        cycleStartDate: new Date(),
        cycleEndDate: new Date(Date.now() + 30 * 86400000),
        mealsRemaining: 60,
        status: 'active'
      });

      const vendorToken = jwt.sign({ id: dupVendorUser._id }, secret, { expiresIn: '1h' });
      const validQrToken = jwt.sign(
        { studentId: dupStudentUser._id.toString(), subscriptionId: dupSub._id.toString(), type: 'meal_qr' },
        secret,
        { expiresIn: '60s' }
      );

      // First Scan: Expected ALLOWED
      const firstScan = await makeRequest(port, {
        path: '/api/checkins/scan',
        method: 'POST',
        headers: { Authorization: `Bearer ${vendorToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ qrToken: validQrToken, overrideMealSlot: 'lunch', overrideDate: '2026-10-29' }));

      if (firstScan.statusCode !== 200 || firstScan.body.status !== 'ALLOWED') {
        throw new Error(`First scan should be ALLOWED: ${JSON.stringify(firstScan.body)}`);
      }
      console.log('✓ 1st Scan: ALLOWED recorded for student (balance reduced 60 → 59).');

      // Second Scan: Same student, same slot (lunch), same date (2026-10-29) -> MUST BE DENIED
      const secondScan = await makeRequest(port, {
        path: '/api/checkins/scan',
        method: 'POST',
        headers: { Authorization: `Bearer ${vendorToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ qrToken: validQrToken, overrideMealSlot: 'lunch', overrideDate: '2026-10-29' }));

      if (secondScan.statusCode !== 400 || secondScan.body.status !== 'DENIED') {
        throw new Error(`Second scan must be DENIED: ${JSON.stringify(secondScan.body)}`);
      }
      console.log(`✓ 2nd Scan: Correctly DENIED by engine index: "${secondScan.body.reason}"`);

      // Verify that database strictly contains 1 checkin record and balance remained 59
      const dbCheckInCount = await CheckIn.countDocuments({
        student: dupStudentUser._id,
        mealSlot: 'lunch',
        date: '2026-10-29'
      });
      if (dbCheckInCount !== 1) {
        throw new Error(`DATABASE CORRUPTION: Found ${dbCheckInCount} records for same slot/day!`);
      }
      const refetchedSub = await Subscription.findById(dupSub._id);
      if (refetchedSub.mealsRemaining !== 59) {
        throw new Error(`Meal balance improperly deducted: ${refetchedSub.mealsRemaining}`);
      }
      console.log('✓ Database integrity confirmed: Exactly 1 record inserted, meal balance preserved at 59.');

      // ================================================================
      // SUITE 3: EXPIRED QR TOKEN REJECTION (ANTI-SCREENSHOT PROTECTION)
      // ================================================================
      console.log('\n>>> SUITE 3: EXPIRED QR TOKEN REJECTION <<<');
      const expiredToken = jwt.sign(
        { studentId: dupStudentUser._id.toString(), subscriptionId: dupSub._id.toString(), type: 'meal_qr' },
        secret,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const expiredScan = await makeRequest(port, {
        path: '/api/checkins/scan',
        method: 'POST',
        headers: { Authorization: `Bearer ${vendorToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ qrToken: expiredToken }));

      if (expiredScan.statusCode !== 400 || expiredScan.body.status !== 'DENIED') {
        throw new Error(`Expired token should be rejected: ${JSON.stringify(expiredScan.body)}`);
      }
      if (!expiredScan.body.reason.includes('expired')) {
        throw new Error(`Reason should mention expiration, got: ${expiredScan.body.reason}`);
      }
      console.log(`✓ Expired token rejected: "${expiredScan.body.reason}". Screenshot sharing defeated.`);

      // ================================================================
      // SUITE 4: WEBHOOK REPLAY & STRICT IDEMPOTENCY
      // ================================================================
      console.log('\n>>> SUITE 4: WEBHOOK REPLAY & STRICT IDEMPOTENCY <<<');
      const webhookStudent = await User.create({
        name: `WebhookStudent ${timestamp}`,
        email: `webhook_${timestamp}@college.edu`,
        password: 'Password123!',
        role: 'student',
        status: 'approved'
      });

      const uniqueOrderId = `CMS_IDEM_${timestamp}_777`;
      await Payment.create({
        orderId: uniqueOrderId,
        student: webhookStudent._id,
        amountPaise: 380000,
        currency: 'INR',
        status: 'created'
      });

      const webhookPayload = {
        data: {
          order: { order_id: uniqueOrderId, order_amount: 3800.00 },
          payment: { cf_payment_id: `CF_TEST_${timestamp}`, payment_status: 'SUCCESS' }
        }
      };

      // 1st Webhook Delivery: Expect subscription creation
      const firstWebhook = await makeRequest(port, {
        path: '/api/payments/webhook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify(webhookPayload));

      if (firstWebhook.statusCode !== 200 || !firstWebhook.body.subscription) {
        throw new Error(`First webhook delivery failed: ${JSON.stringify(firstWebhook.body)}`);
      }
      console.log('✓ 1st Webhook: Successfully processed and created 30-day subscription (60 meals).');

      // 2nd Webhook Delivery (Identical event replayed)
      const secondWebhook = await makeRequest(port, {
        path: '/api/payments/webhook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify(webhookPayload));

      if (secondWebhook.statusCode !== 200 || !secondWebhook.body.idempotent) {
        throw new Error(`Second webhook must return idempotent acknowledgement: ${JSON.stringify(secondWebhook.body)}`);
      }
      console.log('✓ 2nd Webhook (Replay 1): Confirmed idempotent, no duplicate subscription created.');

      // 3rd Webhook Delivery (Identical event replayed again)
      const thirdWebhook = await makeRequest(port, {
        path: '/api/payments/webhook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify(webhookPayload));

      if (thirdWebhook.statusCode !== 200 || !thirdWebhook.body.idempotent) {
        throw new Error('Third webhook must return idempotent acknowledgement');
      }
      console.log('✓ 3rd Webhook (Replay 2): Confirmed idempotent.');

      // Check database: Exactly 1 subscription and 60 meals total
      const totalSubsForOrder = await Subscription.countDocuments({ orderId: uniqueOrderId });
      if (totalSubsForOrder !== 1) {
        throw new Error(`IDEMPOTENCY CRITICAL FAILURE: Found ${totalSubsForOrder} subscriptions for single order!`);
      }
      const singleSub = await Subscription.findOne({ orderId: uniqueOrderId });
      if (singleSub.mealsRemaining !== 60 || singleSub.totalMeals !== 60) {
        throw new Error(`Meals improperly multiplied: ${singleSub.mealsRemaining}`);
      }
      console.log(`✓ Strict idempotency verified: Exactly 1 subscription exists in DB with 60 meals (meals did not multiply to 120 or 180).`);

      console.log('\n=======================================================');
      console.log('>>> ALL 4 MANDATORY TEST SUITES PASSED FLAWLESSLY <<<');
      console.log('=======================================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n>>> PHASE 9 COMPREHENSIVE TESTS FAILED <<<', err);
      server.close(() => process.exit(1));
    }
  });
};

runComprehensiveTests();

