import { useMemo, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import DashboardLayout from "./components/DashboardLayout";
import LoginScreen from "./components/LoginScreen";
import ProductManager from "./components/ProductManager";
import CategoryManager from "./components/CategoryManager";
import SeoPageManager from "./components/SeoPageManager";
import QuoteRequestManager from "./components/QuoteRequestManager";
import SettingsManager from "./components/SettingsManager";

export default function App() {
  const auth = useAuth();
  const [activeSection, setActiveSection] = useState("products");

  const activeContent = useMemo(() => {
    switch (activeSection) {
      case "products":
        return <ProductManager token={auth.token} />;
      case "categories":
        return <CategoryManager token={auth.token} />;
      case "seo":
        return <SeoPageManager token={auth.token} />;
      case "quotes":
        return <QuoteRequestManager token={auth.token} />;
      case "settings":
        return <SettingsManager token={auth.token} />;
      default:
        return null;
    }
  }, [activeSection, auth.token]);

  if (auth.loadingProfile) {
    return <div className="loading-screen">Checking admin session...</div>;
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
          <h1>{activeSection === "seo" ? "SEO Pages" : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
        </div>
      </header>
      {activeContent}
    </DashboardLayout>
  );
}
