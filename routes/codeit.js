const express = require('express');
const CodeItRegistration = require('../models/CodeItRegistration');
const { auth } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');
const QRCode = require('qrcode');
const router = express.Router();

// Register for CodeIt (authenticated users only)
router.post('/register', auth, async (req, res) => {
  try {
    const { registrationNumber, programmingLanguage, usedHackerRank } = req.body;

    // Validate
    if (!registrationNumber || !programmingLanguage || !usedHackerRank) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if already registered
    const existing = await CodeItRegistration.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You are already registered for CodeIt.' });
    }

    // Check deadline (April 10, 2026 23:59:59 IST)
    const deadline = new Date('2026-04-10T23:59:59+05:30');
    if (new Date() > deadline) {
      return res.status(400).json({ message: 'Registration deadline has passed.' });
    }

    const registration = new CodeItRegistration({
      user: req.user._id,
      registrationNumber,
      programmingLanguage,
      usedHackerRank,
    });

    await registration.save();

    await registration.save();

    let qrAttachments = null;
    let qrHtmlAddition = '';
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(registration._id.toString(), {
        color: { dark: '#000000', light: '#ffffff' },
        width: 300,
        margin: 2
      });
      const base64Data = qrCodeDataUrl.split(',')[1];
      qrAttachments = [{
        content: base64Data,
        name: 'CodeIt_EntryTicket.png'
      }];
      qrHtmlAddition = `
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 16px; margin: 24px 0 0; text-align: center;">
          <p style="margin: 0; color: #3b82f6; font-size: 14px; font-weight: bold;">🎟️ Entry Ticket Attached</p>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.6); font-size: 12px; line-height: 1.5;">
            We have attached your unique QR Code ticket to this email. Please download it or keep it ready on your phone to scan at the entry desk on the day of the event.
          </p>
        </div>
      `;
    } catch (qrErr) {
      console.error('[CODEIT] Failed to generate QR Code:', qrErr);
    }

    // Send confirmation email
    try {
      await sendEmail(
        req.user.email,
        'CodeIt Registration Confirmed — CORTEX',
        `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #050505; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0a0a0a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                Code<span style="color: #3b82f6;">It</span>
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 3px;">
                Registration Confirmed
              </p>
            </div>

            <!-- Body -->
            <div style="padding: 30px;">
              <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Hi <strong style="color: #ffffff;">${req.user.name}</strong>,
              </p>
              <p style="color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                You have been successfully registered for <strong style="color: #3b82f6;">CodeIt</strong> — the ultimate coding competition by CORTEX, GEC Bhojpur.
              </p>

              <!-- Details Card -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.3);">Your Registration Details</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);">Name</td>
                    <td style="padding: 8px 0; color: #ffffff; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">${req.user.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);">Email</td>
                    <td style="padding: 8px 0; color: #ffffff; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">${req.user.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);">Roll No.</td>
                    <td style="padding: 8px 0; color: #ffffff; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">${req.user.rollNo}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);">Branch</td>
                    <td style="padding: 8px 0; color: #ffffff; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">${req.user.department}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);">Reg. No.</td>
                    <td style="padding: 8px 0; color: #ffffff; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">${registrationNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);">Language</td>
                    <td style="padding: 8px 0; color: #3b82f6; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">${programmingLanguage}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255,255,255,0.4);">Platform</td>
                    <td style="padding: 8px 0; color: #ffffff; text-align: right; font-weight: 600;">HackerRank</td>
                  </tr>
                </table>
              </div>

              <!-- Important Note -->
              <div style="background: rgba(251, 146, 60, 0.05); border: 1px solid rgba(251, 146, 60, 0.15); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: rgba(251, 146, 60, 0.8); font-size: 12px; line-height: 1.6;">
                  ⚡ <strong>What's next?</strong> The competition details (date, time, and HackerRank contest link) will be shared via email before the event. Make sure you have a HackerRank account ready.
                </p>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 24px 0 16px;">
                <a href="https://coding-club-chi.vercel.app/codeit/rulebook" style="display: inline-block; padding: 14px 32px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                  View Rulebook
                </a>
              </div>

              ${qrHtmlAddition}

              <p style="color: rgba(255,255,255,0.3); font-size: 12px; text-align: center; margin: 16px 0 0;">
                Good luck! 🚀
              </p>
            </div>

            <!-- Footer -->
            <div style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
              <p style="margin: 0; color: rgba(255,255,255,0.2); font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">
                CORTEX — GEC Bhojpur | think. code. evolve.
              </p>
            </div>
          </div>
        `,
        false,
        qrAttachments
      );
      console.log(`[CODEIT] Confirmation email sent to ${req.user.email}`);
    } catch (emailErr) {
      console.error('[CODEIT] Failed to send confirmation email:', emailErr.message);
      // Don't fail the registration if email fails
    }

    res.status(201).json({ 
      message: 'Successfully registered for CodeIt!',
      registration,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for CodeIt.' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Check if current user is registered for CodeIt
router.get('/status', auth, async (req, res) => {
  try {
    const registration = await CodeItRegistration.findOne({ user: req.user._id });
    res.json({ 
      isRegistered: !!registration,
      registration: registration || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all CodeIt registrations
router.get('/registrations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'PRESIDENT' && req.user.role !== 'VOLUNTEER') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const registrations = await CodeItRegistration.find()
      .populate('user', 'name email rollNo department year phoneNumber profilePhoto')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get registration count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await CodeItRegistration.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
