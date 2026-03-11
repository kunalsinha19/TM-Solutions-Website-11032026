const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");

const slugImageMap = {
  "thermal-lamination-machine-tlm-390h-15": "https://cdn.pixabay.com/photo/2016/05/26/17/36/office-1412915_1280.jpg",
  "electrical-manual-heavy-cold-lamination-machine-with-stand": "https://cdn.pixabay.com/photo/2019/05/23/08/10/printer-4227465_1280.jpg",
  "hot-stamping-machine": "https://cdn.pixabay.com/photo/2017/03/13/23/56/press-2130934_1280.jpg",
  "200-a3-fusing-machine": "https://cdn.pixabay.com/photo/2016/01/19/17/56/technology-1148007_1280.jpg",
  "automatic-paper-folding-machine": "https://cdn.pixabay.com/photo/2016/09/30/18/13/documents-1702637_1280.jpg",
  "uv-and-dtf-machine": "https://cdn.pixabay.com/photo/2017/08/04/09/53/printing-2577074_1280.jpg",
  "paper-shredder": "https://cdn.pixabay.com/photo/2016/11/19/14/00/cash-1839874_1280.jpg",
  "note-counting-machine": "https://cdn.pixabay.com/photo/2018/04/03/12/05/money-3283309_1280.jpg",
  "non-heating-gold-foil-rolls": "https://cdn.pixabay.com/photo/2019/07/05/11/44/gold-4313212_1280.jpg",
  "sublimation-material-assorted": "https://cdn.pixabay.com/photo/2016/04/08/17/45/t-shirt-1311043_1280.jpg",
  "id-card-accessories-yoyo-reels": "https://cdn.pixabay.com/photo/2020/10/31/19/19/id-card-5702107_1280.jpg"
};

async function run() {
  await connectDB();
  for (const [slug, imageUrl] of Object.entries(slugImageMap)) {
    const product = await Product.findOneAndUpdate(
      { slug },
      { $set: { images: [imageUrl] } },
      { new: true }
    );
    if (product) {
      console.log(`Updated ${product.name}`);
    } else {
      console.warn(`Product ${slug} not found`);
    }
  }
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
