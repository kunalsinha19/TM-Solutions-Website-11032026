import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const defaultWhatWeDoItems = [
  { title: "Easy product search", description: "Find products by category and quickly understand what they are used for." },
  { title: "Helpful guidance", description: "If you are not sure which product fits your need, we help you choose the right option." },
  { title: "Quick quote support", description: "Send your requirement and our team will get back to you with the next steps." }
];

const emptySettings = {
  siteName: "", siteUrl: "", defaultMetaTitle: "", defaultMetaDescription: "",
  logoUrl: "", faviconUrl: "", themeMode: "system",
  contactInfo: { email: "", phone: "", address: "" },
  masterEmail: "", socialLinks: [],
  analytics: { googleAnalyticsId: "" },
  seoDefaults: { robots: "index,follow", ogImage: "" },
  homepage: {
    heroTitle: "We help you find the right industrial product without wasting time.",
    heroSubtitle: "Browse products, check categories, and send us your requirement in a few simple steps.",
    featuredProductIds: [],
    aboutTitle: "A modern B2B platform for industrial printing, finishing, and office automation.",
    aboutDescription: "", aboutIntro: "", aboutParagraphs: [], aboutImageUrl: "",
    visionTitle: "Vision", visionDescription: "",
    missionTitle: "Mission", missionItems: [],
    offerTitle: "What we offer", offerItems: [],
    whatWeDoTitle: "We make industrial buying simpler for your business.",
    whatWeDoDescription: "", whatWeDoItems: defaultWhatWeDoItems
  }
};

/* ── Chevron icon ── */
const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ss-chevron">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/* ── Collapsible settings section ── */
function Section({ icon, title, defaultOpen = false, children }) {
  return (
    <details className="ss-panel" open={defaultOpen}>
      <summary className="ss-summary">
        <span className="ss-icon" style={{ background: "rgba(180,83,9,0.08)" }}>{icon}</span>
        {title}
        <Chevron />
      </summary>
      <div className="ss-body">{children}</div>
    </details>
  );
}

