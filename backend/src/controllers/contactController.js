const asyncHandler = require("../utils/asyncHandler");
const ContactLead = require("../models/ContactLead");

exports.createContactLead = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name,
    address: req.body.address,
    contact: req.body.contact,
    visitCount: Number(req.body.visitCount) || 1,
    source: req.body.source || "frontend"
  };

  const lead = await ContactLead.create(payload);
  res.status(201).json({ success: true, lead });
});
