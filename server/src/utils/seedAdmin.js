const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/centralized_mess');
    console.log('[Seed] Connected to MongoDB');

    const adminEmail = 'admin@centralmess.in';
    const existing = await User.findOne({ email: adminEmail });

    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('AdminPassword123!', salt);

      const adminUser = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'approved'
      });

      console.log(`[Seed] Admin user created: ${adminUser.email}`);
    } else {
      console.log(`[Seed] Admin user already exists: ${existing.email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedAdmin();

