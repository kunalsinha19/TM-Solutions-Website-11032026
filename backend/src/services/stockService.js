const InvProduct = require("../models/InvProduct");
const InventoryTransaction = require("../models/InventoryTransaction");

async function deductStock({ items, referenceType, referenceId, referenceNo, adminId, session = null }) {
  for (const item of items) {
    if (!item.product || item.isService) continue;
    const product = await InvProduct.findById(item.product).session(session);
    if (!product) continue;

    const qtyBefore = product.stockQty;
    const newQty = qtyBefore - item.qty;
    product.stockQty = newQty;
    await product.save({ session });

    await InventoryTransaction.create([{
      product: product._id,
      type: "sale",
      referenceType,
      referenceId,
      referenceNo,
      qtyBefore,
      qtyChange: -item.qty,
      qtyAfter: newQty,
      unitCost: item.rate || 0,
      totalCost: (item.rate || 0) * item.qty,
      createdBy: adminId,
    }], { session });
  }
}

async function restoreStock({ items, referenceType, referenceId, referenceNo, adminId, session = null }) {
  for (const item of items) {
    if (!item.product) continue;
    const product = await InvProduct.findById(item.product).session(session);
    if (!product) continue;

    const qtyBefore = product.stockQty;
    const newQty = qtyBefore + item.qty;
    product.stockQty = newQty;
    await product.save({ session });

    await InventoryTransaction.create([{
      product: product._id,
      type: "return_in",
      referenceType,
      referenceId,
      referenceNo,
      qtyBefore,
      qtyChange: item.qty,
      qtyAfter: newQty,
      unitCost: item.rate || 0,
      totalCost: (item.rate || 0) * item.qty,
      createdBy: adminId,
    }], { session });
  }
}

async function addPurchaseStock({ items, referenceType, referenceId, referenceNo, adminId, session = null }) {
  for (const item of items) {
    if (!item.product) continue;
    const product = await InvProduct.findById(item.product).session(session);
    if (!product) continue;

    const qtyBefore = product.stockQty;
    const newQty = qtyBefore + item.qty;
    product.stockQty = newQty;
    if (item.rate && item.rate > 0) product.purchasePrice = item.rate;
    await product.save({ session });

    await InventoryTransaction.create([{
      product: product._id,
      type: "purchase",
      referenceType,
      referenceId,
      referenceNo,
      qtyBefore,
      qtyChange: item.qty,
      qtyAfter: newQty,
      unitCost: item.rate || 0,
      totalCost: (item.rate || 0) * item.qty,
      createdBy: adminId,
    }], { session });
  }
}

async function adjustStock({ productId, type, qty, reason, referenceType = "StockAdjustment", referenceId, referenceNo, adminId, session = null }) {
  const product = await InvProduct.findById(productId).session(session);
  if (!product) throw new Error(`Product ${productId} not found`);

  const qtyBefore = product.stockQty;
  let qtyChange = 0;
  let qtyAfter = 0;

  if (type === "increase") {
    qtyChange = qty;
    qtyAfter = qtyBefore + qty;
  } else if (type === "decrease") {
    qtyChange = -qty;
    qtyAfter = qtyBefore - qty;
  } else if (type === "set") {
    qtyChange = qty - qtyBefore;
    qtyAfter = qty;
  }

  product.stockQty = qtyAfter;
  await product.save({ session });

  await InventoryTransaction.create([{
    product: product._id,
    type: "adjustment",
    referenceType,
    referenceId,
    referenceNo,
    qtyBefore,
    qtyChange,
    qtyAfter,
    notes: reason || "",
    createdBy: adminId,
  }], { session });

  return { qtyBefore, qtyChange, qtyAfter };
}

module.exports = { deductStock, restoreStock, addPurchaseStock, adjustStock };
