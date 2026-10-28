process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('../src/server');
const Config = require('../src/models/Config');
const CheckIn = require('../src/models/CheckIn');
const Mess = require('../src/models/Mess');
const User = require('../src/models/User');
const Payment = require('../src/models/Payment');
const Subscription = require('../src/models/Subscription');
const { getCurrentMealSlotAndDate } = require('../src/utils/qrToken');

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

const runPhase7Tests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`[Phase 7 Test] Server running on port ${port}`);

    try {
      const timestamp = Date.now();

      // 1. Admin Login
      console.log('\n--- Step 1: Admin Login ---');
      const adminLogin = await makeRequest(port, {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({ email: 'admin@centralmess.in', password: 'AdminPassword123!' }));
      const adminToken = adminLogin.body.token;
      console.log('✓ Admin authenticated');

      // 2. Pricing Config Read & Update
      console.log('\n--- Step 2: Read & Update Dynamic Pricing Config ---');
      const getConfigRes = await makeRequest(port, {
        path: '/api/admin/config',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (getConfigRes.statusCode !== 200) throw new Error('Get config failed');
      console.log(`✓ Current config: ₹${getConfigRes.body.config.studentMonthlyFeePaise / 100} student fee, ₹${getConfigRes.body.config.vendorRatePerMealPaise / 100} vendor rate`);

      // Update config
      const updateConfigRes = await makeRequest(port, {
        path: '/api/admin/config',
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({
        studentMonthlyFeeRupees: 3900,
        vendorRatePerMealRupees: 62,
        gatewayFeePercent: 2.2
      }));

      if (updateConfigRes.statusCode !== 200 || updateConfigRes.body.config.studentMonthlyFeePaise !== 390000) {
        throw new Error('Config update failed');
      }
      console.log('✓ Config successfully updated to ₹3900 / ₹62');

      // Restore back to canonical defaults (₹3800 / ₹60 / 2.0%)
      await makeRequest(port, {
        path: '/api/admin/config',
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({
        studentMonthlyFeeRupees: 3800,
        vendorRatePerMealRupees: 60,
        gatewayFeePercent: 2.0
      }));
      console.log('✓ Config restored to canonical ₹3800 / ₹60 defaults');

      // 3. Create a Test Mess with Unsettled Check-ins
      console.log('\n--- Step 3: Populate Test Mess with 4 Unsettled Check-ins ---');
      const testVendor = await User.create({
        name: `Settle Vendor ${timestamp}`,
        email: `vendor_s_${timestamp}@mess.com`,
        password: 'Password123!',
        role: 'vendor',
        status: 'approved'
      });
      const testMess = await Mess.create({
        name: `Shiv Shanti Mess ${timestamp}`,
        address: 'Opposite Campus Gate',
        fssaiNumber: '11112222333344',
        vendor: testVendor._id
      });
      const testStudent = await User.create({
        name: `Test Student ${timestamp}`,
        email: `student_s_${timestamp}@college.edu`,
        password: 'Password123!',
        role: 'student',
        status: 'approved'
      });
      const fakeSub = await Subscription.create({
        student: testStudent._id,
        payment: new (require('mongoose').Types.ObjectId)(),
        orderId: `ORD_SETTLE_${timestamp}`,
        cycleStartDate: new Date(),
        cycleEndDate: new Date(Date.now() + 30 * 86400000),
        mealsRemaining: 56
      });

      const { dateStr } = getCurrentMealSlotAndDate();

      for (let i = 1; i <= 4; i++) {
        await CheckIn.create({
          student: testStudent._id,
          mess: testMess._id,
          vendor: testVendor._id,
          subscription: fakeSub._id,
          mealSlot: i % 2 === 0 ? 'lunch' : 'dinner',
          date: `2026-10-${10 + i}`, // distinct dates to prevent compound index collision
          vendorRatePaise: 6000,
          status: 'allowed',
          isPaidOut: false
        });
      }
      console.log('✓ 4 Unsettled check-ins created (4 * ₹60 = ₹240)');

      // 4. Calculate Settlements
      console.log('\n--- Step 4: Calculate Settlements API ---');
      const calcRes = await makeRequest(port, {
        path: '/api/admin/settlements/calculate',
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({}));

      if (calcRes.statusCode !== 200) throw new Error('Calculate settlements failed');
      const foundProposal = calcRes.body.settlementProposals.find(p => p.messId === testMess._id.toString());
      if (!foundProposal || foundProposal.unsettledMeals !== 4 || foundProposal.totalAmountRupees !== 240) {
        throw new Error(`Unexpected settlement proposal: ${JSON.stringify(foundProposal)}`);
      }
      console.log(`✓ Settlement calculated: ${foundProposal.unsettledMeals} meals, ₹${foundProposal.totalAmountRupees} payout`);

      // 5. Disburse Settlement with Prepaid Trust Flag
      console.log('\n--- Step 5: Disburse Settlement with isPrepaid: true ---');
      const disburseRes = await makeRequest(port, {
        path: '/api/admin/settlements/disburse',
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({
        messId: testMess._id,
        isPrepaid: true,
        transactionReference: `CMS_TRUST_NEFT_${timestamp}`,
        notes: 'Prepaid week 1 payout'
      }));

      if (disburseRes.statusCode !== 200 || !disburseRes.body.payout?.isPrepaid) {
        throw new Error('Disbursement failed or isPrepaid flag not set');
      }
      console.log(`✓ Settlement disbursed: ₹${disburseRes.body.payout.amountPaise / 100} with isPrepaid = true`);

      // Verify matching check-ins marked as paid out
      const remainingUnpaid = await CheckIn.countDocuments({ mess: testMess._id, isPaidOut: false });
      if (remainingUnpaid !== 0) throw new Error(`Expected 0 unpaid checkins, found ${remainingUnpaid}`);
      console.log('✓ All 4 check-ins successfully marked isPaidOut = true');

      // 6. Test Platform Margin Report
      console.log('\n--- Step 6: Platform Margin Report API ---');
      const marginRes = await makeRequest(port, {
        path: '/api/admin/margin-report',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (marginRes.statusCode !== 200) throw new Error('Margin report failed');
      const report = marginRes.body;
      console.log(`✓ Margin report verified:`);
      console.log(`  - Gross Student Collections: ₹${report.summary.grossRevenueRupees}`);
      console.log(`  - Vendor Accruals: ₹${report.summary.vendorAccruedRupees}`);
      console.log(`  - Gateway Fee (${report.summary.gatewayFeePercent}%): ₹${report.summary.estimatedGatewayFeeRupees}`);
      console.log(`  - Net Platform Margin: ₹${report.summary.netPlatformMarginRupees} (${report.summary.netMarginPercentage}%)`);

      // Math verification: Net = Gross - Vendor - Gateway
      const expectedNetPaise =
        report.summary.grossRevenuePaise -
        report.summary.vendorAccruedPaise -
        report.summary.estimatedGatewayFeePaise;
      if (report.summary.netPlatformMarginPaise !== expectedNetPaise) {
        throw new Error(`Margin math mismatch: ${report.summary.netPlatformMarginPaise} vs expected ${expectedNetPaise}`);
      }
      console.log('✓ Margin formula strictly verified: Net = Gross - Vendor Costs - Gateway Fees.');

      // 7. Global Check-In Audit
      console.log('\n--- Step 7: Global Check-in Audit API ---');
      const allCheckinsRes = await makeRequest(port, {
        path: '/api/admin/all-checkins',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (allCheckinsRes.statusCode !== 200 || allCheckinsRes.body.checkIns.length === 0) {
        throw new Error('Checkins audit endpoint returned 0 records');
      }
      console.log(`✓ Global check-in audit stream returned ${allCheckinsRes.body.checkIns.length} records.`);

      console.log('\n=============================================');
      console.log('>>> ALL PHASE 7 TESTS PASSED SUCCESSFULLY <<<');
      console.log('=============================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n>>> PHASE 7 TEST FAILED <<<', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase7Tests();

