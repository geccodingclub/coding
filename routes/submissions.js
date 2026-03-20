const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Create a submission (Student)
router.post('/', auth, async (req, res) => {
  try {
    const { contestId, proofUrl } = req.body;
    
    // Check if contest exists
    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    // Check if user already submitted for this contest
    const existing = await Submission.findOne({ user: req.user._id, contest: contestId });
    if (existing) {
      // they can update their proof if it's still pending or rejected
      if (existing.status === 'APPROVED') {
        return res.status(400).json({ message: 'Your previous submission is already approved.' });
      }
      existing.proofUrl = proofUrl;
      existing.status = 'PENDING'; // reset back to pending for review
      await existing.save();
      return res.json(existing);
    }

    const submission = new Submission({
      user: req.user._id,
      contest: contestId,
      proofUrl
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current user's submissions
router.get('/me', auth, async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .populate('contest', 'title pointsReward platformLink startDate endDate')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all submissions for a contest, or all pending submissions
router.get('/', auth, authorize('PRESIDENT', 'VOLUNTEER'), async (req, res) => {
  try {
    const { contestId, status } = req.query;
    let query = {};
    if (contestId) query.contest = contestId;
    if (status) query.status = status;

    const submissions = await Submission.find(query)
      .populate('user', 'name rollNo department')
      .populate('contest', 'title pointsReward')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update submission status
router.put('/:id/status', auth, authorize('PRESIDENT', 'VOLUNTEER'), async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const submission = await Submission.findById(req.params.id).populate('contest');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Ensure we don't award points twice
    if (submission.status !== 'APPROVED' && status === 'APPROVED') {
      const user = await User.findById(submission.user);
      if (user) {
        user.points = (user.points || 0) + submission.contest.pointsReward;
        await user.save();
      }
    } else if (submission.status === 'APPROVED' && status !== 'APPROVED') {
      // Reverting an approval
      const user = await User.findById(submission.user);
      if (user) {
        user.points = Math.max(0, (user.points || 0) - submission.contest.pointsReward);
        await user.save();
      }
    }

    submission.status = status;
    submission.reviewNotes = reviewNotes || '';
    submission.reviewedBy = req.user._id;
    await submission.save();

    res.json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
