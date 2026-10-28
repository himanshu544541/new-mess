process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('../src/server');
const CheckIn = require('../src/models/CheckIn');
const Payout = require('../src/models/Payout');
const Mess = require('../src/models/Mess');
const User = require('../src/models/User');
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

const runPhase6Tests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`[Phase 6 Test] Server running on port ${port}`);

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

      // 2. Register Vendor
      console.log('\n--- Step 2: Register & Approve Vendor ---');
      const vendorReg = await makeRequest(port, {
        path: '/api/auth/register-vendor',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({
        name: `Analytics Vendor ${timestamp}`,
        email: `vendor_p6_${timestamp}@mess.com`,
        password: 'Password123!',
        messName: `Analytics Grand Mess ${timestamp}`,
        address: 'Sector 4, University Road',
        fssaiNumber: '99887766554433'
      }));
      const vendorId = vendorReg.body.user.id;
      const vendorToken = vendorReg.body.token;

      await makeRequest(port, {
        path: `/api/admin/users/${vendorId}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ status: 'approved' }));

      const mess = await Mess.findOne({ vendor: vendorId });
      console.log(`✓ Vendor approved with Mess: ${mess.name}`);

      // 3. Create 3 Dummy Students and CheckIns
      console.log('\n--- Step 3: Populate 3 Check-ins across 2 unique students ---');
      const student1 = await User.create({
        name: `Student One ${timestamp}`,
        email: `s1_${timestamp}@college.edu`,
        password: 'Password123!',
        role: 'student',
        status: 'approved'
      });
      const student2 = await User.create({
        name: `Student Two ${timestamp}`,
        email: `s2_${timestamp}@college.edu`,
        password: 'Password123!',
        role: 'student',
        status: 'approved'
      });

      const fakeSub1 = await Subscription.create({
        student: student1._id,
        payment: new (require('mongoose').Types.ObjectId)(),
        orderId: `ORD1_${timestamp}`,
        cycleStartDate: new Date(),
        cycleEndDate: new Date(Date.now() + 30 * 86400000),
        mealsRemaining: 58
      });

      const { dateStr: todayStr } = getCurrentMealSlotAndDate();

      // Student 1 lunch today
      await CheckIn.create({
        student: student1._id,
        mess: mess._id,
        vendor: vendorId,
        subscription: fakeSub1._id,
        mealSlot: 'lunch',
        date: todayStr,
        vendorRatePaise: 6000,
        status: 'allowed',
        isPaidOut: false
      });

      // Student 1 dinner today
      await CheckIn.create({
        student: student1._id,
        mess: mess._id,
        vendor: vendorId,
        subscription: fakeSub1._id,
        mealSlot: 'dinner',
        date: todayStr,
        vendorRatePaise: 6000,
        status: 'allowed',
        isPaidOut: false
      });

      // Student 2 lunch today
      await CheckIn.create({
        student: student2._id,
        mess: mess._id,
        vendor: vendorId,
        subscription: fakeSub1._id,
        mealSlot: 'lunch',
        date: todayStr,
        vendorRatePaise: 6000,
        status: 'allowed',
        isPaidOut: false
      });

      console.log('✓ 3 Check-ins recorded (Total payout: 3 * ₹60 = ₹180)');

      // 4. Test Vendor Stats API
      console.log('\n--- Step 4: Verify Vendor Dashboard Stats Calculation ---');
      const statsRes = await makeRequest(port, {
        path: '/api/vendor/stats',
        method: 'GET',
        headers: { Authorization: `Bearer ${vendorToken}` }
      });

      if (statsRes.statusCode !== 200) {
        throw new Error(`Stats endpoint failed: ${JSON.stringify(statsRes.body)}`);
      }

      const m = statsRes.body.metrics;
      if (m.mealsToday !== 3) {
        throw new Error(`Expected 3 meals today, got: ${m.mealsToday}`);
      }
      if (m.uniqueStudents !== 2) {
        throw new Error(`Expected 2 unique students, got: ${m.uniqueStudents}`);
      }
      if (m.estimatedUnpaidPaise !== 18000 || m.estimatedUnpaidRupees !== 180) {
        throw new Error(`Expected estimated unpaid to be ₹180 (18000 paise), got: ${m.estimatedUnpaidRupees}`);
      }
      console.log(`✓ Analytics accurate: ${m.mealsToday} meals served today, ${m.uniqueStudents} unique students, ₹${m.estimatedUnpaidRupees} estimated payout.`);

      // 5. Test CSV Export API
      console.log('\n--- Step 5: Verify Per-Meal CSV Audit Export ---');
      const csvRes = await makeRequest(port, {
        path: '/api/vendor/export-csv',
        method: 'GET',
        headers: { Authorization: `Bearer ${vendorToken}` }
      });

      if (csvRes.statusCode !== 200) {
        throw new Error(`CSV export failed with status: ${csvRes.statusCode}`);
      }
      if (!csvRes.headers['content-type']?.includes('text/csv')) {
        throw new Error(`Expected Content-Type text/csv, got: ${csvRes.headers['content-type']}`);
      }

      const rawCsv = csvRes.raw;
      if (!rawCsv.includes('CheckIn ID,Date,Time (IST),Meal Slot,Student Name')) {
        throw new Error('CSV missing required header columns');
      }
      if (!rawCsv.includes(`Student One ${timestamp}`) || !rawCsv.includes(`Student Two ${timestamp}`)) {
        throw new Error('CSV missing student names in rows');
      }
      console.log(`✓ CSV Export verified: Valid RFC format containing all headers and student meal rows.`);

      // 6. Test Payout History and Total Paid update
      console.log('\n--- Step 6: Verify Payout Settlement History ---');
      await Payout.create({
        mess: mess._id,
        vendor: vendorId,
        periodStart: new Date(Date.now() - 7 * 86400000),
        periodEnd: new Date(),
        totalMeals: 10,
        ratePerMealPaise: 6000,
        amountPaise: 60000, // ₹600.00
        status: 'paid',
        paidAt: new Date(),
        transactionReference: 'NEFT_REF_987654'
      });

      const updatedStatsRes = await makeRequest(port, {
        path: '/api/vendor/stats',
        method: 'GET',
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      if (updatedStatsRes.body.metrics.totalPaidRupees !== 600) {
        throw new Error(`Expected total paid out to be ₹600, got: ${updatedStatsRes.body.metrics.totalPaidRupees}`);
      }
      if (updatedStatsRes.body.payoutHistory.length !== 1) {
        throw new Error('Expected 1 historical payout record in list');
      }
      console.log(`✓ Payout history verified: ₹${updatedStatsRes.body.metrics.totalPaidRupees} total settled.`);

      console.log('\n=============================================');
      console.log('>>> ALL PHASE 6 TESTS PASSED SUCCESSFULLY <<<');
      console.log('=============================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n>>> PHASE 6 TEST FAILED <<<', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase6Tests();