/* ── Toast hook ── */
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  function show(text, type = "info") {
    setToast({ text, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }
  return { toast, show };
}

export default function SettingsManager({ token }) {
  const [form, setForm] = useState(emptySettings);
  const [logo, setLogo] = useState({ file: null, preview: "", uploadedUrl: "", status: "", statusType: "" });
  const { toast, show: showToast } = useToast();

  async function loadSettings() {
    try {
      const res = await api.getSettings();
      if (res.settings) {
        setForm({
          ...emptySettings,
          ...res.settings,
          contactInfo: { ...emptySettings.contactInfo, ...(res.settings.contactInfo || {}) },
          analytics:   { ...emptySettings.analytics,   ...(res.settings.analytics   || {}) },
          seoDefaults: { ...emptySettings.seoDefaults, ...(res.settings.seoDefaults || {}) },
          homepage:    { ...emptySettings.homepage,    ...(res.settings.homepage    || {}) },
          socialLinks: res.settings.socialLinks || []
        });
      }
    } catch (err) { showToast(err.message, "error"); }
  }

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => () => { if (logo.preview) URL.revokeObjectURL(logo.preview); }, [logo.preview]);

  /* ── Form helpers ── */
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setContact = (key, val) => setForm(f => ({ ...f, contactInfo: { ...f.contactInfo, [key]: val } }));
  const setHp = (key, val) => setForm(f => ({ ...f, homepage: { ...f.homepage, [key]: val } }));
  const setHpArr = (key, i, val) => setForm(f => {
    const arr = [...(f.homepage[key] || [])]; arr[i] = val;
    return { ...f, homepage: { ...f.homepage, [key]: arr } };
  });
  const addHpArr = (key, val = "") => setForm(f => ({ ...f, homepage: { ...f.homepage, [key]: [...(f.homepage[key] || []), val] } }));
  const rmHpArr  = (key, i)  => setForm(f => ({ ...f, homepage: { ...f.homepage, [key]: (f.homepage[key] || []).filter((_, j) => j !== i) } }));
  const setWtd   = (i, k, v) => setForm(f => { const a = [...(f.homepage.whatWeDoItems || [])]; a[i] = { ...a[i], [k]: v }; return { ...f, homepage: { ...f.homepage, whatWeDoItems: a } }; });

  const updateSocialLink = (i, k, v) => setForm(f => { const l = [...f.socialLinks]; l[i] = { ...l[i], [k]: v }; return { ...f, socialLinks: l }; });

  /* ── Logo upload ── */
  function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logo.preview) URL.revokeObjectURL(logo.preview);
    setLogo({ file, preview: URL.createObjectURL(file), uploadedUrl: "", status: "File selected — click Upload to continue", statusType: "info" });
  }

  async function handleLogoUpload() {
    if (!logo.file) return;
    setLogo(l => ({ ...l, status: "Uploading…", statusType: "loading" }));
    try {
      const res = await api.uploadMedia(token, logo.file);
      setLogo(l => ({ ...l, uploadedUrl: res.url, status: "Uploaded! Click “Use logo” to apply it.", statusType: "success" }));
    } catch (err) {
      setLogo(l => ({ ...l, status: err.message, statusType: "error" }));
    }
  }

  async function confirmLogoUsage() {
    if (!logo.uploadedUrl) return;
    setLogo(l => ({ ...l, status: "Saving…", statusType: "loading" }));
    try {
      const res = await api.updateLogo(token, logo.uploadedUrl);
      if (res.settings) setForm(f => ({ ...f, logoUrl: res.settings.logoUrl || logo.uploadedUrl }));
      setLogo(l => ({ ...l, status: "Logo saved and live on the website.", statusType: "success" }));
      showToast("Logo updated successfully", "success");
    } catch (err) {
      setLogo(l => ({ ...l, status: err.message, statusType: "error" }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    showToast("Saving settings…", "loading");
    try {
      await api.saveSettings(token, form);
      await loadSettings();
      showToast("Settings saved successfully.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const logoStatusClass = { error: "status-line--error", success: "status-line--success",
    loading: "status-line--info", info: "status-line--info" };

  const activeLogo = logo.preview || form.logoUrl;

  return (
    <section className="panel full-span">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Website Settings</p>
          <h3 style={{ margin: 0 }}>Global site configuration</h3>
        </div>
        <button onClick={handleSubmit}
          style={{ fontSize: "0.86rem", padding: "0.6rem 1.2rem", borderRadius: "10px" }}>
          💾 Save All Settings
        </button>
      </div>

      <form className="ss-group" onSubmit={handleSubmit}>

        {/* ── Branding & Logo ── */}
        <Section icon="🏷️" title="Branding & Logo" defaultOpen>
          <div className="grid-two">
            <label><span>Site name</span>
              <input value={form.siteName} onChange={e => set("siteName", e.target.value)} placeholder="Tara Maa Solutions" />
            </label>
            <label><span>Site URL</span>
              <input value={form.siteUrl} onChange={e => set("siteUrl", e.target.value)} placeholder="https://tmsolutionsindia.com" />
            </label>
          </div>

          {/* Logo upload */}
          <div className="logo-upload-zone">
            {/* Preview */}
            <div className="logo-preview-circle">
              {activeLogo
                ? <img src={activeLogo} alt="Logo" />
                : <div className="logo-preview-placeholder">No logo</div>
              }
            </div>

            {/* Controls */}
            <div className="stack" style={{ gap: "0.75rem" }}>
              <div className="logo-dropzone-btn">
                <div className="logo-dropzone-icon">📁</div>
                <div className="logo-dropzone-text">
                  {logo.file ? logo.file.name : "Click to choose logo file"}
                </div>
                <div className="logo-dropzone-sub">PNG with transparent background, 256×256 or larger</div>
                <input type="file" accept="image/*" onChange={handleLogoFile} />
              </div>

              <div className="row gap-sm wrap">
                <button type="button" onClick={handleLogoUpload} disabled={!logo.file}
                  style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", borderRadius: "9px", background: "#0f172a" }}>
                  ↑ Upload
                </button>
                <button type="button" onClick={confirmLogoUsage} disabled={!logo.uploadedUrl}
                  style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", borderRadius: "9px" }}>
                  ✓ Use logo
                </button>
              </div>

              {logo.status && (
                <p className={`status-line ${logoStatusClass[logo.statusType] || "status-line--info"}`} style={{ margin: 0 }}>
                  {logo.status}
                </p>
              )}
            </div>
          </div>

          <div className="grid-two">
            <label><span>Logo URL (direct)</span>
              <input value={form.logoUrl} onChange={e => set("logoUrl", e.target.value)} placeholder="https://… or leave blank if using upload" />
            </label>
            <label><span>Favicon URL</span>
              <input value={form.faviconUrl} onChange={e => set("faviconUrl", e.target.value)} placeholder="https://…/favicon.ico" />
            </label>
          </div>
          <label><span>Theme mode</span>
            <select value={form.themeMode} onChange={e => set("themeMode", e.target.value)}>
              <option value="system">System (auto)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </Section>

        {/* ── SEO & Meta ── */}
        <Section icon="🔍" title="SEO & Meta Defaults">
          <div className="grid-two">
            <label><span>Default meta title <span style={{ color: "#94a3b8", fontWeight: 400 }}>{form.defaultMetaTitle.length}/70</span></span>
              <input maxLength="70" value={form.defaultMetaTitle} onChange={e => set("defaultMetaTitle", e.target.value)} />
            </label>
            <label><span>Default meta description <span style={{ color: "#94a3b8", fontWeight: 400 }}>{form.defaultMetaDescription.length}/160</span></span>
              <input maxLength="160" value={form.defaultMetaDescription} onChange={e => set("defaultMetaDescription", e.target.value)} />
            </label>
          </div>
          <div className="grid-two">
            <label><span>Robots</span>
              <input value={form.seoDefaults.robots} onChange={e => setForm(f => ({ ...f, seoDefaults: { ...f.seoDefaults, robots: e.target.value } }))} />
            </label>
            <label><span>Default OG image URL</span>
              <input value={form.seoDefaults.ogImage} onChange={e => setForm(f => ({ ...f, seoDefaults: { ...f.seoDefaults, ogImage: e.target.value } }))} />
            </label>
          </div>
          <label><span>Google Analytics ID</span>
            <input value={form.analytics.googleAnalyticsId} onChange={e => setForm(f => ({ ...f, analytics: { ...f.analytics, googleAnalyticsId: e.target.value } }))} placeholder="G-XXXXXXXXXX" />
          </label>
        </Section>

        {/* ── Contact Info ── */}
        <Section icon="📞" title="Contact Information">
          <div className="grid-two">
            <label><span>Contact email</span>
              <input type="email" value={form.contactInfo.email} onChange={e => setContact("email", e.target.value)} />
            </label>
            <label><span>Master email (notifications)</span>
              <input type="email" value={form.masterEmail} onChange={e => set("masterEmail", e.target.value)} />
            </label>
          </div>
          <div className="grid-two">
            <label><span>Phone</span>
              <input value={form.contactInfo.phone} onChange={e => setContact("phone", e.target.value)} />
            </label>
            <label><span>Address</span>
              <textarea rows="2" value={form.contactInfo.address} onChange={e => setContact("address", e.target.value)} />
            </label>
          </div>
        </Section>

        {/* ── Social Links ── */}
        <Section icon="🔗" title="Social Links">
          {form.socialLinks.map((link, i) => (
            <div key={i} className="grid-two" style={{ alignItems: "end" }}>
              <label><span>Label</span>
                <input value={link.label} onChange={e => updateSocialLink(i, "label", e.target.value)} placeholder="LinkedIn, Twitter…" />
              </label>
              <div className="row gap-sm" style={{ alignItems: "end" }}>
                <label style={{ flex: 1 }}><span>URL</span>
                  <input value={link.url} onChange={e => updateSocialLink(i, "url", e.target.value)} placeholder="https://…" />
                </label>
                <button type="button" className="danger" onClick={() => setForm(f => ({ ...f, socialLinks: f.socialLinks.filter((_, j) => j !== i) }))}
                  style={{ padding: "0.85rem 0.9rem", borderRadius: "10px", flexShrink: 0 }}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="secondary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", borderRadius: "9px" }}
            onClick={() => setForm(f => ({ ...f, socialLinks: [...f.socialLinks, { label: "", url: "" }] }))}>
            + Add social link
          </button>
        </Section>

        {/* ── Homepage Hero ── */}
        <Section icon="🏠" title="Homepage — Hero">
          <div className="grid-two">
            <label><span>Hero title</span>
              <input value={form.homepage.heroTitle} onChange={e => setHp("heroTitle", e.target.value)} />
            </label>
            <label><span>Hero subtitle</span>
              <input value={form.homepage.heroSubtitle} onChange={e => setHp("heroSubtitle", e.target.value)} />
            </label>
          </div>
        </Section>

        {/* ── About ── */}
        <Section icon="ℹ️" title="Homepage — About Section">
          <label><span>About title</span>
            <input value={form.homepage.aboutTitle} onChange={e => setHp("aboutTitle", e.target.value)} />
          </label>
          <label><span>About description</span>
            <textarea rows="3" value={form.homepage.aboutDescription} onChange={e => setHp("aboutDescription", e.target.value)} />
          </label>
          <label><span>About intro paragraph</span>
            <textarea rows="4" value={form.homepage.aboutIntro} onChange={e => setHp("aboutIntro", e.target.value)} />
          </label>
          <label><span>About image URL (optional)</span>
            <input value={form.homepage.aboutImageUrl} onChange={e => setHp("aboutImageUrl", e.target.value)} placeholder="https://…" />
          </label>

          <p className="form-section-label">Additional paragraphs</p>
          {form.homepage.aboutParagraphs.map((p, i) => (
            <div key={i} className="row gap-sm">
              <textarea rows="3" value={p} onChange={e => setHpArr("aboutParagraphs", i, e.target.value)} style={{ flex: 1 }} />
              <button type="button" className="danger" onClick={() => rmHpArr("aboutParagraphs", i)}
                style={{ padding: "0.6rem 0.75rem", borderRadius: "9px", alignSelf: "start" }}>✕</button>
            </div>
          ))}
          <button type="button" className="secondary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", borderRadius: "9px" }}
            onClick={() => addHpArr("aboutParagraphs")}>+ Add paragraph</button>

          <div className="grid-two">
            <label><span>Vision title</span><input value={form.homepage.visionTitle} onChange={e => setHp("visionTitle", e.target.value)} /></label>
            <label><span>Mission title</span><input value={form.homepage.missionTitle} onChange={e => setHp("missionTitle", e.target.value)} /></label>
          </div>
          <label><span>Vision description</span>
            <textarea rows="3" value={form.homepage.visionDescription} onChange={e => setHp("visionDescription", e.target.value)} />
          </label>

          <p className="form-section-label">Mission items</p>
          {form.homepage.missionItems.map((item, i) => (
            <div key={i} className="row gap-sm">
              <input value={item} onChange={e => setHpArr("missionItems", i, e.target.value)} style={{ flex: 1 }} />
              <button type="button" className="danger" onClick={() => rmHpArr("missionItems", i)}
                style={{ padding: "0.6rem 0.75rem", borderRadius: "9px" }}>✕</button>
            </div>
          ))}
          <button type="button" className="secondary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", borderRadius: "9px" }}
            onClick={() => addHpArr("missionItems")}>+ Add mission item</button>
        </Section>

        {/* ── What We Offer ── */}
        <Section icon="🎯" title="Homepage — What We Offer">
          <label><span>Section title</span>
            <input value={form.homepage.offerTitle} onChange={e => setHp("offerTitle", e.target.value)} />
          </label>
          <p className="form-section-label">Offer items</p>
          {form.homepage.offerItems.map((item, i) => (
            <div key={i} className="row gap-sm">
              <input value={item} onChange={e => setHpArr("offerItems", i, e.target.value)} style={{ flex: 1 }} />
              <button type="button" className="danger" onClick={() => rmHpArr("offerItems", i)}
                style={{ padding: "0.6rem 0.75rem", borderRadius: "9px" }}>✕</button>
            </div>
          ))}
          <button type="button" className="secondary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", borderRadius: "9px" }}
            onClick={() => addHpArr("offerItems")}>+ Add item</button>
        </Section>

        {/* ── What We Do ── */}
        <Section icon="⚙️" title="Homepage — What We Do Cards">
          <label><span>Section title</span>
            <input value={form.homepage.whatWeDoTitle} onChange={e => setHp("whatWeDoTitle", e.target.value)} />
          </label>
          <label><span>Section description</span>
            <textarea rows="3" value={form.homepage.whatWeDoDescription} onChange={e => setHp("whatWeDoDescription", e.target.value)} />
          </label>
          <p className="form-section-label">Cards</p>
          {form.homepage.whatWeDoItems.map((item, i) => (
            <div key={i} className="grid-two" style={{ background: "#faf8f3", padding: "0.85rem", borderRadius: "12px", border: "1px solid #e5dece" }}>
              <label><span>Card title</span>
                <input value={item.title} placeholder="Title" onChange={e => setWtd(i, "title", e.target.value)} />
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "end" }}>
                <label style={{ flex: 1 }}><span>Card description</span>
                  <input value={item.description} placeholder="Description" onChange={e => setWtd(i, "description", e.target.value)} />
                </label>
                <button type="button" className="danger" onClick={() => setHp("whatWeDoItems", form.homepage.whatWeDoItems.filter((_, j) => j !== i))}
                  style={{ padding: "0.6rem 0.75rem", borderRadius: "9px", flexShrink: 0 }}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="secondary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", borderRadius: "9px" }}
            onClick={() => setHp("whatWeDoItems", [...(form.homepage.whatWeDoItems || []), { title: "", description: "" }])}>
            + Add card
          </button>
        </Section>

        <button type="submit"
          style={{ padding: "0.85rem 1.5rem", fontSize: "0.9rem", borderRadius: "12px" }}>
          💾 Save All Settings
        </button>
      </form>

      {/* Toast notification */}
      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`}>
          {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : toast.type === "loading" ? "⏳" : "ℹ"}
          {" "}{toast.text}
        </div>
      )}
    </section>
  );
}
