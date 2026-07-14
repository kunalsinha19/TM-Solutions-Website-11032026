import { useMemo, useState } from "react";
import { api } from "../lib/api";

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

const toggleBtnStyle = {
  position: "absolute",
  right: "0.75rem",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  padding: "0.25rem",
  color: "#64748b",
  cursor: "pointer",
  borderRadius: "6px",
  lineHeight: 1,
  display: "flex",
  alignItems: "center"
};

const linkBtnStyle = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontSize: "0.9rem",
  textDecoration: "underline"
};

export default function LoginScreen({ onAuthenticated }) {
  const [view, setView] = useState("login"); // "login" | "request-otp" | "verify-otp"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [status, setStatus] = useState({ type: "idle", message: "" });

  const canLogin = useMemo(() => email && password, [email, password]);
  const canRequestOtp = useMemo(() => resetEmail, [resetEmail]);
  const canReset = useMemo(() => otp.length === 6 && newPassword && confirmPassword, [otp, newPassword, confirmPassword]);

  function goTo(nextView) {
    setView(nextView);
    setStatus({ type: "idle", message: "" });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: "Signing in..." });
    try {
      const response = await api.login(email, password);
      onAuthenticated(response.token, email, response.admin);
      setStatus({ type: "success", message: response.message || "Login successful." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleRequestOtp(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: "Sending OTP..." });
    try {
      const response = await api.requestOtp(resetEmail);
      setStatus({ type: "success", message: response.message });
      setView("verify-otp");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }
    setStatus({ type: "loading", message: "Resetting password..." });
    try {
      const response = await api.resetPassword(resetEmail, otp, newPassword);
      setStatus({ type: "success", message: (response.message || "Password reset.") + " Please sign in." });
      setTimeout(() => {
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setResetEmail("");
        goTo("login");
      }, 2000);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        <p className="eyebrow">Tara Maa Solutions</p>

        {view === "login" && (
          <>
            <h1>Admin Login</h1>
            <p className="muted">Use your admin email and password to sign in.</p>

            <form className="stack" onSubmit={handleLogin}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </label>
              <label>
                <span>Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    style={{ paddingRight: "3rem" }}
                  />
                  <button
                    type="button"
                    style={toggleBtnStyle}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </label>
              <button type="submit" disabled={!canLogin || status.type === "loading"}>
                Sign In
              </button>
            </form>

            <p style={{ marginTop: "1rem", marginBottom: 0, textAlign: "center" }}>
              <button
                type="button"
                style={{ ...linkBtnStyle, color: "#b45309" }}
                onClick={() => goTo("request-otp")}
              >
                Forgot password?
              </button>
            </p>
          </>
        )}

        {view === "request-otp" && (
          <>
            <h1>Reset Password</h1>
            <p className="muted">Enter your admin email and we'll send a 6-digit OTP.</p>

            <form className="stack" onSubmit={handleRequestOtp}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoFocus
                />
              </label>
              <button type="submit" disabled={!canRequestOtp || status.type === "loading"}>
                Send OTP
              </button>
            </form>

            <p style={{ marginTop: "1rem", marginBottom: 0, textAlign: "center" }}>
              <button
                type="button"
                style={{ ...linkBtnStyle, color: "#64748b" }}
                onClick={() => goTo("login")}
              >
                Back to sign in
              </button>
            </p>
          </>
        )}

        {view === "verify-otp" && (
          <>
            <h1>Set New Password</h1>
            <p className="muted">
              Enter the 6-digit OTP sent to <strong>{resetEmail}</strong> and choose a new password.
            </p>

            <form className="stack" onSubmit={handleResetPassword}>
              <label>
                <span>OTP</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit OTP"
                  autoFocus
                  style={{ letterSpacing: "0.2em", fontSize: "1.2rem" }}
                />
              </label>
              <label>
                <span>New Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    style={{ paddingRight: "3rem" }}
                  />
                  <button
                    type="button"
                    style={toggleBtnStyle}
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showNewPassword} />
                  </button>
                </div>
              </label>
              <label>
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </label>
              <button type="submit" disabled={!canReset || status.type === "loading"}>
                Reset Password
              </button>
            </form>

            <p style={{ marginTop: "1rem", marginBottom: 0, textAlign: "center", fontSize: "0.9rem" }}>
              <button
                type="button"
                style={{ ...linkBtnStyle, color: "#64748b" }}
                onClick={() => goTo("request-otp")}
              >
                Resend OTP
              </button>
              {" · "}
              <button
                type="button"
                style={{ ...linkBtnStyle, color: "#64748b" }}
                onClick={() => goTo("login")}
              >
                Back to sign in
              </button>
            </p>
          </>
        )}

        {status.message ? (
          <p className={`feedback ${status.type}`} style={{ marginTop: "1rem", marginBottom: 0 }}>
            {status.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
