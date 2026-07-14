import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

// ─── Icons ──────────────────────────────────────────────────────────────────

function IconEye({ crossed }) {
  return crossed ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block",
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255,255,255,0.4)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      flexShrink: 0
    }} />
  );
}

// ─── Password strength ───────────────────────────────────────────────────────

function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "#E5E7EB" };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score: s, label: "Weak", color: "#EF4444" };
  if (s <= 2) return { score: s, label: "Fair", color: "#F59E0B" };
  if (s <= 3) return { score: s, label: "Good", color: "#3B82F6" };
  return { score: s, label: "Strong", color: "#10B981" };
}

function StrengthBar({ password }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: "0.4rem" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            flex: 1,
            height: "4px",
            borderRadius: "99px",
            background: i <= score ? color : "#E5E7EB",
            transition: "background 250ms ease"
          }} />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: "0.78rem", color, fontWeight: 600 }}>{label}</p>
    </div>
  );
}

// ─── OTP Boxes ──────────────────────────────────────────────────────────────

function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  function handleChange(e, idx) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = (value + "      ").split("");
    next[idx] = char || " ";
    const joined = next.slice(0, 6).join("").replace(/\s+$/, "");
    onChange(joined);
    if (char && idx < 5) refs.current[idx + 1]?.focus();
  }

  function handleKeyDown(e, idx) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = (value + "      ").split("").slice(0, 6);
      if (arr[idx].trim()) {
        arr[idx] = " ";
      } else if (idx > 0) {
        arr[idx - 1] = " ";
        refs.current[idx - 1]?.focus();
      }
      onChange(arr.join("").replace(/\s+$/, ""));
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
      {digits.map((digit, i) => {
        const filled = digit.trim() !== "";
        return (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={filled ? digit : ""}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            autoFocus={i === 0}
            style={{
              width: "48px",
              height: "56px",
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: "700",
              letterSpacing: "0",
              borderRadius: "12px",
              border: `2px solid ${filled ? "#C46A18" : "#E5E7EB"}`,
              background: filled ? "#FFF8F3" : "#FFFFFF",
              color: "#111827",
              outline: "none",
              padding: 0,
              transition: "border-color 150ms ease, background 150ms ease",
              boxShadow: filled ? "0 0 0 3px rgba(196,106,24,0.12)" : "none",
              caretColor: "#C46A18"
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Countdown ──────────────────────────────────────────────────────────────

function useCountdown(initialSeconds) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  function restart(seconds) {
    clearInterval(intervalRef.current);
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return {
    remaining,
    expired: remaining === 0,
    display: `${mins}:${String(secs).padStart(2, "0")}`,
    restart
  };
}

// ─── Shared field wrapper ────────────────────────────────────────────────────

function Field({ label, icon, children }) {
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#475569" }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9CA3AF",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center"
          }}>
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

const inputStyle = (hasIcon) => ({
  width: "100%",
  padding: hasIcon ? "0.85rem 0.95rem 0.85rem 2.6rem" : "0.85rem 0.95rem",
  border: "1.5px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
  fontSize: "0.95rem",
  color: "#111827",
  boxSizing: "border-box",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
  outline: "none"
});

const eyeBtnStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  padding: "4px",
  color: "#9CA3AF",
  cursor: "pointer",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  lineHeight: 1
};

const primaryBtn = (loading) => ({
  width: "100%",
  padding: "0.9rem",
  borderRadius: "12px",
  background: loading ? "#D97706" : "#C46A18",
  color: "#fff",
  border: "none",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: loading ? "not-allowed" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "background 150ms ease, transform 100ms ease",
  opacity: loading ? 0.85 : 1
});

const ghostLinkStyle = (color = "#6B7280") => ({
  background: "none",
  border: "none",
  padding: 0,
  color,
  cursor: "pointer",
  fontSize: "0.875rem",
  textDecoration: "underline",
  textUnderlineOffset: "2px"
});

// ─── Main component ──────────────────────────────────────────────────────────

export default function LoginScreen({ onAuthenticated }) {
  const [view, setView] = useState("login");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // Reset flow
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef(null);

  const [status, setStatus] = useState({ type: "idle", message: "" });

  const canLogin = useMemo(() => email.trim() && password, [email, password]);
  const otpFull = otp.replace(/\s/g, "").length === 6;
  const canReset = otpFull && newPwd && confirmPwd;

  function goTo(v) {
    setView(v);
    setStatus({ type: "idle", message: "" });
  }

  function startResendCooldown() {
    setResendCooldown(60);
    clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(resendTimerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  useEffect(() => () => clearInterval(resendTimerRef.current), []);

  async function handleLogin(e) {
    e.preventDefault();
    setStatus({ type: "loading", message: "Signing in…" });
    try {
      const res = await api.login(email.trim(), password);
      onAuthenticated(res.token, email.trim(), res.admin);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }

  async function handleRequestOtp(e) {
    e?.preventDefault();
    setStatus({ type: "loading", message: "Sending OTP…" });
    try {
      const res = await api.requestOtp(resetEmail.trim());
      setStatus({ type: "success", message: res.message });
      startResendCooldown();
      if (view !== "verify-otp") setView("verify-otp");
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setOtp("");
    await handleRequestOtp();
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }
    if (newPwd.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }
    setStatus({ type: "loading", message: "Resetting password…" });
    try {
      const res = await api.resetPassword(resetEmail.trim(), otp.replace(/\s/g, ""), newPwd);
      setStatus({ type: "success", message: res.message || "Password reset. Redirecting…" });
      setTimeout(() => {
        setOtp(""); setNewPwd(""); setConfirmPwd(""); setResetEmail("");
        goTo("login");
      }, 2000);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }

  return (
    <div className="login-shell">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
        .auth-input:focus {
          border-color: #C46A18 !important;
          box-shadow: 0 0 0 3px rgba(196,106,24,0.15) !important;
        }
        .auth-btn-primary:not(:disabled):hover {
          background: #A85712 !important;
          transform: translateY(-1px);
        }
        .auth-feedback-error { animation: shake 300ms ease; }
      `}</style>

      <div className="login-panel" style={{ maxWidth: "420px" }}>
        <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Tara Maa Solutions</p>

        {/* ── LOGIN ── */}
        {view === "login" && (
          <>
            <h1 style={{ fontSize: "1.7rem", marginBottom: "0.35rem" }}>Admin Login</h1>
            <p className="muted" style={{ marginBottom: "1.5rem" }}>Sign in to manage your website.</p>

            <form onSubmit={handleLogin} style={{ display: "grid", gap: "1rem" }}>
              <Field label="Email" icon={<IconMail />}>
                <input
                  className="auth-input"
                  style={inputStyle(true)}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="Password" icon={<IconLock />}>
                <input
                  className="auth-input"
                  style={{ ...inputStyle(true), paddingRight: "3rem" }}
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? "Hide" : "Show"}>
                  <IconEye crossed={showPwd} />
                </button>
              </Field>

              <button
                type="submit"
                className="auth-btn-primary"
                style={primaryBtn(status.type === "loading")}
                disabled={!canLogin || status.type === "loading"}
              >
                {status.type === "loading" ? <><Spinner /> Signing in…</> : "Sign In"}
              </button>
            </form>

            <p style={{ marginTop: "1.25rem", textAlign: "center", marginBottom: 0 }}>
              <button style={ghostLinkStyle("#C46A18")} onClick={() => goTo("request-otp")}>
                Forgot password?
              </button>
            </p>
          </>
        )}

        {/* ── REQUEST OTP ── */}
        {view === "request-otp" && (
          <>
            <h1 style={{ fontSize: "1.7rem", marginBottom: "0.35rem" }}>Reset Password</h1>
            <p className="muted" style={{ marginBottom: "1.5rem" }}>
              Enter your admin email and we'll send a 6-digit OTP.
            </p>

            <form onSubmit={handleRequestOtp} style={{ display: "grid", gap: "1rem" }}>
              <Field label="Admin email" icon={<IconMail />}>
                <input
                  className="auth-input"
                  style={inputStyle(true)}
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoFocus
                  autoComplete="email"
                />
              </Field>

              <button
                type="submit"
                className="auth-btn-primary"
                style={primaryBtn(status.type === "loading")}
                disabled={!resetEmail.trim() || status.type === "loading"}
              >
                {status.type === "loading" ? <><Spinner /> Sending OTP…</> : "Send OTP"}
              </button>
            </form>

            <p style={{ marginTop: "1.25rem", textAlign: "center", marginBottom: 0 }}>
              <button style={ghostLinkStyle()} onClick={() => goTo("login")}>
                Back to sign in
              </button>
            </p>
          </>
        )}

        {/* ── VERIFY OTP + RESET ── */}
        {view === "verify-otp" && (
          <VerifyOtpView
            resetEmail={resetEmail}
            otp={otp}
            setOtp={setOtp}
            newPwd={newPwd}
            setNewPwd={setNewPwd}
            confirmPwd={confirmPwd}
            setConfirmPwd={setConfirmPwd}
            showNewPwd={showNewPwd}
            setShowNewPwd={setShowNewPwd}
            canReset={canReset}
            status={status}
            resendCooldown={resendCooldown}
            onSubmit={handleResetPassword}
            onResend={handleResendOtp}
            onBack={() => goTo("login")}
          />
        )}

        {/* ── STATUS MESSAGE ── */}
        {status.message && (
          <div
            className={status.type === "error" ? "auth-feedback-error" : ""}
            style={{
              marginTop: "1rem",
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: status.type === "error" ? "#FEF2F2" : status.type === "success" ? "#ECFDF5" : "#EFF6FF",
              color: status.type === "error" ? "#991B1B" : status.type === "success" ? "#166534" : "#1D4ED8"
            }}
          >
            {status.type === "success" && <IconCheck />}
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Verify OTP view (separate to keep parent lean) ─────────────────────────

function VerifyOtpView({
  resetEmail, otp, setOtp, newPwd, setNewPwd, confirmPwd, setConfirmPwd,
  showNewPwd, setShowNewPwd, canReset, status, resendCooldown,
  onSubmit, onResend, onBack
}) {
  const countdown = useCountdown(10 * 60);

  return (
    <>
      <h1 style={{ fontSize: "1.7rem", marginBottom: "0.25rem" }}>Check your email</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        We sent a 6-digit OTP to <strong>{resetEmail}</strong>.
        {!countdown.expired && (
          <span style={{ color: countdown.remaining < 120 ? "#EF4444" : "#6B7280" }}>
            {" "}Expires in {countdown.display}.
          </span>
        )}
        {countdown.expired && (
          <span style={{ color: "#EF4444" }}> OTP has expired. Please resend.</span>
        )}
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "1.1rem" }}>
        <div style={{ display: "grid", gap: "8px" }}>
          <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#475569" }}>
            Enter OTP
          </span>
          <OtpBoxes value={otp} onChange={setOtp} />
        </div>

        <Field label="New password" icon={<IconLock />}>
          <input
            className="auth-input"
            style={{ ...inputStyle(true), paddingRight: "3rem" }}
            type={showNewPwd ? "text" : "password"}
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <button type="button" style={eyeBtnStyle} onClick={() => setShowNewPwd((v) => !v)} aria-label="Toggle">
            <IconEye crossed={showNewPwd} />
          </button>
          <StrengthBar password={newPwd} />
        </Field>

        <Field label="Confirm password" icon={<IconLock />}>
          <input
            className="auth-input"
            style={{
              ...inputStyle(true),
              borderColor: confirmPwd && confirmPwd !== newPwd ? "#EF4444" : undefined
            }}
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />
          {confirmPwd && confirmPwd !== newPwd && (
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#EF4444" }}>
              Passwords do not match
            </p>
          )}
        </Field>

        <button
          type="submit"
          className="auth-btn-primary"
          style={primaryBtn(status.type === "loading")}
          disabled={!canReset || countdown.expired || status.type === "loading"}
        >
          {status.type === "loading" ? <><Spinner /> Resetting…</> : "Reset Password"}
        </button>
      </form>

      <div style={{
        marginTop: "1.25rem",
        display: "flex",
        justifyContent: "center",
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        <button
          style={ghostLinkStyle(resendCooldown > 0 ? "#9CA3AF" : "#C46A18")}
          onClick={onResend}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
        </button>
        <button style={ghostLinkStyle()} onClick={onBack}>
          Back to sign in
        </button>
      </div>
    </>
  );
}
