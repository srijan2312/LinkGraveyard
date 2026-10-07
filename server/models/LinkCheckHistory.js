// models/LinkCheckHistory.js
// A lightweight record of every status check performed on a link.
// This powers the "Link History" feature — users can see how a link's
// health changed over time (e.g. healthy in June, redirected in August,
// broken in September).

const mongoose = require('mongoose');

const linkCheckHistorySchema = new mongoose.Schema(
  {
    // Which link this check belongs to.
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },

    // The user is stored too so history can be queried fast without
    // joining through the Link collection for the "Link History" page.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['healthy', 'redirected', 'broken', 'never_checked'],
      required: true,
    },

    httpStatus: {
      type: Number,
      default: null,
    },

    finalUrl: {
      type: String,
      default: null,
    },

    responseTime: {
      type: Number,
      default: null,
    },

    // Human-readable reason for failure, e.g. "Request timed out" or
    // "404 Not Found". Shown in the UI so users understand the result.
    errorMessage: {
      type: String,
      default: null,
    },

    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Newest-first is the most common access pattern, so index for it.
linkCheckHistorySchema.index({ link: 1, checkedAt: -1 });

module.exports = mongoose.model('LinkCheckHistory', linkCheckHistorySchema);
