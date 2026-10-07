// routes/authRoutes.js
// URL paths for authentication. All public — the auth middleware is NOT
// applied here because these are the endpoints that CREATE the session.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, me, updateProfile, changePassword, deleteAccount } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

// These need a valid token: "me" restores a session, profile/password
// let a logged-in user manage their own account, and account deletion
// removes the user and all of their data permanently.
router.get('/me', auth, me);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);
router.delete('/account', auth, deleteAccount);

module.exports = router;
