const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send an email
 * @param {string|string[]} to - Recipient(s)
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML
 * @param {boolean} bcc - Whether to use BCC for multiple recipients
 */
const sendEmail = async (to, subject, html, bcc = false) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not set. Skipping email.');
    return;
  }

  const mailOptions = {
    from: `"Coding Club" <${process.env.EMAIL_USER}>`,
    [bcc ? 'bcc' : 'to']: to,
    subject: subject,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendEmail };
