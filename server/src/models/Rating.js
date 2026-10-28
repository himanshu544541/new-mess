const mongoose = require('mongoose');

// Private student mess rating
// Privacy: Only Admin sees individual reviews & comments.
// Mess owners and the public only see the aggregated avgRating.
const ratingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mess: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// One student can rate a mess once (upsert on review)
ratingSchema.index({ student: 1, mess: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);

