import { useMemo, useState } from "react";
import { api } from "../lib/api";

export default function LoginScreen({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("credentials");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const canSubmitCredentials = useMemo(() => email && password, [email, password]);

  async function handleCredentialsSubmit(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: "Requesting OTP..." });

    try {
      const response = await api.requestLoginOtp(email, password);
      setStep("otp");
      setStatus({ type: "success", message: response.message || "OTP sent to admin email." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleOtpSubmit(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: "Verifying OTP..." });

    try {
      const response = await api.verifyLoginOtp(email, otp);
      onAuthenticated(response.token, email, response.admin);
      setStatus({ type: "success", message: "Login successful." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        <p className="eyebrow">Tara Maa Solutions</p>
        <h1>Admin OTP Login</h1>
        <p className="muted">Use your email and password, then verify the OTP sent to your admin inbox.</p>

        {step === "credentials" ? (
          <form className="stack" onSubmit={handleCredentialsSubmit}>
            <label>
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" />
            </label>
            <label>
              <span>Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
            </label>
            <button type="submit" disabled={!canSubmitCredentials || status.type === "loading"}>Request OTP</button>
          </form>
        ) : (
          <form className="stack" onSubmit={handleOtpSubmit}>
            <label>
              <span>Email</span>
              <input value={email} disabled />
            </label>
            <label>
              <span>OTP</span>
              <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6-digit OTP" />
            </label>
            <div className="row gap-sm">
              <button type="submit" disabled={!otp || status.type === "loading"}>Verify OTP</button>
              <button type="button" className="secondary" onClick={() => setStep("credentials")}>Back</button>
            </div>
          </form>
        )}

        {status.message ? <p className={`feedback ${status.type}`}>{status.message}</p> : null}
      </div>
    </div>
  );
}
