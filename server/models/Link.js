// models/Link.js
// A saved URL belonging to one user. This is the central document of the app.

const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    // The user who owns this link. Never taken from the request body —
    // controllers always fill it from the authenticated JWT payload.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    // Kept as a plain string on purpose. A separate Category collection
    // would add joins and complexity without real benefit for one user.
    category: {
      type: String,
      trim: true,
      default: 'Other',
      maxlength: 60,
    },

    tags: {
      type: [String],
      default: [],
    },

    // One of: 'healthy' | 'redirected' | 'broken' | 'never_checked'.
    // 'never_checked' is the default for links that have never been checked.
    status: {
      type: String,
      enum: ['healthy', 'redirected', 'broken', 'never_checked'],
      default: 'never_checked',
    },

    httpStatus: {
      type: Number,
      default: null,
    },

    // Where the URL redirected to (only meaningful when status is 'redirected').
    // The ORIGINAL url is never overwritten — redirect history is part of the
    // product's concept ("preserve the original URL").
    finalUrl: {
      type: String,
      default: null,
    },

    responseTime: {
      type: Number, // milliseconds
      default: null,
    },

    lastChecked: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent accidental duplicates: one user cannot save the same URL twice.
// NOTE: this index compares the exact string. "https://x.com" and
// "https://x.com/" are technically different strings, so controllers
// normalize URLs (trim, remove trailing slash) before saving.
linkSchema.index({ user: 1, url: 1 }, { unique: true });

module.exports = mongoose.model('Link', linkSchema);
