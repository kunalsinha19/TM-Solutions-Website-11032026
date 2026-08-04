const InvoiceSettings = require("../models/InvoiceSettings");

async function getOrCreateSettings() {
  let s = await InvoiceSettings.findOne({ singleton: "settings" });
  if (!s) s = await InvoiceSettings.create({ singleton: "settings" });
  return s;
}

async function nextInvoiceNumber() {
  const s = await InvoiceSettings.findOneAndUpdate(
    { singleton: "settings" },
    { $inc: { currentInvoiceNo: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const n = s.currentInvoiceNo;
  const prefix = s.invoicePrefix || "INV";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

async function nextProformaNumber() {
  const s = await InvoiceSettings.findOneAndUpdate(
    { singleton: "settings" },
    { $inc: { currentProformaNo: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const n = s.currentProformaNo;
  const prefix = s.proformaPrefix || "PRO";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

async function nextCreditNoteNumber() {
  const s = await InvoiceSettings.findOneAndUpdate(
    { singleton: "settings" },
    { $inc: { currentCreditNoteNo: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const n = s.currentCreditNoteNo;
  const prefix = s.creditNotePrefix || "CRN";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

async function nextDebitNoteNumber() {
  const s = await InvoiceSettings.findOneAndUpdate(
    { singleton: "settings" },
    { $inc: { currentDebitNoteNo: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const n = s.currentDebitNoteNo;
  const prefix = s.debitNotePrefix || "DBN";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

async function nextPoNumber() {
  const s = await InvoiceSettings.findOneAndUpdate(
    { singleton: "settings" },
    { $inc: { currentPoNo: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const n = s.currentPoNo;
  const prefix = s.poPrefix || "PO";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

async function nextPaymentNumber() {
  const s = await InvoiceSettings.findOneAndUpdate(
    { singleton: "settings" },
    { $inc: { currentPaymentNo: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const n = s.currentPaymentNo;
  const prefix = s.paymentPrefix || "REC";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

async function nextAdjustmentNumber() {
  const s = await InvoiceSettings.findOneAndUpdate(
    { singleton: "settings" },
    { $inc: { currentAdjustmentNo: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const n = s.currentAdjustmentNo;
  const prefix = s.adjustmentPrefix || "ADJ";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

module.exports = {
  getOrCreateSettings,
  nextInvoiceNumber,
  nextProformaNumber,
  nextCreditNoteNumber,
  nextDebitNoteNumber,
  nextPoNumber,
  nextPaymentNumber,
  nextAdjustmentNumber,
};
