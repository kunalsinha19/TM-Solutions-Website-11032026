const asyncHandler = require("../utils/asyncHandler");
const InvoiceSettings = require("../models/InvoiceSettings");
const { getOrCreateSettings } = require("../services/invoiceNumberService");
const { log } = require("../utils/activityLogger");

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await InvoiceSettings.findOneAndUpdate(
    { singleton: "settings" },
    { $set: req.body },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  setImmediate(() => log(req, {
    action: "invoice_settings_updated", category: "invoice",
    details: "Updated invoice settings",
    resourceId: settings._id, resourceName: "Invoice Settings",
  }));

  res.json({ success: true, settings });
});
