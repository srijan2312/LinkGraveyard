// middleware/errorHandler.js
// Last stop for any error thrown inside a route. We log the technical
// details on the server but send the USER a safe, friendly message —
// never a stack trace or raw MongoDB error.

function errorHandler(err, req, res, next) {
  console.error('Server error:', err);

  // Duplicate key (e.g. user tried to save the same URL twice).
  if (err.code === 11000) {
    return res.status(409).json({ message: 'This URL is already saved in your collection.' });
  }

  // Mongoose validation errors (missing/invalid fields).
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages[0] || 'Invalid data provided.' });
  }

  // A malformed Mongo ObjectId, e.g. GET /api/links/abc123.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid link id.' });
  }

  res.status(err.status || 500).json({
    message: err.expose ? err.message : 'Something went wrong on our side. Please try again.',
  });
}

module.exports = errorHandler;
