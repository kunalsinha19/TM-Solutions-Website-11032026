const { CAPTCHA_SECRET } = require("../config/env");

async function validateCaptcha(token, remoteIp) {
  if (!CAPTCHA_SECRET || !token) {
    return {
      success: false,
      provider: "google-recaptcha",
      reason: "missing-secret-or-token"
    };
  }

  const params = new URLSearchParams({
    secret: CAPTCHA_SECRET,
    response: token
  });

  if (remoteIp) {
    params.append("remoteip", remoteIp);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    return {
      success: false,
      provider: "google-recaptcha",
      reason: `http-${response.status}`
    };
  }

  const data = await response.json();

  return {
    success: Boolean(data.success),
    provider: "google-recaptcha",
    score: data.score,
    action: data.action,
    hostname: data.hostname,
    errors: data["error-codes"] || []
  };
}

module.exports = {
  validateCaptcha
};
