const { Resend } = require('resend');

// Initialize Resend with API Key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Verifies the Resend setup (basic check for API Key presence)
 */
const verifyConnection = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing from environment variables');
    }
    // We don't have a "verify" method like Nodemailer, 
    // but the presence of the key and successfully sending 
    // the first email will confirm validity.
    console.log('[MAILER] Resend API Client Initialized');
    return { success: true };
  } catch (error) {
    console.error('[MAILER] Resend Initialization Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends an email using Resend API
 * @param {string|string[]} to - Recipient(s)
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML
 * @param {boolean} bcc - Whether to use BCC for multiple recipients
 */
const sendEmail = async (to, subject, html, bcc = false) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[MAILER] RESEND_API_KEY not set. Skipping email.');
    return;
  }

  try {
    console.log(`[MAILER] Sending email via Resend to: ${Array.isArray(to) ? to.join(', ') : to}`);
    
    const { data, error } = await resend.emails.send({
      from: 'Coding Club <onboarding@resend.dev>', // Default Resend test sender
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
      ...(bcc && { bcc: Array.isArray(to) ? to : [to] })
    });

    if (error) {
      console.error('[MAILER] Resend sending failed:', error.message);
      throw new Error(error.message);
    }

    console.log(`[MAILER] Email sent successfully! ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`[MAILER] ERROR:`, error.message);
    throw error;
  }
};

module.exports = { sendEmail, verifyConnection };
