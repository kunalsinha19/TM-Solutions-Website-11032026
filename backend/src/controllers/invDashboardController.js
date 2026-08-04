const asyncHandler = require("../utils/asyncHandler");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const InvProduct = require("../models/InvProduct");
const PurchaseOrder = require("../models/PurchaseOrder");

exports.getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    invoiceStats,
    thisMonthRevenue,
    lastMonthRevenue,
    thisMonthPayments,
    overdueInvoices,
    lowStockCount,
    recentInvoices,
    topCustomers,
    pendingPOs,
    recentPayments,
  ] = await Promise.all([
    // Invoice totals
    Invoice.aggregate([
      { $match: { invoiceType: "invoice", status: { $nin: ["cancelled", "void"] } } },
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$grandTotal" }, balance: { $sum: "$balanceDue" } } },
    ]),
    // This month revenue
    Invoice.aggregate([
      { $match: { invoiceType: "invoice", status: { $nin: ["cancelled", "void"] }, invoiceDate: { $gte: startOfMonth } } },
      { $group: { _id: null, amount: { $sum: "$grandTotal" }, count: { $sum: 1 } } },
    ]),
    // Last month revenue
    Invoice.aggregate([
      { $match: { invoiceType: "invoice", status: { $nin: ["cancelled", "void"] }, invoiceDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, amount: { $sum: "$grandTotal" }, count: { $sum: 1 } } },
    ]),
    // This month payments
    Payment.aggregate([
      { $match: { status: "received", paymentDate: { $gte: startOfMonth } } },
      { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    // Overdue invoices
    Invoice.countDocuments({ status: "overdue" }),
    // Low stock
    InvProduct.countDocuments({ isActive: true, isService: false, $expr: { $lte: ["$stockQty", "$minStockQty"] } }),
    // Recent invoices
    Invoice.find({ invoiceType: "invoice" }).sort({ createdAt: -1 }).limit(10)
      .populate("customer", "name").select("invoiceNo customerName status grandTotal balanceDue invoiceDate"),
    // Top customers
    Customer.find({ totalAmount: { $gt: 0 } }).sort({ totalAmount: -1 }).limit(5)
      .select("name company totalAmount totalPaid outstandingAmount"),
    // Pending POs
    PurchaseOrder.countDocuments({ status: { $in: ["draft", "sent"] } }),
    // Recent payments
    Payment.find({ status: "received" }).sort({ paymentDate: -1 }).limit(5)
      .populate("customer", "name").select("paymentNo customerName amount paymentMode paymentDate invoiceNo"),
  ]);

  // Build status map from aggregate
  const statusMap = {};
  for (const row of invoiceStats) statusMap[row._id] = row;
  const totalOutstanding = invoiceStats.reduce((s, r) => s + (r.balance || 0), 0);
  const totalRevenue = invoiceStats.reduce((s, r) => s + (r.amount || 0), 0);

  const thisMonthAmt = thisMonthRevenue[0]?.amount || 0;
  const lastMonthAmt = lastMonthRevenue[0]?.amount || 0;
  const growthPct = lastMonthAmt > 0 ? ((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100 : 0;

  res.json({
    success: true,
    dashboard: {
      revenue: { total: totalRevenue, thisMonth: thisMonthAmt, lastMonth: lastMonthAmt, growthPct: +growthPct.toFixed(1) },
      collections: { thisMonth: thisMonthPayments[0]?.amount || 0, count: thisMonthPayments[0]?.count || 0 },
      outstanding: { total: totalOutstanding, overdueCount: overdueInvoices },
      invoiceCounts: {
        draft: statusMap.draft?.count || 0,
        sent: (statusMap.sent?.count || 0) + (statusMap.partial?.count || 0),
        paid: statusMap.paid?.count || 0,
        overdue: statusMap.overdue?.count || 0,
      },
      inventory: { lowStockCount },
      pendingPOs,
      recentInvoices,
      topCustomers,
      recentPayments,
    },
  });
});

exports.getRevenueChart = asyncHandler(async (req, res) => {
  const months = Number(req.query.months) || 6;
  const from = new Date();
  from.setMonth(from.getMonth() - months + 1, 1);
  from.setHours(0, 0, 0, 0);

  const data = await Invoice.aggregate([
    { $match: { invoiceType: "invoice", status: { $nin: ["cancelled", "void"] }, invoiceDate: { $gte: from } } },
    { $group: {
      _id: { year: { $year: "$invoiceDate" }, month: { $month: "$invoiceDate" } },
      revenue: { $sum: "$grandTotal" },
      collected: { $sum: "$amountPaid" },
      count: { $sum: 1 },
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  res.json({ success: true, data });
});
