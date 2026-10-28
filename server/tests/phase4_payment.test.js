process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('../src/server');
const Subscription = require('../src/models/Subscription');

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

const runPhase4Tests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`[Phase 4 Test] Server running on port ${port}`);

    try {
      const timestamp = Date.now();

      // 1. Verify Public Pricing from Config in integer paise
      console.log('\n--- Step 1: Check Dynamic Pricing Config in Integer Paise ---');
      const pricingRes = await makeRequest(port, {
        path: '/api/subscriptions/pricing',
        method: 'GET'
      });
      if (pricingRes.statusCode !== 200) throw new Error('Pricing API failed');
      const pricing = pricingRes.body;
      if (pricing.studentMonthlyFeePaise !== 380000 || pricing.mealsPerMonth !== 60) {
        throw new Error(`Unexpected pricing values: ${JSON.stringify(pricing)}`);
      }
      console.log(`✓ Pricing verified: ₹${pricing.studentMonthlyFeeRupees} (${pricing.studentMonthlyFeePaise} paise) for ${pricing.mealsPerMonth} meals`);

      // 2. Admin Login
      console.log('\n--- Step 2: Admin Login ---');
      const adminLogin = await makeRequest(port, {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({ email: 'admin@centralmess.in', password: 'AdminPassword123!' }));
      const adminToken = adminLogin.body.token;
      console.log('✓ Admin authenticated');

      // 3. Register & Approve Student
      console.log('\n--- Step 3: Register & Approve Test Student ---');
      const studentEmail = `student_p4_${timestamp}@college.edu`;
      const boundary = '----WebKitFormBoundaryPhase4';
      let multipartBody = '';
      const fields = {
        name: 'Siddharth Rao',
        email: studentEmail,
        password: 'Password123!',
        college: 'BITS Pilani',
        hostelOrPg: 'Malviya Bhawan, C-Wing',
        phone: '9876543219'
      };
      for (const [key, value] of Object.entries(fields)) {
        multipartBody += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
      }
      multipartBody += `--${boundary}\r\nContent-Disposition: form-data; name="idProof"; filename="bits-id.png"\r\nContent-Type: image/png\r\n\r\nFakeBitsIdData\r\n--${boundary}--\r\n`;

      const regRes = await makeRequest(port, {
        path: '/api/auth/register-student',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(multipartBody)
        }
      }, multipartBody);

      const studentId = regRes.body.user.id;
      const studentToken = regRes.body.token;

      // Approve student
      await makeRequest(port, {
        path: `/api/admin/users/${studentId}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ status: 'approved' }));
      console.log(`✓ Student ${studentEmail} approved`);

      // 4. Student creates payment order
      console.log('\n--- Step 4: Approved Student Creates Payment Order ---');
      const createOrderRes = await makeRequest(port, {
        path: '/api/payments/create-order',
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      if (createOrderRes.statusCode !== 201 || !createOrderRes.body.orderId) {
        throw new Error(`Create order failed: ${JSON.stringify(createOrderRes.body)}`);
      }
      const orderId = createOrderRes.body.orderId;
      if (createOrderRes.body.amountPaise !== 380000) {
        throw new Error(`Server did not use config fee: ${createOrderRes.body.amountPaise}`);
      }
      console.log(`✓ Order initialized with ID: ${orderId} for exact amount: ${createOrderRes.body.amountPaise} paise (₹${createOrderRes.body.amountRupees})`);

      // 5. Cashfree Webhook Fulfillment
      console.log('\n--- Step 5: Cashfree Webhook Delivers Payment Success ---');
      const webhookPayload = {
        data: {
          order: {
            order_id: orderId,
            order_amount: 3800.00
          },
          payment: {
            cf_payment_id: `CF_PAY_${timestamp}`,
            payment_status: 'SUCCESS'
          }
        }
      };

      const webhookRes = await makeRequest(port, {
        path: '/api/payments/webhook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify(webhookPayload));

      if (webhookRes.statusCode !== 200 || !webhookRes.body.subscription) {
        throw new Error(`Webhook handling failed: ${JSON.stringify(webhookRes.body)}`);
      }
      console.log(`✓ Webhook fulfilled: Subscription created with 60 meals (mealsRemaining: ${webhookRes.body.subscription.mealsRemaining})`);

      // 6. Strict Idempotency & Webhook Replay Test
      console.log('\n--- Step 6: Test Idempotency with Webhook Replay (Duplicate Event) ---');
      const replayRes = await makeRequest(port, {
        path: '/api/payments/webhook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify(webhookPayload));

      if (replayRes.statusCode !== 200 || !replayRes.body.idempotent) {
        throw new Error('Webhook replay should return idempotent confirmation without re-executing');
      }

      // Check database to ensure strictly 1 subscription exists for this student
      const subCount = await Subscription.countDocuments({ student: studentId, orderId: orderId });
      if (subCount !== 1) {
        throw new Error(`IDEMPOTENCY FAILURE: Expected 1 subscription, found ${subCount}`);
      }
      console.log(`✓ Idempotency verified: Replay ignored duplicate, database holds exactly ${subCount} subscription.`);

      // 7. Student Checks Active Subscription Status
      console.log('\n--- Step 7: Student Inspects Subscription Status ---');
      const mySubRes = await makeRequest(port, {
        path: '/api/subscriptions/my-status',
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      if (mySubRes.statusCode !== 200 || !mySubRes.body.hasActiveSubscription) {
        throw new Error('Student should have active subscription');
      }
      const mySub = mySubRes.body.subscription;
      if (mySub.mealsRemaining !== 60 || mySub.totalMeals !== 60) {
        throw new Error(`Unexpected meals balance: ${mySub.mealsRemaining}/${mySub.totalMeals}`);
      }
      console.log(`✓ Student pass active: ${mySub.mealsRemaining}/${mySub.totalMeals} meals remaining, ${mySubRes.body.daysRemaining} days remaining in cycle.`);

      console.log('\n=============================================');
      console.log('>>> ALL PHASE 4 TESTS PASSED SUCCESSFULLY <<<');
      console.log('=============================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n>>> PHASE 4 TEST FAILED <<<', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase4Tests();
