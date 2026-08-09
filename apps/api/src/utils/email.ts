import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.smtpUser || !env.smtpPass) {
    return null; // no SMTP configured
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });

  return transporter;
}

export async function sendQuoteNotification(quote: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}): Promise<void> {
  const to = env.adminNotificationEmail;
  if (!to) {
    console.log("[Quote] No ADMIN_NOTIFICATION_EMAIL set — skipping notification");
    return;
  }

  const subject = `New quote request from ${quote.name}`;
  const text = [
    "A new quote request has been received.",
    `Name: ${quote.name}`,
    `Email: ${quote.email}`,
    `Phone: ${quote.phone || "N/A"}`,
    `Company: ${quote.company || "N/A"}`,
    `Message: ${quote.message || "N/A"}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px">
      <h2 style="color:#b45309">New Quote Request</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 12px;font-weight:bold;width:120px">Name</td><td style="padding:6px 12px">${quote.name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px"><a href="mailto:${quote.email}">${quote.email}</a></td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Phone</td><td style="padding:6px 12px">${quote.phone || "N/A"}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold">Company</td><td style="padding:6px 12px">${quote.company || "N/A"}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top">Message</td><td style="padding:6px 12px">${(quote.message || "N/A").replace(/\n/g, "<br/>")}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">Sent from tmsolutionsindia.com chatbot / quote form</p>
    </div>
  `;

  const t = getTransporter();
  if (!t) {
    console.log(`[Quote] No SMTP configured. New quote from ${quote.name} <${quote.email}>`);
    return;
  }

  await t.sendMail({
    from: `"TM Solutions" <${env.smtpFrom}>`,
    to,
    replyTo: quote.email, // clicking Reply goes straight to the customer
    subject,
    text,
    html,
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const t = getTransporter();

  if (!t) {
    // No SMTP configured — log for debugging (visible in Railway logs)
    console.log(`[OTP] No SMTP configured. OTP for ${to}: ${otp}`);
    return;
  }

  const siteName = "TM Solutions Admin";

  await t.sendMail({
    from: `"${siteName}" <${env.smtpFrom}>`,
    to,
    subject: `Your ${siteName} login OTP`,
    text: `Your one-time login code is: ${otp}\n\nThis code expires in ${env.otpTtlMinutes} minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1a1a1a">Your login code</h2>
        <p style="color:#555">Use the code below to sign in to <strong>${siteName}</strong>.</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:20px 24px;margin:20px 0;text-align:center">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;font-family:monospace;color:#c0392b">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px">Expires in ${env.otpTtlMinutes} minutes. Do not share this code.</p>
      </div>
    `,
  });
}
