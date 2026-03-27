import { useEffect, useState } from "react";
import { api } from "../lib/api";

const defaultWhatWeDoItems = [
  {
    title: "Easy product search",
    description: "Find products by category and quickly understand what they are used for."
  },
  {
    title: "Helpful guidance",
    description: "If you are not sure which product fits your need, we help you choose the right option."
  },
  {
    title: "Quick quote support",
    description: "Send your requirement and our team will get back to you with the next steps."
  }
];

const emptySettings = {
  siteName: "",
  siteUrl: "",
  defaultMetaTitle: "",
  defaultMetaDescription: "",
  logoUrl: "",
  faviconUrl: "",
  themeMode: "system",
  contactInfo: { email: "", phone: "", address: "" },
  masterEmail: "",
  socialLinks: [],
  analytics: { googleAnalyticsId: "" },
  seoDefaults: { robots: "index,follow", ogImage: "" },
  homepage: {
    heroTitle: "We help you find the right industrial product without wasting time.",
    heroSubtitle: "Browse products, check categories, and send us your requirement in a few simple steps. We keep the process clear, fast, and easy to understand.",
    featuredProductIds: [],
    aboutTitle: "A modern B2B platform for industrial printing, finishing, and office automation.",
    aboutDescription: "Tara Maa Solutions helps businesses discover, compare, and source reliable equipment, consumables, and workflow tools with clarity and confidence.",
    aboutIntro: "We believe the future of industrial procurement is digital, transparent, and data-driven. Our platform blends technology, industry expertise, and guided quote workflows so teams can make smarter buying decisions and modernize production environments.",
    aboutParagraphs: [
      "Beyond product listings, we aim to be a knowledge and innovation hub for the printing and finishing industry by offering insights, analytics, and structured guidance that reduce guesswork and improve outcomes.",
      "We curate dependable machines, lamination systems, finishing equipment, sublimation tools, office automation products, and industrial consumables from trusted manufacturers and suppliers. The goal is simple: make procurement clear, faster, and more predictable for every business."
    ],
    aboutImageUrl: "",
    visionTitle: "Vision",
    visionDescription: "To become a trusted global platform for industrial printing, finishing, and automation solutions, enabling businesses to grow through innovation, accessibility, and data-driven procurement.",
    missionTitle: "Mission",
    missionItems: [
      "Simplify the procurement of industrial equipment and consumables.",
      "Connect manufacturers, distributors, and businesses through one unified marketplace.",
      "Provide technology-driven tools and analytics for smarter operational decisions.",
      "Build a reliable, transparent ecosystem for the printing and finishing industry."
    ],
    offerTitle: "What we offer",
    offerItems: [
      "Industrial printing and finishing equipment",
      "Lamination and binding solutions",
      "Office automation tools",
      "Sublimation and custom printing equipment",
      "Industrial consumables",
      "Workflow and procurement support"
    ],
    whatWeDoTitle: "We make industrial buying simpler for your business.",
    whatWeDoDescription: "You do not need to search through confusing technical pages. We show products clearly and help you reach the right team quickly.",
    whatWeDoItems: defaultWhatWeDoItems
  }
};

