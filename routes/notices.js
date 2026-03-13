const express = require('express');
const { sendEmail } = require('../utils/mailer');
const Notice = require('../models/Notice');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all notices (Authenticated members)
router.get('/', auth, async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('author', 'name role')
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create and broadcast notice (President only)
router.post('/fire-up', auth, authorize('PRESIDENT'), async (req, res) => {
  const { title, content, isImportant } = req.body;
  
  const notice = new Notice({
    title,
    content,
    isImportant,
    author: req.user._id
  });

  try {
    await notice.save();
    
    // Broadcast to every verified member
    const users = await User.find({ isVerified: true }, 'email');
    const emails = users.map(u => u.email);

    if (emails.length > 0) {
      try {
        await sendEmail(
          emails,
          `NOTICE: ${title}`,
          `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #f8fafc;">
              <h2 style="color: #ef4444; text-transform: uppercase;">${isImportant ? '⚠️ Urgent Notice' : '📢 Official Notice'}</h2>
              <h3 style="color: #1e293b;">${title}</h3>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">${content}</p>
              <br/>
              <div style="padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Broadcasted by: <strong>${req.user.name}</strong></p>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Role: President</p>
              </div>
              <br/>
              <a href="https://coding-club-chi.vercel.app/notices" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Read on Dashboard</a>
            </div>
          `,
          true // Use BCC for mass broadcast
        );
      } catch (err) {
        console.error('CRITICAL: Notice broadcast email failed:', err);
      }
    }

    res.status(201).json(notice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete notice (President only)
router.delete('/:id', auth, authorize('PRESIDENT'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json({ message: 'Notice retracted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
