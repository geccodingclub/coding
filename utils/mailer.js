const axios = require('axios');

/**
 * Verifies the Brevo setup
 */
const verifyConnection = async () => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is missing');
    }
    console.log('[MAILER] Brevo API Client Ready');
    return { success: true };
  } catch (error) {
    console.error('[MAILER] Brevo Initialization Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends an email using Brevo API (v3)
 */
const sendEmail = async (to, subject, html, bcc = false) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_USER || 'geccodingclub@gmail.com';

  if (!apiKey) {
    console.warn('[MAILER] BREVO_API_KEY not set. Skipping email.');
    return;
  }

  const recipients = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
  
  const payload = {
    sender: { name: 'Coding Club', email: senderEmail },
    to: recipients,
    subject: subject,
    htmlContent: html
  };

  // If BCC is needed for multiple recipients (e.g. broadcasting)
  if (bcc && Array.isArray(to)) {
    payload.bcc = to.map(email => ({ email }));
    // When using BCC, we usually send to the sender themselves as the "To"
    payload.to = [{ email: senderEmail }];
  }

  try {
    console.log(`[MAILER] Sending email via Brevo to: ${Array.isArray(to) ? to.length + ' recipients' : to}`);
    
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[MAILER] Email sent successfully! ID: ${response.data.messageId}`);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`[MAILER] Brevo Error:`, errorMsg);
    throw new Error(errorMsg);
  }
};

module.exports = { sendEmail, verifyConnection };
