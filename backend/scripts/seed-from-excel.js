/**
 * Seed script — clears and repopulates categories + products from seed-data.json
 * Generated from TARA_MAA_SOLUTIONS_Products.xlsx (184 products, 10 categories)
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node backend/scripts/seed-from-excel.js
 *
 * Or with .env in backend/:
 *   cd backend && node scripts/seed-from-excel.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");
const seedData = require(path.join(__dirname, "seed-data.json"));

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://taraadmin:taraadmin@tara-maa-cluster.2b2mvqt.mongodb.net/taramaadb?retryWrites=true&w=majority";

// ── Schemas (inline to avoid import issues) ──────────────────────────────────

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: { type: [String], default: [] },
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "published" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  // 1. Wipe existing data
  console.log("\nClearing existing products and categories…");
  const deletedProducts = await Product.deleteMany({});
  const deletedCats = await Category.deleteMany({});
  console.log(`  Removed ${deletedProducts.deletedCount} products, ${deletedCats.deletedCount} categories.`);

  // 2. Insert categories
  console.log("\nInserting 10 categories…");
  const categoryDocs = await Category.insertMany(seedData.categories);
  const catBySlug = {};
  for (const doc of categoryDocs) {
    catBySlug[doc.slug] = doc._id;
  }
  console.log(`  ✓ ${categoryDocs.length} categories created.`);

  // 3. Insert products
  console.log("\nInserting 184 products…");
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (const p of seedData.products) {
    const categoryId = catBySlug[p.categorySlug];
    if (!categoryId) {
      errors.push(`No category found for slug "${p.categorySlug}" (product: ${p.name})`);
      skipped++;
      continue;
    }

    try {
      // images stored as plain URL strings in the old backend schema
      const imageUrls = p.images.map((img) => img.url);
      await Product.create({
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        price: 0,
        category: categoryId,
        images: imageUrls,
        tags: p.tags,
        isFeatured: p.isFeatured,
        status: "published",
        seoTitle: p.metaTitle,
        seoDescription: p.metaDescription,
        publishedAt: new Date(),
      });
      inserted++;
    } catch (err) {
      errors.push(`${p.name}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`  ✓ ${inserted} products created.`);
  if (skipped > 0) {
    console.log(`  ⚠ ${skipped} skipped.`);
    errors.forEach((e) => console.log("    -", e));
  }

  // 4. Summary
  const totalCats = await Category.countDocuments();
  const totalProds = await Product.countDocuments();
  console.log(`\nDone! DB now has ${totalCats} categories and ${totalProds} products.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
