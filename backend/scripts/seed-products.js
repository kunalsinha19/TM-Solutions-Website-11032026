const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");

function placeholderImage(name) {
  const text = encodeURIComponent(name);
  return `https://placehold.co/800x600?text=${text}`;
}

const categories = [
  {
    name: "Lamination",
    slug: "lamination",
    description: "Thermal and cold lamination machines and accessories."
  },
  {
    name: "Finishing",
    slug: "finishing",
    description: "Finishing machines like folding, stamping, and fusing."
  },
  {
    name: "Printing",
    slug: "printing",
    description: "Printing machines for industrial and commercial use."
  },
  {
    name: "Office",
    slug: "office",
    description: "Office automation tools and equipment."
  },
  {
    name: "Consumables",
    slug: "consumables",
    description: "Consumable items used in printing and finishing workflows."
  },
  {
    name: "Sublimation",
    slug: "sublimation",
    description: "Sublimation materials and consumables."
  },
  {
    name: "Other",
    slug: "other",
    description: "Accessories and other related products."
  }
];

const products = [
  {
    categorySlug: "lamination",
    name: "Thermal Lamination Machine TLM 390H / 15\"",
    slug: "thermal-lamination-machine-tlm-390h-15",
    sku: "TMS-TLM-8743",
    price: 18500,
    shortDescription: "A reliable thermal laminator for digital and lab prints, offering professional-grade lamination for documents up to 15 inches wide.",
    description: "The TLM 390H is a thermal lamination machine designed specifically for digital and lab prints. It provides a protective and glossy finish to your documents, photos, and important papers. With a 15-inch capacity, it is ideal for small to medium-scale printing and lamination jobs. It uses heat to activate the adhesive on the lamination pouch or roll, creating a durable and long-lasting seal.",
    seoTitle: "Buy Thermal Lamination Machine TLM 390H/15\" Online | TARA MAA SOLUTIONS",
    seoDescription: "Get a professional finish with the TLM 390H Thermal Lamination Machine. Ideal for digital prints, photos, and documents. Shop now from TARA MAA SOLUTIONS."
  },
  {
    categorySlug: "lamination",
    name: "Electrical & Manual Heavy Cold Lamination M/C With Stand",
    slug: "electrical-manual-heavy-cold-lamination-machine-with-stand",
    sku: "TMS-CLD-2910",
    price: 32000,
    shortDescription: "A versatile cold laminator for use on vinyl, sunboard, photos, and MDF boards. Comes with a heavy-duty stand.",
    description: "This heavy-duty cold lamination machine is perfect for mounting and laminating a variety of rigid and flexible materials. It uses pressure-sensitive adhesives, eliminating the need for heat. It is ideal for laminating vinyl graphics, photos onto sunboards, and protecting large-format prints mounted on MDF. The included stand provides a stable and ergonomic workspace.",
    seoTitle: "Heavy Duty Cold Lamination Machine with Stand | For Vinyl & Board",
    seoDescription: "Laminate vinyl, sunboard, photos, and MDF with ease using our Electrical & Manual Cold Lamination Machine. Includes a sturdy stand. Available at TARA MAA SOLUTIONS."
  },
  {
    categorySlug: "finishing",
    name: "Hot Stamping Machine",
    slug: "hot-stamping-machine",
    sku: "TMS-HSM-5621",
    price: 12000,
    shortDescription: "A machine for applying metallic foil and embossed designs to paper, card, and other materials.",
    description: "This Hot Stamping Machine is used to create elegant, shiny finishes on items like wedding cards, letterheads, and certificates. It works by using heat and pressure to transfer metallic foil (like gold or silver) from a roll onto the surface of the material. This machine adds a premium, professional touch to any printed piece.",
    seoTitle: "Professional Hot Stamping Machine for Foil Printing | TARA MAA SOLUTIONS",
    seoDescription: "Add a touch of elegance with our Hot Stamping Machine. Perfect for gold and silver foiling on cards and stationery. Buy online from TARA MAA SOLUTIONS."
  },
  {
    categorySlug: "finishing",
    name: "200/A3 Fusing M/C",
    slug: "200-a3-fusing-machine",
    sku: "TMS-FUS-4387",
    price: 9500,
    shortDescription: "A compact fusing machine for toner transfer and heat-based applications on A3-sized materials.",
    description: "The 200/A3 Fusing Machine is designed for heat-based fusing applications, commonly used in toner transfer techniques for PCB making or for heat-activated adhesives. It provides consistent heat and pressure to bond or transfer images onto various substrates up to A3 size. It's a useful tool for hobbyists and small workshops.",
    seoTitle: "Buy 200/A3 Fusing Machine Online | TARA MAA SOLUTIONS",
    seoDescription: "Ideal for toner transfer and fusing applications. This A3 Fusing Machine delivers consistent heat and pressure. Order from TARA MAA SOLUTIONS today."
  },
  {
    categorySlug: "finishing",
    name: "Automatic Paper Folding Machine",
    slug: "automatic-paper-folding-machine",
    sku: "TMS-PFM-1256",
    price: 45000,
    shortDescription: "An efficient machine for automatically folding various paper sizes and types for letters, brochures, and invoices.",
    description: "Streamline your mailroom or print finishing with this Automatic Paper Folding Machine. It can quickly and accurately fold different paper sizes into standard fold patterns like letter, gate, or accordion folds. This machine saves significant time and labor compared to manual folding, ensuring consistent results for brochures, invoices, letters, and direct mail pieces.",
    seoTitle: "High-Speed Automatic Paper Folding Machine | TARA MAA SOLUTIONS",
    seoDescription: "Improve your workflow with our Automatic Paper Folding Machine. Perfect for brochures, letters, and invoices. Fast, accurate, and efficient. Shop now."
  },
  {
    categorySlug: "printing",
    name: "UV & DTF Machine",
    slug: "uv-and-dtf-machine",
    sku: "TMS-UV-DTF-9902",
    price: 185000,
    shortDescription: "A hybrid printer capable of UV direct-to-object printing and DTF (Direct to Film) printing. Resolution: 1200Dpi.",
    description: "This advanced UV & DTF Machine is a versatile printing solution. As a UV printer, it can print directly onto a wide variety of rigid and roll materials like acrylic, glass, metal, and wood, with the ink being instantly cured by UV rays. As a DTF printer, it prints designs onto a special film, which can then be transferred onto fabrics using a heat press. It features a 310mm print width, uses CMYK + White ink, and has a high resolution of 1200Dpi.",
    seoTitle: "Buy UV DTF Printer Combo Machine 1200 DPI | TARA MAA SOLUTIONS",
    seoDescription: "Versatile UV & DTF printing machine for direct-to-object and film printing. High resolution with CMYK+W ink. Available at TARA MAA SOLUTIONS."
  },
  {
    categorySlug: "office",
    name: "Paper Shredder",
    slug: "paper-shredder",
    sku: "TMS-SHR-3011",
    price: 4500,
    shortDescription: "A secure and efficient paper shredder for disposing of confidential documents in the office or home.",
    description: "Keep your sensitive information safe with this reliable Paper Shredder from TARA MAA SOLUTIONS. Designed for office use, it can shred documents, credit cards, and staples, turning them into unreadable strips or cross-cut particles. It is an essential tool for any workplace looking to maintain data security and reduce paper clutter.",
    seoTitle: "Heavy Duty Paper Shredder for Office | TARA MAA SOLUTIONS",
    seoDescription: "Ensure data security with our reliable Paper Shredder. Ideal for office use to dispose of confidential documents. Shop at TARA MAA SOLUTIONS."
  },
  {
    categorySlug: "office",
    name: "Note Counting Machine",
    slug: "note-counting-machine",
    sku: "TMS-CNT-7420",
    price: 7500,
    shortDescription: "An electronic machine for accurately counting mixed currency notes and detecting counterfeit bills.",
    description: "Streamline your cash handling with this high-speed Note Counting Machine. It accurately counts batches of mixed notes and is equipped with advanced sensors to detect counterfeit currency using UV, MG, and IR detection methods. It features a large hopper and display, making it perfect for banks, retail stores, and any business that handles significant amounts of cash.",
    seoTitle: "Advanced Note Counting Machine with Fake Note Detection | TARA MAA SOLUTIONS",
    seoDescription: "Count cash quickly and detect counterfeits with our Note Counting Machine. Perfect for retail and business use. Available at TARA MAA SOLUTIONS."
  },
  {
    categorySlug: "consumables",
    name: "Non-Heating Gold Foil Rolls For Direct Printing",
    slug: "non-heating-gold-foil-rolls",
    sku: "TMS-GFR-5689",
    price: 450,
    shortDescription: "Metallic foil rolls for cold foiling applications, compatible with laser printers and copiers without the need for heat.",
    description: "These specialized Non-Heating Gold Foil Rolls allow you to add a brilliant metallic finish to your prints without a dedicated hot stamping machine. They are designed for use with laser printers or copiers. The process involves printing a toner pattern, then running the sheet through the machine with the foil to transfer the metallic layer onto the toner. Perfect for invitations, business cards, and craft projects.",
    seoTitle: "Buy Non-Heating Gold Foil Rolls for Laser Printers | TARA MAA SOLUTIONS",
    seoDescription: "Add metallic shine to your prints without heat! These Gold Foil Rolls are perfect for laser printers and DIY projects. Shop now at TARA MAA SOLUTIONS."
  },
  {
    categorySlug: "sublimation",
    name: "Sublimation Material (Assorted)",
    slug: "sublimation-material-assorted",
    sku: "TMS-SUB-1001",
    price: 300,
    shortDescription: "A range of consumables for sublimation printing, including paper, blanks (mugs, t-shirts), and other substrates. Price range: ?300 - ?2,000.",
    description: "TARA MAA SOLUTIONS offers a comprehensive range of sublimation materials to fuel your printing needs. This includes high-release sublimation paper for vibrant transfers, and a variety of polymer-coated blanks such as mugs, t-shirts, plates, and phone cases. These materials are essential for creating personalized gifts and custom apparel.",
    seoTitle: "High-Quality Sublimation Paper and Blanks | TARA MAA SOLUTIONS",
    seoDescription: "Find all your sublimation needs in one place: paper, mugs, t-shirts, and more. High-quality materials for vibrant transfers. Shop at TARA MAA SOLUTIONS."
  },
  {
    categorySlug: "other",
    name: "1D Card YOYO and Other Accessories",
    slug: "id-card-accessories-yoyo-reels",
    sku: "TMS-ACC-2255",
    price: 25,
    shortDescription: "A variety of office and identification accessories including badge reels, card holders, and lanyard attachments. Price range: ?25 - ?150 per piece.",
    description: "This category includes a wide assortment of handy accessories. The \"1D Card YOYO\" is a retractable badge reel, perfect for holding ID cards and keys. Other products in this line include various types of ID card holders, lanyard clips, badge reels, and plastic parts for creating professional-looking ID badges. These items are essential for offices, schools, and events for easy identification.",
    seoTitle: "Buy ID Card Holders, Badge Reels & Accessories Online | TARA MAA SOLUTIONS",
    seoDescription: "Shop for retractable badge reels (YOYO), card holders, and lanyard attachments. Perfect for office ID cards and events. Available from TARA MAA SOLUTIONS."
  }
];

async function upsertCategories() {
  const results = new Map();
  for (const item of categories) {
    const category = await Category.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          isActive: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.set(item.slug, category);
  }
  return results;
}

async function upsertProducts(categoryMap) {
  for (const item of products) {
    const category = categoryMap.get(item.categorySlug);
    if (!category) {
      console.warn("Missing category for product:", item.name);
      continue;
    }

    const images = item.images && item.images.length
      ? item.images
      : [placeholderImage(item.name)];

    await Product.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          price: item.price,
          shortDescription: item.shortDescription,
          description: item.description,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          category: category._id,
          status: "published",
          publishedAt: new Date(),
          images
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function run() {
  await connectDB();
  const categoryMap = await upsertCategories();
  await upsertProducts(categoryMap);
  await mongoose.disconnect();
  console.log("Seed completed.");
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
