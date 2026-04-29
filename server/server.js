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

const session = require('express-session');
const passport = require('passport');

app.use(session({
    secret: process.env.JWT_SECRET || 'fallback_session_secret',
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
const pulseRoutes = require('./routes/pulse');
const steamRoutes = require('./routes/steam');
const libraryRoutes = require('./routes/library');
const prestigeRoutes = require('./routes/prestige');

// Mount routes under /api prefix for the frontend service layer
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);


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
app.use('/api/steam', steamRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/prestige', prestigeRoutes);

const http = require('http');
const { setupWebSocket } = require('./ws/chatSocket');

const server = http.createServer(app);
setupWebSocket(server);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`WebSocket available at ws://localhost:${port}/ws/chat`);
});