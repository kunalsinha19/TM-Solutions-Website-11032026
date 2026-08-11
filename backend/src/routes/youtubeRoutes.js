const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");
const { log } = require("../utils/activityLogger");

const YOUTUBE_API_KEY    = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

// Fetch up to this many pages from the search API (50 results/page).
// 3 pages = up to 150 videos scanned; at most MAX_SHORTS_OUTPUT are returned.
const SEARCH_PAGES      = 3;
const MAX_SHORTS_OUTPUT = 50; // cap shown on the website

// In-memory cache so we don't hammer the YouTube API
let cache = { shorts: [], fetchedAt: null };
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Parse an ISO 8601 duration string (e.g. "PT58S", "PT1M3S") → total seconds.
 */
function parseDurationSecs(iso) {
  if (!iso) return Infinity;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return Infinity;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

/**
 * Fetch ALL videos from the channel (paginated), filter to actual Shorts
 * (duration ≤ 60 s), enrich with stats, sort by view count desc.
 */
async function fetchShorts() {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    throw new Error("YouTube API not configured. Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID.");
  }

  // ── Step 1: collect video IDs across multiple search pages ────────────────
  const allVideoIds = [];
  let pageToken = "";

  for (let page = 0; page < SEARCH_PAGES; page++) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", YOUTUBE_API_KEY);
    url.searchParams.set("channelId", YOUTUBE_CHANNEL_ID);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "50");  // YouTube API max per request
    url.searchParams.set("order", "date");      // newest first so we get the full history
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "YouTube search API error");

    const ids = (data.items || []).map(i => i.id?.videoId).filter(Boolean);
    allVideoIds.push(...ids);

    pageToken = data.nextPageToken || "";
    if (!pageToken) break; // no more pages
  }

  if (allVideoIds.length === 0) return [];

  // ── Step 2: batch-fetch contentDetails + statistics (max 50 ids per call) ──
  const allItems = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const ids = allVideoIds.slice(i, i + 50).join(",");
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${ids}&part=statistics,snippet,contentDetails`;
    const statsRes = await fetch(statsUrl, { signal: AbortSignal.timeout(8000) });
    const statsData = await statsRes.json();
    allItems.push(...(statsData.items || []));
  }

  // ── Step 3: filter to actual Shorts (≤ 60 s) and shape the response ───────
  const shorts = allItems
    .filter(v => parseDurationSecs(v.contentDetails?.duration) <= 60)
    .map(v => {
      const t = v.snippet?.thumbnails || {};
      const thumbnail = t.maxres?.url || t.standard?.url || t.high?.url || t.medium?.url || t.default?.url || "";
      return {
        id:           v.id,
        title:        v.snippet?.title || "",
        thumbnail,
        publishedAt:  v.snippet?.publishedAt || "",
        viewCount:    parseInt(v.statistics?.viewCount  || 0, 10),
        likeCount:    parseInt(v.statistics?.likeCount  || 0, 10),
        commentCount: parseInt(v.statistics?.commentCount || 0, 10),
        duration:     v.contentDetails?.duration || "",
      };
    });

  // Sort by view count descending, cap output
  return shorts
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, MAX_SHORTS_OUTPUT);
}

// GET /api/youtube/shorts  (public — reads cached data, no auth needed)
router.get("/shorts", asyncHandler(async (_req, res) => {
  if (cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return res.json({ success: true, shorts: cache.shorts, cached: true });
  }
  const shorts = await fetchShorts();
  cache = { shorts, fetchedAt: Date.now() };
  res.json({ success: true, shorts });
}));

// POST /api/youtube/shorts/sync  (protected — admin "Sync Now" button)
router.post("/shorts/sync", protect, asyncHandler(async (req, res) => {
  cache = { shorts: [], fetchedAt: null }; // bust cache
  const shorts = await fetchShorts();
  cache = { shorts, fetchedAt: Date.now() };

  setImmediate(() => log(req, {
    action: "youtube_sync", category: "youtube",
    details: `Synced ${shorts.length} YouTube Shorts`,
    resourceName: "YouTube Shorts",
  }));

  res.json({ success: true, shorts, message: `Synced ${shorts.length} Shorts.` });
}));

module.exports = router;
