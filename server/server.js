// server.js
// Entry point of the LinkGraveyard backend.
// Wiring order matters: load env -> connect DB -> create app -> mount routes.

// .env lives at the project root (see .env.example); server.js is one
// level down, so we point dotenv at it explicitly.
// Load environment variables from the .env file in the server folder.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const linkRoutes = require('./routes/linkRoutes');
const errorHandler = require('./middleware/errorHandler');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB. If the database is unreachable we stop the process
// right away — there is no point serving an API that cannot store anything.
connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB. Check your MONGODB_URI in .env');
  console.error(err.message);
  process.exit(1);
});

const app = express();

// Parse JSON request bodies (all our APIs speak JSON).
app.use(express.json());

// CORS: only allow the frontend origin(s) listed in .env.
// If FRONTEND_URL is not set we fall back to the Vite dev server address.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Public API routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);

// A tiny health endpoint — handy for checking the server is alive.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'linkgraveyard-api' });
});

// In production, serve the built React app from the same server.
// (client/dist is created by `npm run build` inside the client folder.
// In development this block is skipped — Vite serves the frontend.)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));
  // React Router handles its own routes, so any non-API path falls back
  // to index.html. This must come AFTER the /api routes above.
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Everything below this line is error handling middleware.
// express notices it because it has 4 parameters (err, req, res, next).
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`LinkGraveyard API running on port ${PORT}`);
});

// Exporting the app lets tests use supertest without binding a real port.
module.exports = app;
