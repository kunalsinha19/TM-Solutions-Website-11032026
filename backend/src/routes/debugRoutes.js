/**
 * Debug routes — ONLY active when NODE_ENV !== "production" OR when DEBUG_ROUTES=true
 * Usage: GET /api/debug/email-test?to=you@example.com
 *        GET /api/debug/email-config   (shows sanitised config, no credentials)
 */
const express = require("express");
const router = express.Router();
const { sendEmail } = require("../services/emailService");
const {
  HAS_RESEND, HAS_REAL_SMTP,
  SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
  EMAIL_FROM, ADMIN_NOTIFICATION_EMAIL, RESEND_API_KEY,
} = require("../config/env");

const ENABLED = process.env.NODE_ENV !== "production" || process.env.DEBUG_ROUTES === "true";

function guard(req, res, next) {
  if (!ENABLED) return res.status(404).json({ error: "Debug routes disabled in production. Set DEBUG_ROUTES=true to enable." });
  next();
}

/* GET /api/debug/email-config — shows what env vars are loaded */
router.get("/email-config", guard, (req, res) => {
  res.json({
    provider: HAS_RESEND ? "resend" : HAS_REAL_SMTP ? "smtp" : "none",
    HAS_RESEND,
    HAS_REAL_SMTP,
    EMAIL_FROM,
    ADMIN_NOTIFICATION_EMAIL,
    smtp: {
      SMTP_HOST: SMTP_HOST || "(not set)",
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER: SMTP_USER ? `${SMTP_USER.slice(0, 4)}…${SMTP_USER.split("@")[1] || ""}` : "(not set)",
      SMTP_PASS: SMTP_PASS ? `${SMTP_PASS.length} chars — set` : "(not set)",
    },
    resend: {
      RESEND_API_KEY: RESEND_API_KEY ? `${RESEND_API_KEY.slice(0, 8)}… — set` : "(not set)",
    },
  });
});

/* GET /api/debug/email-test?to=you@example.com — fires a real test email */
router.get("/email-test", guard, async (req, res) => {
  const to = req.query.to || ADMIN_NOTIFICATION_EMAIL;
  if (!to) {
    return res.status(400).json({ error: "Provide ?to=email@example.com or set ADMIN_NOTIFICATION_EMAIL env var." });
  }

  if (!HAS_RESEND && !HAS_REAL_SMTP) {
    return res.status(503).json({
      error: "No email provider configured.",
      hint: "Set RESEND_API_KEY, or set SMTP_HOST + SMTP_USER + SMTP_PASS in Railway Variables.",
      config: {
        SMTP_HOST: SMTP_HOST || "(not set)",
        SMTP_USER: SMTP_USER || "(not set)",
        SMTP_PASS: SMTP_PASS ? "set" : "(not set)",
        RESEND_API_KEY: RESEND_API_KEY ? "set" : "(not set)",
      },
    });
  }

  const startMs = Date.now();
  try {
    console.log("[Debug/email-test] sending test email to:", to);
    const result = await sendEmail({
      to,
      subject: "TMS Email Test ✓",
      text: `This is a test email from api.tmsolutionsindia.com.\nProvider: ${HAS_RESEND ? "Resend" : "SMTP"}\nFrom: ${EMAIL_FROM}\nSent at: ${new Date().toISOString()}`,
      html: `<div style="font-family:Arial,sans-serif;color:#111827;max-width:480px;">
        <h2 style="color:#b45309;">TMS Email Test ✓</h2>
        <p>Email delivery is working correctly.</p>
        <table style="border-collapse:collapse;width:100%;font-size:0.9rem;">
          <tr><td style="padding:4px 8px;color:#6b7280;">Provider</td><td style="padding:4px 8px;">${HAS_RESEND ? "Resend" : "SMTP/Gmail"}</td></tr>
          <tr><td style="padding:4px 8px;color:#6b7280;">From</td><td style="padding:4px 8px;">${EMAIL_FROM}</td></tr>
          <tr><td style="padding:4px 8px;color:#6b7280;">To</td><td style="padding:4px 8px;">${to}</td></tr>
          <tr><td style="padding:4px 8px;color:#6b7280;">Sent at</td><td style="padding:4px 8px;">${new Date().toISOString()}</td></tr>
        </table>
      </div>`,
    });
    console.log("[Debug/email-test] SUCCESS in", Date.now() - startMs, "ms");
    res.json({
      success: true,
      to,
      provider: HAS_RESEND ? "resend" : "smtp",
      durationMs: Date.now() - startMs,
      result: result ? { messageId: result.messageId || result.id, response: result.response } : "sent",
    });
  } catch (err) {
    console.error("[Debug/email-test] FAILED:", err.message, "code:", err.code, "response:", err.response);
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code || null,
      smtpResponse: err.response || null,
      responseCode: err.responseCode || null,
      command: err.command || null,
      durationMs: Date.now() - startMs,
      hint: err.responseCode === 535 || err.message?.includes("535")
        ? "535 = Gmail auth failed. Use an App Password (not your Gmail password). 2FA must be enabled."
        : err.responseCode === 534
        ? "534 = Gmail requires App Password. Enable 2FA at myaccount.google.com/security then create an App Password."
        : err.message?.includes("ECONNREFUSED")
        ? "ECONNREFUSED = cannot reach SMTP host. Check SMTP_HOST and SMTP_PORT."
        : err.message?.includes("ETIMEDOUT") || err.message?.includes("timed out")
        ? "Timeout — Railway may be blocking outbound SMTP. Consider switching to Resend (add RESEND_API_KEY)."
        : "Check Railway Console logs for more detail.",
    });
  }
});

module.exports = router;
