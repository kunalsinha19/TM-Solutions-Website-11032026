const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Customer = require("../models/Customer");
const { log } = require("../utils/activityLogger");

exports.getCustomers = asyncHandler(async (req, res) => {
  const { search, type, active, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (active !== undefined) filter.isActive = active === "true";
  if (type) filter.customerType = type;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(filter),
  ]);
  res.json({ success: true, customers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, "Customer not found");
  res.json({ success: true, customer });
});

exports.createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  setImmediate(() => log(req, {
    action: "customer_created", category: "invoice",
    details: `Created customer: ${customer.name}`,
    resourceId: customer._id, resourceName: customer.name,
  }));
  res.status(201).json({ success: true, customer });
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!customer) throw new ApiError(404, "Customer not found");
  setImmediate(() => log(req, {
    action: "customer_updated", category: "invoice",
    details: `Updated customer: ${customer.name}`,
    resourceId: customer._id, resourceName: customer.name,
  }));
  res.json({ success: true, customer });
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) throw new ApiError(404, "Customer not found");
  setImmediate(() => log(req, {
    action: "customer_deleted", category: "invoice",
    details: `Deleted customer: ${customer.name}`,
    resourceId: customer._id, resourceName: customer.name,
  }));
  res.json({ success: true, message: "Customer deleted" });
});