export default function SettingsManager({ token }) {
  const [form, setForm] = useState(emptySettings);
  const [status, setStatus] = useState("");
  const [logoUpload, setLogoUpload] = useState({ file: null, preview: "", uploadedUrl: "", status: "" });

  async function loadSettings() {
    try {
      const response = await api.getSettings();
      if (response.settings) {
        setForm({
          ...emptySettings,
          ...response.settings,
          contactInfo: { ...emptySettings.contactInfo, ...(response.settings.contactInfo || {}) },
          analytics: { ...emptySettings.analytics, ...(response.settings.analytics || {}) },
          seoDefaults: { ...emptySettings.seoDefaults, ...(response.settings.seoDefaults || {}) },
          homepage: { ...emptySettings.homepage, ...(response.settings.homepage || {}) },
          socialLinks: response.settings.socialLinks || []
        });
      }
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    return () => {
      if (logoUpload.preview) {
        URL.revokeObjectURL(logoUpload.preview);
      }
    };
  }, [logoUpload.preview]);

  function updateSocialLink(index, key, value) {
    const nextLinks = [...form.socialLinks];
    nextLinks[index] = { ...nextLinks[index], [key]: value };
    setForm({ ...form, socialLinks: nextLinks });
  }

  function updateHomepageField(key, value) {
    setForm({ ...form, homepage: { ...form.homepage, [key]: value } });
  }

  function updateArrayField(key, index, value) {
    const next = [...(form.homepage[key] || [])];
    next[index] = value;
    updateHomepageField(key, next);
  }

  function addArrayFieldItem(key, value = "") {
    updateHomepageField(key, [...(form.homepage[key] || []), value]);
  }

  function removeArrayFieldItem(key, index) {
    updateHomepageField(key, (form.homepage[key] || []).filter((_, current) => current !== index));
  }

  function updateWhatWeDoItem(index, key, value) {
    const items = [...(form.homepage.whatWeDoItems || [])];
    items[index] = { ...items[index], [key]: value };
    updateHomepageField("whatWeDoItems", items);
  }

  function handleLogoFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (logoUpload.preview) {
      URL.revokeObjectURL(logoUpload.preview);
    }

    setLogoUpload({
      file,
      preview: URL.createObjectURL(file),
      uploadedUrl: "",
      status: ""
    });
  }

  async function handleLogoUpload() {
    if (!logoUpload.file) {
      setLogoUpload((current) => ({ ...current, status: "Select a logo file before uploading." }));
      return;
    }

    try {
      setLogoUpload((current) => ({ ...current, status: "Uploading logo..." }));
      const response = await api.uploadMedia(token, logoUpload.file);
      setLogoUpload((current) => ({
        ...current,
        uploadedUrl: response.url,
        status: "Upload complete. Confirm to use this logo."
      }));
    } catch (error) {
      setLogoUpload((current) => ({ ...current, status: error.message }));
    }
  }

  async function confirmLogoUsage() {
    if (!logoUpload.uploadedUrl) {
      return;
    }

    const approved = window.confirm("Use this uploaded logo on the website header?");
    if (!approved) {
      return;
    }

    try {
      setLogoUpload((current) => ({ ...current, status: "Saving logo..." }));
      const response = await api.updateLogo(token, logoUpload.uploadedUrl);
      if (response.settings) {
        setForm((current) => ({ ...current, logoUrl: response.settings.logoUrl || logoUpload.uploadedUrl }));
      }
      setLogoUpload((current) => ({ ...current, status: "Logo saved. Refresh the website to see the update." }));
    } catch (error) {
      setLogoUpload((current) => ({ ...current, status: error.message }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await api.saveSettings(token, form);
      setStatus("Website settings updated.");
      await loadSettings();
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="panel full-span">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Website Settings</p>
          <h3>Global site configuration</h3>
        </div>
      </div>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="grid-two">
          <label><span>Site name</span><input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} /></label>
          <label><span>Site URL</span><input value={form.siteUrl} onChange={(e) => setForm({ ...form, siteUrl: e.target.value })} /></label>
        </div>
        <div className="grid-two">
          <label><span>Default meta title</span><input value={form.defaultMetaTitle} onChange={(e) => setForm({ ...form, defaultMetaTitle: e.target.value })} /></label>
          <label><span>Default meta description</span><input value={form.defaultMetaDescription} onChange={(e) => setForm({ ...form, defaultMetaDescription: e.target.value })} /></label>
        </div>
        <div className="grid-two">
          <label><span>Logo URL</span><input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></label>
          <label><span>Favicon URL</span><input value={form.faviconUrl} onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })} /></label>
        </div>
        <div className="logo-upload-block">
          <div className="logo-upload-frame">
            {logoUpload.preview ? (
              <img src={logoUpload.preview} alt="Logo preview" />
            ) : form.logoUrl ? (
              <img src={form.logoUrl} alt="Current logo" />
            ) : (
              <span>Logo preview</span>
            )}
          </div>
          <div className="logo-upload-controls">
            <label className="stack">
              <span>Upload logo image</span>
              <input type="file" accept="image/*" onChange={handleLogoFileChange} />
            </label>
            <div className="row gap-sm wrap">
              <button type="button" className="secondary" onClick={handleLogoUpload} disabled={!logoUpload.file}>Upload</button>
              <button type="button" onClick={confirmLogoUsage} disabled={!logoUpload.uploadedUrl}>Use uploaded logo</button>
            </div>
            {logoUpload.status ? <p className="muted small">{logoUpload.status}</p> : null}
            <p className="muted small">Recommended size: square logo, 256x256 or higher. Transparent PNG works best.</p>
          </div>
        </div>
        <div className="grid-two">
          <label><span>Contact email</span><input value={form.contactInfo.email} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, email: e.target.value } })} /></label>
          <label><span>Master email</span><input value={form.masterEmail} onChange={(e) => setForm({ ...form, masterEmail: e.target.value } })} /></label>
        </div>
        <div className="grid-two">
          <label><span>Contact phone</span><input value={form.contactInfo.phone} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, phone: e.target.value } })} /></label>
          <label><span>Address</span><textarea rows="3" value={form.contactInfo.address} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, address: e.target.value } })} /></label>
        </div>
        <div className="grid-two">
          <label><span>Theme mode</span>
            <select value={form.themeMode} onChange={(e) => setForm({ ...form, themeMode: e.target.value })}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label><span>Google Analytics ID</span><input value={form.analytics.googleAnalyticsId} onChange={(e) => setForm({ ...form, analytics: { ...form.analytics, googleAnalyticsId: e.target.value } })} /></label>
        </div>
        <div className="grid-two">
          <label><span>Robots</span><input value={form.seoDefaults.robots} onChange={(e) => setForm({ ...form, seoDefaults: { ...form.seoDefaults, robots: e.target.value } })} /></label>
          <label><span>Default OG image</span><input value={form.seoDefaults.ogImage} onChange={(e) => setForm({ ...form, seoDefaults: { ...form.seoDefaults, ogImage: e.target.value } })} /></label>
        </div>
        <div className="grid-two">
          <label><span>Homepage hero title</span><input value={form.homepage.heroTitle} onChange={(e) => updateHomepageField("heroTitle", e.target.value)} /></label>
          <label><span>Homepage hero subtitle</span><input value={form.homepage.heroSubtitle} onChange={(e) => updateHomepageField("heroSubtitle", e.target.value)} /></label>
        </div>

        <div className="stack">
          <h4>About section</h4>
          <label><span>About title</span><input value={form.homepage.aboutTitle} onChange={(e) => updateHomepageField("aboutTitle", e.target.value)} /></label>
          <label><span>About description</span><textarea rows="3" value={form.homepage.aboutDescription} onChange={(e) => updateHomepageField("aboutDescription", e.target.value)} /></label>
          <label><span>Intro paragraph</span><textarea rows="4" value={form.homepage.aboutIntro} onChange={(e) => updateHomepageField("aboutIntro", e.target.value)} /></label>
          <label><span>About image URL (optional)</span><input value={form.homepage.aboutImageUrl} onChange={(e) => updateHomepageField("aboutImageUrl", e.target.value)} /></label>

          <div className="stack">
            <div className="row gap-sm align-center">
              <span className="label">About paragraphs</span>
              <button type="button" className="secondary" onClick={() => addArrayFieldItem("aboutParagraphs")}>+ Add paragraph</button>
            </div>
            {form.homepage.aboutParagraphs.map((paragraph, index) => (
              <div key={`about-paragraph-${index}`} className="row gap-sm">
                <textarea rows="3" value={paragraph} onChange={(e) => updateArrayField("aboutParagraphs", index, e.target.value)} />
                <button type="button" className="danger" onClick={() => removeArrayFieldItem("aboutParagraphs", index)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="grid-two">
            <label><span>Vision title</span><input value={form.homepage.visionTitle} onChange={(e) => updateHomepageField("visionTitle", e.target.value)} /></label>
            <label><span>Mission title</span><input value={form.homepage.missionTitle} onChange={(e) => updateHomepageField("missionTitle", e.target.value)} /></label>
          </div>
          <label><span>Vision description</span><textarea rows="3" value={form.homepage.visionDescription} onChange={(e) => updateHomepageField("visionDescription", e.target.value)} /></label>

          <div className="stack">
            <div className="row gap-sm align-center">
              <span className="label">Mission items</span>
              <button type="button" className="secondary" onClick={() => addArrayFieldItem("missionItems")}>+ Add item</button>
            </div>
            {form.homepage.missionItems.map((item, index) => (
              <div key={`mission-item-${index}`} className="row gap-sm">
                <input value={item} onChange={(e) => updateArrayField("missionItems", index, e.target.value)} />
                <button type="button" className="danger" onClick={() => removeArrayFieldItem("missionItems", index)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="stack">
            <div className="row gap-sm align-center">
              <span className="label">What we offer</span>
              <button type="button" className="secondary" onClick={() => addArrayFieldItem("offerItems")}>+ Add item</button>
            </div>
            <input value={form.homepage.offerTitle} onChange={(e) => updateHomepageField("offerTitle", e.target.value)} />
            {form.homepage.offerItems.map((item, index) => (
              <div key={`offer-item-${index}`} className="row gap-sm">
                <input value={item} onChange={(e) => updateArrayField("offerItems", index, e.target.value)} />
                <button type="button" className="danger" onClick={() => removeArrayFieldItem("offerItems", index)}>Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <h4>What we do section</h4>
          <label><span>Section title</span><input value={form.homepage.whatWeDoTitle} onChange={(e) => updateHomepageField("whatWeDoTitle", e.target.value)} /></label>
          <label><span>Section description</span><textarea rows="3" value={form.homepage.whatWeDoDescription} onChange={(e) => updateHomepageField("whatWeDoDescription", e.target.value)} /></label>
          <div className="stack">
            <div className="row gap-sm align-center">
              <span className="label">Cards</span>
              <button type="button" className="secondary" onClick={() => updateHomepageField("whatWeDoItems", [...(form.homepage.whatWeDoItems || []), { title: "", description: "" }])}>+ Add card</button>
            </div>
            {form.homepage.whatWeDoItems.map((item, index) => (
              <div key={`wtd-${index}`} className="grid-two">
                <input value={item.title} placeholder="Title" onChange={(e) => updateWhatWeDoItem(index, "title", e.target.value)} />
                <input value={item.description} placeholder="Description" onChange={(e) => updateWhatWeDoItem(index, "description", e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <button type="submit">Save Settings</button>
        {status ? <p className="muted small">{status}</p> : null}
      </form>
    </section>
  );
}
