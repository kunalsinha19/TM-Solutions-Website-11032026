import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";

function fmtViews(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Category dropdown for a single Short ──────────────────────────────────────
function CategorySelect({ short, categories, token, onSaved }) {
  const [saving, setSaving]     = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError]       = useState("");
  const [value, setValue]       = useState(short.categoryId || "");

  async function handleChange(e) {
    const newVal = e.target.value; // "" = None, otherwise a MongoDB ObjectId
    setValue(newVal);
    setSaving(true);
    setError("");
    try {
      await api.setYouTubeVideoCategory(token, short.id, newVal || null);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
      onSaved(short.id, newVal || null);
    } catch (err) {
      setError("Save failed");
      setValue(short.categoryId || ""); // revert
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <select
          value={value}
          onChange={handleChange}
          disabled={saving}
          style={{
            flex: 1,
            fontSize: "0.75rem",
            padding: "0.25rem 0.4rem",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: saving ? "wait" : "pointer",
          }}
          title="Assign to a category (used to show this Short on category pages)"
        >
          <option value="">— No category —</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        {saving && (
          <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>…</span>
        )}
        {savedFlash && !saving && (
          <span style={{ fontSize: "0.7rem", color: "#22c55e", fontWeight: 700 }}>✓ Saved</span>
        )}
        {error && !saving && (
          <span style={{ fontSize: "0.7rem", color: "#ef4444" }}>{error}</span>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function YouTubeManager({ token }) {
  const [shorts, setShorts]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [syncing, setSyncing]     = useState(false);

  // ── Filter / search state ───────────────────────────────────────────────────
  const [search, setSearch]           = useState("");
  const [filterCategory, setFilterCategory] = useState(""); // "" = all, "none" = unassigned, or a categoryId

  // ── Pagination ──────────────────────────────────────────────────────────────
  const CARDS_PER_PAGE = 20;
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getYouTubeShorts(token),
      api.getCategories(),          // uses the public /api/categories endpoint
    ])
      .then(([ytData, catData]) => {
        setShorts(ytData.shorts || []);
        setCategories(catData.categories || catData || []);
        setError("");
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      await api.syncYouTubeShorts(token);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  // Update the local state after a category is saved so the filter stays consistent
  function handleCategorySaved(videoId, newCategoryId) {
    setShorts(prev => prev.map(s => {
      if (s.id !== videoId) return s;
      const cat = categories.find(c => c._id === newCategoryId);
      return {
        ...s,
        categoryId:   newCategoryId || null,
        categorySlug: cat?.slug || null,
        categoryName: cat?.name || null,
      };
    }));
  }

  // ── Derived list: search + category filter ──────────────────────────────────
  const filtered = shorts.filter(s => {
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      !filterCategory
        ? true
        : filterCategory === "none"
          ? !s.categoryId
          : s.categoryId === filterCategory;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageShorts = filtered.slice((safePage - 1) * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterCategory]);

  // ── Category stats for the header summary ───────────────────────────────────
  const assignedCount   = shorts.filter(s => s.categoryId).length;
  const unassignedCount = shorts.length - assignedCount;

  return (
    <div>
      {/* ── Header ── */}
      <div className="panel-header" style={{ marginBottom: "1rem" }}>
        <div>
          <p className="eyebrow">YouTube</p>
          <h3>YouTube Shorts</h3>
          <p className="muted small">
            {shorts.length > 0
              ? `${shorts.length} Shorts · ${assignedCount} assigned · ${unassignedCount} unassigned`
              : "Videos synced automatically from your channel."}
          </p>
        </div>
        <button type="button" onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing…" : "🔄 Sync Now"}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="feedback error" style={{ marginBottom: "1rem" }}>
          {error.includes("not configured") || error.includes("API key") ? (
            <>
              <strong>YouTube API not configured.</strong>
              <br />
              Add <code>YOUTUBE_API_KEY</code> and <code>YOUTUBE_CHANNEL_ID</code> to your backend environment variables.
            </>
          ) : error}
        </div>
      )}

      {loading ? (
        <div className="dash-loading"><div className="dash-spinner" /></div>
      ) : shorts.length === 0 ? (
        <div className="feedback loading">
          No YouTube Shorts found. Configure your YouTube API key and channel ID in the backend, then click Sync.
        </div>
      ) : (
        <>
          {/* ── Filters ── */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
            <input
              type="search"
              placeholder="Search by title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: "1 1 180px",
                padding: "0.4rem 0.7rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "0.85rem",
              }}
            />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{
                padding: "0.4rem 0.7rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "0.85rem",
              }}
            >
              <option value="">All categories</option>
              <option value="none">Unassigned only</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            <span style={{ fontSize: "0.8rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
              {filtered.length} video{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Grid ── */}
          {pageShorts.length === 0 ? (
            <div className="feedback loading">No videos match your filter.</div>
          ) : (
            <div className="yt-grid">
              {pageShorts.map(short => (
                <div key={short.id} className="yt-card">
                  <div className="yt-thumb-wrap">
                    <img
                      src={short.thumbnail}
                      alt={short.title}
                      className="yt-thumb"
                      loading="lazy"
                    />
                    <span className="yt-shorts-badge">Shorts</span>
                    {short.categoryName && (
                      <span style={{
                        position: "absolute",
                        bottom: "0.4rem",
                        left: "0.4rem",
                        background: "rgba(0,0,0,0.75)",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                        maxWidth: "calc(100% - 0.8rem)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {short.categoryName}
                      </span>
                    )}
                  </div>
                  <div className="yt-info">
                    <p className="yt-title" title={short.title}>{short.title}</p>
                    <div className="yt-meta">
                      <span>👁️ {fmtViews(short.viewCount)}</span>
                      <span>📅 {fmtDate(short.publishedAt)}</span>
                    </div>
                    <a
                      href={`https://www.youtube.com/shorts/${short.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="yt-watch-btn"
                    >
                      ▶ Watch
                    </a>

                    {/* Category assignment dropdown */}
                    <CategorySelect
                      short={short}
                      categories={categories}
                      token={token}
                      onSaved={handleCategorySaved}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{
                  padding: "0.35rem 0.9rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  cursor: safePage === 1 ? "not-allowed" : "pointer",
                  opacity: safePage === 1 ? 0.4 : 1,
                  fontSize: "0.85rem",
                }}
              >
                ← Prev
              </button>

              <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
                Page {safePage} of {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{
                  padding: "0.35rem 0.9rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  cursor: safePage === totalPages ? "not-allowed" : "pointer",
                  opacity: safePage === totalPages ? 0.4 : 1,
                  fontSize: "0.85rem",
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
