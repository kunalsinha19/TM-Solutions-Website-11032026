const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");
const { log } = require("../utils/activityLogger");

const YOUTUBE_API_KEY     = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_CHANNEL_ID  = process.env.YOUTUBE_CHANNEL_ID || "";
const MAX_RESULTS         = 20;

// In-memory cache so we don't hammer the YouTube API
let cache = { shorts: [], fetchedAt: null };
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchShorts() {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    throw new Error("YouTube API not configured. Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID.");
  }
  // Search for shorts from the channel
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet&type=video&maxResults=${MAX_RESULTS}&order=date`;
  const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
  const searchData = await searchRes.json();
  if (!searchRes.ok) throw new Error(searchData.error?.message || "YouTube API error");

  const ids = (searchData.items || []).map(i => i.id.videoId).filter(Boolean).join(",");
  if (!ids) return [];

  // Fetch stats + high-res thumbnails
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${ids}&part=statistics,snippet,contentDetails`;
  const statsRes = await fetch(statsUrl, { signal: AbortSignal.timeout(8000) });
  const statsData = await statsRes.json();

  const items = (statsData.items || []).map(v => {
    const t = v.snippet?.thumbnails || {};
    // Prefer highest-resolution portrait thumbnail available
    const thumbnail = t.maxres?.url || t.standard?.url || t.high?.url || t.medium?.url || t.default?.url || "";
    return {
      id:          v.id,
      title:       v.snippet?.title || "",
      thumbnail,
      publishedAt: v.snippet?.publishedAt || "",
      viewCount:    parseInt(v.statistics?.viewCount || 0),
      likeCount:    parseInt(v.statistics?.likeCount || 0),
      commentCount: parseInt(v.statistics?.commentCount || 0),
      duration:     v.contentDetails?.duration || "",
    };
  });

  // Sort by view count descending so most-watched come first
  return items.sort((a, b) => b.viewCount - a.viewCount);
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

// POST /api/youtube/shorts/sync  (protected)
router.post("/shorts/sync", protect, asyncHandler(async (req, res) => {
  cache = { shorts: [], fetchedAt: null }; // bust cache
  const shorts = await fetchShorts();
  cache = { shorts, fetchedAt: Date.now() };

  setImmediate(() => log(req, {
    action: "youtube_sync", category: "youtube",
    details: `Synced ${shorts.length} YouTube videos`,
    resourceName: "YouTube Shorts",
  }));

  res.json({ success: true, shorts, message: `Synced ${shorts.length} videos.` });
}));

module.exports = router;
