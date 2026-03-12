const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Request logging removed for cleaner terminal output
app.use(express.json());

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
  console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables.');
}

mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/coding-club')
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // On Render, we should let the app start even if DB fails initially 
    // to avoid "exited early" errors, then handle DB errors per request.
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Deployment status: ACTIVE');
});
