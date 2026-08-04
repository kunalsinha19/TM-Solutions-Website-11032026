const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const InvoiceTemplate = require("../models/InvoiceTemplate");
const InvoiceSettings = require("../models/InvoiceSettings");
const { calculateItemTax, calculateInvoiceTotals, isInterState } = require("../utils/gstCalculator");
const { amountToWords } = require("../utils/numberToWords");
const { deductStock, restoreStock } = require("../services/stockService");
const { nextInvoiceNumber, nextProformaNumber, nextCreditNoteNumber, nextDebitNoteNumber, getOrCreateSettings } = require("../services/invoiceNumberService");
const { generateInvoicePdf } = require("../services/pdfService");
const { log } = require("../utils/activityLogger");

async function computeItems(rawItems, invoiceStateCode, customerStateCode) {
  const interState = isInterState(invoiceStateCode, customerStateCode);
  return rawItems.map((item) => {
    const calc = calculateItemTax({
      rate: item.rate,
      gstRate: item.isTaxable === false ? 0 : (item.gstRate ?? 18),
      cessRate: item.cessRate ?? 0,
      qty: item.qty,
      discountPercent: item.discountPercent ?? 0,
      isInterStateSupply: interState,
    });
    return { ...item, ...calc, isInterState: interState };
  });
}

exports.getInvoices = asyncHandler(async (req, res) => {
  const { status, type, customer, from, to, search, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.invoiceType = type;
  if (customer) filter.customer = customer;
  if (from || to) {
    filter.invoiceDate = {};
    if (from) filter.invoiceDate.$gte = new Date(from);
    if (to) filter.invoiceDate.$lte = new Date(new Date(to).setHours(23, 59, 59));
  }
  if (search) {
    filter.$or = [
      { invoiceNo: new RegExp(search, "i") },
      { customerName: new RegExp(search, "i") },
      { poNumber: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [invoices, total] = await Promise.all([
    Invoice.find(filter).sort({ invoiceDate: -1, createdAt: -1 })
      .skip(skip).limit(Number(limit))
      .populate("customer", "name phone email")
      .select("-items"),
    Invoice.countDocuments(filter),
  ]);
  res.json({ success: true, invoices, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("customer", "name phone email gstin billingAddress shippingAddress")
    .populate("template")
    .populate("createdBy", "name");
  if (!invoice) throw new ApiError(404, "Invoice not found");
  res.json({ success: true, invoice });
});

exports.createInvoice = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { invoiceType = "invoice", customer: customerId, items: rawItems = [], ...rest } = req.body;

  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, "Customer not found");

  const customerStateCode = customer.billingAddress?.stateCode || "";
  const supplyStateCode = settings.defaultStateCode || "";

  let invoiceNo;
  if (invoiceType === "proforma") invoiceNo = await nextProformaNumber();
  else if (invoiceType === "credit_note") invoiceNo = await nextCreditNoteNumber();
  else if (invoiceType === "debit_note") invoiceNo = await nextDebitNoteNumber();
  else invoiceNo = await nextInvoiceNumber();

  const computedItems = await computeItems(rawItems, supplyStateCode, customerStateCode);
  const totals = calculateInvoiceTotals(computedItems, settings.enableRoundOff !== false);
  const interState = isInterState(supplyStateCode, customerStateCode);

  const invoiceData = {
    invoiceNo,
    invoiceType,
    customer: customerId,
    customerName: customer.displayName || customer.name,
    customerGSTIN: customer.gstin || "",
    billingAddress: customer.billingAddress || {},
    shippingAddress: customer.sameAddress ? customer.billingAddress : customer.shippingAddress,
    sameShipping: customer.sameAddress !== false,
    items: computedItems,
    ...totals,
    amountInWords: amountToWords(totals.grandTotal),
    isInterState: interState,
    supplyStateCode,
    termsConditions: rest.termsConditions || settings.defaultTerms || "",
    notes: rest.notes || settings.defaultNotes || "",
    template: rest.template || settings.defaultTemplate || null,
    createdBy: req.admin._id,
    ...rest,
  };

  invoiceData.balanceDue = totals.grandTotal;

  const invoice = await Invoice.create(invoiceData);

  // Auto-deduct stock when confirmed invoice (not draft, not proforma)
  if (invoice.status !== "draft" && invoiceType === "invoice") {
    setImmediate(async () => {
      try {
        await deductStock({
          items: invoice.items.filter(i => i.product),
          referenceType: "Invoice",
          referenceId: invoice._id,
          referenceNo: invoice.invoiceNo,
          adminId: req.admin._id,
        });
        // Update customer stats
        await Customer.findByIdAndUpdate(customerId, {
          $inc: { totalInvoices: 1, totalAmount: totals.grandTotal, outstandingAmount: totals.grandTotal },
        });
      } catch (err) {
        console.error("[Invoice] Stock deduction failed:", err.message);
      }
    });
  }

  setImmediate(() => log(req, {
    action: "invoice_created", category: "invoice",
    details: `Created ${invoiceType} ${invoiceNo} for ${customer.name} — ₹${totals.grandTotal}`,
    resourceId: invoice._id, resourceName: invoice.invoiceNo,
  }));

  res.status(201).json({ success: true, invoice });
});

exports.updateInvoice = asyncHandler(async (req, res) => {
  const prev = await Invoice.findById(req.params.id);
  if (!prev) throw new ApiError(404, "Invoice not found");
  if (prev.status === "cancelled" || prev.status === "void") throw new ApiError(400, "Cannot edit a cancelled invoice");

  const settings = await getOrCreateSettings();
  const { items: rawItems, customer: customerId, ...rest } = req.body;

  let computedItems = prev.items;
  let totals = {};

  if (rawItems) {
    const customer = customerId ? await Customer.findById(customerId) : await Customer.findById(prev.customer);
    const customerStateCode = customer?.billingAddress?.stateCode || "";
    const supplyStateCode = settings.defaultStateCode || "";
    computedItems = await computeItems(rawItems, supplyStateCode, customerStateCode);
    totals = calculateInvoiceTotals(computedItems, settings.enableRoundOff !== false);
    rest.amountInWords = amountToWords(totals.grandTotal);
    rest.isInterState = isInterState(supplyStateCode, customerStateCode);
  }

  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { ...rest, ...(rawItems ? { items: computedItems, ...totals } : {}), customer: customerId || prev.customer },
    { new: true }
  );

  setImmediate(() => log(req, {
    action: "invoice_updated", category: "invoice",
    details: `Updated invoice ${invoice.invoiceNo}`,
    resourceId: invoice._id, resourceName: invoice.invoiceNo,
    previousValue: prev.status, newValue: invoice.status,
  }));

  res.json({ success: true, invoice });
});

exports.cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status === "cancelled") throw new ApiError(400, "Invoice already cancelled");

  invoice.status = "cancelled";
  invoice.cancelledAt = new Date();
  invoice.cancelReason = req.body.reason || "";
  await invoice.save();

  if (invoice.invoiceType === "invoice") {
    setImmediate(async () => {
      try {
        await restoreStock({
          items: invoice.items.filter(i => i.product),
          referenceType: "Invoice",
          referenceId: invoice._id,
          referenceNo: invoice.invoiceNo + "-CANCEL",
          adminId: req.admin._id,
        });
        await Customer.findByIdAndUpdate(invoice.customer, {
          $inc: { totalAmount: -invoice.grandTotal, outstandingAmount: -(invoice.grandTotal - invoice.amountPaid) },
        });
      } catch (err) {
        console.error("[Invoice] Stock restore on cancel failed:", err.message);
      }
    });
  }

  setImmediate(() => log(req, {
    action: "invoice_cancelled", category: "invoice",
    details: `Cancelled invoice ${invoice.invoiceNo}: ${invoice.cancelReason}`,
    resourceId: invoice._id, resourceName: invoice.invoiceNo,
  }));

  res.json({ success: true, invoice });
});

