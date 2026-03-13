const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to prefer IPv4 over IPv6 globally for Render networking
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Force IPv4 specifically for the SMTP connection
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false // Helps with some cloud connection handshakes
  }
});

/**
 * Verifies the connection to the SMTP server
 */
const verifyConnection = async () => {
  try {
    console.log('[MAILER] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[MAILER] SMTP Server is READY');
    return { success: true };
  } catch (error) {
    console.error('[MAILER] SMTP Connection Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends an email
 */
const sendEmail = async (to, subject, html, bcc = false) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[MAILER] Missing credentials. Skipping email.');
    return;
  }

  const mailOptions = {
    from: `"Coding Club" <${process.env.EMAIL_USER}>`,
    [bcc ? 'bcc' : 'to']: to,
    subject: subject,
    html: html
  };

  try {
    console.log(`[MAILER] Sending email to: ${Array.isArray(to) ? to.join(', ') : to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Email sent successfully! ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[MAILER] Sending failed:`, error.message);
    throw error;
  }
};

module.exports = { sendEmail, verifyConnection };
