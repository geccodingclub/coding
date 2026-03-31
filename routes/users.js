const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');
const router = express.Router();

// Get profile
router.get('/profile', auth, async (req, res) => {
  const user = req.user;
  if (user.isProfileComplete === false && user.rollNo && user.department && user.year && user.phoneNumber) {
    user.isProfileComplete = true;
    await user.save();
  }
  res.json(user);
});

// President/Volunteer: Get students for verification
router.get('/all', auth, authorize('VOLUNTEER', 'PRESIDENT'), async (req, res) => {
  try {
    let query = { role: 'STUDENT' };
    
    // Volunteers only see students from their own year
    if (req.user.role === 'VOLUNTEER') {
      query.year = req.user.year;
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// President/Volunteer: Verify a student
router.patch('/verify/:id', auth, authorize('VOLUNTEER', 'PRESIDENT'), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Volunteers can only verify students in their own year
    if (req.user.role === 'VOLUNTEER' && targetUser.year !== req.user.year) {
      return res.status(403).json({ message: 'You can only verify students from your own year' });
    }

    targetUser.isVerified = true;
    await targetUser.save();

    // Send Approval Email
    try {
      await sendEmail(
        targetUser.email,
        'Account Approved - Cortex',
        `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Your Account is Active!</h2>
            <p>Hi ${targetUser.name},</p>
            <p>Your registration for the <strong>Cortex</strong> has been approved.</p>
            <p>You can now log in to the dashboard to view upcoming events and access club resources.</p>
            <br/>
            <a href="https://coding-club-chi.vercel.app/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
            <br/><br/>
            <p>Welcome aboard!</p>
            <p><em>Cortex GEC Bhojpur</em></p>
          </div>
        `
      );
    } catch (err) {
      console.error('Failed to send approval email:', err);
    }

    res.json(targetUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// President only: Get all users for role management
router.get('/members', auth, authorize('PRESIDENT'), async (req, res) => {
  try {
    const users = await User.find({}).sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// President only: Assign roles (with quota check for volunteers)
router.post('/assign-role', auth, authorize('PRESIDENT'), async (req, res) => {
  const { userId, role } = req.body;
  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (role === 'VOLUNTEER') {
      // Check if this year already has 2 volunteers
      const volunteerCount = await User.countDocuments({ role: 'VOLUNTEER', year: targetUser.year });
      if (volunteerCount >= 2) {
        return res.status(400).json({ message: `Year ${targetUser.year} already has 2 volunteers` });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    // Send Promotion Email
    try {
      await sendEmail(
        targetUser.email,
        'Role Updated - Cortex',
        `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">Role Update Notification</h2>
            <p>Hi ${targetUser.name},</p>
            <p>Your role in the <strong>Cortex</strong> has been updated to: <strong>${role}</strong>.</p>
            <p>Your dashboard has been updated with new permissions corresponding to your role.</p>
            <br/>
            <a href="https://coding-club-chi.vercel.app/" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
            <br/><br/>
            <p>Keep up the great work!</p>
            <p><em>Cortex GEC Bhojpur</em></p>
          </div>
        `
      );
    } catch (err) {
      console.error('Failed to send promotion email:', err);
    }

    res.json(targetUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Authenticated: Get all verified members for directory (Protected)
router.get('/verified-directory', auth, async (req, res) => {
  try {
    const users = await User.find({ isVerified: true })
      .select('name rollNo department year role profilePhoto')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public: Get club statistics
router.get('/public-stats', async (req, res) => {
  try {
    const verifiedCount = await User.countDocuments({ isVerified: true });
    res.json({ verifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Authenticated: Update own profile
router.patch('/profile', auth, async (req, res) => {
  const { name, phoneNumber, profilePhoto, rollNo, department, year } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (rollNo) user.rollNo = rollNo;
    if (department) user.department = department;
    if (year) user.year = parseInt(year);
    
    if (profilePhoto && profilePhoto.startsWith('data:image')) {
      const { uploadImage } = require('../utils/cloudinary');
      user.profilePhoto = await uploadImage(profilePhoto);
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find({ isVerified: true, points: { $gt: 0 } })
      .select('name rollNo department year points profilePhoto')
      .sort({ points: -1 })
      .limit(100);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user progress (rank and points)
router.get('/progress', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('points');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Calculate rank
    const higherRankCount = await User.countDocuments({ 
      isVerified: true, 
      points: { $gt: user.points } 
    });
    
    res.json({
      points: user.points || 0,
      rank: user.points > 0 ? higherRankCount + 1 : 'Unranked'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
