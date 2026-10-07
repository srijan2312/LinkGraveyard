// models/User.js
// One document per registered user. Passwords are NEVER stored as plain text:
// the pre-save hook hashes the password with bcrypt before it reaches MongoDB.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // two accounts cannot share one email
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by queries unless explicitly requested
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

// Runs automatically before a user document is saved.
// "isModified" check skips re-hashing when the password didn't change
// (e.g. when the user only updates their name).
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10); // cost factor 10: strong enough, fast enough
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper used at login: compare a typed password against the stored hash.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove the password from anything we serialize to JSON, even if it was
// loaded with select('+password') during login.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