exports.downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("customer")
    .populate("template");
  if (!invoice) throw new ApiError(404, "Invoice not found");

  const settings = await InvoiceSettings.findOne({ singleton: "settings" });
  const pdfBuffer = await generateInvoicePdf(invoice.toObject(), settings?.toObject() || {}, invoice.template?.toObject() || {});

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNo}.pdf"`);
  res.send(pdfBuffer);
});

exports.getInvoiceStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear  = new Date(now.getFullYear(), 3, 1); // April = financial year start

  const [totalStats, monthStats, overdueStats, draftCount] = await Promise.all([
    Invoice.aggregate([
      { $match: { invoiceType: "invoice", status: { $nin: ["cancelled", "void"] } } },
      { $group: { _id: null, totalAmount: { $sum: "$grandTotal" }, totalPaid: { $sum: "$amountPaid" }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { invoiceType: "invoice", status: { $nin: ["cancelled", "void"] }, invoiceDate: { $gte: startOfMonth } } },
      { $group: { _id: null, totalAmount: { $sum: "$grandTotal" }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { status: "overdue" } },
      { $group: { _id: null, totalDue: { $sum: "$balanceDue" }, count: { $sum: 1 } } },
    ]),
    Invoice.countDocuments({ status: "draft" }),
  ]);

  res.json({
    success: true,
    stats: {
      total: totalStats[0] || { totalAmount: 0, totalPaid: 0, count: 0 },
      month: monthStats[0] || { totalAmount: 0, count: 0 },
      overdue: overdueStats[0] || { totalDue: 0, count: 0 },
      drafts: draftCount,
    },
  });
});
