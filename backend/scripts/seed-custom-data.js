const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");

const categories = [
  {
    name: "Lamination",
    slug: "lamination",
    description: "Heat and cold lamination machinery for prints and boards.",
    seoTitle: "Thermal and Cold Lamination Machines",
    seoDescription: "Professional lamination solutions for documents, photos, and boards.",
    sortOrder: 1
  },
  {
    name: "Finishing",
    slug: "finishing",
    description: "Foil stamping, fusing, and folding equipment.",
    seoTitle: "Finishing Machines",
    seoDescription: "Hot stamping, fusing, and folding machines for premium finishes.",
    sortOrder: 2
  },
  {
    name: "Printing",
    slug: "printing",
    description: "UV, DTF, and hybrid printers.",
    seoTitle: "Printing Machines",
    seoDescription: "UV and DTF printers for direct-to-object and film transfers.",
    sortOrder: 3
  },
  {
    name: "Office",
    slug: "office",
    description: "Office helpers like shredders and cash counters.",
    seoTitle: "Office Equipment",
    seoDescription: "Shredders and note counters for workplaces.",
    sortOrder: 4
  },
  {
    name: "Consumables",
    slug: "consumables",
    description: "Foil rolls and other consumable finishing products.",
    seoTitle: "Consumables",
    seoDescription: "Gold foil rolls and other finishing supplies.",
    sortOrder: 5
  },
  {
    name: "Sublimation",
    slug: "sublimation",
    description: "Sublimation papers, blanks, and inks.",
    seoTitle: "Sublimation Materials",
    seoDescription: "Paper, blanks, and accessories for sublimation printing.",
    sortOrder: 6
  },
  {
    name: "Other",
    slug: "other",
    description: "Assorted accessories and staff-friendly items.",
    seoTitle: "Miscellaneous Accessories",
    seoDescription: "Badge reels, lanyards, and other office accessories.",
    sortOrder: 7
  }
];

