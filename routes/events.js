const express = require('express');
const { sendEmail } = require('../utils/mailer');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all launched events (Public)
router.get('/public', async (req, res) => {
  try {
    const events = await Event.find({ isLaunched: true })
      .populate('organizer', 'name')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name').sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event (President only)
router.post('/', auth, authorize('PRESIDENT'), async (req, res) => {
  const event = new Event({
    ...req.body,
    organizer: req.user._id
  });

  try {
    await event.save();
    
    // Notify all registered users via email
    const users = await User.find({}, 'email');
    const emails = users.map(u => u.email);

    if (emails.length > 0) {
      try {
        await sendEmail(
          emails,
          `New Event: ${event.title}`,
          `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2563eb;">New Event Alert!</h2>
              <p><strong>${event.title}</strong> has been scheduled.</p>
              <p>${event.description}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <br/>
              <a href="https://coding-club-chi.vercel.app/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Event on Dashboard</a>
              <br/><br/>
              <p>See you there!</p>
              <p><em>Coding Club GEC Bhojpur</em></p>
            </div>
          `,
          true // Use BCC
        );
      } catch (err) {
        console.error('CRITICAL: Failed to send event broadcast email:', err);
      }
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update event (President only)
router.patch('/:id', auth, authorize('PRESIDENT'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete event (President only)
router.delete('/:id', auth, authorize('PRESIDENT'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle Launch Status (President only)
router.patch('/launch/:id', auth, authorize('PRESIDENT'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    event.isLaunched = !event.isLaunched;
    // Auto-update status when launching
    if (event.isLaunched && event.status === 'DRAFT') {
      event.status = 'UPCOMING';
    }
    
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
