const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail, verifyConnection } = require('../utils/mailer');
const { uploadImage } = require('../utils/cloudinary');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    // console.log('Registration attempt:', req.body); // Removed for security
    const { name, email, password, rollNo, department, year, phoneNumber, profilePhoto } = req.body;

    // Backend Validation
    if (!name || !email || !password || !rollNo || !department || !year || !phoneNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    let photoUrl = '';
    if (profilePhoto) {
      photoUrl = await uploadImage(profilePhoto);
    }

    const isHod = email.toLowerCase() === 'vijeshkumarpatel4@gmail.com';

    const user = new User({ 
      name, 
      email, 
      password, 
      rollNo, 
      department, 
      year, 
      phoneNumber, 
      profilePhoto: photoUrl,
      role: isHod ? 'PRESIDENT' : 'STUDENT',
      isVerified: true
    });
    await user.save();

    // Send Welcome Email
    try {
      await sendEmail(
        user.email,
        'Welcome to Coding Club!',
        `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
            <h2 style="color: #2563eb;">Welcome, ${user.name}!</h2>
            <p>You have successfully registered for the <strong>Coding Club GEC Bhojpur</strong>.</p>
            <p style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <strong>Your Access Credentials:</strong><br/>
              Email: ${user.email}<br/>
              Password: <code style="background: #e2e8f0; padding: 2px 4px; rounded: 3px;">${password}</code>
            </p>
            <p>Your account is <strong style="color: #16a34a;">Active</strong>. You now have full access to all club projects, repositories, and events.</p>
            <br/>
            <a href="https://coding-club-chi.vercel.app/login" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Access Dashboard</a>
            <br/><br/>
            <p>Happy Coding!</p>
            <p><em>Coding Club GEC Bhojpur</em></p>
          </div>
        `
      );
    } catch (err) {
      console.error('CRITICAL: Failed to send welcome email:', err);
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check Email System Status
router.get('/email-status', async (req, res) => {
  try {
    const result = await verifyConnection();
    if (result.success) {
      res.json({ status: 'ready', message: 'Brevo API is initialized and ready' });
    } else {
      res.status(500).json({ status: 'error', message: 'Brevo API Initialization Failed', details: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Contact Form Endpoint
router.post('/contact', async (req, res) => {
  try {
    const { name, userEmail, subject, message } = req.body;
    
    if (!name || !userEmail || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required for transmission' });
    }

    // Send email to club admin
    await sendEmail(
      process.env.EMAIL_USER || 'geccodingclub@gmail.com',
      `[CONTACT_UPLINK] ${subject}`,
      `
        <div style="font-family: monospace; padding: 20px; background-color: #0f172a; color: #f1f5f9; border: 1px solid #1e293b; border-radius: 12px;">
          <h2 style="color: #3b82f6; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">Contact_Form_Submission</h2>
          <p><strong>Codename:</strong> ${name}</p>
          <p><strong>Uplink_Email:</strong> ${userEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #1e293b; border-radius: 8px;">
            <strong>Message_Data:</strong><br/>
            ${message.replace(/\n/g, '<br/>')}
          </div>
          <p style="margin-top: 20px; font-size: 10px; color: #64748b;">SYSTEM: CONTACT_API_V1.0</p>
        </div>
      `
    );

    res.json({ success: true, message: 'Transmission Successful' });
  } catch (error) {
    console.error('CONTACT_ERROR:', error);
    res.status(500).json({ message: 'Uplink Failed. System offline.' });
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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ user, token });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