const products = [
  {
    name: "Thermal Lamination Machine TLM 390H / 15\"",
    slug: "thermal-lamination-machine-tlm-390h-15",
    sku: "TMS-TLM-8743",
    price: 18500,
    shortDescription: "A reliable thermal laminator for digital and lab prints, offering professional-grade lamination for documents up to 15 inches wide.",
    description: "The TLM 390H is a thermal lamination machine designed specifically for digital and lab prints. It provides a protective and glossy finish to your documents, photos, and important papers. With a 15-inch capacity, it is ideal for small to medium-scale printing and lamination jobs.",
    seoTitle: "Buy Thermal Lamination Machine TLM 390H/15\" Online | TARA MAA SOLUTIONS",
    seoDescription: "Get a professional finish with the TLM 390H Thermal Lamination Machine. Ideal for digital prints, photos, and documents. Shop now from TARA MAA SOLUTIONS.",
    image: "https://placehold.co/600x400?text=Thermal+Lamination+Machine",
    categorySlug: "lamination"
  },
  {
    name: "Electrical & Manual Heavy Cold Lamination M/C With Stand",
    slug: "electrical-manual-heavy-cold-lamination-machine-with-stand",
    sku: "TMS-CLD-2910",
    price: 32000,
    shortDescription: "A versatile cold laminator for use on vinyl, sunboard, photos, and MDF boards. Comes with a heavy-duty stand.",
    description: "This heavy-duty cold lamination machine is perfect for mounting and laminating a variety of rigid and flexible materials. It uses pressure-sensitive adhesives, eliminating the need for heat.",
    seoTitle: "Heavy Duty Cold Lamination Machine with Stand | For Vinyl & Board",
    seoDescription: "Laminate vinyl, sunboard, photos, and MDF with ease using our Electrical & Manual Cold Lamination Machine with Stand. Available at TARA MAA SOLUTIONS.",
    image: "https://placehold.co/600x400?text=Cold+Lamination+Machine",
    categorySlug: "lamination"
  },
  {
    name: "Hot Stamping Machine",
    slug: "hot-stamping-machine",
    sku: "TMS-HSM-5621",
    price: 12000,
    shortDescription: "Applies metallic foil and embossed designs to paper, card, and other materials.",
    description: "Used to create elegant, shiny finishes on items like wedding cards, letterheads, and certificates. It transfers metallic foil with heat and pressure, giving a premium look.",
    seoTitle: "Professional Hot Stamping Machine for Foil Printing | TARA MAA SOLUTIONS",
    seoDescription: "Add a touch of elegance with our Hot Stamping Machine. Perfect for gold and silver foiling on cards and stationery.",
    image: "https://placehold.co/600x400?text=Hot+Stamping+Machine",
    categorySlug: "finishing"
  },
  {
    name: "200/A3 Fusing M/C",
    slug: "200-a3-fusing-machine",
    sku: "TMS-FUS-4387",
    price: 9500,
    shortDescription: "A compact fusing machine for toner transfer and heat-based applications on A3-sized materials.",
    description: "Provides consistent heat and pressure to bond or transfer images onto various substrates up to A3 size. Useful for PCB making and heat-activated adhesives.",
    seoTitle: "Buy 200/A3 Fusing Machine Online | TARA MAA SOLUTIONS",
    seoDescription: "Ideal for toner transfer and fusing applications. This A3 Fusing Machine delivers consistent heat and pressure.",
    image: "https://placehold.co/600x400?text=Fusing+Machine",
    categorySlug: "finishing"
  },
  {
    name: "Automatic Paper Folding Machine",
    slug: "automatic-paper-folding-machine",
    sku: "TMS-PFM-1256",
    price: 45000,
    shortDescription: "Efficiently folds various paper sizes and types for letters, brochures, and invoices.",
    description: "Streamline your mailroom with this machine. It folds different paper sizes into standard fold patterns quickly and accurately.",
    seoTitle: "High-Speed Automatic Paper Folding Machine | TARA MAA SOLUTIONS",
    seoDescription: "Improve your workflow with our Automatic Paper Folding Machine. Perfect for brochures, letters, and invoices.",
    image: "https://placehold.co/600x400?text=Paper+Folding+Machine",
    categorySlug: "finishing"
  },
  {
    name: "UV & DTF Machine",
    slug: "uv-and-dtf-machine",
    sku: "TMS-UV-DTF-9902",
    price: 185000,
    shortDescription: "Hybrid printer capable of UV direct-to-object and DTF printing with 1200Dpi.",
    description: "Prints directly onto rigid and roll materials with UV curing and transfers designs to fabrics with DTF film. Features CMYK+W inks and 310mm width.",
    seoTitle: "Buy UV DTF Printer Combo Machine 1200 DPI | TARA MAA SOLUTIONS",
    seoDescription: "Versatile UV & DTF machine for direct-to-object and film printing. High resolution with CMYK+W ink.",
    image: "https://placehold.co/600x400?text=UV+DTF+Machine",
    categorySlug: "printing"
  },
  {
    name: "Paper Shredder",
    slug: "paper-shredder",
    sku: "TMS-SHR-3011",
    price: 4500,
    shortDescription: "Secure and efficient shredder for confidential documents.",
    description: "Shreds documents, credit cards, and staples into unreadable particles to protect sensitive information and reduce clutter.",
    seoTitle: "Heavy Duty Paper Shredder for Office | TARA MAA SOLUTIONS",
    seoDescription: "Ensure data security with our reliable Paper Shredder. Ideal for office use.",
    image: "https://placehold.co/600x400?text=Paper+Shredder",
    categorySlug: "office"
  },
  {
    name: "Note Counting Machine",
    slug: "note-counting-machine",
    sku: "TMS-CNT-7420",
    price: 7500,
    shortDescription: "Accurate note counter with counterfeit detection.",
    description: "Counts mixed currency and detects fakes using UV, MG, and IR sensors. Large hopper and display suit banks and retailers.",
    seoTitle: "Advanced Note Counting Machine with Fake Note Detection | TARA MAA SOLUTIONS",
    seoDescription: "Count cash quickly and detect counterfeits with our Note Counting Machine. Perfect for businesses.",
    image: "https://placehold.co/600x400?text=Note+Counting+Machine",
    categorySlug: "office"
  },
  {
    name: "Non-Heating Gold Foil Rolls For Direct Printing",
    slug: "non-heating-gold-foil-rolls",
    sku: "TMS-GFR-5689",
    price: 450,
    shortDescription: "Metallic foil rolls for cold foiling without heat.",
    description: "Adds gold foiling to prints using laser printers/copy without a hot stamping machine.",
    seoTitle: "Buy Non-Heating Gold Foil Rolls for Laser Printers | TARA MAA SOLUTIONS",
    seoDescription: "Add metallic shine to prints without heat. Perfect for laser printers and crafts.",
    image: "https://placehold.co/600x400?text=Gold+Foil+Rolls",
    categorySlug: "consumables"
  },
  {
    name: "Sublimation Material (Assorted)",
    slug: "sublimation-material-assorted",
    sku: "TMS-SUB-1001",
    price: 1250,
    shortDescription: "Consumables for sublimation printing including paper and blanks.",
    description: "Includes sublimation paper, mugs, t-shirts, and phone cases for personalized gifts.",
    seoTitle: "High-Quality Sublimation Paper and Blanks | TARA MAA SOLUTIONS",
    seoDescription: "Find sublimation paper, mugs, and t-shirts for vibrant transfers at one place.",
    image: "https://placehold.co/600x400?text=Sublimation+Material",
    categorySlug: "sublimation"
  },
  {
    name: "1D Card YOYO and Other Accessories",
    slug: "id-card-accessories-yoyo-reels",
    sku: "TMS-ACC-2255",
    price: 60,
    shortDescription: "Badge reels, card holders, and lanyard accessories.",
    description: "Includes retractable badge reels, ID holders, and lanyard hardware for offices and events.",
    seoTitle: "Buy ID Card Holders, Badge Reels & Accessories Online | TARA MAA SOLUTIONS",
    seoDescription: "Shop retractable badge reels, card holders, and lanyard attachments. Perfect for ID cards.",
    image: "https://placehold.co/600x400?text=ID+Card+Accessories",
    categorySlug: "other"
  }
];

async function run() {
  await connectDB();

  const createdCategories = {};
  for (const data of categories) {
    const existing = await Category.findOne({ slug: data.slug });
    const category = existing
      ? await Category.findByIdAndUpdate(existing._id, data, { new: true })
      : await Category.create(data);
    createdCategories[data.slug] = category._id;
  }

  for (const product of products) {
    const payload = {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      shortDescription: product.shortDescription,
      description: product.description,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      images: [product.image],
      category: createdCategories[product.categorySlug],
      status: "published"
    };

    await Product.findOneAndUpdate({ slug: product.slug }, payload, { upsert: true, setDefaultsOnInsert: true });
  }

  console.log("Seeded categories and products.");
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
