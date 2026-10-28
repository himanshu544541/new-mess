const mongoose = require('mongoose');

// Mess schema representing a dining mess managed by a vendor
const messSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Mess name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Mess address is required'],
      trim: true
    },
    fssaiNumber: {
      type: String,
      required: [true, 'FSSAI licence number is required'],
      trim: true
    },
    description: {
      type: String,
      default: 'Homely hygienic meals cooked fresh daily for hostel & PG students.'
    },
    timings: {
      lunch: {
        type: String,
        default: '12:30 PM - 03:00 PM'
      },
      dinner: {
        type: String,
        default: '07:30 PM - 10:00 PM'
      }
    },
    menu: {
      lunch: {
        type: [String],
        default: ['Dal Makhani', 'Paneer Butter Masala', 'Steamed Rice', 'Butter Roti', 'Green Salad', 'Gulab Jamun']
      },
      dinner: {
        type: [String],
        default: ['Mix Veg Sabzi', 'Dal Tadka', 'Jeera Rice', 'Tawa Roti', 'Roasted Papad', 'Kheer']
      }
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    avgRating: {
      type: Number,
      default: 4.5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Mess', messSchema);
