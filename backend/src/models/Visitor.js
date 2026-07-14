const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  sessionId:        { type: String, required: true, unique: true },
  visitorId:        { type: String, required: true, index: true },
  ipAnonymized:     { type: String },
  country:          { type: String },
  countryCode:      { type: String },
  state:            { type: String },
  city:             { type: String },
  lat:              { type: Number },
  lon:              { type: Number },
  isp:              { type: String },
  timezone:         { type: String },
  browser:          { type: String },
  os:               { type: String },
  device:           { type: String, enum: ["desktop", "tablet", "mobile"], default: "desktop" },
  screenResolution: { type: String },
  language:         { type: String },
  referrer:         { type: String },
  utmSource:        { type: String },
  utmMedium:        { type: String },
  utmCampaign:      { type: String },
  entryPage:        { type: String },
  exitPage:         { type: String },
  pagesVisited:     [{ type: String }],
  pageCount:        { type: Number, default: 1 },
  sessionStart:     { type: Date, default: Date.now },
  sessionEnd:       { type: Date },
  duration:         { type: Number, default: 0 },
  isActive:         { type: Boolean, default: true },
  isBot:            { type: Boolean, default: false },
  isNewVisitor:     { type: Boolean, default: true },
}, { timestamps: true });

visitorSchema.index({ sessionStart: -1 });
visitorSchema.index({ country: 1 });
visitorSchema.index({ isActive: 1, sessionStart: -1 });

module.exports = mongoose.model("Visitor", visitorSchema);
