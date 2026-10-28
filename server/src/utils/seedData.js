const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Models
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Mess = require('../models/Mess');
const Config = require('../models/Config');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const CheckIn = require('../models/CheckIn');
const Rating = require('../models/Rating');
const Notification = require('../models/Notification');
const Payout = require('../models/Payout');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/centralized_mess';
    await mongoose.connect(mongoUri);
    console.log(`[Seed Script] Connected to MongoDB: ${mongoUri}`);

    console.log('[Seed Script] Clearing previous collections...');
    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      Mess.deleteMany({}),
      Config.deleteMany({}),
      Payment.deleteMany({}),
      Subscription.deleteMany({}),
      CheckIn.deleteMany({}),
      Rating.deleteMany({}),
      Notification.deleteMany({}),
      Payout.deleteMany({})
    ]);

    // 1. Initialize Dynamic Config in Integer Paise
    console.log('[Seed Script] 1. Initializing System Config in Integer Paise...');
    const config = await Config.create({
      studentMonthlyFeePaise: 380000, // ₹3,800.00
      mealsPerMonth: 60,
      cycleDays: 30,
      vendorRatePerMealPaise: 6000, // ₹60.00
      platformFeePerMealPaise: 333, // ₹3.33
      oldSingleMessComparisonRatePaise: 5833, // ₹58.33
      gatewayFeePercent: 2.0
    });
    console.log('✓ Config created with ₹3,800 monthly pass & ₹60 vendor rate');

    // 2. Hash default password
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Password123!', salt);
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', salt);

    // 3. Seed 1 Default Admin
    console.log('[Seed Script] 2. Seeding 1 System Administrator...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@centralmess.in',
      password: adminPasswordHash,
      role: 'admin',
      status: 'approved'
    });
    console.log(`✓ Admin created: ${admin.email} / AdminPassword123!`);

    // 4. Seed 3 Distinct Partner Messes & Vendor Accounts
    console.log('[Seed Script] 3. Seeding 3 Partner Messes and Vendors...');
    const messesData = [
      {
        vendorName: 'Ramesh Sharma',
        email: 'vendor1@mess.com',
        messName: 'Annapurna Rasoi (North Campus)',
        address: 'Shop 4, Student Colony, Near Gate 2',
        fssaiNumber: '11223344556601',
        description: 'Special North Indian homestyle thali, Shahi Paneer, and pure ghee phulkas.',
        timings: { lunch: '12:00 PM - 03:00 PM', dinner: '07:30 PM - 10:00 PM' },
        menu: {
          lunch: ['Dal Makhani', 'Paneer Butter Masala', 'Steamed Basmati Rice', 'Butter Roti', 'Boondi Raita', 'Gulab Jamun'],
          dinner: ['Mix Veg Sabzi', 'Dal Tadka', 'Jeera Rice', 'Tawa Roti', 'Green Salad', 'Kheer']
        },
        avgRating: 4.8,
        totalRatings: 12
      },
      {
        vendorName: 'Vikram Singh',
        email: 'vendor2@mess.com',
        messName: 'Shiv Shakti Bhojnalaya',
        address: 'Plot 18, Metro Pillar 114, Hostel Zone',
        fssaiNumber: '11223344556602',
        description: 'Authentic Punjabi dining hall serving fresh chole bhature and homestyle thali.',
        timings: { lunch: '12:30 PM - 03:30 PM', dinner: '08:00 PM - 10:30 PM' },
        menu: {
          lunch: ['Chole Masala', 'Aloo Palak', 'Jeera Rice', 'Butter Naan', 'Pickle', 'Rasgulla'],
          dinner: ['Rajma Curry', 'Bhindi Masala', 'Steamed Rice', 'Tandoori Roti', 'Kachumber Salad']
        },
        avgRating: 4.6,
        totalRatings: 9
      },
      {
        vendorName: 'Suresh Pillai',
        email: 'vendor3@mess.com',
        messName: 'Royal South & North Dining Hall',
        address: 'Building 7, Behind University Library',
        fssaiNumber: '11223344556603',
        description: 'Hygienic multi-cuisine mess serving hot dosas, sambar, and North Indian meals.',
        timings: { lunch: '11:45 AM - 02:45 PM', dinner: '07:15 PM - 09:45 PM' },
        menu: {
          lunch: ['Sambar', 'Veg Biryani', 'Paneer Do Pyaza', 'Porotta', 'Curd Rice', 'Payasam'],
          dinner: ['Dal Palak', 'Kadhai Paneer', 'Lemon Rice', 'Chapati', 'Appalam']
        },
        avgRating: 4.7,
        totalRatings: 15
      }
    ];

    const createdMesses = [];
    for (const mData of messesData) {
      const vendorUser = await User.create({
        name: mData.vendorName,
        email: mData.email,
        password: defaultPasswordHash,
        role: 'vendor',
        status: 'approved'
      });

      const mess = await Mess.create({
        vendor: vendorUser._id,
        name: mData.messName,
        address: mData.address,
        fssaiNumber: mData.fssaiNumber,
        description: mData.description,
        timings: mData.timings,
        menu: mData.menu,
        isOpen: true,
        isActive: true,
        avgRating: mData.avgRating,
        totalRatings: mData.totalRatings
      });

      createdMesses.push({ vendorUser, mess });
      console.log(`✓ Mess Partner created: ${mData.messName} (${mData.email} / Password123!)`);
    }

    // 5. Seed 10 Realistic Students Across Different States
    console.log('[Seed Script] 4. Seeding 10 Students Across Different Verification States...');
    const studentsData = [
      // 4 Active Subscribed Students
      {
        name: 'Aryan Sharma',
        email: 'aryan@college.edu',
        college: 'Delhi Technological University',
        hostelOrPg: 'Aryabhatta Hostel, Room 104',
        phone: '9876543210',
        status: 'approved',
        subscription: { mealsRemaining: 58, mealsUsed: 2 }
      },
      {
        name: 'Sneha Patel',
        email: 'sneha@college.edu',
        college: 'Netaji Subhas University of Technology',
        hostelOrPg: 'Kalpana Chawla Hostel',
        phone: '9876543211',
        status: 'approved',
        subscription: { mealsRemaining: 52, mealsUsed: 8 }
      },
      {
        name: 'Rohit Verma',
        email: 'rohit@college.edu',
        college: 'IIT Delhi',
        hostelOrPg: 'Karakoram Hostel, Room 312',
        phone: '9876543212',
        status: 'approved',
        subscription: { mealsRemaining: 45, mealsUsed: 15 }
      },
      {
        name: 'Ananya Rao',
        email: 'ananya@college.edu',
        college: 'Indira Gandhi Technical University',
        hostelOrPg: 'Stanza Living PG, Block C',
        phone: '9876543213',
        status: 'approved',
        subscription: { mealsRemaining: 60, mealsUsed: 0 } // Freshly subscribed
      },

      // 3 Approved Students Awaiting Subscription Payment
      {
        name: 'Karan Mehra',
        email: 'karan@college.edu',
        college: 'Delhi University (Hindu College)',
        hostelOrPg: 'North Campus PG No. 4',
        phone: '9876543214',
        status: 'approved',
        subscription: null
      },
      {
        name: 'Pooja Nair',
        email: 'pooja@college.edu',
        college: 'Jamia Millia Islamia',
        hostelOrPg: 'Zakir Husain Hostel',
        phone: '9876543215',
        status: 'approved',
        subscription: null
      },
      {
        name: 'Vikramaditya Roy',
        email: 'vikram@college.edu',
        college: 'IIIT Delhi',
        hostelOrPg: 'Boys Hostel 2',
        phone: '9876543216',
        status: 'approved',
        subscription: null
      },

      // 2 Pending Verification Students
      {
        name: 'Mohit Gupta',
        email: 'mohit@college.edu',
        college: 'Delhi University (Hansraj College)',
        hostelOrPg: 'Kamla Nagar PG',
        phone: '9876543217',
        status: 'pending',
        subscription: null
      },
      {
        name: 'Riya Sen',
        email: 'riya@college.edu',
        college: 'IP University',
        hostelOrPg: 'Dwarka Sector 14 PG',
        phone: '9876543218',
        status: 'pending',
        subscription: null
      },

      // 1 Rejected Student with Rejection Reason
      {
        name: 'Sameer Khan',
        email: 'sameer@college.edu',
        college: 'Amity University',
        hostelOrPg: 'Knowledge Park PG',
        phone: '9876543219',
        status: 'rejected',
        rejectionReason: 'Uploaded college ID was blurred and expired in 2024. Please re-register with valid 2026 proof.',
        subscription: null
      }
    ];

    for (const sData of studentsData) {
      const studentUser = await User.create({
        name: sData.name,
        email: sData.email,
        password: defaultPasswordHash,
        role: 'student',
        status: sData.status,
        rejectionReason: sData.rejectionReason || ''
      });

      await StudentProfile.create({
        user: studentUser._id,
        college: sData.college,
        hostelOrPg: sData.hostelOrPg,
        phone: sData.phone,
        idProofUrl: '/uploads/sample-student-id.png'
      });

      // If active subscription
      if (sData.subscription) {
        const orderId = `CMS_SUB_SEED_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const payment = await Payment.create({
          orderId,
          student: studentUser._id,
          amountPaise: 380000,
          currency: 'INR',
          status: 'success',
          cfPaymentId: `CF_SEED_${Date.now()}`,
          processedAt: new Date()
        });

        const cycleStartDate = new Date(Date.now() - 5 * 86400000);
        const cycleEndDate = new Date(Date.now() + 25 * 86400000);

        const sub = await Subscription.create({
          student: studentUser._id,
          payment: payment._id,
          orderId,
          cycleStartDate,
          cycleEndDate,
          totalMeals: 60,
          mealsUsed: sData.subscription.mealsUsed,
          mealsRemaining: sData.subscription.mealsRemaining,
          status: 'active'
        });

        // Seed sample check-ins for this student
        if (sData.subscription.mealsUsed > 0) {
          const mess = createdMesses[0].mess;
          for (let i = 1; i <= sData.subscription.mealsUsed; i++) {
            const dayNum = 10 + Math.floor(i / 2);
            const slot = i % 2 === 0 ? 'lunch' : 'dinner';
            await CheckIn.create({
              student: studentUser._id,
              mess: mess._id,
              vendor: mess.vendor,
              subscription: sub._id,
              mealSlot: slot,
              date: `2026-10-${String(dayNum).padStart(2, '0')}`,
              vendorRatePaise: 6000,
              status: 'allowed',
              isPaidOut: i <= 2 // some settled, some unsettled
            });
          }

          // Sample private rating
          await Rating.create({
            student: studentUser._id,
            mess: mess._id,
            rating: 5,
            comment: 'Fresh, warm rotis and great hygiene. Keep it up!'
          });
        }
      }

      console.log(`✓ Student created: ${sData.name} (${sData.email} / Password123!) - Status: ${sData.status}`);
    }

    console.log('\n=============================================');
    console.log('>>> DATABASE SEEDING COMPLETED SUCCESSFULLY <<<');
    console.log('1 Admin, 3 Messes, 10 Students initialized.');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
