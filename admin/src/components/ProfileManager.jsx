import { useState } from "react";
import { api } from "../lib/api.js";

export default function ProfileManager({ token, profile, onProfileUpdate }) {
  const [form, setForm] = useState({
    name:        profile?.name        || "",
    email:       profile?.email       || "",
    backupEmail: profile?.backupEmail || "",
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [feedback, setFeedback] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  function flash(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 4000);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      flash("error", "Passwords do not match."); return;
    }
    if (form.newPassword && form.newPassword.length < 8) {
      flash("error", "Password must be at least 8 characters."); return;
    }
    setLoading(true);
    try {
      const payload = {
        name:        form.name,
        backupEmail: form.backupEmail,
        ...(form.newPassword ? { password: form.newPassword } : {}),
      };
      await api.updateAdmin(token, profile?._id, payload);
      flash("success", "Profile updated successfully.");
      setForm(f => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      flash("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Account</p>
            <h3>My Profile</h3>
            <p className="muted small">Update your display name, backup email, or password.</p>
          </div>
          <div className="profile-avatar-large">{(profile?.name || "A")[0].toUpperCase()}</div>
        </div>

        {feedback.msg && (
          <div className={`feedback ${feedback.type}`} style={{ marginBottom: "1rem" }}>
            {feedback.msg}
          </div>
        )}

        <form className="stack" onSubmit={handleSave}>
          <label>
            <span>Display Name</span>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            <span>Email (login — cannot be changed here)</span>
            <input value={form.email} readOnly style={{ opacity: 0.6 }} />
          </label>
          <label>
            <span>Backup Email</span>
            <input type="email" value={form.backupEmail} onChange={e => setForm(f => ({ ...f, backupEmail: e.target.value }))} />
          </label>

          <hr style={{ border: "none", borderTop: "1px solid #e5dece", margin: "0.5rem 0" }} />
          <p className="label">Change Password <span className="muted small">(leave blank to keep current)</span></p>

          <label>
            <span>New Password</span>
            <input
              type="password"
              placeholder="Min 8 characters"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            />
          </label>
          <label>
            <span>Confirm New Password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </form>

        <div className="profile-info-block">
          <p className="muted small">Role: <strong>{profile?.role || "admin"}</strong></p>
          <p className="muted small">Last login: {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "—"}</p>
          <p className="muted small">Member since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</p>
        </div>
      </div>
    </div>
  );
}
