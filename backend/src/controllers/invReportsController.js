const asyncHandler = require("../utils/asyncHandler");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const InvProduct = require("../models/InvProduct");
const InventoryTransaction = require("../models/InventoryTransaction");

function dateFilter(from, to) {
  const f = {};
  if (from) f.$gte = new Date(from);
  if (to) f.$lte = new Date(new Date(to).setHours(23, 59, 59));
  return Object.keys(f).length ? f : null;
}

exports.getSalesReport = asyncHandler(async (req, res) => {
  const { from, to, customer, groupBy = "month" } = req.query;
  const match = { invoiceType: "invoice", status: { $nin: ["cancelled", "void"] } };
  const df = dateFilter(from, to);
  if (df) match.invoiceDate = df;
  if (customer) match.customer = new (require("mongoose").Types.ObjectId)(customer);

  let groupId;
  if (groupBy === "day") groupId = { year: { $year: "$invoiceDate" }, month: { $month: "$invoiceDate" }, day: { $dayOfMonth: "$invoiceDate" } };
  else if (groupBy === "week") groupId = { year: { $year: "$invoiceDate" }, week: { $week: "$invoiceDate" } };
  else groupId = { year: { $year: "$invoiceDate" }, month: { $month: "$invoiceDate" } };

  const data = await Invoice.aggregate([
    { $match: match },
    { $group: {
      _id: groupId,
      revenue: { $sum: "$grandTotal" },
      taxableAmt: { $sum: "$totalTaxableAmt" },
      totalTax: { $sum: "$totalTax" },
      collected: { $sum: "$amountPaid" },
      outstanding: { $sum: "$balanceDue" },
      count: { $sum: 1 },
    }},
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  res.json({ success: true, data });
});

exports.getGSTReport = asyncHandler(async (req, res) => {
  const { from, to, type = "sales" } = req.query;
  const match = { status: { $nin: ["cancelled", "void"] } };
  if (type === "sales") match.invoiceType = "invoice";
  const df = dateFilter(from, to);
  if (df) match.invoiceDate = df;

  const data = await Invoice.aggregate([
    { $match: match },
    { $unwind: "$items" },
    { $group: {
      _id: { hsnCode: "$items.hsnCode", gstRate: "$items.gstRate" },
      taxableAmt: { $sum: "$items.taxableAmt" },
      cgst: { $sum: "$items.cgstAmt" },
      sgst: { $sum: "$items.sgstAmt" },
      igst: { $sum: "$items.igstAmt" },
      totalTax: { $sum: "$items.totalTaxAmt" },
      count: { $sum: 1 },
    }},
    { $sort: { "_id.gstRate": 1 } },
  ]);

  res.json({ success: true, data });
});

exports.getReceivablesReport = asyncHandler(async (req, res) => {
  const agingBuckets = [
    { label: "0–30 days", min: 0, max: 30 },
    { label: "31–60 days", min: 31, max: 60 },
    { label: "61–90 days", min: 61, max: 90 },
    { label: ">90 days", min: 91, max: Infinity },
  ];

  const overdueInvoices = await Invoice.find({ status: { $in: ["sent", "partial", "overdue"] }, balanceDue: { $gt: 0 } })
    .populate("customer", "name phone")
    .select("invoiceNo customerName customer invoiceDate dueDate grandTotal balanceDue status");

  const now = Date.now();
  const result = agingBuckets.map(bucket => ({
    label: bucket.label,
    invoices: [],
    totalAmount: 0,
    count: 0,
  }));

  for (const inv of overdueInvoices) {
    const daysOld = Math.floor((now - new Date(inv.dueDate || inv.invoiceDate).getTime()) / 86400000);
    for (let i = 0; i < agingBuckets.length; i++) {
      const b = agingBuckets[i];
      if (daysOld >= b.min && daysOld <= b.max) {
        result[i].invoices.push({ ...inv.toObject(), daysOld });
        result[i].totalAmount += inv.balanceDue;
        result[i].count++;
        break;
      }
    }
  }

  res.json({ success: true, aging: result, totalOutstanding: overdueInvoices.reduce((s, i) => s + i.balanceDue, 0) });
});

exports.getInventoryReport = asyncHandler(async (req, res) => {
  const { category, lowStock } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (lowStock === "true") filter.$expr = { $lte: ["$stockQty", "$minStockQty"] };

  const products = await InvProduct.find(filter)
    .sort({ category: 1, name: 1 })
    .select("name sku category unit stockQty minStockQty maxStockQty purchasePrice sellingPrice");

  const summary = {
    total: products.length,
    lowStock: products.filter(p => p.stockQty <= p.minStockQty).length,
    stockValue: products.reduce((s, p) => s + p.stockQty * p.purchasePrice, 0),
    sellingValue: products.reduce((s, p) => s + p.stockQty * p.sellingPrice, 0),
  };

  res.json({ success: true, products, summary });
});

exports.getCustomerLedger = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { from, to } = req.query;

  const invoiceFilter = { customer: customerId, invoiceType: "invoice", status: { $nin: ["cancelled", "void"] } };
  const paymentFilter = { customer: customerId, status: "received" };
  const df = dateFilter(from, to);
  if (df) { invoiceFilter.invoiceDate = df; paymentFilter.paymentDate = df; }

  const [invoices, payments, customer] = await Promise.all([
    Invoice.find(invoiceFilter).sort({ invoiceDate: 1 }).select("invoiceNo invoiceDate grandTotal amountPaid balanceDue status"),
    Payment.find(paymentFilter).sort({ paymentDate: 1 }).select("paymentNo paymentDate amount paymentMode invoiceNo"),
    Customer.findById(customerId).select("name company phone email gstin openingBalance balanceType"),
  ]);

  if (!customer) throw new (require("../utils/apiError"))(404, "Customer not found");

  // Merge and sort into ledger
  const entries = [
    ...invoices.map(i => ({ date: i.invoiceDate, type: "invoice", no: i.invoiceNo, debit: i.grandTotal, credit: 0, balance: 0, status: i.status })),
    ...payments.map(p => ({ date: p.paymentDate, type: "payment", no: p.paymentNo, debit: 0, credit: p.amount, balance: 0, ref: p.invoiceNo, mode: p.paymentMode })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = customer.openingBalance || 0;
  for (const e of entries) {
    runningBalance += e.debit - e.credit;
    e.balance = runningBalance;
  }

  res.json({ success: true, customer, entries, closingBalance: runningBalance });
});
