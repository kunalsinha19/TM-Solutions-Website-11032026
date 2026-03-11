import { useState } from "react";

const sectionOrder = ["admins", "products", "categories", "seo", "quotes", "settings"];

function ExampleModal({ section, meta, onClose }) {
  if (!section || !meta) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header modal-header">
          <div>
            <p className="eyebrow">Example Data</p>
            <h3>{meta.exampleTitle}</h3>
            <p className="muted small">This shows a sample filled entry for the {meta.title.toLowerCase()} section.</p>
          </div>
          <button type="button" className="secondary" onClick={onClose}>Close</button>
        </div>
        <div className="example-grid">
          {Object.entries(meta.exampleData || {}).map(([key, value]) => (
            <article key={key} className="example-card">
              <strong>{key}</strong>
              <code>{String(value)}</code>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ activeSection, setActiveSection, profile, onLogout, children, sectionMeta }) {
  const [modalSection, setModalSection] = useState("");

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h2>Tara Maa Solutions</h2>
        </div>
        <nav className="sidebar-nav">
          {sectionOrder.map((key) => {
            const meta = sectionMeta[key];

            return (
              <div key={key} className="nav-item-wrap">
                <div className="nav-item-row">
                  <button
                    type="button"
                    className={activeSection === key ? "nav-item active" : "nav-item"}
                    onClick={() => setActiveSection(key)}
                  >
                    {meta.title.replace(" Guide", "")}
                  </button>
                  <button
                    type="button"
                    className="nav-info-button"
                    aria-label={`Show ${meta.title} example`}
                    onClick={() => setModalSection(key)}
                  >
                    i
                  </button>
                </div>
                <div className="nav-tooltip">
                  <strong>{meta.title.replace(" Guide", "")}</strong>
                  <span>{meta.navDescription}</span>
                </div>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div>
            <strong>{profile?.name || "Admin"}</strong>
            <p className="muted small">{profile?.email || "Authenticated session"}</p>
            <p className="muted small">Role: {profile?.role || "admin"}</p>
          </div>
          <button type="button" className="secondary full-width" onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <div className="content-shell">{children}</div>
      <ExampleModal section={modalSection} meta={sectionMeta[modalSection]} onClose={() => setModalSection("")} />
    </div>
  );
}
