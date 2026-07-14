import { useState, useEffect } from "react";

/* ─── SVG Icons ─────────────────────────────────────────────────────── */
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);
const CircleIcon = ({ cx = 12, cy = 12, r, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx={cx} cy={cy} r={r} /></svg>
);

const icons = {
  dashboard:    <Icon d={["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"]} />,
  activity:     <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  visitors:     <Icon d={["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M9 11a4 4 0 100-8 4 4 0 000 8z", "M23 21v-2a4 4 0 00-3-3.87", "M16 3.13a4 4 0 010 7.75"]} />,
  pageAnalytics:<Icon d={["M18 20V10", "M12 20V4", "M6 20v-6"]} />,
  liveVisitors: <Icon d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 100 6 3 3 0 000-6z"]} />,
  products:     <Icon d={["M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", "M3.27 6.96L12 12.01l8.73-5.05", "M12 22.08V12"]} />,
  categories:   <Icon d={["M5 3h4v4H5V3z", "M15 3h4v4h-4V3z", "M5 13h4v4H5v-4z", "M15 13h4v4h-4v-4z"]} />,
  seo:          <Icon d={["M11 19a8 8 0 100-16 8 8 0 000 16z", "M21 21l-4.35-4.35"]} />,
  youtube:      <Icon d={["M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z", "M9.75 15.02V8.98L15.5 12l-5.75 3.02z"]} />,
  brochures:    <Icon d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"]} />,
  quotes:       <Icon d={["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"]} />,
  settings:     <Icon d={["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"]} />,
  admins:       <Icon d={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"]} />,
  systemLogs:   <Icon d={["M4 4l2 2-2 2M4 12h8M12 4l2 2-2 2M12 12h8"]} />,
  profile:      <Icon d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"]} />,
  logout:       <Icon d={["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"]} />,
  chevronLeft:  <Icon d="M15 18l-6-6 6-6" />,
  menu:         <Icon d={["M3 12h18", "M3 6h18", "M3 18h18"]} />,
  close:        <Icon d={["M18 6L6 18", "M6 6l12 12"]} />,
};

/* ─── Nav structure ──────────────────────────────────────────────────── */
const NAV = [
  {
    group: "Overview",
    items: [
      { key: "dashboard",    label: "Dashboard",      icon: "dashboard"     },
      { key: "activityLogs", label: "Activity Logs",  icon: "activity"      },
    ],
  },
  {
    group: "Analytics",
    items: [
      { key: "visitors",     label: "Visitors",       icon: "visitors",     badge: "live" },
      { key: "pageAnalytics",label: "Page Analytics", icon: "pageAnalytics" },
      { key: "liveVisitors", label: "Live Visitors",  icon: "liveVisitors"  },
    ],
  },
  {
    group: "Content",
    items: [
      { key: "products",     label: "Products",       icon: "products"      },
      { key: "categories",   label: "Categories",     icon: "categories"    },
      { key: "seo",          label: "SEO Pages",      icon: "seo"           },
      { key: "youtubeShorts",label: "YouTube Shorts", icon: "youtube"       },
      { key: "brochures",    label: "Brochures",      icon: "brochures"     },
    ],
  },
  {
    group: "Operations",
    items: [
      { key: "quotes",       label: "Quote Requests", icon: "quotes"        },
      { key: "settings",     label: "Website Settings",icon: "settings"     },
    ],
  },
  {
    group: "Admin",
    items: [
      { key: "admins",       label: "Admins",         icon: "admins"        },
      { key: "systemLogs",   label: "System Logs",    icon: "systemLogs"    },
      { key: "profile",      label: "My Profile",     icon: "profile"       },
    ],
  },
];

function getInitials(name) {
  if (!name) return "A";
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

/* ─── Sidebar content ────────────────────────────────────────────────── */
function SidebarContent({ activeSection, onNavigate, profile, onLogout }) {
  return (
    <>
      {/* Brand */}
      <div className="dl-brand">
        <div className="dl-brand-logo">TMS</div>
        <div className="dl-brand-text">
          <p className="dl-brand-name">Tara Maa Solutions</p>
          <p className="dl-brand-sub">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="dl-nav">
        {NAV.map(({ group, items }) => (
          <div key={group} className="dl-nav-group">
            <p className="dl-nav-group-label">{group}</p>
            {items.map(({ key, label, icon, badge }) => (
              <button
                key={key}
                type="button"
                className={`dl-nav-item${activeSection === key ? " dl-nav-item--active" : ""}`}
                onClick={() => onNavigate(key)}
              >
                <span className="dl-nav-icon">{icons[icon]}</span>
                <span className="dl-nav-label">{label}</span>
                {badge === "live" && <span className="dl-live-dot" />}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="dl-sidebar-footer">
        <div className="dl-user">
          <div className="dl-user-avatar">{getInitials(profile?.name)}</div>
          <div className="dl-user-info">
            <p className="dl-user-name">{profile?.name || "Admin"}</p>
            <p className="dl-user-role">{profile?.role || "admin"}</p>
          </div>
        </div>
        <button type="button" className="dl-logout-btn" onClick={onLogout}>
          {icons.logout}
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}

/* ─── Main layout ────────────────────────────────────────────────────── */
export default function DashboardLayout({ activeSection, setActiveSection, profile, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [activeSection]);

  // Close on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const currentItem = NAV.flatMap(g => g.items).find(i => i.key === activeSection);

  return (
    <div className="dl-shell">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="dl-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className="dl-sidebar dl-sidebar--desktop">
        <SidebarContent
          activeSection={activeSection}
          onNavigate={setActiveSection}
          profile={profile}
          onLogout={onLogout}
        />
      </aside>

      {/* Mobile slide-in drawer */}
      <aside className={`dl-sidebar dl-sidebar--mobile${mobileOpen ? " dl-sidebar--open" : ""}`}>
        <button
          type="button"
          className="dl-drawer-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          {icons.close}
        </button>
        <SidebarContent
          activeSection={activeSection}
          onNavigate={setActiveSection}
          profile={profile}
          onLogout={onLogout}
        />
      </aside>

      {/* Main area */}
      <div className="dl-main">
        {/* Mobile topbar */}
        <header className="dl-topbar">
          <button
            type="button"
            className="dl-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            {icons.menu}
          </button>
          <div className="dl-topbar-center">
            <span className="dl-topbar-icon">{icons[currentItem?.icon]}</span>
            <span className="dl-topbar-title">{currentItem?.label || "Admin"}</span>
          </div>
          <div className="dl-topbar-avatar">{getInitials(profile?.name)}</div>
        </header>

        {/* Page content */}
        <main className="dl-content">
          {children}
        </main>
      </div>
    </div>
  );
}
