process.env.NODE_ENV = 'test';
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const Mess = require('../src/models/Mess');
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const Rating = require('../src/models/Rating');
const Notification = require('../src/models/Notification');
const { dispatchClosingAlerts } = require('../src/jobs/closingAlerts');

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

const runPhase8Tests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`[Phase 8 Test] Server running on port ${port}`);

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

      // 2. Setup Vendor and Student
      console.log('\n--- Step 2: Setup Partner Mess and Subscribed Student ---');
      const vendorUser = await User.create({
        name: `Vendor P8 ${timestamp}`,
        email: `vendor_p8_${timestamp}@mess.com`,
        password: 'Password123!',
        role: 'vendor',
        status: 'approved'
      });
      const vendorMess = await Mess.create({
        name: `Bhojan Rasoi ${timestamp}`,
        address: 'Hostel Block 1',
        fssaiNumber: '98765432101234',
        vendor: vendorUser._id,
        isOpen: true,
        isActive: true
      });

      const studentUser = await User.create({
        name: `Student P8 ${timestamp}`,
        email: `student_p8_${timestamp}@college.edu`,
        password: 'Password123!',
        role: 'student',
        status: 'approved'
      });

      // Active subscription
      const sub = await Subscription.create({
        student: studentUser._id,
        payment: new (require('mongoose').Types.ObjectId)(),
        orderId: `ORD_P8_${timestamp}`,
        cycleStartDate: new Date(),
        cycleEndDate: new Date(Date.now() + 30 * 86400000),
        mealsRemaining: 55,
        status: 'active'
      });

      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_centralized_mess_2026_dev';
      const studentToken = jwt.sign({ id: studentUser._id }, secret, { expiresIn: '1h' });
      const vendorToken = jwt.sign({ id: vendorUser._id }, secret, { expiresIn: '1h' });
      console.log('✓ Student and Vendor authenticated');

      // 3. Student Submits Private Rating
      console.log('\n--- Step 3: Student Submits Private Rating & Feedback ---');
      const reviewText = 'Delicious dal makhani, warm rotis, and great dining hygiene!';
      const submitRatingRes = await makeRequest(port, {
        path: '/api/ratings',
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' }
      }, JSON.stringify({
        messId: vendorMess._id,
        rating: 5,
        comment: reviewText
      }));

      if (submitRatingRes.statusCode !== 200) {
        throw new Error(`Rating submit failed: ${JSON.stringify(submitRatingRes.body)}`);
      }
      console.log('✓ Rating submitted: 5 stars with private comment');

      // 4. Privacy Check: Vendor only sees average, NEVER individual comment
      console.log('\n--- Step 4: Privacy Check - Vendor gets average only, NO comments ---');
      const vendorSummaryRes = await makeRequest(port, {
        path: '/api/ratings/vendor/summary',
        method: 'GET',
        headers: { Authorization: `Bearer ${vendorToken}` }
      });

      if (vendorSummaryRes.statusCode !== 200) throw new Error('Vendor rating summary failed');
      if (vendorSummaryRes.body.avgRating !== 5 || vendorSummaryRes.body.totalRatings !== 1) {
        throw new Error(`Expected avgRating 5 and totalRatings 1, got ${JSON.stringify(vendorSummaryRes.body)}`);
      }
      if (vendorSummaryRes.body.ratings || vendorSummaryRes.body.comments || vendorSummaryRes.body.student) {
        throw new Error('SECURITY VIOLATION: Individual student review/comment leaked to vendor!');
      }
      console.log(`✓ Privacy enforced: Vendor received avgRating = ${vendorSummaryRes.body.avgRating} (1 review), 0 individual comments exposed.`);

      // 5. Admin sees full private feedback
      console.log('\n--- Step 5: Admin Inspects Private Reviews & Student Identities ---');
      const adminRatingsRes = await makeRequest(port, {
        path: '/api/ratings/admin/all',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (adminRatingsRes.statusCode !== 200) throw new Error('Admin ratings failed');
      const foundReview = adminRatingsRes.body.ratings.find(r => r.mess?._id === vendorMess._id.toString());
      if (!foundReview || !foundReview.comment.includes('Delicious dal makhani')) {
        throw new Error('Admin could not see full review comment');
      }
      console.log(`✓ Admin verified review: "${foundReview.comment}" submitted by ${foundReview.student?.name}`);

      // 6. Test Funny Zomato-Style Closing-Time Alerts
      console.log('\n--- Step 6: Trigger Closing-Time Alert Job ---');
      const alertResult = await dispatchClosingAlerts(vendorMess._id);
      if (alertResult.error) throw new Error(`Dispatch alerts error: ${alertResult.error}`);
      console.log(`✓ Alert job executed: ${alertResult.dispatched} notifications generated.`);

      // 7. Student In-App Notification Delivery & Mark Read
      console.log('\n--- Step 7: Verify Student In-App Notification Delivery ---');
      const notifRes = await makeRequest(port, {
        path: '/api/notifications',
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      if (notifRes.statusCode !== 200 || notifRes.body.count === 0) {
        throw new Error('Student should have received closing alert notification');
      }
      const notif = notifRes.body.notifications[0];
      console.log(`✓ Notification received by student:`);
      console.log(`  - Title: "${notif.title}"`);
      console.log(`  - Message: "${notif.message}"`);

      // Mark as read
      const markReadRes = await makeRequest(port, {
        path: `/api/notifications/${notif._id}/read`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (markReadRes.statusCode !== 200 || !markReadRes.body.notification.isRead) {
        throw new Error('Failed to mark notification as read');
      }
      console.log('✓ Notification successfully marked as read.');

      console.log('\n=============================================');
      console.log('>>> ALL PHASE 8 TESTS PASSED SUCCESSFULLY <<<');
      console.log('=============================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n>>> PHASE 8 TEST FAILED <<<', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase8Tests();
