const { execSync } = require('child_process');
const path = require('path');

const tests = [
  { name: 'Phase 1: Server Health Check', file: 'tests/health.test.js' },
  { name: 'Phase 2: Auth, Roles & Approval Flow', file: 'tests/phase2_auth.test.js' },
  { name: 'Phase 3: Partner Messes & Menus', file: 'tests/phase3_mess.test.js' },
  { name: 'Phase 4: Pricing, Cashfree Sandbox & Subscriptions', file: 'tests/phase4_payment.test.js' },
  { name: 'Phase 5: Dynamic QR & Check-in Engine', file: 'tests/phase5_checkin.test.js' },
  { name: 'Phase 6: Vendor Analytics & CSV Export', file: 'tests/phase6_vendor_analytics.test.js' },
  { name: 'Phase 7: Admin Pricing, Settlements & Margin Report', file: 'tests/phase7_admin.test.js' },
  { name: 'Phase 8: Ratings, Closing Alerts & Notifications', file: 'tests/phase8_ratings_notifications.test.js' },
  { name: 'Phase 9: Comprehensive 4-Suite Verification', file: 'tests/phase9_comprehensive.test.js' }
];

console.log('================================================================');
console.log('🚀 RUNNING ALL CENTRALIZED MESS SYSTEM AUTOMATED TEST SUITES');
console.log('================================================================\n');

let passedCount = 0;

for (const t of tests) {
  console.log(`▶ Running: ${t.name}...`);
  try {
    execSync(`node ${t.file}`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    passedCount++;
    console.log(`✔ Passed: ${t.name}\n`);
  } catch (err) {
    console.error(`✖ Failed: ${t.name}`);
    process.exit(1);
  }
}

console.log('================================================================');
console.log(`🎉 ALL ${passedCount} OF ${tests.length} TEST SUITES PASSED END-TO-END!`);
console.log('================================================================');

