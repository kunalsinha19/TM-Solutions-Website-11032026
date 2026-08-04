// Indian state codes for IGST determination
const STATE_CODES = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
  "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam",
  "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
  "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh", "96": "Other Countries",
};

function getStateCodeFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  return gstin.substring(0, 2);
}

function isInterState(supplyStateCode, customerStateCode) {
  if (!supplyStateCode || !customerStateCode) return false;
  return supplyStateCode !== customerStateCode;
}

function calculateItemTax({ rate, gstRate, cessRate = 0, qty, discountPercent = 0, isInterStateSupply = false }) {
  const grossAmt = rate * qty;
  const discountAmt = (grossAmt * discountPercent) / 100;
  const taxableAmt = grossAmt - discountAmt;
  const totalGSTRate = gstRate + cessRate;

  let cgstRate = 0, sgstRate = 0, igstRate = 0;
  let cgstAmt = 0, sgstAmt = 0, igstAmt = 0;
  const cessAmt = (taxableAmt * cessRate) / 100;

  if (isInterStateSupply) {
    igstRate = gstRate;
    igstAmt = (taxableAmt * igstRate) / 100;
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmt = (taxableAmt * cgstRate) / 100;
    sgstAmt = (taxableAmt * sgstRate) / 100;
  }

  const totalTaxAmt = cgstAmt + sgstAmt + igstAmt + cessAmt;
  const totalAmt = taxableAmt + totalTaxAmt;

  return {
    grossAmt: round2(grossAmt),
    discountAmt: round2(discountAmt),
    taxableAmt: round2(taxableAmt),
    cgstRate, sgstRate, igstRate, cessRate,
    cgstAmt: round2(cgstAmt),
    sgstAmt: round2(sgstAmt),
    igstAmt: round2(igstAmt),
    cessAmt: round2(cessAmt),
    totalTaxAmt: round2(totalTaxAmt),
    totalAmt: round2(totalAmt),
  };
}

function calculateInvoiceTotals(items, enableRoundOff = true) {
  let subtotal = 0, totalDiscount = 0, totalTaxableAmt = 0;
  let totalCGST = 0, totalSGST = 0, totalIGST = 0, totalCess = 0;

  for (const item of items) {
    subtotal       += item.grossAmt ?? (item.rate * item.qty);
    totalDiscount  += item.discountAmt ?? 0;
    totalTaxableAmt += item.taxableAmt ?? 0;
    totalCGST      += item.cgstAmt ?? 0;
    totalSGST      += item.sgstAmt ?? 0;
    totalIGST      += item.igstAmt ?? 0;
    totalCess      += item.cessAmt ?? 0;
  }

  const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
  const preRound = totalTaxableAmt + totalTax;
  const roundOff = enableRoundOff ? round2(Math.round(preRound) - preRound) : 0;
  const grandTotal = round2(preRound + roundOff);

  return {
    subtotal: round2(subtotal),
    totalDiscount: round2(totalDiscount),
    totalTaxableAmt: round2(totalTaxableAmt),
    totalCGST: round2(totalCGST),
    totalSGST: round2(totalSGST),
    totalIGST: round2(totalIGST),
    totalCess: round2(totalCess),
    totalTax: round2(totalTax),
    roundOff,
    grandTotal,
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { STATE_CODES, getStateCodeFromGSTIN, isInterState, calculateItemTax, calculateInvoiceTotals };
