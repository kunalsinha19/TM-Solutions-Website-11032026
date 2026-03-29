const mongoose = require("mongoose");

const contactLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240
    },
    contact: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30
    },
    visitCount: {
      type: Number,
      default: 1,
      min: 1
    },
    source: {
      type: String,
      default: "frontend",
      trim: true,
      maxlength: 64
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactLead", contactLeadSchema);
