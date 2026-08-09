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
async function sendViaResend({ to, cc, subject, html, text, replyTo }) {
  const toList = Array.isArray(to) ? to : [to];
  const ccList = cc ? (Array.isArray(cc) ? cc : [cc]).filter(e => e && !toList.includes(e)) : [];
  console.log("[Email/Resend] attempting send →", toList, ccList.length ? `cc: ${ccList}` : "", "| subject:", subject);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: toList,
      ...(ccList.length ? { cc: ccList } : {}),
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
  console.log("[Email/Resend] SUCCESS id:", result?.id, "→", toList);
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

async function sendViaSMTP({ to, cc, subject, html, text, replyTo }) {
  console.log("[Email/SMTP] attempting send →", to, cc ? `cc: ${cc}` : "", "| from:", EMAIL_FROM, "| subject:", subject);
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
      t.sendMail({ from: EMAIL_FROM, to, cc: cc || undefined, replyTo, subject, text, html }),
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
async function sendEmail({ to, cc, subject, html, text, replyTo }) {
  if (HAS_RESEND) {
    return sendViaResend({ to, cc, subject, html, text, replyTo });
  }
  if (HAS_REAL_SMTP) {
    return sendViaSMTP({ to, cc, subject, html, text, replyTo });
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
  const source = quoteRequest.source === "chat" ? "chatbot" : "quote form";
  const text = [
    "A new quote request has been received.",
    "",
    `Name:       ${quoteRequest.name}`,
    `Email:      ${quoteRequest.email}`,
    `Phone:      ${quoteRequest.phone || "N/A"}`,
    `Company:    ${quoteRequest.company || "N/A"}`,
    `Message:    ${quoteRequest.message}`,
    `Product ID: ${quoteRequest.product || "N/A"}`,
    `Source:     ${source}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px;">
      <h2 style="color:#b45309; margin-top:0">New Quote Request</h2>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:6px 12px; font-weight:bold; width:110px; color:#6b7280">Name</td><td style="padding:6px 12px">${quoteRequest.name}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:6px 12px; font-weight:bold; color:#6b7280">Email</td><td style="padding:6px 12px"><a href="mailto:${quoteRequest.email}" style="color:#b45309">${quoteRequest.email}</a></td></tr>
        <tr><td style="padding:6px 12px; font-weight:bold; color:#6b7280">Phone</td><td style="padding:6px 12px">${quoteRequest.phone || "<em style='color:#9ca3af'>N/A</em>"}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:6px 12px; font-weight:bold; color:#6b7280">Company</td><td style="padding:6px 12px">${quoteRequest.company || "<em style='color:#9ca3af'>N/A</em>"}</td></tr>
        <tr><td style="padding:6px 12px; font-weight:bold; color:#6b7280; vertical-align:top">Message</td><td style="padding:6px 12px">${(quoteRequest.message || "").replace(/\n/g, "<br/>")}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:6px 12px; font-weight:bold; color:#6b7280">Product</td><td style="padding:6px 12px">${quoteRequest.product || "<em style='color:#9ca3af'>N/A</em>"}</td></tr>
        <tr><td style="padding:6px 12px; font-weight:bold; color:#6b7280">Source</td><td style="padding:6px 12px">${source}</td></tr>
      </table>
      <p style="margin-top:20px">
        <a href="mailto:${quoteRequest.email}" style="display:inline-block; background:#b45309; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:13px;">Reply to ${quoteRequest.name.split(" ")[0]}</a>
      </p>
      <p style="color:#6b7280; font-size:11px; margin-top:24px">Sent from tmsolutionsindia.com — ${source}</p>
    </div>
  `;

  // CC: support.tmsindia@gmail.com unless it's already the TO address
  const CC_EMAIL = process.env.CC_NOTIFICATION_EMAIL || "support.tmsindia@gmail.com";
  const cc = CC_EMAIL !== notificationEmail ? CC_EMAIL : undefined;

  console.log("[Email] sending quote notification to:", notificationEmail, cc ? `| cc: ${cc}` : "");
  return sendEmail({ to: notificationEmail, cc, replyTo: quoteRequest.email, subject, text, html });
}

/**
 * Customer auto-acknowledgement — sent once when a new quote is first created.
 * Friendly, non-generic: uses the customer's first name and echoes their requirement.
 */
async function sendCustomerAck(quoteRequest) {
  const email = quoteRequest.email;
  if (!email) return;

  const firstName = (quoteRequest.name || "there").trim().split(/\s+/)[0];
  const requirement = (quoteRequest.message || "").slice(0, 160).trim();
  const requirementSnippet = requirement.length < quoteRequest.message?.length
    ? requirement + "…"
    : requirement;

  const subject = "We've received your enquiry — Tara Maa Solutions";
  const text = [
    `Dear ${firstName},`,
    "",
    "Thank you for reaching out to Tara Maa Solutions.",
    "",
    `We've received your enquiry${requirementSnippet ? ` for: "${requirementSnippet}"` : ""} and our sales team will review your requirements shortly.`,
    "We will get back to you with pricing, availability, and further details within 24 business hours.",
    "",
    "For urgent queries, feel free to call us at +91 75950 56476.",
    "",
    "Warm regards,",
    "Tara Maa Solutions Team",
    "tmsolutionsindia.com",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827; max-width: 560px;">
      <p style="margin-top:0">Dear ${firstName},</p>
      <p>Thank you for reaching out to <strong>Tara Maa Solutions</strong>.</p>
      ${requirementSnippet ? `<p>We've received your enquiry for: <em>"${requirementSnippet}"</em></p>` : ""}
      <p>Our sales team will review your requirements shortly and get back to you with <strong>pricing, availability, and further details within 24 business hours</strong>.</p>
      <p>For urgent queries, feel free to call us at <strong>+91 75950 56476</strong>.</p>
      <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0"/>
      <p style="margin-bottom:0">Warm regards,<br/><strong>Tara Maa Solutions Team</strong></p>
      <p style="color:#6b7280; font-size:12px; margin-top:4px">
        <a href="https://tmsolutionsindia.com" style="color:#b45309">tmsolutionsindia.com</a> &middot; +91 75950 56476 &middot; support.tmsindia@gmail.com
      </p>
    </div>
  `;

  console.log("[Email] sending customer ack to:", email);
  return sendEmail({ to: email, subject, text, html });
}

function buildQuoteReply({ name, message }) {
  const safeName = name?.trim() || "Customer";
  const safeMessage = message?.trim() || "Thank you for your enquiry regarding the requested product. We have received your request and will share the details with you shortly.";
  const alreadyTemplated = /^dear\b/i.test(safeMessage);

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
  sendCustomerAck,
  sendQuoteResponseEmail,
  buildQuoteReply
};
