const sections = [
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "seo", label: "SEO Pages" },
  { key: "quotes", label: "Quote Requests" },
  { key: "settings", label: "Website Settings" }
];

export default function DashboardLayout({ activeSection, setActiveSection, profile, onLogout, children }) {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h2>Tara Maa Solutions</h2>
        </div>
        <nav className="sidebar-nav">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={activeSection === section.key ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>
            <strong>{profile?.name || "Admin"}</strong>
            <p className="muted small">{profile?.email || "Authenticated session"}</p>
          </div>
          <button type="button" className="secondary full-width" onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <div className="content-shell">{children}</div>
    </div>
  );
}
