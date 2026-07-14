const asyncHandler = require("../utils/asyncHandler");
const Visitor = require("../models/Visitor");
const QuoteRequest = require("../models/QuoteRequest");
const Product = require("../models/Product");
const Category = require("../models/Category");

function getIp(req) {
  return (String(req.headers["x-forwarded-for"] || "")).split(",")[0].trim() ||
    req.socket?.remoteAddress || "0.0.0.0";
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

async function fetchGeoData(ip) {
  if (isLocalIp(ip)) return { country: "Local", countryCode: "LO", city: "Localhost" };
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,timezone`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (data.status !== "success") return {};
    return {
      country: data.country,
      countryCode: data.countryCode,
      state: data.regionName,
      city: data.city,
      lat: data.lat,
      lon: data.lon,
      isp: data.isp,
      timezone: data.timezone,
    };
  } catch {
    return {};
  }
}

// POST /api/analytics/track
exports.trackVisitor = asyncHandler(async (req, res) => {
  const { sessionId, visitorId, page, browser, os, device,
    screenResolution, language, referrer, utmSource, utmMedium,
    utmCampaign, isNewVisitor } = req.body;

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
    country:      geo.country,
    countryCode:  geo.countryCode,
    state:        geo.state,
    city:         geo.city,
    lat:          geo.lat,
    lon:          geo.lon,
    isp:          geo.isp,
    timezone:     geo.timezone,
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
  if (exitPage) { v.exitPage = exitPage; }
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
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart   = new Date(now.getTime() - 6 * 86400_000);
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const fiveMinAgo  = new Date(now.getTime() - 5 * 60_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000);

  const [
    totalVisitors, todayVisitors, weekVisitors, monthVisitors, liveVisitors,
    totalQuotes, totalProducts, totalCategories,
    avgRes, returningVisitors, singlePage, totalForBounce,
    dailyVisitors, topCountries, topPages, deviceBreakdown,
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
    ]),
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
  });
});

// GET /api/analytics/visitors  (protected)
exports.getVisitors = asyncHandler(async (req, res) => {
  const page    = Math.max(1, parseInt(req.query.page) || 1);
  const limit   = Math.min(100, parseInt(req.query.limit) || 25);
  const skip    = (page - 1) * limit;
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
