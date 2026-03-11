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
  masterEmail: "",
  socialLinks: [],
  analytics: { googleAnalyticsId: "" },
  seoDefaults: { robots: "index,follow", ogImage: "" },
  homepage: { heroTitle: "", heroSubtitle: "", featuredProductIds: [] }
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
          <label><span>Master email</span><input value={form.masterEmail} onChange={(e) => setForm({ ...form, masterEmail: e.target.value })} /></label>
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
