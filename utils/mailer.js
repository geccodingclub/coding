const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: false, // show debug output
  logger: false // log information in console
});

// Verify connection configuration
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP Server is ready to take our messages');
    return true;
  } catch (error) {
    console.error('SMTP Connection Error:', error);
    return false;
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
    console.log(`Attempting to send email to: ${to} | Subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to: ${to} | Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`ERROR: Email sending failed for recipient ${to}:`, error.message);
    throw error;
  }
};

module.exports = { sendEmail, verifyConnection };
