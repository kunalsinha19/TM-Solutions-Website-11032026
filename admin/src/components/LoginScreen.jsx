import { useMemo, useState } from "react";
import { api } from "../lib/api";

export default function LoginScreen({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const canSubmit = useMemo(() => email && password, [email, password]);

  async function handleSubmit(event) {
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

  return (
    <div className="login-shell">
      <div className="login-panel">
        <p className="eyebrow">Tara Maa Solutions</p>
        <h1>Admin Login</h1>
        <p className="muted">Use your admin email and password to sign in.</p>

        <form className="stack" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          </label>
          <button type="submit" disabled={!canSubmit || status.type === "loading"}>Sign In</button>
        </form>

        {status.message ? <p className={`feedback ${status.type}`}>{status.message}</p> : null}
      </div>
    </div>
  );
}
