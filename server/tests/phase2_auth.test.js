process.env.NODE_ENV = 'test';
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../src/server');

const makeRequest = (port, options, postData = null, isMultipart = false, boundary = '') => {
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

const runPhase2Tests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`[Phase 2 Test] Server running on port ${port}`);

    try {
      // 1. Admin Login
      console.log('\n--- Test 1: Admin Login ---');
      const adminLoginRes = await makeRequest(port, {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({
        email: 'admin@centralmess.in',
        password: 'AdminPassword123!'
      }));

      if (adminLoginRes.statusCode !== 200 || !adminLoginRes.body.token) {
        throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
      }
      const adminToken = adminLoginRes.body.token;
      console.log('✓ Admin login succeeded. Received JWT token.');

      // 2. Vendor Registration
      console.log('\n--- Test 2: Vendor Registration ---');
      const timestamp = Date.now();
      const vendorPayload = {
        name: `Vendor Test ${timestamp}`,
        email: `vendor_${timestamp}@mess.com`,
        password: 'Password123!',
        messName: `Shiv Shakti Mess ${timestamp}`,
        address: 'Plot 45, University Enclave',
        fssaiNumber: '10019011000123',
        lunchTiming: '12:00 PM - 02:30 PM',
        dinnerTiming: '07:30 PM - 10:00 PM'
      };

      const vendorRegRes = await makeRequest(port, {
        path: '/api/auth/register-vendor',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify(vendorPayload));

      if (vendorRegRes.statusCode !== 201) {
        throw new Error(`Vendor registration failed: ${JSON.stringify(vendorRegRes.body)}`);
      }
      const vendorId = vendorRegRes.body.user.id;
      const vendorToken = vendorRegRes.body.token;
      if (vendorRegRes.body.user.status !== 'pending') {
        throw new Error(`Expected vendor status to be pending, got ${vendorRegRes.body.user.status}`);
      }
      console.log(`✓ Vendor registered with status 'pending': ${vendorPayload.email}`);

      // 3. Student Registration with multipart upload
      console.log('\n--- Test 3: Student Registration with Multer ID Proof ---');
      const studentEmail = `student_${timestamp}@college.edu`;
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      let multipartBody = '';

      const fields = {
        name: 'Aakash Verma',
        email: studentEmail,
        password: 'Password123!',
        college: 'Delhi Technological University',
        hostelOrPg: 'Aryabhatta Hostel, Room 204',
        phone: '9812345678'
      };

      for (const [key, value] of Object.entries(fields)) {
        multipartBody += `--${boundary}\r\n`;
        multipartBody += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
        multipartBody += `${value}\r\n`;
      }

      // Add dummy file
      multipartBody += `--${boundary}\r\n`;
      multipartBody += `Content-Disposition: form-data; name="idProof"; filename="student-id.png"\r\n`;
      multipartBody += `Content-Type: image/png\r\n\r\n`;
      multipartBody += `FakeImageDataContent\r\n`;
      multipartBody += `--${boundary}--\r\n`;

      const studentRegRes = await makeRequest(port, {
        path: '/api/auth/register-student',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(multipartBody)
        }
      }, multipartBody);

      if (studentRegRes.statusCode !== 201) {
        throw new Error(`Student registration failed: ${JSON.stringify(studentRegRes.body)}`);
      }
      const studentId = studentRegRes.body.user.id;
      const studentToken = studentRegRes.body.token;
      if (studentRegRes.body.user.status !== 'pending') {
        throw new Error(`Expected student status to be pending, got ${studentRegRes.body.user.status}`);
      }
      console.log(`✓ Student registered with status 'pending' and file upload: ${studentEmail}`);

      // 4. Admin checks Pending Users list
      console.log('\n--- Test 4: Admin Queries Pending Verification Queue ---');
      const pendingRes = await makeRequest(port, {
        path: '/api/admin/pending-users',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (pendingRes.statusCode !== 200) {
        throw new Error(`Admin get pending failed: ${JSON.stringify(pendingRes.body)}`);
      }
      const foundStudent = pendingRes.body.users.find(u => u._id === studentId);
      const foundVendor = pendingRes.body.users.find(u => u._id === vendorId);
      if (!foundStudent || !foundVendor) {
        throw new Error('Both student and vendor should appear in pending verification queue.');
      }
      console.log(`✓ Admin fetched queue: found student ${foundStudent.name} and vendor ${foundVendor.name}`);

      // 5. Admin Approves Student
      console.log('\n--- Test 5: Admin Approves Student ---');
      const approveRes = await makeRequest(port, {
        path: `/api/admin/users/${studentId}/status`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }, JSON.stringify({ status: 'approved' }));

      if (approveRes.statusCode !== 200 || approveRes.body.user.status !== 'approved') {
        throw new Error(`Failed to approve student: ${JSON.stringify(approveRes.body)}`);
      }
      console.log('✓ Student approved successfully.');

      // 6. Admin Rejects Vendor with Reason
      console.log('\n--- Test 6: Admin Rejects Vendor with Reason ---');
      const rejectRes = await makeRequest(port, {
        path: `/api/admin/users/${vendorId}/status`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }, JSON.stringify({
        status: 'rejected',
        rejectionReason: 'Invalid FSSAI licence number. Please re-submit valid registration.'
      }));

      if (rejectRes.statusCode !== 200 || rejectRes.body.user.status !== 'rejected') {
        throw new Error(`Failed to reject vendor: ${JSON.stringify(rejectRes.body)}`);
      }
      console.log('✓ Vendor rejected with reason stored.');

      // 7. Verify /auth/me for Approved Student
      console.log('\n--- Test 7: Verify Student /auth/me reflect Approved state ---');
      const studentMeRes = await makeRequest(port, {
        path: '/api/auth/me',
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (studentMeRes.body.user.status !== 'approved') {
        throw new Error(`Expected approved status for student, got ${studentMeRes.body.user.status}`);
      }
      console.log('✓ Student /api/auth/me returns status: approved');

      // 8. Verify /auth/me for Rejected Vendor
      console.log('\n--- Test 8: Verify Vendor /auth/me reflect Rejected state and Reason ---');
      const vendorMeRes = await makeRequest(port, {
        path: '/api/auth/me',
        method: 'GET',
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      if (vendorMeRes.body.user.status !== 'rejected' || !vendorMeRes.body.user.rejectionReason) {
        throw new Error(`Expected rejected status with reason for vendor`);
      }
      console.log(`✓ Vendor /api/auth/me returns status: rejected with reason: "${vendorMeRes.body.user.rejectionReason}"`);

      // 9. Unauthorized Role Access Check
      console.log('\n--- Test 9: Security Check - Student cannot access Admin route ---');
      const forbiddenRes = await makeRequest(port, {
        path: '/api/admin/pending-users',
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (forbiddenRes.statusCode !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${forbiddenRes.statusCode}`);
      }
      console.log('✓ Security check passed: Student access to /api/admin is rejected with 403 Forbidden.');

      console.log('\n=============================================');
      console.log('>>> ALL PHASE 2 TESTS PASSED SUCCESSFULLY <<<');
      console.log('=============================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n>>> PHASE 2 TEST FAILED <<<', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase2Tests();

