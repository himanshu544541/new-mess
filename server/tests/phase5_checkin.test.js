process.env.NODE_ENV = 'test';
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const CheckIn = require('../src/models/CheckIn');
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

const runPhase5Tests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`[Phase 5 Test] Server running on port ${port}`);

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

      // 2. Register & Approve Vendor
      console.log('\n--- Step 2: Register & Approve Partner Mess Vendor ---');
      const vendorReg = await makeRequest(port, {
        path: '/api/auth/register-vendor',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({
        name: `Vendor P5 ${timestamp}`,
        email: `vendor_p5_${timestamp}@mess.com`,
        password: 'Password123!',
        messName: `Bhojnalaya P5 ${timestamp}`,
        address: 'Campus Gate 3',
        fssaiNumber: '19876543210123'
      }));
      const vendorId = vendorReg.body.user.id;
      const vendorToken = vendorReg.body.token;

      await makeRequest(port, {
        path: `/api/admin/users/${vendorId}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ status: 'approved' }));
      console.log(`✓ Vendor approved: ${vendorReg.body.mess.name}`);

      // 3. Register & Approve Student with Active Subscription
      console.log('\n--- Step 3: Register Student and Activate Subscription (60 meals) ---');
      const boundary = '----WebKitFormBoundaryPhase5';
      let multipartBody = '';
      const fields = {
        name: `Student P5 ${timestamp}`,
        email: `student_p5_${timestamp}@college.edu`,
        password: 'Password123!',
        college: 'IIT Roorkee',
        hostelOrPg: 'Govind Bhawan',
        phone: '9876501234'
      };
      for (const [k, v] of Object.entries(fields)) {
        multipartBody += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
      }
      multipartBody += `--${boundary}\r\nContent-Disposition: form-data; name="idProof"; filename="iitr.png"\r\nContent-Type: image/png\r\n\r\nFakeProof\r\n--${boundary}--\r\n`;

      const studentReg = await makeRequest(port, {
        path: '/api/auth/register-student',
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(multipartBody) }
      }, multipartBody);
      const studentId = studentReg.body.user.id;
      const studentToken = studentReg.body.token;

      await makeRequest(port, {
        path: `/api/admin/users/${studentId}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ status: 'approved' }));

      // Create Order & Fulfill Webhook
      const orderRes = await makeRequest(port, {
        path: '/api/payments/create-order',
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const orderId = orderRes.body.orderId;

      await makeRequest(port, {
        path: '/api/payments/webhook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({
        data: {
          order: { order_id: orderId },
          payment: { cf_payment_id: `CF_${timestamp}`, payment_status: 'SUCCESS' }
        }
      }));
      console.log('✓ Student subscription active with 60 meals balance');

      // 4. Student Generates Dynamic 60-Second QR Token
      console.log('\n--- Step 4: Student Generates Dynamic QR Code ---');
      const qrRes = await makeRequest(port, {
        path: '/api/checkins/generate-qr',
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      if (qrRes.statusCode !== 200 || !qrRes.body.qrToken) {
        throw new Error(`Generate QR failed: ${JSON.stringify(qrRes.body)}`);
      }
      const qrToken = qrRes.body.qrToken;
      if (qrRes.body.expiresInSeconds !== 60) {
        throw new Error(`Expected 60s expiration, got ${qrRes.body.expiresInSeconds}`);
      }
      console.log(`✓ QR token generated (expires in 60s): ${qrToken.substring(0, 35)}...`);

      // 5. Vendor Scans Valid Student QR Code
      console.log('\n--- Step 5: Vendor Scans Valid QR Code (Allowed) ---');
      const scanRes = await makeRequest(port, {
        path: '/api/checkins/scan',
        method: 'POST',
        headers: { Authorization: `Bearer ${vendorToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ qrToken }));

      if (scanRes.statusCode !== 200 || scanRes.body.status !== 'ALLOWED') {
        throw new Error(`Expected ALLOWED checkin, got: ${JSON.stringify(scanRes.body)}`);
      }
      if (scanRes.body.mealsRemaining !== 59) {
        throw new Error(`Expected 59 meals remaining, got: ${scanRes.body.mealsRemaining}`);
      }
      if (scanRes.body.vendorPayoutRupees !== 60) {
        throw new Error(`Expected ₹60 vendor payout, got: ${scanRes.body.vendorPayoutRupees}`);
      }
      console.log(`✓ Scan APPROVED: Big Green ALLOWED returned. Meals remaining decremented to ${scanRes.body.mealsRemaining}/60. Payout credited: +₹${scanRes.body.vendorPayoutRupees}`);

      // 6. Test Duplicate Check-in Rejection (Same Student, Same Slot, Same Day)
      console.log('\n--- Step 6: Test Duplicate Check-in Rejection (Compound Index) ---');
      const dupScanRes = await makeRequest(port, {
        path: '/api/checkins/scan',
        method: 'POST',
        headers: { Authorization: `Bearer ${vendorToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ qrToken }));

      if (dupScanRes.statusCode !== 400 || dupScanRes.body.status !== 'DENIED') {
        throw new Error(`Duplicate checkin should be DENIED: ${JSON.stringify(dupScanRes.body)}`);
      }
      console.log(`✓ Duplicate check-in correctly REJECTED with Red DENIED: "${dupScanRes.body.reason}"`);

      // Verify that database has strictly 1 checkin record and meals remained 59
      const checkInCount = await CheckIn.countDocuments({ student: studentId });
      if (checkInCount !== 1) {
        throw new Error(`Expected 1 checkin record in DB, found ${checkInCount}`);
      }
      const updatedSub = await Subscription.findOne({ student: studentId });
      if (updatedSub.mealsRemaining !== 59) {
        throw new Error(`Meals balance was modified on duplicate! Balance: ${updatedSub.mealsRemaining}`);
      }
      console.log(`✓ Compound index enforced: database contains exactly 1 checkin and student balance remains 59.`);

      // 7. Test Expired QR Token Rejection
      console.log('\n--- Step 7: Test Expired QR Token Rejection ---');
      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_centralized_mess_2026_dev';
      const expiredToken = jwt.sign(
        { studentId, subscriptionId: updatedSub._id, type: 'meal_qr' },
        secret,
        { expiresIn: '-5s' } // Expired 5 seconds ago
      );

      const expiredScanRes = await makeRequest(port, {
        path: '/api/checkins/scan',
        method: 'POST',
        headers: { Authorization: `Bearer ${vendorToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({ qrToken: expiredToken }));

      if (expiredScanRes.statusCode !== 400 || expiredScanRes.body.status !== 'DENIED') {
        throw new Error(`Expired token should be DENIED: ${JSON.stringify(expiredScanRes.body)}`);
      }
      console.log(`✓ Expired QR token correctly REJECTED: "${expiredScanRes.body.reason}"`);

      console.log('\n=============================================');
      console.log('>>> ALL PHASE 5 TESTS PASSED SUCCESSFULLY <<<');
      console.log('=============================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n>>> PHASE 5 TEST FAILED <<<', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase5Tests();

