// config/db.js
// Keeps the MongoDB connection logic in one place so server.js stays readable.

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  }

  // mongoose.connect returns a promise; we await it so server startup
  // only continues once the database is actually reachable.
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = connectDB;
