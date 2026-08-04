const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const InvoiceTemplate = require("../models/InvoiceTemplate");
const InvoiceSettings = require("../models/InvoiceSettings");
const { log } = require("../utils/activityLogger");

exports.getTemplates = asyncHandler(async (req, res) => {
  const templates = await InvoiceTemplate.find().sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, templates });
});

exports.getTemplateById = asyncHandler(async (req, res) => {
  const template = await InvoiceTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, "Template not found");
  res.json({ success: true, template });
});

exports.createTemplate = asyncHandler(async (req, res) => {
  const template = await InvoiceTemplate.create({ ...req.body, createdBy: req.admin._id });

  if (req.body.isDefault) {
    await InvoiceTemplate.updateMany({ _id: { $ne: template._id } }, { isDefault: false });
    await InvoiceSettings.updateOne({ singleton: "settings" }, { defaultTemplate: template._id }, { upsert: true });
  }

  setImmediate(() => log(req, {
    action: "template_created", category: "invoice",
    details: `Created invoice template: ${template.name}`,
    resourceId: template._id, resourceName: template.name,
  }));
  res.status(201).json({ success: true, template });
});

exports.updateTemplate = asyncHandler(async (req, res) => {
  const template = await InvoiceTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!template) throw new ApiError(404, "Template not found");

  if (req.body.isDefault) {
    await InvoiceTemplate.updateMany({ _id: { $ne: template._id } }, { isDefault: false });
    await InvoiceSettings.updateOne({ singleton: "settings" }, { defaultTemplate: template._id }, { upsert: true });
  }

  res.json({ success: true, template });
});

exports.deleteTemplate = asyncHandler(async (req, res) => {
  const template = await InvoiceTemplate.findByIdAndDelete(req.params.id);
  if (!template) throw new ApiError(404, "Template not found");
  res.json({ success: true, message: "Template deleted" });
});

exports.setDefault = asyncHandler(async (req, res) => {
  const template = await InvoiceTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, "Template not found");
  await InvoiceTemplate.updateMany({}, { isDefault: false });
  template.isDefault = true;
  await template.save();
  await InvoiceSettings.updateOne({ singleton: "settings" }, { defaultTemplate: template._id }, { upsert: true });
  res.json({ success: true, template });
});
