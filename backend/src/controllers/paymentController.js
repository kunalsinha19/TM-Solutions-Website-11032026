const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const { nextPaymentNumber } = require("../services/invoiceNumberService");
const { log } = require("../utils/activityLogger");

exports.getPayments = asyncHandler(async (req, res) => {
  const { customer, invoice, from, to, mode, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (customer) filter.customer = customer;
  if (invoice) filter.invoice = invoice;
  if (mode) filter.paymentMode = mode;
  if (from || to) {
    filter.paymentDate = {};
    if (from) filter.paymentDate.$gte = new Date(from);
    if (to) filter.paymentDate.$lte = new Date(new Date(to).setHours(23, 59, 59));
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ paymentDate: -1 }).skip(skip).limit(Number(limit))
      .populate("customer", "name phone")
      .populate("invoice", "invoiceNo grandTotal"),
    Payment.countDocuments(filter),
  ]);
  res.json({ success: true, payments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("customer", "name phone email")
    .populate("invoice")
    .populate("createdBy", "name");
  if (!payment) throw new ApiError(404, "Payment not found");
  res.json({ success: true, payment });
});

exports.createPayment = asyncHandler(async (req, res) => {
  const { invoice: invoiceId, amount, paymentMode, ...rest } = req.body;
  if (!invoiceId || !amount || !paymentMode) throw new ApiError(400, "Invoice, amount and payment mode are required");

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status === "cancelled") throw new ApiError(400, "Cannot add payment to cancelled invoice");

  const payAmount = Number(amount);
  if (payAmount <= 0) throw new ApiError(400, "Amount must be positive");
  if (payAmount > invoice.balanceDue + 0.01) throw new ApiError(400, `Amount exceeds balance due (₹${invoice.balanceDue.toFixed(2)})`);

  const paymentNo = await nextPaymentNumber();
  const payment = await Payment.create({
    paymentNo,
    invoice: invoiceId,
    invoiceNo: invoice.invoiceNo,
    customer: invoice.customer,
    customerName: invoice.customerName,
    amount: payAmount,
    paymentMode,
    createdBy: req.admin._id,
    ...rest,
  });

  // Update invoice
  const newPaid = invoice.amountPaid + payAmount;
  const newBalance = invoice.grandTotal - newPaid;
  const newStatus = newBalance <= 0.01 ? "paid" : "partial";
  await Invoice.findByIdAndUpdate(invoiceId, {
    amountPaid: newPaid,
    balanceDue: Math.max(0, newBalance),
    status: newStatus,
  });

  // Update customer outstanding
  await Customer.findByIdAndUpdate(invoice.customer, {
    $inc: { totalPaid: payAmount, outstandingAmount: -payAmount },
  });

  setImmediate(() => log(req, {
    action: "payment_received", category: "invoice",
    details: `Payment ${paymentNo}: ₹${payAmount} for ${invoice.invoiceNo} via ${paymentMode}`,
    resourceId: payment._id, resourceName: payment.paymentNo,
  }));

  res.status(201).json({ success: true, payment });
});

exports.cancelPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status === "cancelled") throw new ApiError(400, "Payment already cancelled");

  payment.status = "cancelled";
  await payment.save();

  const invoice = await Invoice.findById(payment.invoice);
  if (invoice) {
    const newPaid = Math.max(0, invoice.amountPaid - payment.amount);
    const newBalance = invoice.grandTotal - newPaid;
    const newStatus = invoice.status === "paid" ? (newBalance > 0 ? "partial" : "paid") : invoice.status;
    await Invoice.findByIdAndUpdate(invoice._id, { amountPaid: newPaid, balanceDue: newBalance, status: newStatus });
    await Customer.findByIdAndUpdate(invoice.customer, {
      $inc: { totalPaid: -payment.amount, outstandingAmount: payment.amount },
    });
  }

  setImmediate(() => log(req, {
    action: "payment_cancelled", category: "invoice",
    details: `Cancelled payment ${payment.paymentNo}`,
    resourceId: payment._id, resourceName: payment.paymentNo,
  }));

  res.json({ success: true, payment });
});
