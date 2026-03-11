const nodemailer = require("nodemailer");
const WebsiteSettings = require("../models/WebsiteSettings");
const {
  EMAIL_FROM,
  ADMIN_NOTIFICATION_EMAIL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  HAS_REAL_SMTP
} = require("../config/env");

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!HAS_REAL_SMTP) {
    throw new Error("SMTP configuration is incomplete. Set real SMTP_HOST, SMTP_USER, and SMTP_PASS values.");
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

async function getNotificationEmail() {
  const settings = await WebsiteSettings.findOne({ siteKey: "primary" })
    .select("masterEmail contactInfo.email")
    .lean();

  return settings?.masterEmail || ADMIN_NOTIFICATION_EMAIL || settings?.contactInfo?.email || "";
}

async function sendQuoteRequestEmail(quoteRequest) {
  const notificationEmail = await getNotificationEmail();

  if (!notificationEmail) {
    throw new Error("Notification email is not configured.");
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
    to: notificationEmail,
    replyTo: quoteRequest.email,
    subject,
    text,
    html
  });
}

function buildQuoteReply({ name, message }) {
  const safeName = name?.trim() || "Customer";
  const safeMessage = message?.trim() || "Thank you for your enquiry regarding the requested product. We have received your request and will share the details with you shortly.";
  const alreadyTemplated = /^dear\b/i.test(safeMessage) && /team\s+tms/i.test(safeMessage);

  if (alreadyTemplated) {
    return {
      subject: `Response to your enquiry from Tara Maa Solutions`,
      text: safeMessage,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
          <p>${safeMessage.replace(/\n/g, "<br/>")}</p>
        </div>
      `
    };
  }

  return {
    subject: `Response to your enquiry from Tara Maa Solutions`,
    text: `Dear ${safeName},\n\n${safeMessage}\n\nThank you for contacting us.\n\nRegards,\nTeam TMS`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
        <p>Dear ${safeName},</p>
        <p>${safeMessage.replace(/\n/g, "<br/>")}</p>
        <p>Thank you for contacting us.</p>
        <p>Regards,<br/>Team TMS</p>
      </div>
    `
  };
}

async function sendQuoteResponseEmail({ to, name, subject, message }) {
  const composed = buildQuoteReply({ name, message });
  return sendEmail({
    to,
    subject: subject?.trim() || composed.subject,
    text: composed.text,
    html: composed.html
  });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendQuoteRequestEmail,
  sendQuoteResponseEmail,
  buildQuoteReply
};
