import { useEffect, useState } from "react";
import { api } from "../lib/api";

const emptySettings = {
  siteName: "",
  siteUrl: "",
  defaultMetaTitle: "",
  defaultMetaDescription: "",
  logoUrl: "",
  faviconUrl: "",
  themeMode: "system",
  contactInfo: { email: "", phone: "", address: "" },
  socialLinks: [],
  analytics: { googleAnalyticsId: "" },
  seoDefaults: { robots: "index,follow", ogImage: "" },
  homepage: { heroTitle: "", heroSubtitle: "", featuredProductIds: [] }
};

export default function SettingsManager({ token }) {
  const [form, setForm] = useState(emptySettings);
  const [status, setStatus] = useState("");

  async function loadSettings() {
    try {
      const response = await api.getSettings();
      if (response.settings) {
        setForm({ ...emptySettings, ...response.settings, contactInfo: { ...emptySettings.contactInfo, ...(response.settings.contactInfo || {}) }, analytics: { ...emptySettings.analytics, ...(response.settings.analytics || {}) }, seoDefaults: { ...emptySettings.seoDefaults, ...(response.settings.seoDefaults || {}) }, homepage: { ...emptySettings.homepage, ...(response.settings.homepage || {}) }, socialLinks: response.settings.socialLinks || [] });
      }
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function updateSocialLink(index, key, value) {
    const nextLinks = [...form.socialLinks];
    nextLinks[index] = { ...nextLinks[index], [key]: value };
    setForm({ ...form, socialLinks: nextLinks });
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
        <div className="grid-two">
          <label><span>Contact email</span><input value={form.contactInfo.email} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, email: e.target.value } })} /></label>
          <label><span>Contact phone</span><input value={form.contactInfo.phone} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, phone: e.target.value } })} /></label>
        </div>
        <label><span>Address</span><textarea rows="3" value={form.contactInfo.address} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, address: e.target.value } })} /></label>
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
          <label><span>Homepage hero title</span><input value={form.homepage.heroTitle} onChange={(e) => setForm({ ...form, homepage: { ...form.homepage, heroTitle: e.target.value } })} /></label>
          <label><span>Homepage hero subtitle</span><input value={form.homepage.heroSubtitle} onChange={(e) => setForm({ ...form, homepage: { ...form.homepage, heroSubtitle: e.target.value } })} /></label>
        </div>
        <div className="stack">
          <div className="row gap-sm align-center">
            <span className="label">Social links</span>
            <button type="button" className="secondary" onClick={() => setForm({ ...form, socialLinks: [...form.socialLinks, { label: "", url: "" }] })}>Add Social Link</button>
          </div>
          {form.socialLinks.map((link, index) => (
            <div key={`social-${index}`} className="grid-two">
              <input value={link.label} placeholder="Label" onChange={(e) => updateSocialLink(index, "label", e.target.value)} />
              <div className="row gap-sm">
                <input value={link.url} placeholder="https://..." onChange={(e) => updateSocialLink(index, "url", e.target.value)} />
                <button type="button" className="danger" onClick={() => setForm({ ...form, socialLinks: form.socialLinks.filter((_, currentIndex) => currentIndex !== index) })}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <button type="submit">Save Settings</button>
        {status ? <p className="muted small">{status}</p> : null}
      </form>
    </section>
  );
}
