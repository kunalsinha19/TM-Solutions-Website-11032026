const asyncHandler = require("../utils/asyncHandler");
const Visitor = require("../models/Visitor");
const QuoteRequest = require("../models/QuoteRequest");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brochure = require("../models/Brochure");
const ActivityLog = require("../models/ActivityLog");

// Priority: x-visitor-ip (set by Next.js proxy with real client IP) →
//           cf-connecting-ip (Cloudflare) → x-real-ip → x-forwarded-for[0]
function getIp(req) {
  return (
    req.headers["x-visitor-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    (String(req.headers["x-forwarded-for"] || "")).split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "0.0.0.0"
  );
}

function anonymizeIp(ip) {
  if (!ip) return "0.0.0.0";
  const parts = ip.split(".");
  if (parts.length === 4) { parts[3] = "0"; return parts.join("."); }
  return ip;
}

function isLocalIp(ip) {
  return !ip || ip === "127.0.0.1" || ip === "::1" ||
    ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.");
}

// Simple in-memory geo cache — avoids duplicate API calls for the same /24 block
const geoCache = new Map();

async function fetchGeoData(ip) {
  if (isLocalIp(ip)) return { country: "Local", countryCode: "LO", city: "Localhost" };

  const cacheKey = ip;
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey);

  try {
    // ipwho.is: free, HTTPS (no rate-limit issues with HTTP), no API key required
    const res = await fetch(
      `https://ipwho.is/${ip}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (!data.success) return {};

    const geo = {
      country:     data.country,
      countryCode: data.country_code,
      state:       data.region,
      city:        data.city,
      lat:         data.latitude,
      lon:         data.longitude,
      isp:         data.connection?.isp || data.connection?.org || "",
      timezone:    data.timezone?.id || "",
    };

    // Cache for 24 h — geo data for an IP doesn't change frequently
    geoCache.set(cacheKey, geo);
    setTimeout(() => geoCache.delete(cacheKey), 24 * 60 * 60 * 1000);

    return geo;
  } catch {
    return {};
  }
}

// POST /api/analytics/track
exports.trackVisitor = asyncHandler(async (req, res) => {
  const { sessionId, visitorId, page, browser, os, device,
    screenResolution, language, referrer,
    utmSource, utmMedium, utmCampaign, isNewVisitor } = req.body;

  if (!sessionId || !visitorId) return res.json({ success: true });

  const existing = await Visitor.findOne({ sessionId });
  if (existing) {
    if (page && !existing.pagesVisited.includes(page)) {
      existing.pagesVisited.push(page);
      existing.pageCount = existing.pagesVisited.length;
      existing.exitPage = page;
    }
    existing.isActive = true;
    await existing.save();
    return res.json({ success: true });
  }

  const ip = getIp(req);
  const geo = await fetchGeoData(ip);

  await Visitor.create({
    sessionId, visitorId,
    ipAnonymized: anonymizeIp(ip),
    country: geo.country, countryCode: geo.countryCode,
    state: geo.state, city: geo.city,
    lat: geo.lat, lon: geo.lon,
    isp: geo.isp, timezone: geo.timezone,
    browser, os,
    device: ["desktop", "tablet", "mobile"].includes(device) ? device : "desktop",
    screenResolution, language, referrer,
    utmSource, utmMedium, utmCampaign,
    entryPage:   page,
    exitPage:    page,
    pagesVisited: page ? [page] : [],
    pageCount:    1,
    isNewVisitor: isNewVisitor !== false,
    isActive:     true,
  });

  res.json({ success: true });
});

// PUT /api/analytics/track/:sessionId
exports.updateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { duration, exitPage, isActive } = req.body;

  const v = await Visitor.findOne({ sessionId });
  if (!v) return res.json({ success: true });

  if (duration !== undefined) v.duration = duration;
  if (exitPage) v.exitPage = exitPage;
  if (isActive === false) {
    v.isActive = false;
    v.sessionEnd = new Date();
  }
  await v.save();
  res.json({ success: true });
});

// GET /api/analytics/summary  (protected)
exports.getSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart     = new Date(now.getTime() - 6 * 86400_000);
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1);
  const fiveMinAgo    = new Date(now.getTime() - 5 * 60_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000);

  const [
    totalVisitors, todayVisitors, weekVisitors, monthVisitors, liveVisitors,
    totalQuotes, totalProducts, totalCategories,
    avgRes, returningVisitors, singlePage, totalForBounce,
    dailyVisitors, topCountries, topPages, deviceBreakdown,
    browserBreakdown, osBreakdown, quoteStatusBreakdown,
    topBrochure, latestQuote, latestActivity, recentLogins,
  ] = await Promise.all([
    Visitor.countDocuments({ isBot: false }),
    Visitor.countDocuments({ isBot: false, sessionStart: { $gte: todayStart } }),
    Visitor.countDocuments({ isBot: false, sessionStart: { $gte: weekStart } }),
    Visitor.countDocuments({ isBot: false, sessionStart: { $gte: monthStart } }),
    Visitor.countDocuments({ isBot: false, isActive: true, sessionStart: { $gte: fiveMinAgo } }),
    QuoteRequest.countDocuments(),
    Product.countDocuments(),
    Category.countDocuments(),
    Visitor.aggregate([{ $group: { _id: null, avg: { $avg: "$duration" } } }]),
    Visitor.countDocuments({ isBot: false, isNewVisitor: false }),
    Visitor.countDocuments({ isBot: false, pageCount: { $lte: 1 } }),
    Visitor.countDocuments({ isBot: false }),
    Visitor.aggregate([
      { $match: { sessionStart: { $gte: thirtyDaysAgo }, isBot: false } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$sessionStart" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Visitor.aggregate([
      { $match: { isBot: false, country: { $ne: null, $ne: "" } } },
      { $group: { _id: "$country", countryCode: { $first: "$countryCode" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Visitor.aggregate([
      { $match: { isBot: false } },
      { $unwind: "$pagesVisited" },
      { $group: { _id: "$pagesVisited", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Visitor.aggregate([
      { $match: { isBot: false } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Visitor.aggregate([
      { $match: { isBot: false, browser: { $ne: null, $ne: "" } } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    Visitor.aggregate([
      { $match: { isBot: false, os: { $ne: null, $ne: "" } } },
      { $group: { _id: "$os", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    QuoteRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Brochure.findOne({ isActive: true }).sort({ downloadCount: -1 }).select("title downloadCount").lean(),
    QuoteRequest.findOne().sort({ createdAt: -1 }).select("name email company status createdAt").lean(),
    ActivityLog.find().sort({ createdAt: -1 }).limit(5).select("adminName action category details createdAt").lean(),
    ActivityLog.find({ action: "login" }).sort({ createdAt: -1 }).limit(5)
      .select("adminName adminEmail ip createdAt").lean(),
  ]);

  res.json({
    success: true,
    summary: {
      totalVisitors, todayVisitors, weekVisitors, monthVisitors, liveVisitors,
      totalQuotes, totalProducts, totalCategories,
      avgDuration:       Math.round(avgRes[0]?.avg || 0),
      bounceRate:        totalForBounce > 0 ? Math.round((singlePage / totalForBounce) * 100) : 0,
      returningVisitors,
      newVisitors:       Math.max(0, totalVisitors - returningVisitors),
    },
    dailyVisitors, topCountries, topPages, deviceBreakdown,
    browserBreakdown, osBreakdown, quoteStatusBreakdown,
    topBrochure, latestQuote, latestActivity, recentLogins,
  });
});

// GET /api/analytics/visitors  (protected)
exports.getVisitors = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 25);
  const skip   = (page - 1) * limit;
  const { country, device, search } = req.query;

  const filter = { isBot: false };
  if (country) filter.country = country;
  if (device)  filter.device  = device;
  if (search) {
    filter.$or = [
      { city:      { $regex: search, $options: "i" } },
      { country:   { $regex: search, $options: "i" } },
      { browser:   { $regex: search, $options: "i" } },
      { entryPage: { $regex: search, $options: "i" } },
    ];
  }

  const [total, visitors] = await Promise.all([
    Visitor.countDocuments(filter),
    Visitor.find(filter).sort({ sessionStart: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({
    success: true, visitors,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

// GET /api/analytics/live  (protected)
exports.getLiveVisitors = asyncHandler(async (req, res) => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
  const visitors = await Visitor.find({
    isBot: false, isActive: true, sessionStart: { $gte: fiveMinAgo },
  }).sort({ sessionStart: -1 }).limit(50).lean();

  res.json({ success: true, liveCount: visitors.length, visitors });
});
