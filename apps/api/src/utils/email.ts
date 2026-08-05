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
