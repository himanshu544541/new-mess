const mongoose = require('mongoose');

// Platform-wide dynamic configuration stored in database (never hardcoded)
// All monetary values stored in integer paise
const configSchema = new mongoose.Schema(
  {
    studentMonthlyFeePaise: {
      type: Number,
      default: 380000 // ₹3,800.00
    },
    mealsPerMonth: {
      type: Number,
      default: 60 // 2 meals a day * 30 days
    },
    cycleDays: {
      type: Number,
      default: 30
    },
    vendorRatePerMealPaise: {
      type: Number,
      default: 6000 // ₹60.00 per meal served
    },
    platformFeePerMealPaise: {
      type: Number,
      default: 333 // ₹3.33 platform margin (~₹199.8 / student / mo)
    },
    oldSingleMessComparisonRatePaise: {
      type: Number,
      default: 5833 // ₹58.33 per meal (₹3,500 / month)
    },
    gatewayFeePercent: {
      type: Number,
      default: 2.0 // 2% editable payment gateway estimate
    },
    mealSlots: {
      type: [
        {
          slot: { type: String, enum: ['lunch', 'dinner'], required: true },
          name: { type: String, required: true },
          startTime: { type: String, default: '12:00' },
          endTime: { type: String, default: '15:30' }
        }
      ],
      default: [
        { slot: 'lunch', name: 'Lunch', startTime: '12:00', endTime: '15:30' },
        { slot: 'dinner', name: 'Dinner', startTime: '19:30', endTime: '22:30' }
      ]
    }
  },
  {
    timestamps: true
  }
);

// Singleton helper to get or initialize system config
configSchema.statics.getSystemConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('Config', configSchema);

