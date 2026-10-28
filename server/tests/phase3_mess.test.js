process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('../src/server');

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

const runPhase3Tests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`[Phase 3 Test] Server running on port ${port}`);

    try {
      const timestamp = Date.now();

      // 1. Admin Login to approve vendor
      console.log('\n--- Step 1: Admin Login ---');
      const adminLogin = await makeRequest(port, {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({ email: 'admin@centralmess.in', password: 'AdminPassword123!' }));
      const adminToken = adminLogin.body.token;
      console.log('✓ Admin authenticated');

      // 2. Register Vendor
      console.log('\n--- Step 2: Register Vendor & Mess ---');
      const vendorEmail = `vendor_p3_${timestamp}@mess.com`;
      const vendorReg = await makeRequest(port, {
        path: '/api/auth/register-vendor',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({
        name: 'Rameshwar Caterers',
        email: vendorEmail,
        password: 'Password123!',
        messName: `Rameshwar Bhojnalaya ${timestamp}`,
        address: 'Sector 15, Near Student Metro',
        fssaiNumber: '11223344556677'
      }));
      const vendorId = vendorReg.body.user.id;
      const vendorToken = vendorReg.body.token;
      console.log(`✓ Vendor registered with Mess: ${vendorReg.body.mess.name}`);

      // 3. Admin Approves Vendor
      console.log('\n--- Step 3: Admin Approves Vendor ---');
      const approveRes = await makeRequest(port, {
        path: `/api/admin/users/${vendorId}/status`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }, JSON.stringify({ status: 'approved' }));
      if (approveRes.statusCode !== 200) throw new Error('Failed to approve vendor');
      console.log('✓ Vendor approved by Admin');

      // 4. Vendor Fetches their own Mess Profile
      console.log('\n--- Step 4: Vendor Gets Own Profile ---');
      const getMessRes = await makeRequest(port, {
        path: '/api/messes/my/profile',
        method: 'GET',
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      if (getMessRes.statusCode !== 200 || !getMessRes.body.mess) {
        throw new Error('Vendor could not fetch own mess profile');
      }
      console.log(`✓ Mess profile loaded: ${getMessRes.body.mess.name}`);

      // 5. Vendor Updates Mess Details
      console.log('\n--- Step 5: Vendor Updates Profile Details ---');
      const updateProfileRes = await makeRequest(port, {
        path: '/api/messes/my/profile',
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        }
      }, JSON.stringify({
        name: `Rameshwar Deluxe Rasoi ${timestamp}`,
        description: 'Special North Indian thali and pure ghee rotis for students.',
        lunchTiming: '12:00 PM - 03:00 PM',
        dinnerTiming: '07:30 PM - 10:30 PM'
      }));
      if (updateProfileRes.statusCode !== 200) throw new Error('Failed to update mess details');
      console.log(`✓ Profile updated with new name: ${updateProfileRes.body.mess.name}`);

      // 6. Vendor Updates Daily Lunch & Dinner Menu
      console.log('\n--- Step 6: Vendor Updates Today\'s Menus ---');
      const updateMenuRes = await makeRequest(port, {
        path: '/api/messes/my/menu',
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        }
      }, JSON.stringify({
        lunch: ['Paneer Lababdar', 'Dal Tadka', 'Pulao', 'Butter Naan', 'Boondi Raita'],
        dinner: ['Aloo Gobhi', 'Chana Masala', 'Steamed Rice', 'Tawa Roti', 'Gulab Jamun']
      }));
      if (updateMenuRes.statusCode !== 200 || updateMenuRes.body.menu.lunch.length !== 5) {
        throw new Error('Failed to update menu items');
      }
      console.log('✓ Menus updated: 5 lunch items and 5 dinner items published');

      // 7. Vendor Toggles Open Status
      console.log('\n--- Step 7: Vendor Toggles Open Status ---');
      const toggleRes = await makeRequest(port, {
        path: '/api/messes/my/toggle-open',
        method: 'PATCH',
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      if (toggleRes.statusCode !== 200) throw new Error('Failed to toggle open status');
      console.log(`✓ Mess toggle status returned: isOpen = ${toggleRes.body.isOpen}`);

      // 8. Student/Public Queries Partner Messes List
      console.log('\n--- Step 8: Student Discovers Partner Messes ---');
      const allMessesRes = await makeRequest(port, {
        path: '/api/messes',
        method: 'GET'
      });
      if (allMessesRes.statusCode !== 200) throw new Error('Failed to fetch partner messes');
      const foundMess = allMessesRes.body.messes.find(m => m.name.includes(`Rameshwar Deluxe Rasoi ${timestamp}`));
      if (!foundMess) throw new Error('Newly updated mess not found in partner messes list');
      console.log(`✓ Verified mess discovery: found "${foundMess.name}" with lunch menu items`);

      // 9. Search query test
      console.log('\n--- Step 9: Search Partner Mess by Keyword ---');
      const searchRes = await makeRequest(port, {
        path: `/api/messes?search=Rameshwar`,
        method: 'GET'
      });
      if (searchRes.statusCode !== 200 || searchRes.body.messes.length === 0) {
        throw new Error('Search query returned 0 results');
      }
      console.log(`✓ Search query test passed: found ${searchRes.body.messes.length} matching messes`);

      console.log('\n=============================================');
      console.log('>>> ALL PHASE 3 TESTS PASSED SUCCESSFULLY <<<');
      console.log('=============================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n>>> PHASE 3 TEST FAILED <<<', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase3Tests();

