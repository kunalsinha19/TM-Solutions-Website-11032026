/**
 * Downloads product images from Hangzhou Caide (the TMS manufacturer) and
 * updates seed-data.json so every product points to a real image file.
 *
 * Run: node backend/scripts/download-images.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "../../apps/web/public/products");
const SEED_FILE = path.join(__dirname, "seed-data.json");
const BASE_URL = "https://image.made-in-china.com/2f0j00";

// ── Image download list ───────────────────────────────────────────────────────
// hash = the unique part of the made-in-china.com URL; file = local filename
const IMAGES = [
  // Glue Binders
  { file: "gb_x3.jpg",      hash: "tHOBKbGASloJ", label: "Wd-X3 Glue Binder" },
  { file: "gb_x5.jpg",      hash: "AIyCQracAhos",  label: "Wd-X5 Glue Binder" },
  { file: "gb_x5l.jpg",     hash: "zILBibOAnYku",  label: "Wd-X5l Glue Binder" },
  { file: "gb_x6.jpg",      hash: "nHlMQsfzhYoZ",  label: "Wd-X6 Glue Binder" },
  { file: "gb_x7.jpg",      hash: "gHGBUNpEVYbk",  label: "Wd-X7 Glue Binder" },
  { file: "gb_x7l.jpg",     hash: "KPDedqJspUkj",  label: "Wd-X7l Glue Binder" },
  { file: "gb_m3.jpg",      hash: "IJsvjocBPnqz",  label: "WD-M3 Glue Binder" },
  { file: "gb_m5.jpg",      hash: "gPhBGHfsIRkt",  label: "M5 Glue Binder" },
  { file: "gb_m6.jpg",      hash: "DFHWnQgGnbcA",  label: "WD-M6 Glue Binder" },
  { file: "gb_m7.jpg",      hash: "mDdMyGslSWoR",  label: "Wd-M7 Glue Binder" },
  { file: "gb_cca3.jpg",    hash: "QTyesiRzbnoV",  label: "WD-CCA3 Glue Binder" },
  { file: "gb_cca4.jpg",    hash: "MtQeEkrZhJch",  label: "WD-CCA4 Glue Binder" },
  { file: "gb_caa3.jpg",    hash: "pyEqSTPzhibN",  label: "CAA3 Glue Binder" },
  { file: "gb_caa4.jpg",    hash: "yEQMPmGFydqw",  label: "WD-CAA4 Glue Binder" },
  { file: "gb_j500.jpg",    hash: "kZuoyWEKnGcV",  label: "J500 Glue Binder" },
  { file: "gb_60sca3.jpg",  hash: "bJAMptTWEmkf",  label: "60SCA3 Glue Binder" },
  // Roll Laminators
  { file: "rl_fm380.jpg",   hash: "VEFZbSmGQscK",  label: "Wd-FM-380A Laminator" },
  { file: "rl_l3806.jpg",   hash: "AEQZMvqBSFko",  label: "Wd-L3806 Laminator" },
  { file: "rl_9350t.jpg",   hash: "AaRZIKesGSkm",  label: "Wd-9350t Laminator" },
  { file: "rl_480sj.jpg",   hash: "tTQjJGCaTfbR",  label: "Wd-480sj Laminator" },
  { file: "rl_450t.jpg",    hash: "hQTSFMtqsGoR",  label: "Wd-450t Laminator" },
  { file: "rl_360sj.jpg",   hash: "uawKtEJmCQbk",  label: "Wd-360sj Laminator" },
  { file: "rl_v350s.jpg",   hash: "JaQjwciDEfbs",  label: "Wd-V350s Laminator" },
  { file: "rl_350t.jpg",    hash: "RQdKrGCJHTqI",  label: "Wd-350t Laminator" },
  { file: "rl_fm390a.jpg",  hash: "tEysmibznTkN",  label: "FM-390A Laminator" },
  { file: "rl_fm390.jpg",   hash: "wWivthnaLFqb",  label: "FM-390 Laminator" },
  { file: "rl_yg320.jpg",   hash: "tcIvROyPgrbf",  label: "Wd-Yg-320CS Laminator" },
  { file: "rl_fm520.jpg",   hash: "QiJBrcFPEsoY",  label: "FM-520yz Laminator" },
  { file: "rl_fm360.jpg",   hash: "NlyBKgZFdsbS",  label: "FM360 Laminator" },
  { file: "rl_fm360l.jpg",  hash: "mhABlGWPyKkv",  label: "FM360L Laminator" },
  // Paper Creasing Machines
  { file: "pc_h350.jpg",    hash: "sTNelSzrlmqi",  label: "Wd-H350 Creaser" },
  { file: "pc_h450.jpg",    hash: "vEBMfeGsAdor",  label: "Wd-H450 Creaser" },
  { file: "pc_y350.jpg",    hash: "VavMfNYFMmcn",  label: "Wd-Y350 Creaser" },
  { file: "pc_12b.jpg",     hash: "SVDeMRzGnFok",  label: "Wd-12b Creaser" },
  { file: "pc_15b.jpg",     hash: "fVuekngsANqG",  label: "Wd-15b Creaser" },
  { file: "pc_16b.jpg",     hash: "oWPBbUpfgnqg",  label: "Wd-16b Creaser" },
  { file: "pc_12c.jpg",     hash: "JhHMDbIRMOom",  label: "Wd-12c Creaser" },
  { file: "pc_12d.jpg",     hash: "EiHMbIPtJnkr",  label: "Wd-12D Creaser" },
  { file: "pc_h460.jpg",    hash: "QEkKRvNIOubU",  label: "Wd-H460 Creaser" },
  { file: "pc_h520.jpg",    hash: "DQCjvwyBQgbF",  label: "Wd-H520 Creaser" },
  { file: "pc_650.jpg",     hash: "GPWvDByhCVou",  label: "Wd-650 Creaser" },
  { file: "pc_650a.jpg",    hash: "eEZScUBnEpoI",  label: "Wd-650A Creaser" },
  { file: "pc_nc353a.jpg",  hash: "hSVkRCUbYDcQ",  label: "Wd-Nc353A Creaser" },
  { file: "pc_339.jpg",     hash: "dASiHIWySofh",  label: "Wd-339 Creaser" },
  { file: "pc_cpc480a.jpg", hash: "ONCEQbtYhWcs",  label: "Wd-CPC480A Creaser" },
  // Paper Folding Machines
  { file: "fm_r304.jpg",    hash: "EyIqeQYGvzko",  label: "Wd-R304 Folder" },
  { file: "fm_z382s.jpg",   hash: "FCNqyBdtpHkh",  label: "WD-Z382s Folder" },
  { file: "fm_298a.jpg",    hash: "RZgcbaHtqfoM",  label: "WD-298A Folder" },
  { file: "fm_297.jpg",     hash: "wDvUtMlBfLby",  label: "WD-297 Folder" },
  // Riding / Saddle Staplers
  { file: "rs_102.jpg",     hash: "ZHrMumQBfjcV",  label: "Wd-102 Riding Stapler" },
  { file: "rs_102t.jpg",    hash: "MOsqBYWdSkcU",  label: "Wd-102t Riding Stapler" },
  { file: "rs_102hl.jpg",   hash: "FnkoJBrISbqG",  label: "Wd-102hl Riding Stapler" },
  { file: "rs_zy1b.jpg",    hash: "pFDkEcZrfqoA",  label: "ZY-B1 Booklet Maker" },
  // Corner Cutters
  { file: "cc_120b.jpg",    hash: "aMQkCPqmfHoJ",  label: "WD-120B Corner Cutter" },
  { file: "cc_30.jpg",      hash: "JLQGkdIbArqK",  label: "WD-30 Corner Cutter" },
  { file: "cc_30y.jpg",     hash: "LCtbeBlMEiko",   label: "WD-30Y Corner Cutter" },
  { file: "cc_l30.jpg",     hash: "pCRisZfzqQYW",  label: "WD-L30 Corner Cutter" },
  { file: "cc_80.jpg",      hash: "gHuUlrPBOVbM",  label: "WD-80 Corner Cutter" },
  { file: "cc_80y.jpg",     hash: "UBTcRpvHJWke",  label: "WD-80Y Corner Cutter" },
  // Slitting Machines
  { file: "sm_wd300.jpg",   hash: "eTqUCiGcvuof",  label: "WD-300 Slitter" },
  { file: "sm_wd400.jpg",   hash: "nTbYMHUgIrcQ",  label: "WD-400 Slitter" },
  { file: "sm_wd500.jpg",   hash: "YKycaRjgnhoO",  label: "WD-500 Slitter" },
  { file: "sm_wd600.jpg",   hash: "BraYACLlHugO",  label: "WD-600 Slitter" },
  { file: "sm_6h320.jpg",   hash: "CzoRDupIakcB",  label: "WD-6H320 Slitter" },
  // Foil Stamping
  { file: "fs_360a.jpg",    hash: "pUHfGLIPVDqJ",  label: "WD-360A Foil Stamper" },
  // Heavy Duty Paper Cutters
  { file: "hpc_9211d.jpg",  hash: "ndTBDkFMPJoh",  label: "WD-9211D Hydraulic Cutter" },
  { file: "hpc_8210s.jpg",  hash: "YJAMKBtnNOqd",  label: "WD-8210S Hydraulic Cutter" },
  // Die Cutting
  { file: "dc_ha4.jpg",     hash: "bZnqkAJMeioD",  label: "Ha4 Die Cutter" },
];

// ── SKU → image file mapping ──────────────────────────────────────────────────
const SKU_MAP = {
  // Glue Binders
  "TMS-JB-5": "gb_cca3.jpg",       "TMS-JB-3": "gb_cca3.jpg",       "TMS-JB-4": "gb_cca3.jpg",
  "TMS-460A": "gb_cca3.jpg",       "TMS-460":  "gb_cca3.jpg",       "TMS-460AC": "gb_cca3.jpg",
  "TMS-460AS": "gb_cca3.jpg",      "TMS-450AC": "gb_caa4.jpg",      "TMS-470":  "gb_cca4.jpg",
  "TMS-470S": "gb_cca4.jpg",       "TMS-J380": "gb_m3.jpg",         "TMS-J400": "gb_m3.jpg",
  "TMS-J500": "gb_j500.jpg",       "TMS-3238SEMI-AUTOMATIC": "gb_caa3.jpg",
  "TMS-30": "gb_cca3.jpg",         "TMS-50DA4": "gb_caa4.jpg",      "TMS-CBA4": "gb_caa4.jpg",
  "TMS-CAA3": "gb_caa3.jpg",       "TMS-M3": "gb_m3.jpg",           "TMS-M5": "gb_m5.jpg",
  "TMS-M6": "gb_m6.jpg",           "TMS-M7": "gb_m7.jpg",           "TMS-X3": "gb_x3.jpg",
  "TMS-X5L": "gb_x5l.jpg",         "TMS-X6": "gb_x6.jpg",           "TMS-X6600": "gb_x6.jpg",
  "TMS-X7L": "gb_x7l.jpg",         "TMS-X8800": "gb_x7.jpg",        "TMS-X5200": "gb_x5.jpg",
  "TMS-X5800": "gb_x5.jpg",        "TMS-X5100": "gb_x5.jpg",        "TMS-508SY": "gb_x5.jpg",
  "TMS-TH600": "gb_60sca3.jpg",    "TMS-60SCA3BP": "gb_60sca3.jpg",
  // Roll Laminators
  "TMS-V370F": "rl_v350s.jpg",     "TMS-V370FS": "rl_v350s.jpg",   "TMS-380": "rl_fm380.jpg",
  "TMS-650": "rl_l3806.jpg",       "TMS-650G": "rl_l3806.jpg",     "TMS-AUTO-420MAX": "rl_fm390a.jpg",
  "TMS-AUTO-520MAX": "rl_fm520.jpg","TMS-FM-360": "rl_fm360.jpg",   "TMS-FM-360L": "rl_fm360l.jpg",
  "TMS-FM-1100": "rl_l3806.jpg",   "TMS-FM-480": "rl_480sj.jpg",   "TMS-FM-350A": "rl_350t.jpg",
  "TMS-FM-350D": "rl_350t.jpg",    "TMS-FM-350E": "rl_350t.jpg",   "TMS-9460T": "rl_9350t.jpg",
  "TMS-350": "rl_350t.jpg",        "TMS-350T": "rl_350t.jpg",      "TMS-360SJ": "rl_360sj.jpg",
  "TMS-360GS": "rl_360sj.jpg",     "TMS-360S": "rl_360sj.jpg",     "TMS-400A": "rl_450t.jpg",
  "TMS-390": "rl_fm390.jpg",       "TMS-390B": "rl_fm390.jpg",     "TMS-520B": "rl_fm520.jpg",
  "TMS-FM520Y": "rl_fm520.jpg",    "TMS-FM720Y": "rl_yg320.jpg",   "TMS-FM-520YZ": "rl_fm520.jpg",
  "TMS-FM720E": "rl_yg320.jpg",    "TMS-420B": "rl_480sj.jpg",     "TMS-375A": "rl_v350s.jpg",
  "TMS-720+": "rl_l3806.jpg",      "TMS-3800": "rl_l3806.jpg",     "TMS-3801": "rl_l3806.jpg",
  "TMS-3808": "rl_l3806.jpg",      "TMS-3809": "rl_l3806.jpg",     "TMS-3800S": "rl_l3806.jpg",
  "TMS-3801S": "rl_l3806.jpg",     "TMS-3808S": "rl_l3806.jpg",    "TMS-3809S": "rl_l3806.jpg",
  "TMS-YYFM720": "rl_yg320.jpg",   "TMS-YYFM520": "rl_fm520.jpg",  "TMS-YYFM900": "rl_l3806.jpg",
  "TMS-YYFM1200": "rl_l3806.jpg",  "TMS-QLFM-720Y": "rl_fm520.jpg","TMS-QLFM-900Y": "rl_l3806.jpg",
  "TMS-QLFM-1000Y": "rl_l3806.jpg","TMS-QLFM-1200Y": "rl_l3806.jpg",
  // Paper Creasing
  "TMS-H350": "pc_h350.jpg",       "TMS-Y350": "pc_y350.jpg",      "TMS-12B": "pc_12b.jpg",
  "TMS-15B": "pc_15b.jpg",         "TMS-16B": "pc_16b.jpg",        "TMS-12C": "pc_12c.jpg",
  "TMS-12D": "pc_12d.jpg",         "TMS-P460": "pc_h460.jpg",      "TMS-SL650": "pc_650.jpg",
  "TMS-P480": "pc_h460.jpg",       "TMS-SL950": "pc_650a.jpg",     "TMS-6601": "pc_cpc480a.jpg",
  "TMS-6602": "pc_cpc480a.jpg",    "TMS-6603": "pc_cpc480a.jpg",   "TMS-6620": "pc_cpc480a.jpg",
  "TMS-H500": "pc_h520.jpg",       "TMS-HS500": "pc_h520.jpg",     "TMS-NCC330A": "pc_nc353a.jpg",
  "TMS-650A": "pc_650a.jpg",       "TMS-NC330": "pc_nc353a.jpg",   "TMS-NC350A": "pc_nc353a.jpg",
  "TMS-NC-353": "pc_nc353a.jpg",   "TMS-NC-353A": "pc_nc353a.jpg", "TMS-339": "pc_339.jpg",
  "TMS-339A": "pc_339.jpg",
  // Die Cutting
  "TMS-CPD500": "dc_ha4.jpg",
  // Folding Machines
  "TMS-R204": "fm_297.jpg",        "TMS-R304": "fm_r304.jpg",      "TMS-2600": "fm_z382s.jpg",
  "TMS-2601": "fm_z382s.jpg", // alias for 2600/2601
  "TMS-1810ZHL": "fm_298a.jpg",    "TMS-1810CHL": "fm_298a.jpg",   "TMS-1810CHHL": "fm_298a.jpg",
  // Riding Staplers
  "TMS-103": "rs_102.jpg",         "TMS-103HL": "rs_102.jpg",      "TMS-102": "rs_102t.jpg",
  "TMS-102T": "rs_102t.jpg",       "TMS-102HL": "rs_102hl.jpg",    "TMS-105": "rs_zy1b.jpg",
  "TMS-105GT": "rs_zy1b.jpg",      "TMS-105G": "rs_zy1b.jpg",      "TMS-106": "rs_102.jpg",
  "TMS-JH100Z": "rs_zy1b.jpg",     "TMS-JH100": "rs_zy1b.jpg",
  // Corner Cutters
  "TMS-JD120": "cc_120b.jpg",      "TMS-JD120B": "cc_120b.jpg",   "TMS-30C": "cc_30.jpg",
  "TMS-L30": "cc_l30.jpg",         "TMS-L30Y": "cc_30y.jpg",       "TMS-30Y": "cc_30y.jpg",
  "TMS-80B": "cc_80.jpg",          "TMS-80": "cc_80.jpg",          "TMS-80A": "cc_80y.jpg",
  // Slitting Machines
  "TMS-18M": "sm_wd300.jpg",       "TMS-6H320": "sm_6h320.jpg",   "TMS-18Y": "sm_wd300.jpg",
  "TMS-6H320B": "sm_6h320.jpg",    "TMS-6H320C": "sm_6h320.jpg",  "TMS-300H": "sm_wd300.jpg",
  "TMS-8500": "sm_wd600.jpg",      "TMS-500H": "sm_wd500.jpg",    "TMS-600AS": "sm_wd600.jpg",
  "TMS-400H": "sm_wd400.jpg",      "TMS-600H": "sm_wd600.jpg",
  // Foil Stamping
  "TMS-360A": "fs_360a.jpg",
  // Heavy Duty Paper Cutters
  "TMS-720R": "hpc_8210s.jpg",     "TMS-720H": "hpc_9211d.jpg",   "TMS-Z92CT-KD": "hpc_9211d.jpg",
  "TMS-Z130CT-KD": "hpc_9211d.jpg","TMS-QZYK1150DH-10": "hpc_9211d.jpg",
  "TMS-QZYK1300DH-10": "hpc_9211d.jpg","TMS-QZYK1370DH-10": "hpc_9211d.jpg",
  "TMS-QZYK1620DH-10": "hpc_9211d.jpg","TMS-QZYK1850DH-10": "hpc_9211d.jpg",
  "TMS-QZYK2200DH-10": "hpc_9211d.jpg",
};

// ── Download helper ───────────────────────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve("exists"); return; }
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Downloading product images from Hangzhou Caide ===\n");

  let downloaded = 0, skipped = 0, failed = 0;

  for (const img of IMAGES) {
    const dest = path.join(PUBLIC_DIR, img.file);
    // Construct URL — the filename suffix after the hash doesn't matter for the CDN
    const url = `${BASE_URL}${img.hash}/${img.label.replace(/\s+/g, "-")}.jpg`;
    try {
      const result = await download(url, dest);
      if (result === "exists") {
        skipped++;
        console.log(`  ↷  ${img.file} (already exists)`);
      } else {
        downloaded++;
        const size = Math.round(fs.statSync(dest).size / 1024);
        console.log(`  ✓  ${img.file} — ${size} KB`);
      }
    } catch (err) {
      failed++;
      console.log(`  ✗  ${img.file} — ${err.message}`);
    }
    // Small delay to avoid rate-limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDownloads: ${downloaded} new, ${skipped} skipped, ${failed} failed.\n`);

  // ── Update seed-data.json ─────────────────────────────────────────────────
  console.log("Updating seed-data.json with correct image paths…");
  const seedData = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
  let updated = 0, unchanged = 0, noMap = 0;

  for (const product of seedData.products) {
    const imgFile = SKU_MAP[product.sku];
    if (!imgFile) {
      noMap++;
      continue;
    }
    const newUrl = `/products/${imgFile}`;
    if (product.images?.[0]?.url === newUrl) { unchanged++; continue; }
    // Set all images to the one representative file (can be extended later)
    product.images = [{ url: newUrl, alt: product.name }];
    updated++;
  }

  fs.writeFileSync(SEED_FILE, JSON.stringify(seedData, null, 2));
  console.log(`  ✓ ${updated} products updated, ${unchanged} unchanged, ${noMap} without mapping.`);
  console.log("\nDone! Now re-seed MongoDB to apply image changes:");
  console.log("  cd backend && node scripts/seed-from-excel.js\n");
}

main().catch(console.error);
