const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");
const { log } = require("../utils/activityLogger");
const YoutubeVideoMeta = require("../models/YoutubeVideoMeta");
const Category = require("../models/Category");

const YOUTUBE_API_KEY    = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";
const SEARCH_PAGES = 5; // 5 pages × 50 = up to 250 videos scanned; no output cap

let cache = { shorts: [], fetchedAt: null };
const CACHE_TTL = 30 * 60 * 1000;

function parseDurationSecs(iso) {
  if (!iso) return Infinity;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return Infinity;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

async function fetchShorts() {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    throw new Error("YouTube API not configured. Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID.");
  }
  const allVideoIds = [];
  let pageToken = "";
  for (let page = 0; page < SEARCH_PAGES; page++) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", YOUTUBE_API_KEY);
    url.searchParams.set("channelId", YOUTUBE_CHANNEL_ID);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("order", "date");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "YouTube search API error");
    const ids = (data.items || []).map(i => i.id?.videoId).filter(Boolean);
    allVideoIds.push(...ids);
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }
  if (allVideoIds.length === 0) return [];
  const allItems = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const ids = allVideoIds.slice(i, i + 50).join(",");
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${ids}&part=statistics,snippet,contentDetails`;
    const statsRes = await fetch(statsUrl, { signal: AbortSignal.timeout(8000) });
    const statsData = await statsRes.json();
    allItems.push(...(statsData.items || []));
  }
  const shorts = allItems
    .filter(v => parseDurationSecs(v.contentDetails?.duration) <= 60)
    .map(v => {
      const t = v.snippet?.thumbnails || {};
      return {
        id: v.id,
        title: v.snippet?.title || "",
        thumbnail: t.maxres?.url || t.standard?.url || t.high?.url || t.medium?.url || t.default?.url || "",
        publishedAt: v.snippet?.publishedAt || "",
        viewCount: parseInt(v.statistics?.viewCount || 0, 10),
        likeCount: parseInt(v.statistics?.likeCount || 0, 10),
        commentCount: parseInt(v.statistics?.commentCount || 0, 10),
        duration: v.contentDetails?.duration || "",
        categoryId: null,
        categorySlug: null,
        categoryName: null,
      };
    })
    .sort((a, b) => b.viewCount - a.viewCount);
  return shorts;
}

async function enrichWithCategories(shorts) {
  if (!shorts.length) return shorts;
  const videoIds = shorts.map(s => s.id);
  const metas = await YoutubeVideoMeta.find({ videoId: { $in: videoIds } })
    .populate("categoryId", "name slug")
    .lean();
  const metaMap = {};
  for (const m of metas) metaMap[m.videoId] = m;
  return shorts.map(s => {
    const meta = metaMap[s.id];
    if (!meta || !meta.categoryId) return s;
    return { ...s, categoryId: meta.categoryId._id?.toString() || null, categorySlug: meta.categoryId.slug || null, categoryName: meta.categoryId.name || null };
  });
}

router.get("/shorts", asyncHandler(async (req, res) => {
  if (!cache.fetchedAt || Date.now() - cache.fetchedAt >= CACHE_TTL) {
    const fresh = await fetchShorts();
    cache = { shorts: fresh, fetchedAt: Date.now() };
  }
  let shorts = await enrichWithCategories(cache.shorts);
  const { category } = req.query;
  if (category) shorts = shorts.filter(s => s.categorySlug === category);
  res.json({ success: true, shorts, cached: true });
}));

router.post("/shorts/sync", protect, asyncHandler(async (req, res) => {
  cache = { shorts: [], fetchedAt: null };
  const fresh = await fetchShorts();
  cache = { shorts: fresh, fetchedAt: Date.now() };
  const shorts = await enrichWithCategories(fresh);
  setImmediate(() => log(req, { action: "youtube_sync", category: "youtube", details: `Synced ${shorts.length} YouTube Shorts`, resourceName: "YouTube Shorts" }));
  res.json({ success: true, shorts, message: `Synced ${shorts.length} Shorts.` });
}));

router.patch("/shorts/:videoId/category", protect, asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { categoryId } = req.body;
  if (categoryId) {
    const exists = await Category.exists({ _id: categoryId });
    if (!exists) return res.status(400).json({ success: false, message: "Category not found." });
  }
  await YoutubeVideoMeta.findOneAndUpdate({ videoId }, { categoryId: categoryId || null }, { upsert: true, new: true, setDefaultsOnInsert: true });
  setImmediate(() => log(req, { action: "youtube_category_assign", category: "youtube", details: categoryId ? `Assigned video ${videoId} to category ${categoryId}` : `Cleared category for video ${videoId}`, resourceName: "YouTube Shorts" }));
  res.json({ success: true, message: "Category saved." });
}));

router.get("/categories", asyncHandler(async (_req, res) => {
  const cats = await Category.find({ isActive: true }).select("name slug sortOrder").sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ success: true, categories: cats });
}));

module.exports = router;
