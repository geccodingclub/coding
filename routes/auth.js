const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    // console.log('Registration attempt:', req.body); // Removed for security
    const { name, email, password, collegeId, department, year } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, password, collegeId, department, year });
    await user.save();

    // Send Welcome Email
    sendEmail(
      user.email,
      'Welcome to Coding Club!',
      `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${user.name}!</h2>
          <p>You have successfully registered for the <strong>Coding Club</strong>.</p>
          <p>Your account is currently <strong>Pending Review</strong>. A volunteer or president will verify your details shortly.</p>
          <p>Once verified, you will have access to all club projects, repositories, and events.</p>
          <br/>
          <p>Happy Coding!</p>
          <p><em>Coding Club GEC Bhojpur</em></p>
        </div>
      `
    ).catch(err => console.error('Failed to send welcome email:', err));

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (!process.env.JWT_SECRET) {
      console.error('ERROR: JWT_SECRET is not defined in environment variables.');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET missing' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ user, token });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
