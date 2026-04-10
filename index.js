const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true, 
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Middleware
app.use(cors());
app.use('/api', limiter); // Apply rate limiter to all API routes
// Request logging removed for cleaner terminal output
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/contests', require('./routes/contests'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/codeit', require('./routes/codeit'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({ message: err.message });
});

const PORT = process.env.PORT || 5001;

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL ERROR: MONGODB_URI is not defined.');
}

// Disable buffering so we get immediate errors if not connected
mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/coding-club', {
  serverSelectionTimeoutMS: 5000, // Fail fast if Atlas is unreachable
})
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch(err => console.error('Initial MongoDB connection error:', err));

// Log connection events
mongoose.connection.on('connected', () => console.log('Mongoose connected to DB Cluster'));
mongoose.connection.on('error', (err) => console.error('Mongoose runtime error:', err));
mongoose.connection.on('disconnected', () => console.warn('Mongoose disconnected from DB Cluster'));

const { verifyConnection } = require('./utils/mailer');
const { startDailyChallengeCron } = require('./utils/dailyChallenge');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Deployment status: ACTIVE');
  verifyConnection();
  startDailyChallengeCron();
});
