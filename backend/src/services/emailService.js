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
  HAS_REAL_SMTP,
  RESEND_API_KEY,
  HAS_RESEND
} = require("../config/env");

const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 15000);

/* ── Startup diagnostic ─────────────────────────────────────────────── */
console.log("[EmailService] boot config:", {
  HAS_RESEND,
  HAS_REAL_SMTP,
  EMAIL_FROM,
  SMTP_HOST: SMTP_HOST || "(not set)",
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER: SMTP_USER ? `${SMTP_USER.slice(0, 4)}…` : "(not set)",
  SMTP_PASS: SMTP_PASS ? `${SMTP_PASS.length}-char password set` : "(not set)",
  RESEND_API_KEY: RESEND_API_KEY ? `${RESEND_API_KEY.slice(0, 8)}…` : "(not set)",
});

/* ── Resend (HTTPS, never blocked by firewalls) ─────────────────────── */
async function sendViaResend({ to, subject, html, text, replyTo }) {
  console.log("[Email/Resend] attempting send →", to, "| subject:", subject);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {})
    }),
    signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS)
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = `Resend API error ${res.status}: ${body?.message || res.statusText}`;
    console.error("[Email/Resend] FAILED:", msg, "| full body:", JSON.stringify(body));
    throw new Error(msg);
  }

  const result = await res.json();
  console.log("[Email/Resend] SUCCESS id:", result?.id, "→", to);
  return result;
}

/* ── Nodemailer (SMTP fallback) ─────────────────────────────────────── */
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (!HAS_REAL_SMTP) {
    const detail = `SMTP_HOST=${SMTP_HOST || "MISSING"} SMTP_USER=${SMTP_USER || "MISSING"} SMTP_PASS=${SMTP_PASS ? "set" : "MISSING"}`;
    throw new Error(`SMTP configuration is incomplete. ${detail}`);
  }

  console.log("[Email/SMTP] creating transporter:", {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    user: SMTP_USER ? `${SMTP_USER.slice(0, 4)}…` : "MISSING",
    requireTLS: SMTP_PORT === 587,
  });

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    requireTLS: SMTP_PORT === 587,
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: EMAIL_TIMEOUT_MS,
    family: 4,      // Force IPv4 — Railway does not support IPv6 outbound
    logger: true,   // nodemailer internal logging
    debug: false,   // set true for full SMTP conversation (very verbose)
  });

  return transporter;
}

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error(`${label} timed out after ${EMAIL_TIMEOUT_MS}ms`));
      }, EMAIL_TIMEOUT_MS);
    })
  ]);
}

async function sendViaSMTP({ to, subject, html, text, replyTo }) {
  console.log("[Email/SMTP] attempting send →", to, "| from:", EMAIL_FROM, "| subject:", subject);
  const t = getTransporter();

  // Verify connection before sending
  try {
    await withTimeout(t.verify(), "SMTP verify");
    console.log("[Email/SMTP] connection verified ✓");
  } catch (verifyErr) {
    console.error("[Email/SMTP] connection verify FAILED:", verifyErr.message, "| code:", verifyErr.code, "| response:", verifyErr.response);
    throw verifyErr;
  }

  try {
    const info = await withTimeout(
      t.sendMail({ from: EMAIL_FROM, to, replyTo, subject, text, html }),
      "Email send"
    );
    console.log("[Email/SMTP] SUCCESS messageId:", info.messageId, "| response:", info.response, "→", to);
    return info;
  } catch (sendErr) {
    console.error("[Email/SMTP] sendMail FAILED:", {
      message: sendErr.message,
      code: sendErr.code,
      command: sendErr.command,
      response: sendErr.response,
      responseCode: sendErr.responseCode,
    });
    throw sendErr;
  }
}

/* ── Unified send (Resend preferred, SMTP fallback) ─────────────────── */
async function sendEmail({ to, subject, html, text, replyTo }) {
  if (HAS_RESEND) {
    return sendViaResend({ to, subject, html, text, replyTo });
  }
  if (HAS_REAL_SMTP) {
    return sendViaSMTP({ to, subject, html, text, replyTo });
  }
  console.warn("[Email] No email provider configured — skipping send. to:", to);
  throw new Error("No email provider configured (no RESEND_API_KEY, no valid SMTP).");
}

/* ── Public helpers ──────────────────────────────────────────────────── */
async function sendPasswordResetEmail(email, otp) {
  const subject = "Your Tara Maa Solutions admin OTP";
  const text = `Your one-time password (OTP) is: ${otp}\nIt expires in 10 minutes. Do not share it with anyone.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 480px;">
      <h2 style="margin-top: 0;">Admin Password Reset</h2>
      <p>Use the OTP below to reset your Tara Maa Solutions admin password:</p>
      <p style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #b45309; margin: 1.5rem 0;">${otp}</p>
      <p>This OTP expires in <strong>10 minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 0.9rem;">If you did not request a password reset, you can ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, text, html });
}

async function getNotificationEmail() {
  const settings = await WebsiteSettings.findOne({ siteKey: "primary" })
    .select("masterEmail contactInfo.email")
    .lean();
  const email = settings?.masterEmail || ADMIN_NOTIFICATION_EMAIL || settings?.contactInfo?.email || "";
  console.log("[Email] notification email resolved to:", email || "(none — check WebsiteSettings.masterEmail or ADMIN_NOTIFICATION_EMAIL env var)");
  return email;
}

async function sendQuoteRequestEmail(quoteRequest) {
  console.log("[Email] sendQuoteRequestEmail for:", quoteRequest.name, quoteRequest.email);
  const notificationEmail = await getNotificationEmail();
  if (!notificationEmail) {
    console.error("[Email] No notification email configured — quote alert NOT sent. Set masterEmail in WebsiteSettings OR set ADMIN_NOTIFICATION_EMAIL env var.");
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

  console.log("[Email] sending quote notification to:", notificationEmail);
  return sendEmail({ to: notificationEmail, replyTo: quoteRequest.email, subject, text, html });
}

function buildQuoteReply({ name, message }) {
  const safeName = name?.trim() || "Customer";
  const safeMessage = message?.trim() || "Thank you for your enquiry regarding the requested product. We have received your request and will share the details with you shortly.";
  const alreadyTemplated = /^dear\b/i.test(safeMessage) && /team\s+tms/i.test(safeMessage);

  if (alreadyTemplated) {
    return {
      subject: `Response to your enquiry from Tara Maa Solutions`,
      text: safeMessage,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;"><p>${safeMessage.replace(/\n/g, "<br/>")}</p></div>`
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
