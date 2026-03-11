import { useMemo, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import DashboardLayout from "./components/DashboardLayout";
import LoginScreen from "./components/LoginScreen";
import AdminManager from "./components/AdminManager";
import ProductManager from "./components/ProductManager";
import CategoryManager from "./components/CategoryManager";
import SeoPageManager from "./components/SeoPageManager";
import QuoteRequestManager from "./components/QuoteRequestManager";
import SettingsManager from "./components/SettingsManager";

const sectionMeta = {
  admins: {
    title: "Admins Guide",
    navDescription: "Create, edit, activate, and remove admin accounts with role-based access.",
    intro: "Use this section to manage who can access the admin panel. The primary account should remain under your control.",
    exampleTitle: "Example admin account",
    exampleData: {
      name: "Kunal",
      email: "kunal.nic10@gmail.com",
      backupEmail: "kunal.nic10@gmail.com",
      role: "super_admin",
      isActive: "true",
      password: "StrongPass123"
    },
    fields: [
      { field: "Name", activity: "Display name used in the admin panel.", example: "Kunal" },
      { field: "Email", activity: "Main login username for the admin.", example: "kunal.nic10@gmail.com" },
      { field: "Backup email", activity: "Secondary email for recovery-related flows.", example: "kunal.nic10@gmail.com" },
      { field: "Role", activity: "Controls whether the admin can manage other admins.", example: "super_admin" },
      { field: "Password", activity: "Login password for the admin account.", example: "StrongPass123" }
    ]
  },
  products: {
    title: "Product Form Guide",
    navDescription: "Add, edit, price, and publish the product cards shown on the website.",
    intro: "Use this section to create the product cards that appear on the website.",
    exampleTitle: "Example product entry",
    exampleData: {
      name: "MC-212 Sticker Half Cutting Machine",
      slug: "mc-212-sticker-half-cutting-machine",
      sku: "MC-212",
      price: "75000",
      category: "Sticker Half Cutting Machines",
      shortDescription: "Compact sticker half cutting machine for routine label jobs.",
      status: "published",
      image: "/products/mc-212.jpg"
    },
    fields: [
      { field: "Name", activity: "Main product title shown in admin and on the website.", example: "MC-212 Sticker Half Cutting Machine" },
      { field: "SKU", activity: "Internal product code for quick identification.", example: "MC-212" },
      { field: "Price", activity: "Selling amount that appears with the product card.", example: "75000" },
      { field: "Category", activity: "Groups the product under a product type.", example: "Sticker Half Cutting Machines" },
      { field: "Images", activity: "Primary product photo used in frontend cards.", example: "/products/mc-212.jpg" }
    ]
  },
  categories: {
    title: "Category Guide",
    navDescription: "Group products into clean catalog sections and control their visibility.",
    intro: "Use categories to group similar products and keep the catalog organised.",
    exampleTitle: "Example category entry",
    exampleData: {
      name: "Creasing and Perforation Machines",
      slug: "creasing-and-perforation-machines",
      description: "Machines used for clean creasing and perforation jobs.",
      seoTitle: "Creasing and Perforation Machines",
      seoDescription: "Industrial creasing and perforation machines for paper finishing work.",
      sortOrder: "1",
      active: "true"
    },
    fields: [
      { field: "Name", activity: "Visible category title.", example: "Creasing and Perforation Machines" },
      { field: "Slug", activity: "Clean URL-friendly version of the category name.", example: "creasing-and-perforation-machines" },
      { field: "Description", activity: "Short summary of what belongs in this category.", example: "Machines used for clean creasing and perforation jobs." },
      { field: "Sort order", activity: "Controls the display order in listings.", example: "1" },
      { field: "Active", activity: "Shows or hides the category in live use.", example: "Checked means visible" }
    ]
  },
  seo: {
    title: "SEO Page Guide",
    navDescription: "Create landing pages, metadata, and search-friendly content blocks.",
    intro: "Use this section to create landing pages with SEO metadata and structured content.",
    exampleTitle: "Example SEO page entry",
    exampleData: {
      title: "Industrial Creasing Machines in India",
      slug: "industrial-creasing-machines-india",
      metaTitle: "Industrial Creasing Machines Supplier | Tara Maa Solutions",
      metaDescription: "Explore industrial creasing machines with clear pricing and support.",
      canonicalUrl: "https://taramaasolutions.com/industrial-creasing-machines-india",
      ogImage: "https://taramaasolutions.com/og-image.jpg",
      status: "published"
    },
    fields: [
      { field: "Title", activity: "Internal and visible title for the landing page.", example: "Industrial Creasing Machines in India" },
      { field: "Slug", activity: "Page path after the website domain.", example: "industrial-creasing-machines-india" },
      { field: "Meta title", activity: "Search engine title tag.", example: "Industrial Creasing Machines Supplier | Tara Maa Solutions" },
      { field: "Meta description", activity: "Short search engine description.", example: "Explore industrial creasing machines with clear pricing and support." },
      { field: "Page content JSON", activity: "Structured content payload for the landing page.", example: '{"hero":{"title":"Industrial Creasing Machines"}}' }
    ]
  },
  quotes: {
    title: "Quote Requests Guide",
    navDescription: "Review enquiries, change lead status, and reply to customers.",
    intro: "Use this section to review customer enquiries and respond with a standard business reply.",
    exampleTitle: "Example quote reply",
    exampleData: {
      customerName: "Varsha Singh",
      customerEmail: "varshasingh1910@gmail.com",
      subject: "Response to your enquiry from Tara Maa Solutions",
      message: "We have reviewed your requirement and will share the details with you shortly.",
      status: "reviewed"
    },
    fields: [
      { field: "Status", activity: "Tracks the progress of each lead.", example: "New, Reviewed, Closed" },
      { field: "Reply subject", activity: "Email subject line sent to the customer.", example: "Response to your enquiry from Tara Maa Solutions" },
      { field: "Reply message", activity: "Main custom message body between greeting and signoff.", example: "We have reviewed your requirement and will share the details shortly." },
      { field: "Customer email", activity: "Destination email where the response goes.", example: "varshasingh1910@gmail.com" },
      { field: "Product reference", activity: "Helps you respond based on the requested product.", example: "AHC 330 A3 Sticker Half Cutting Machine" }
    ]
  },
  settings: {
    title: "Website Settings Guide",
    navDescription: "Manage site branding, SEO defaults, contact details, and homepage settings.",
    intro: "Use this section to manage website-wide branding, SEO defaults, and homepage details.",
    exampleTitle: "Example website settings",
    exampleData: {
      siteName: "Tara Maa Solutions",
      siteUrl: "https://taramaasolutions.com",
      contactEmail: "kunal.nic10@gmail.com",
      contactPhone: "+91 98765 43210",
      defaultMetaTitle: "Industrial Products Supplier | Tara Maa Solutions",
      heroTitle: "We help you find the right industrial product without wasting time."
    },
    fields: [
      { field: "Site name", activity: "Primary website brand name.", example: "Tara Maa Solutions" },
      { field: "Site URL", activity: "Main public domain of the website.", example: "https://taramaasolutions.com" },
      { field: "Default meta title", activity: "Fallback title used for SEO when page-level title is missing.", example: "Industrial Products Supplier | Tara Maa Solutions" },
      { field: "Contact email", activity: "Website contact email shown in settings-driven places.", example: "kunal.nic10@gmail.com" },
      { field: "Homepage hero title", activity: "Main headline shown on the website homepage.", example: "We help you find the right industrial product without wasting time." }
    ]
  }
};

function GuidancePanel({ section }) {
  const guidance = sectionMeta[section];

  if (!guidance) {
    return null;
  }

  return (
    <section className="panel full-span guidance-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Guidance</p>
          <h3>{guidance.title}</h3>
          <p className="muted small">{guidance.intro}</p>
        </div>
      </div>
      <div className="guidance-grid">
        {guidance.fields.map((item) => (
          <article key={item.field} className="guidance-card">
            <strong>{item.field}</strong>
            <p className="muted small"><span className="guidance-label">What it does:</span> {item.activity}</p>
            <p className="muted small"><span className="guidance-label">Example:</span> {item.example}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const auth = useAuth();
  const [activeSection, setActiveSection] = useState("admins");

  const activeContent = useMemo(() => {
    switch (activeSection) {
      case "admins":
        return <AdminManager token={auth.token} profile={auth.profile} />;
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
  }, [activeSection, auth.token, auth.profile]);

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
      sectionMeta={sectionMeta}
    >
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>{activeSection === "seo" ? "SEO Pages" : sectionMeta[activeSection]?.title.replace(" Guide", "") || activeSection}</h1>
        </div>
      </header>
      {activeContent}
      <GuidancePanel section={activeSection} />
    </DashboardLayout>
  );
}
