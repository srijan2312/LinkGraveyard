// middleware/auth.js
// Protects private routes. Every request must carry a JWT in the
// Authorization header ("Bearer <token>"). The token tells us WHO the user
// is — we never trust a user id sent by the frontend in the request body.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  const header = req.headers.authorization || '';

  // The expected format is exactly: Bearer <token>
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated. Please log in.' });
  }

  const token = header.slice(7);

  try {
    // jwt.verify fails if the token was tampered with, signed with the
    // wrong secret, or has expired. The payload contains only { id } —
    // we deliberately put nothing else (no passwords, no emails).
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists. Please log in again.' });
    }

    // Attach the user to the request so controllers can use req.user.id.
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // The frontend watches for this exact message and sends the user
      // back to the login page gracefully.
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid session. Please log in again.' });
  }
}

module.exports = auth;
