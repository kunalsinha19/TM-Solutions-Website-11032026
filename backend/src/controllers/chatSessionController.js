const ChatSession = require("../models/ChatSession");

// POST /api/chat-sessions — upsert from frontend (no auth)
exports.upsert = async (req, res) => {
  try {
    const {
      sessionId, messages = [], leadScore = 0, leadSignals = [],
      productsDiscussed = [], emailCaptured = "", phoneCaptured = "",
      hasQuoteRequest = false, hasPriceInquiry = false, hasUrgency = false,
      quoteSubmitted = false,
    } = req.body;

    if (!sessionId) return res.status(400).json({ success: false, error: "sessionId required" });

    const ip = (req.headers["cf-connecting-ip"] ?? req.headers["x-real-ip"] ??
      (req.headers["x-forwarded-for"] ?? "").split(",")[0] ?? req.ip ?? "").trim();
    const ua = (req.headers["user-agent"] ?? "").slice(0, 300);

    const cleanMessages = (messages || []).slice(-60).map(m => ({
      role: m.role, text: String(m.text ?? "").slice(0, 800), timestamp: m.timestamp ?? new Date(),
    }));

    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          messages: cleanMessages,
          leadScore, leadSignals,
          productsDiscussed, emailCaptured, phoneCaptured,
          hasQuoteRequest, hasPriceInquiry, hasUrgency, quoteSubmitted,
          lastActivityAt: new Date(),
          visitorIp: ip, userAgent: ua,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, id: session._id });
  } catch (err) {
    console.error("[chatSession.upsert]", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// GET /api/chat-sessions — admin list (protected)
exports.list = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.hasQuote === "true")  filter.hasQuoteRequest = true;
    if (req.query.hasQuote === "false") filter.hasQuoteRequest = false;
    if (req.query.minScore) filter.leadScore = { $gte: parseInt(req.query.minScore) };

    const [sessions, total] = await Promise.all([
      ChatSession.find(filter)
        .sort({ leadScore: -1, startedAt: -1 })
        .skip(skip).limit(limit)
        .select("-userAgent -visitorIp -__v")
        .lean(),
      ChatSession.countDocuments(filter),
    ]);

    res.json({ success: true, sessions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[chatSession.list]", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// GET /api/chat-sessions/:id — single session detail (protected)
exports.getOne = async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
