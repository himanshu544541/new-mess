const mongoose = require('mongoose');

// Student profile for college, hostel/PG verification & uploaded proof
const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true
    },
    hostelOrPg: {
      type: String,
      required: [true, 'Hostel or PG name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    idProofUrl: {
      type: String,
      required: [true, 'Proof of identity/residence file is required']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);

