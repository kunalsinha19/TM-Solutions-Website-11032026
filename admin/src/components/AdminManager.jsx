import { useEffect, useState } from "react";
import { api } from "../lib/api";

const emptyAdmin = {
  name: "",
  email: "",
  backupEmail: "",
  password: "",
  role: "admin",
  isActive: true
};

function validateAdmin(form, editingId) {
  if (!form.name.trim() || form.name.trim().length < 2) {
    return "Admin name must be at least 2 characters.";
  }

  if (!form.email.trim()) {
    return "Email is required.";
  }

  if (!form.backupEmail.trim()) {
    return "Backup email is required.";
  }

  if (!editingId && (!form.password || form.password.length < 8)) {
    return "Password must be at least 8 characters for new admin accounts.";
  }

  if (editingId && form.password && form.password.length < 8) {
    return "New password must be at least 8 characters.";
  }

  return "";
}

export default function AdminManager({ token, profile }) {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyAdmin);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAdmins() {
    setLoading(true);
    try {
      const response = await api.getAdmins(token);
      setAdmins(response.admins || []);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, [token]);

  function startEdit(admin) {
    setEditingId(admin._id);
    setForm({
      name: admin.name || "",
      email: admin.email || "",
      backupEmail: admin.backupEmail || "",
      password: "",
      role: admin.role || "admin",
      isActive: admin.isActive !== false
    });
    setStatus("");
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyAdmin);
    setStatus("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateAdmin(form, editingId);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      backupEmail: form.backupEmail.trim().toLowerCase(),
      role: form.role,
      isActive: form.isActive
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      if (editingId) {
        await api.updateAdmin(token, editingId, payload);
        setStatus("Admin updated successfully.");
      } else {
        await api.createAdmin(token, payload);
        setStatus("Admin created successfully.");
      }
      resetForm();
      await loadAdmins();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this admin account?")) {
      return;
    }

    try {
      await api.deleteAdmin(token, id);
      await loadAdmins();
      if (editingId === id) {
        resetForm();
      }
      setStatus("Admin deleted.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="module-grid">
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Admins</p>
            <h3>{editingId ? "Edit admin" : "Create admin"}</h3>
          </div>
          {editingId ? <button type="button" className="secondary" onClick={resetForm}>New Admin</button> : null}
        </div>
        <form className="stack" onSubmit={handleSubmit}>
          <label><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span>Backup email</span><input type="email" value={form.backupEmail} onChange={(e) => setForm({ ...form, backupEmail: e.target.value })} /></label>
          <label>
            <span>{editingId ? "New password (optional)" : "Password"}</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <small className="muted">Use 8 or more characters. Leave blank while editing if the password should stay unchanged.</small>
          </label>
          <div className="grid-two">
            <label>
              <span>Role</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </label>
            <label className="checkbox-row"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><span>Active account</span></label>
          </div>
          <button type="submit">{editingId ? "Update Admin" : "Create Admin"}</button>
          {status ? <p className="muted small">{status}</p> : null}
        </form>
      </section>

      <section className="panel list-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Access Control</p>
            <h3>Admin Accounts</h3>
          </div>
          <button type="button" className="secondary" onClick={loadAdmins}>Refresh</button>
        </div>
        {loading ? <p className="muted">Loading admin accounts...</p> : (
          <div className="stack">
            {admins.map((admin) => (
              <article key={admin._id} className="list-card">
                <div>
                  <strong>{admin.name}{admin.email === "kunal.nic10@gmail.com" ? " (Primary Admin)" : ""}</strong>
                  <p className="muted small">{admin.email} · {admin.role} · {admin.isActive ? "Active" : "Inactive"}</p>
                  <p className="muted small">Backup: {admin.backupEmail}</p>
                  {String(admin._id) === String(profile?._id) ? <p className="muted small">Current logged-in admin</p> : null}
                </div>
                <div className="row gap-sm wrap">
                  <button type="button" className="secondary" onClick={() => startEdit(admin)}>Edit</button>
                  {String(admin._id) !== String(profile?._id) ? <button type="button" className="danger" onClick={() => handleDelete(admin._id)}>Delete</button> : null}
                </div>
              </article>
            ))}
            {!admins.length ? <p className="muted">No admin accounts found.</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}
