const nodemailer = require("nodemailer");
const {
  EMAIL_FROM,
  ADMIN_NOTIFICATION_EMAIL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS
} = require("../config/env");

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP configuration is incomplete. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
}

async function sendEmail({ to, subject, html, text, replyTo }) {
  const mailTransporter = getTransporter();
  return mailTransporter.sendMail({
    from: EMAIL_FROM,
    to,
    replyTo,
    subject,
    text,
    html
  });
}

async function sendAdminOtpEmail(email, otpCode, purpose = "login") {
  const subject = purpose === "verify_email" ? "Verify your admin email" : "Your Tara Maa admin OTP";
  const text = purpose === "verify_email"
    ? `Your verification OTP is ${otpCode}. It expires in 10 minutes.`
    : `Your login OTP is ${otpCode}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>${purpose === "verify_email" ? "Verify Admin Email" : "Admin Login OTP"}</h2>
      <p>${purpose === "verify_email" ? "Use the code below to verify your admin email address." : "Use the code below to complete your admin login."}</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otpCode}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}

async function sendPasswordResetEmail(email, resetToken) {
  const subject = "Tara Maa admin password reset";
  const text = `Your password reset token is ${resetToken}. It expires in 30 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Password Reset Request</h2>
      <p>Use the token below to reset your admin password.</p>
      <p style="font-size: 20px; font-weight: 700; word-break: break-all;">${resetToken}</p>
      <p>This token expires in 30 minutes.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}

async function sendQuoteRequestEmail(quoteRequest) {
  if (!ADMIN_NOTIFICATION_EMAIL) {
    throw new Error("ADMIN_NOTIFICATION_EMAIL is not configured.");
  }

  const subject = `New quote request from ${quoteRequest.name}`;
  const text = [
    "A new quote request has been received.",
    `Name: ${quoteRequest.name}`,
    `Email: ${quoteRequest.email}`,
    `Phone: ${quoteRequest.phone || "N/A"}`,
    `Company: ${quoteRequest.company || "N/A"}`,
    `Message: ${quoteRequest.message}`,
    `Product ID: ${quoteRequest.product || "N/A"}`
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>New Quote Request</h2>
      <p><strong>Name:</strong> ${quoteRequest.name}</p>
      <p><strong>Email:</strong> ${quoteRequest.email}</p>
      <p><strong>Phone:</strong> ${quoteRequest.phone || "N/A"}</p>
      <p><strong>Company:</strong> ${quoteRequest.company || "N/A"}</p>
      <p><strong>Message:</strong><br/>${quoteRequest.message}</p>
      <p><strong>Product ID:</strong> ${quoteRequest.product || "N/A"}</p>
    </div>
  `;

  return sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    replyTo: quoteRequest.email,
    subject,
    text,
    html
  });
}

module.exports = {
  sendEmail,
  sendAdminOtpEmail,
  sendPasswordResetEmail,
  sendQuoteRequestEmail
};
