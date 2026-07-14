import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

export default function YouTubeManager({ token }) {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  function load() {
    setLoading(true);
    api.getYouTubeShorts(token)
      .then(d => { setShorts(d.shorts || []); setError(""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await api.syncYouTubeShorts(token);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  function fmtViews(n) {
    if (!n) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }

  return (
    <div>
      <div className="panel-header" style={{ marginBottom: "1rem" }}>
        <div>
          <p className="eyebrow">YouTube</p>
          <h3>YouTube Shorts</h3>
          <p className="muted small">Videos synced automatically from your channel.</p>
        </div>
        <button type="button" onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing…" : "🔄 Sync Now"}
        </button>
      </div>

      {error && (
        <div className="feedback error" style={{ marginBottom: "1rem" }}>
          {error.includes("not configured") || error.includes("API key") ? (
            <>
              <strong>YouTube API not configured.</strong>
              <br />
              Add <code>YOUTUBE_API_KEY</code> and <code>YOUTUBE_CHANNEL_ID</code> to your backend environment variables to enable this feature.
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
        <div className="yt-grid">
          {shorts.map(short => (
            <div key={short.id} className="yt-card">
              <div className="yt-thumb-wrap">
                <img
                  src={short.thumbnail}
                  alt={short.title}
                  className="yt-thumb"
                  loading="lazy"
                />
                <span className="yt-shorts-badge">Shorts</span>
              </div>
              <div className="yt-info">
                <p className="yt-title" title={short.title}>{short.title}</p>
                <div className="yt-meta">
                  <span>👁️ {fmtViews(short.viewCount)}</span>
                  <span>📅 {short.publishedAt ? new Date(short.publishedAt).toLocaleDateString() : "—"}</span>
                </div>
                <a
                  href={`https://www.youtube.com/shorts/${short.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-watch-btn"
                >
                  ▶ Watch
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
