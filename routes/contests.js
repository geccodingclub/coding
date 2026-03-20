const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

// Get all contests
router.get('/', auth, async (req, res) => {
  try {
    const contests = await Contest.find().sort({ startDate: -1 }).populate('createdBy', 'name');
    res.json(contests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single contest
router.get('/:id', auth, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate('createdBy', 'name');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    res.json(contest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create contest (Admin only)
router.post('/', auth, authorize('PRESIDENT', 'VOLUNTEER'), async (req, res) => {
  try {
    const { title, description, platformLink, pointsReward, startDate, endDate } = req.body;
    
    const contest = new Contest({
      title,
      description,
      platformLink,
      pointsReward,
      startDate,
      endDate,
      createdBy: req.user._id
    });

    await contest.save();

    // Send email to all verified users asynchronously
    // try {
    //   const users = await User.find({ isVerified: true }).select('email name');
    //   const emailPromises = users.map(u => 
    //     sendEmail(
    //       u.email,
    //       `New Challenge: ${title} - Coding Club`,
    //       `
    //         <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0f172a; color: #f1f5f9;">
    //           <h2 style="color: #3b82f6; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">New Challenge Deployed: ${title}</h2>
    //           <p>Hi ${u.name},</p>
    //           <p>A new coding challenge has been launched! Head over to the platform, solve the problem, and submit your proof to earn points and climb the leaderboard.</p>
              
    //           <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
    //             <p style="margin-top: 0;"><strong>Description:</strong><br/>${description}</p>
    //             <p><strong>Reward:</strong> ${pointsReward} Points</p>
    //             <p style="margin-bottom: 0;"><strong>Deadline:</strong> ${new Date(endDate).toLocaleString()}</p>
    //           </div>
              
    //           <a href="${platformLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Attempt Challenge on Platform</a>
              
    //           <p style="margin-top: 30px;">Once completed, don't forget to submit your proof on the <a href="https://coding-club-chi.vercel.app/contests" style="color: #3b82f6;">Contests Dashboard</a>.</p>
              
    //           <br/>
    //           <p style="font-size: 12px; color: #64748b;"><em>Coding Club GEC Bhojpur • Automated Delivery System</em></p>
    //         </div>
    //       `
    //     ).catch(err => console.error(`Failed to send email to ${u.email}:`, err))
    //   );
      
    //   Promise.all(emailPromises);
    // } catch (emailErr) {
    //   console.error('Error fetching users for contest broadcast:', emailErr);
    // }

    res.status(201).json(contest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update contest (Admin only)
router.put('/:id', auth, authorize('PRESIDENT', 'VOLUNTEER'), async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    res.json(contest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete contest (Admin only)
router.delete('/:id', auth, authorize('PRESIDENT', 'VOLUNTEER'), async (req, res) => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    res.json({ message: 'Contest deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
