const env = require("../config/env");

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Deterministic pricing used by both the cart (frontend preview) and the
 * checkout endpoint so totals always reconcile.
 */
const calculateTotals = ({ subtotal, deliveryFee = 0, discount = 0 }) => {
  const safeSubtotal = round2(Math.max(0, subtotal));
  const safeDiscount = round2(Math.min(Math.max(0, discount), safeSubtotal));
  const taxable = safeSubtotal - safeDiscount;
  const tax = round2(taxable * env.taxRate);
  const serviceFee = round2(safeSubtotal * env.serviceFeeRate);
  const total = round2(taxable + tax + serviceFee + deliveryFee);

  return {
    subtotal: safeSubtotal,
    discount: safeDiscount,
    tax,
    serviceFee,
    deliveryFee: round2(deliveryFee),
    total,
  };
};

const buildOrderNumber = () => {
  const stamp = Date.now().toString(36).toUpperCase();
  const noise = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CMP-${stamp}-${noise}`;
};

module.exports = { calculateTotals, buildOrderNumber, round2 };
