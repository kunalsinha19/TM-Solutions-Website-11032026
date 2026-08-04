const PDFDocument = require("pdfkit");
const { amountToWords } = require("../utils/numberToWords");

const PAGE_SIZES = {
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  thermal80: [226.77, 841.89],
  thermal58: [163.35, 841.89],
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function r(n) { return Number(n || 0).toFixed(2); }

async function generateInvoicePdf(invoice, settings, template) {
  return new Promise((resolve, reject) => {
    const paperSize = template?.paperSize || "A4";
    const [pageW, pageH] = PAGE_SIZES[paperSize] || PAGE_SIZES.A4;
    const isSmall = paperSize.startsWith("thermal");

    const doc = new PDFDocument({
      size: [pageW, pageH],
      margins: isSmall ? { top: 10, left: 8, bottom: 10, right: 8 } : { top: 30, left: 40, bottom: 30, right: 40 },
      autoFirstPage: true,
      bufferPages: true,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const colors = template?.colorScheme || {};
    const primary   = colors.primary || "#1e40af";
    const headerBg  = colors.headerBg || primary;
    const headerTxt = colors.headerText || "#ffffff";
    const tableBg   = colors.tableBg || "#eff6ff";
    const borderClr = colors.borderColor || "#93c5fd";

    const margin = doc.page.margins.left;
    const contentW = pageW - margin * 2;
    const y0 = doc.page.margins.top;
    let y = y0;

    // ── HEADER BAND ──────────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, isSmall ? 60 : 80).fill(headerBg);

    const titleText = invoice.invoiceType === "proforma" ? "PROFORMA INVOICE"
      : invoice.invoiceType === "credit_note" ? "CREDIT NOTE"
      : invoice.invoiceType === "debit_note" ? "DEBIT NOTE"
      : invoice.invoiceType === "quotation" ? "QUOTATION"
      : "TAX INVOICE";

    if (!isSmall) {
      doc.fillColor(headerTxt).fontSize(18).font("Helvetica-Bold")
        .text(titleText, margin, 18, { width: contentW * 0.55, align: "left" });

      const biz = settings || {};
      doc.fontSize(7).font("Helvetica")
        .text(biz.businessName || "", pageW - margin - 200, 14, { width: 200, align: "right" })
        .text([biz.businessAddress?.line1, biz.businessAddress?.city, biz.businessAddress?.state].filter(Boolean).join(", "), { width: 200, align: "right" })
        .text(biz.businessPhone ? "Ph: " + biz.businessPhone : "", { width: 200, align: "right" })
        .text(biz.gstin ? "GSTIN: " + biz.gstin : "", { width: 200, align: "right" });
    } else {
      doc.fillColor(headerTxt).fontSize(11).font("Helvetica-Bold")
        .text(titleText, margin, 8, { width: contentW, align: "center" });
      doc.fontSize(7).text((settings?.businessName || ""), margin, 24, { width: contentW, align: "center" });
    }

    y = isSmall ? 65 : 88;

    // ── INVOICE META ─────────────────────────────────────────────────────────
    if (!isSmall) {
      // Left: customer info
      const colW = contentW / 2;
      doc.fillColor("#111827").fontSize(8).font("Helvetica-Bold").text("Bill To:", margin, y);
      doc.font("Helvetica").fontSize(9).text(invoice.customerName || "", margin, y + 10);
      const ba = invoice.billingAddress || {};
      const addrLine = [ba.line1, ba.line2, ba.city, ba.state, ba.pincode].filter(Boolean).join(", ");
      if (addrLine) doc.fontSize(8).text(addrLine, margin, doc.y, { width: colW - 10 });
      if (invoice.customerGSTIN) doc.text("GSTIN: " + invoice.customerGSTIN, margin, doc.y);

      // Right: invoice details box
      const rx = margin + colW;
      doc.rect(rx, y, colW, 60).stroke(borderClr);
      const metaRows = [
        ["Invoice No:", invoice.invoiceNo],
        ["Date:", formatDate(invoice.invoiceDate)],
        ["Due Date:", formatDate(invoice.dueDate)],
        invoice.poNumber ? ["PO No:", invoice.poNumber] : null,
      ].filter(Boolean);
      let ry = y + 6;
      for (const [label, val] of metaRows) {
        doc.fillColor("#374151").fontSize(8).font("Helvetica-Bold").text(label, rx + 6, ry, { width: 60, continued: false });
        doc.font("Helvetica").text(val || "", rx + 70, ry, { width: colW - 80 });
        ry += 12;
      }
      y = Math.max(doc.y, ry) + 12;
    } else {
      doc.fillColor("#111827").fontSize(8).font("Helvetica-Bold").text("Invoice: " + invoice.invoiceNo, margin, y);
      doc.font("Helvetica").fontSize(7)
        .text("Date: " + formatDate(invoice.invoiceDate), margin, doc.y)
        .text("Bill To: " + invoice.customerName, margin, doc.y);
      y = doc.y + 6;
    }

    // ── ITEMS TABLE HEADER ───────────────────────────────────────────────────
    const colWidths = isSmall
      ? [contentW * 0.45, contentW * 0.12, contentW * 0.18, contentW * 0.25]
      : [contentW * 0.32, contentW * 0.07, contentW * 0.08, contentW * 0.10, contentW * 0.10, contentW * 0.10, contentW * 0.23];
    const colHeaders = isSmall
      ? ["Item", "Qty", "Rate", "Amount"]
      : ["Item / HSN", "Qty", "Unit", "Rate", "Disc%", "GST%", "Amount"];

    doc.rect(margin, y, contentW, 16).fill(headerBg);
    let cx = margin;
    for (let i = 0; i < colHeaders.length; i++) {
      doc.fillColor(headerTxt).fontSize(isSmall ? 6.5 : 7.5).font("Helvetica-Bold")
        .text(colHeaders[i], cx + 3, y + 4, { width: colWidths[i] - 6, align: i === 0 ? "left" : "right" });
      cx += colWidths[i];
    }
    y += 16;

    // ── ITEMS TABLE ROWS ─────────────────────────────────────────────────────
    let rowIndex = 0;
    for (const item of invoice.items || []) {
      const rowH = isSmall ? 16 : 20;
      if (rowIndex % 2 === 1) doc.rect(margin, y, contentW, rowH).fill(tableBg);

      cx = margin;
      const vals = isSmall
        ? [item.name, String(item.qty), r(item.rate), r(item.totalAmt)]
        : [item.name + (item.hsnCode ? "\nHSN: " + item.hsnCode : ""), String(item.qty), item.unit || "", r(item.rate),
           r(item.discountPercent) + "%", r(item.gstRate) + "%", r(item.totalAmt)];

      const itemH = isSmall ? rowH : Math.max(rowH, item.hsnCode ? 26 : 20);
      for (let i = 0; i < vals.length; i++) {
        doc.fillColor("#111827").fontSize(isSmall ? 7 : 8).font(i === 0 ? "Helvetica-Bold" : "Helvetica")
          .text(vals[i], cx + 3, y + 3, { width: colWidths[i] - 6, align: i === 0 ? "left" : "right", lineBreak: i === 0 });
        cx += colWidths[i];
      }
      y += itemH;
      rowIndex++;
    }

    // ── TOTALS ───────────────────────────────────────────────────────────────
    y += 4;
    doc.moveTo(margin, y).lineTo(margin + contentW, y).stroke(borderClr);
    y += 4;

    const totals = [];
    if (invoice.totalDiscount > 0) totals.push(["Discount:", "-" + r(invoice.totalDiscount)]);
    totals.push(["Taxable Amount:", r(invoice.totalTaxableAmt)]);
    if (invoice.totalCGST > 0) totals.push(["CGST:", r(invoice.totalCGST)]);
    if (invoice.totalSGST > 0) totals.push(["SGST:", r(invoice.totalSGST)]);
    if (invoice.totalIGST > 0) totals.push(["IGST:", r(invoice.totalIGST)]);
    if (invoice.totalCess > 0) totals.push(["Cess:", r(invoice.totalCess)]);
    if (invoice.roundOff) totals.push(["Round Off:", r(invoice.roundOff)]);
    totals.push(["GRAND TOTAL:", r(invoice.grandTotal)]);

    const totalsX = isSmall ? margin : margin + contentW * 0.55;
    const totalsW = isSmall ? contentW : contentW * 0.45;
    for (const [label, val] of totals) {
      const isGrand = label.startsWith("GRAND");
      if (isGrand) {
        doc.rect(totalsX, y - 2, totalsW, 16).fill(primary);
        doc.fillColor("#ffffff").fontSize(isSmall ? 8 : 9).font("Helvetica-Bold");
      } else {
        doc.fillColor("#374151").fontSize(isSmall ? 7 : 8).font("Helvetica");
      }
      doc.text(label, totalsX + 4, y, { width: totalsW * 0.6, continued: false });
      doc.text("₹ " + val, totalsX + 4, y, { width: totalsW - 8, align: "right" });
      y += isGrand ? 16 : 14;
    }
    y += 6;

    // ── AMOUNT IN WORDS ───────────────────────────────────────────────────────
    if (!isSmall) {
      doc.fillColor("#374151").fontSize(8).font("Helvetica-Bold").text("Amount in Words: ", margin, y, { continued: true });
      doc.font("Helvetica").text(invoice.amountInWords || amountToWords(invoice.grandTotal));
      y = doc.y + 8;
    }

    // ── BANK DETAILS ──────────────────────────────────────────────────────────
    const showBank = template?.layout?.showBankDetails !== false && settings?.bankAccount;
    if (showBank && !isSmall) {
      doc.fillColor("#374151").fontSize(8).font("Helvetica-Bold").text("Bank Details:", margin, y);
      doc.font("Helvetica").fontSize(7)
        .text("Bank: " + (settings.bankName || ""), margin, doc.y)
        .text("A/C No: " + (settings.bankAccount || ""), margin, doc.y)
        .text("IFSC: " + (settings.bankIFSC || "") + "  Branch: " + (settings.bankBranch || ""), margin, doc.y);
      y = doc.y + 8;
    }

    // ── NOTES & TERMS ─────────────────────────────────────────────────────────
    if (invoice.notes && template?.layout?.showNotes !== false) {
      doc.fillColor("#374151").fontSize(8).font("Helvetica-Bold").text("Notes:", margin, y);
      doc.font("Helvetica").fontSize(7).text(invoice.notes, margin, doc.y, { width: contentW });
      y = doc.y + 6;
    }
    if (invoice.termsConditions && template?.layout?.showTerms !== false && !isSmall) {
      doc.fillColor("#374151").fontSize(8).font("Helvetica-Bold").text("Terms & Conditions:", margin, y);
      doc.font("Helvetica").fontSize(7).text(invoice.termsConditions, margin, doc.y, { width: contentW });
      y = doc.y + 6;
    }

    // ── SIGNATURE ─────────────────────────────────────────────────────────────
    if (template?.layout?.showSignature !== false && !isSmall) {
      const sigX = margin + contentW - 150;
      doc.moveTo(sigX, doc.page.height - 60).lineTo(sigX + 140, doc.page.height - 60).stroke("#9ca3af");
      doc.fillColor("#6b7280").fontSize(7).text("Authorised Signatory", sigX, doc.page.height - 52, { width: 140, align: "center" });
      doc.text(settings?.businessName || "", sigX, doc.page.height - 43, { width: 140, align: "center" });
    }

    doc.end();
  });
}

module.exports = { generateInvoicePdf };
