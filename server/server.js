const express = require('express');
const { connectToDatabase } = require('./config/dbConfig'); // Import database connection
const app = express();
const cors = require('cors'); // Import CORS middleware
require('dotenv').config(); // Load environment variables from .env file
const port = parseInt(process.env.PORT, 10); // Convert environment variable to integer or default to 5000

app.use(cors({
  origin: process.env.FRONTEND_URL, // Allow your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow all HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow Content-Type and Authorization headers
  credentials: true // Allow cookies and credentials
}));

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Connect to the database
connectToDatabase().catch(err => {
  console.error('Failed to initialize the server due to database connection issues.');
  process.exit(1); // Exit the application if the database connection fails
});
app.get('/', (req, res) => {
  res.send('Backend server is running 🚀');
});

// Import and use routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notification');
const messageRoutes = require('./routes/message');
const adminRoutes = require('./routes/admin');
// New API Domains
const feedRoutes = require('./routes/feed');
const gamesRoutes = require('./routes/games');
const achievementsRoutes = require('./routes/achievements');
const leaderboardRoutes = require('./routes/leaderboard');
const ralliesRoutes = require('./routes/rallies');
const squadRoutes = require('./routes/squad');
const friendsRoutes = require('./routes/friends');
const settingsRoutes = require('./routes/settings');

// Mount routes under /api prefix for the frontend service layer
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// GET /api/trending - top games being played by the user's network
app.get('/api/trending', require('./middleware/authMiddleware').authenticateToken, async (req, res) => {
  const { pool } = require('./config/dbConfig');
  try {
    const result = await pool.query(`
      SELECT g."title", g."coverArtURL", COUNT(l."userID") AS "playerCount"
      FROM "library_entries" l
      JOIN "games" g ON l."appID" = g."appID"
      WHERE l."isCurrentlyPlaying" = TRUE
      GROUP BY g."appID", g."title", g."coverArtURL"
      ORDER BY "playerCount" DESC
      LIMIT 5
    `);
    res.json({ success: true, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// New API Endpoints
app.use('/api/feed', feedRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rallies', ralliesRoutes);
app.use('/api/squad', squadRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/settings', settingsRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});