// src/utils/sendEmail.js
const nodemailer = require("nodemailer");

/**
 * @desc Sends an email using Nodemailer.
 * * @param {object} options - Email options.
 * @param {string} options.email - Recipient's email address.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.message - Email body (HTML or plain text).
 */
const sendEmail = async (options) => {
  // Create a transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    // Allows Nodemailer to connect to services like Mailtrap/SendGrid in development
    tls: {
      ciphers: 'SSLv3'
    }
  });

  // Setup email data
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // Using HTML for rich email formatting
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

// NOTE: Ensure these env variables are set in your .env file:
// SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD, FROM_NAME, FROM_EMAIL