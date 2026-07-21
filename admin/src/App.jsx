import { useMemo, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import DashboardLayout from "./components/DashboardLayout";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import AdminManager from "./components/AdminManager";
import ProductManager from "./components/ProductManager";
import CategoryManager from "./components/CategoryManager";
import SeoPageManager from "./components/SeoPageManager";
import QuoteRequestManager from "./components/QuoteRequestManager";
import SettingsManager from "./components/SettingsManager";
import VisitorsManager from "./components/VisitorsManager";
import ActivityLogs from "./components/ActivityLogs";
import BrochureManager from "./components/BrochureManager";
import ProfileManager from "./components/ProfileManager";
import YouTubeManager from "./components/YouTubeManager";
import LiveVisitors from "./components/LiveVisitors";
import SystemLogs from "./components/SystemLogs";
import PageAnalytics from "./components/PageAnalytics";

const PAGE_TITLES = {
  dashboard:    "Dashboard",
  visitors:     "Visitors",
  pageAnalytics:"Page Analytics",
  liveVisitors: "Live Visitors",
  products:     "Products",
  categories:   "Categories",
  seo:          "SEO Pages",
  youtubeShorts:"YouTube Shorts",
  brochures:    "Brochures",
  quotes:       "Quote Requests",
  settings:     "Website Settings",
  admins:       "Admins",
  activityLogs: "Activity Logs",
  systemLogs:   "System Logs",
  profile:      "My Profile",
};

function ComingSoon({ title }) {
  return (
    <div className="panel" style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚧</div>
      <h3>{title}</h3>
      <p className="muted">Visitor tracking data will populate here once tracking is active.</p>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  const activeContent = useMemo(() => {
    const t = auth.token;
    switch (activeSection) {
      case "dashboard":     return <Dashboard token={t} />;
      case "visitors":      return <VisitorsManager token={t} />;
      case "liveVisitors":  return <LiveVisitors token={t} />;
      case "pageAnalytics": return <PageAnalytics token={t} />;
      case "products":      return <ProductManager token={t} />;
      case "categories":    return <CategoryManager token={t} />;
      case "seo":           return <SeoPageManager token={t} />;
      case "youtubeShorts": return <YouTubeManager token={t} />;
      case "brochures":     return <BrochureManager token={t} />;
      case "quotes":        return <QuoteRequestManager token={t} />;
      case "settings":      return <SettingsManager token={t} />;
      case "admins":        return <AdminManager token={t} profile={auth.profile} />;
      case "activityLogs":  return <ActivityLogs token={t} />;
      case "systemLogs":    return <SystemLogs token={t} />;
      case "profile":       return <ProfileManager token={t} profile={auth.profile} />;
      default:              return null;
    }
  }, [activeSection, auth.token, auth.profile]);

  if (auth.loadingProfile) {
    return (
      <div className="loading-screen">
        <div className="dash-spinner" style={{ margin: "0 auto 1rem" }} />
        Checking admin session…
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <LoginScreen onAuthenticated={auth.saveSession} />;
  }

  return (
    <DashboardLayout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      profile={auth.profile}
      onLogout={auth.logout}
    >
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>{PAGE_TITLES[activeSection] || activeSection}</h1>
        </div>
      </header>
      {activeContent}
    </DashboardLayout>
  );
}
