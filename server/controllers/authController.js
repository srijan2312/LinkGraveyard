// controllers/authController.js
// Handles registration and login. The full JWT flow:
//   register/login -> verify identity -> sign a token with JWT_SECRET ->
//   frontend stores the token -> sends it on every request -> auth middleware
//   verifies it and loads the user.

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Link = require('../models/Link');
const LinkCheckHistory = require('../models/LinkCheckHistory');

// How long a login session lasts before the user must log in again.
const TOKEN_TTL = '7d';

// Create a signed token containing ONLY the user's id.
// Nothing secret goes inside the payload — the signature is what matters.
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// POST /api/auth/register  { name, email, password }
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Basic input validation. (Frontend validates too, but the backend must
    // never trust the frontend — anyone can call this API directly.)
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // The password is hashed by the pre-save hook in the User model.
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = signToken(user._id);

    // toJSON removes the password, so user is safe to send.
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login  { email, password }
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // password is select:false in the schema, so we explicitly include it
    // here — only for this one comparison, never returned to the client.
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      // Explicit message (instead of a vague "invalid credentials") so users
      // understand what went wrong. Trade-off: it lets someone probe which
      // emails have accounts — accepted here for a friendlier login UX.
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = signToken(user._id);

    // toJSON strips the password field before sending.
    const safeUser = user.toJSON();
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me  (requires auth)
// Lets the frontend restore the logged-in session from a stored token
// without asking the user to log in again on every page refresh.
async function me(req, res, next) {
  try {
    // req.user was set by the auth middleware (already verified).
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/profile  (requires auth)  { name }
async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty.' });
    }
    req.user.name = name.trim();
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/password  (requires auth)  { currentPassword, newPassword }
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // hashed automatically by the pre-save hook
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/auth/account  (requires auth)
// Permanently deletes the user AND everything they own: links and check
// history. Order matters: delete the dependent data first, then the user.
// There is intentionally no "undo" — the frontend requires the user to
// type their email to confirm, so this only runs on deliberate action.
async function deleteAccount(req, res, next) {
  try {
    const userId = req.user._id;

    await LinkCheckHistory.deleteMany({ user: userId });
    await Link.deleteMany({ user: userId });
    await User.deleteOne({ _id: userId });

    // The JWT is now useless (its user no longer exists), so the frontend
    // just clears it locally — no server-side session to destroy.
    res.json({ message: 'Your account and all its data have been permanently deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateProfile, changePassword, deleteAccount };
