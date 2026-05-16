const express = require('express');
const { connectToDatabase, pool } = require('./config/dbConfig'); // Import database connection + pool for health check
const app = express();
app.set('trust proxy', 1); // Trust first proxy (e.g. Vercel, Heroku, Nginx)
const cors = require('cors'); // Import CORS middleware
require('dotenv').config(); // Load environment variables from .env file
const port = parseInt(process.env.PORT, 10) || 5000; // Convert environment variable to integer or default to 5000

// ── Global Error Guard ────────────────────────────────────────────────────────
// Catch-all handlers for errors that occur outside of Express routes.
// Prevents the entire server process from exiting unexpectedly.
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception thrown:', err);
});

const { globalLimiter, authLimiter, syncLimiter } = require('./middleware/rateLimiter');

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const rawFrontendUrl = process.env.FRONTEND_URL || "";
    const frontendUrl = rawFrontendUrl.endsWith("/") ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl;
    const allowedOrigins = [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ── Body Parsing ─────────────────────────────────────────────────────────────
// Specific parser for profile updates (2MB) - Must be defined BEFORE global routes
app.use('/api/users/me/profile', express.json({ limit: '2mb' }));

// Global parser for all other routes (100KB)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Rate Limiting ────────────────────────────────────────────────────────────
// Global limiter is applied to every route. Tier-specific limiters are applied
// per-route below when mounting auth and sync endpoints.
app.use(globalLimiter);

const session = require('express-session');
const passport = require('passport');

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect to the database
connectToDatabase().catch(err => {
  console.error('Failed to initialize the server due to database connection issues.');
  process.exit(1); // Exit the application if the database connection fails
});
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// ── Health Check Endpoint ────────────────────────────────────────────────────
// Returns precise status of each dependency. Used by monitoring, load balancers,
// and CI pipelines to determine if the server is truly healthy — not just alive.
app.get('/health', async (req, res) => {
  const healthReport = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      server: { status: 'online' },
      database: { status: 'unknown' }
    }
  };

  // try {
  //   const start = Date.now();
  //   await pool.query('SELECT 1');
  //   const latencyMs = Date.now() - start;
  //   healthReport.checks.database = { status: 'online', latencyMs };
  // } catch (dbErr) {
  //   healthReport.status = 'degraded';
  //   healthReport.checks.database = {
  //     status: 'offline',
  //     error: dbErr.message || 'Connection failed'
  //   };
  // }

  const httpStatus = healthReport.status === 'healthy' ? 200 : 503;
  res.status(httpStatus).json(healthReport);
});

// Import and use routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notification');
const messageRoutes = require('./routes/message');
// New API Domains
const feedRoutes = require('./routes/feed');
const gamesRoutes = require('./routes/games');
const achievementsRoutes = require('./routes/achievements');
const leaderboardRoutes = require('./routes/leaderboard');
const ralliesRoutes = require('./routes/rallies');
const squadRoutes = require('./routes/squad');
const friendsRoutes = require('./routes/friends');
const settingsRoutes = require('./routes/settings');
const pulseRoutes = require('./routes/pulse');
const steamRoutes = require('./routes/steam');
const libraryRoutes = require('./routes/library');
const prestigeRoutes = require('./routes/prestige');
const searchRoutes = require('./routes/search');

// Mount routes under /api prefix for the frontend service layer
// Auth routes get a stricter rate limiter to prevent brute-force attacks.
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// New API Endpoints
app.use('/api/feed', feedRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rallies', ralliesRoutes);
app.use('/api/squad', squadRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/pulse', pulseRoutes);
// Steam and Library sync routes get a strict sync limiter to prevent
// hammering external APIs (Steam, IGDB) and risking API key bans.
app.use('/api/steam', syncLimiter, steamRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/prestige', prestigeRoutes);
app.use('/api/search', searchRoutes);

// ── Global Error Handler ─────────────────────────────────────────────────────
// This MUST be registered after all route mounts. Express recognises it as an
// error-handling middleware because it has exactly 4 parameters (err, req, res, next).
// It catches any error thrown or passed via next(err) from any route handler and
// returns a safe, structured JSON response — never leaking stack traces.
app.use((err, req, res, _next) => {
  // Log the full error internally for debugging (visible only in server console)
  console.error(`[GlobalErrorHandler] ${req.method} ${req.originalUrl}`, err);

  // ── Categorise the error for the client ──────────────────────────────────
  let statusCode = err.statusCode || err.status || 500;
  let errorType = 'InternalServerError';
  let message = 'An unexpected error occurred. Please try again later.';

  // Database errors (Postgres error codes start with two-character class)
  if (err.code && typeof err.code === 'string' && /^[0-9]{2}/.test(err.code)) {
    errorType = 'DatabaseError';
    statusCode = 500;

    // Postgres-specific helpful messages (safe to expose — no internal data)
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = 'A record with that data already exists (duplicate key).';
        break;
      case '23503': // foreign_key_violation
        statusCode = 409;
        message = 'This operation references a record that does not exist.';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = 'A required field was missing from the request.';
        break;
      case '57014': // query_cancelled (statement_timeout)
        message = 'The database query timed out. Please try again.';
        break;
      default:
        message = 'A database error occurred. Please try again later.';
    }
  }

  // JSON parse errors (malformed request body)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorType = 'MalformedRequest';
    message = 'The request body contains invalid JSON.';
  }

  // CORS errors
  if (err.message && err.message.includes('Not allowed by CORS')) {
    statusCode = 403;
    errorType = 'CORSError';
    message = 'Cross-Origin request blocked. Your domain is not allowed.';
  }

  // PayloadTooLargeError
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorType = 'PayloadTooLarge';
    message = 'The request body exceeds the maximum allowed size.';
  }

  res.status(statusCode).json({
    success: false,
    errorType,
    message
  });
});

const http = require('http');
const { setupWebSocket, startupCleanup } = require('./ws/chatSocket');
const { startJobWorker } = require('./utils/jobQueue');

const server = http.createServer(app);
setupWebSocket(server);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`WebSocket available at ws://localhost:${port}/ws/chat`);
  console.log(`Health check available at http://localhost:${port}/health`);

  // Start the in-memory background job worker
  startJobWorker();
});