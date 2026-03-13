const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Force IPv4 to avoid Render ENETUNREACH errors
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // show debug output
  logger: true // log information in console
});

// Verify connection configuration
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP Server is ready to take our messages');
    return { success: true };
  } catch (error) {
    console.error('SMTP Connection Error:', error);
    return { success: false, error: error.message };
  }
};

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
    console.log(`[MAILER] Attempting to send email to: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[MAILER] Subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Success! Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[MAILER] ERROR: Sending failed:`, {
      message: error.message,
      code: error.code,
      command: error.command,
      recipient: to
    });
    throw error;
  }
};

module.exports = { sendEmail, verifyConnection };
