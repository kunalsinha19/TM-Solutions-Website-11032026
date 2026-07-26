const BlogPost   = require("../models/BlogPost");
const asyncHandler = require("../utils/asyncHandler");
const ApiError   = require("../utils/apiError");
const path       = require("path");

function estimateReadingTime(content = "") {
  return Math.max(1, Math.round(content.split(/\s+/).length / 200));
}

// GET /api/blog — public list of published posts
exports.list = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(20, parseInt(req.query.limit) || 9);
  const skip  = (page - 1) * limit;
  const tag   = req.query.tag || "";

  const filter = { status: "published" };
  if (tag) filter.tags = tag;

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip).limit(limit)
      .select("title slug excerpt coverImage tags publishedAt readingTimeMin")
      .lean(),
    BlogPost.countDocuments(filter),
  ]);

  res.json({ success: true, posts, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/blog/:slug — single public post
exports.getBySlug = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, status: "published" }).lean();
  if (!post) throw new ApiError(404, "Post not found");
  res.json({ success: true, post });
});

// POST /api/blog — admin create
exports.create = asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, coverImage, tags, seoTitle, seoDescription, status } = req.body;
  const post = await BlogPost.create({
    title, slug, excerpt, content, coverImage, tags: tags || [],
    seoTitle, seoDescription, status: status || "draft",
    publishedAt: status === "published" ? new Date() : null,
    readingTimeMin: estimateReadingTime(content),
  });
  res.status(201).json({ success: true, post });
});

// PUT /api/blog/:id — admin update
exports.update = asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, coverImage, tags, seoTitle, seoDescription, status } = req.body;
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found");

  if (title !== undefined) post.title = title;
  if (slug  !== undefined) post.slug  = slug;
  if (excerpt !== undefined) post.excerpt = excerpt;
  if (content !== undefined) { post.content = content; post.readingTimeMin = estimateReadingTime(content); }
  if (coverImage !== undefined) post.coverImage = coverImage;
  if (tags !== undefined) post.tags = tags;
  if (seoTitle !== undefined) post.seoTitle = seoTitle;
  if (seoDescription !== undefined) post.seoDescription = seoDescription;
  if (status !== undefined) {
    if (status === "published" && post.status !== "published") post.publishedAt = new Date();
    post.status = status;
  }

  await post.save();
  res.json({ success: true, post });
});

// DELETE /api/blog/:id — admin delete
exports.remove = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) throw new ApiError(404, "Post not found");
  res.json({ success: true });
});

// POST /api/blog/seed-demo — admin trigger to upsert the 5 demo blog posts
exports.seedDemo = asyncHandler(async (_req, res) => {
  const { seedBlogs } = require(path.join(__dirname, "../../../scripts/seed-blogs"));
  await seedBlogs();
  const count = await BlogPost.countDocuments({ status: "published" });
  res.json({ success: true, message: "Demo blog posts seeded", publishedCount: count });
});

// GET /api/blog/admin/all — admin list (all statuses)
exports.adminList = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    BlogPost.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select("title slug status publishedAt readingTimeMin tags").lean(),
    BlogPost.countDocuments({}),
  ]);
  res.json({ success: true, posts, total, page, pages: Math.ceil(total / limit) });
});
