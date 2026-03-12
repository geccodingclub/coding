const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Request logging removed for cleaner terminal output
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Deployment status: ACTIVE');
});
