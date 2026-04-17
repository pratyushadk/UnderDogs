/**
 * Razorpay Order Service — Premium Payment Collection (money IN)
 * 
 * Separate from razorpayService.js which handles payouts (money OUT).
 * Uses the official `razorpay` npm package for order creation.
 * Uses raw crypto for HMAC signature verification.
 */

const Razorpay = require('razorpay');
const crypto   = require('crypto');

// Lazy singleton — only created once, when first needed
let _instance = null;
function getRazorpay() {
  if (!_instance) {
    _instance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _instance;
}

/**
 * Create a Razorpay Order for premium payment.
 * @param {number} amountINR   - Premium amount in INR (e.g. 47.50)
 * @param {string} receiptId   - Your internal txn_id (for traceability)
 * @param {object} [notes]     - Optional metadata attached to the order
 * @returns {Promise<{ order_id, amount, currency, receipt, status }>}
 */
async function createPremiumOrder(amountINR, receiptId, notes = {}) {
  const amountPaise = Math.round(amountINR * 100);
  const order = await getRazorpay().orders.create({
    amount:   amountPaise,
    currency: 'INR',
    receipt:  receiptId.substring(0, 40), // Razorpay receipt max 40 chars
    notes,
  });
  return {
    order_id: order.id,
    amount:   order.amount,
    currency: order.currency,
    receipt:  order.receipt,
    status:   order.status,
  };
}

/**
 * Verify Razorpay payment signature (HMAC-SHA256).
 * Must be called after payment.captured webhook or frontend callback.
 * @param {string} orderId     - razorpay_order_id
 * @param {string} paymentId   - razorpay_payment_id
 * @param {string} signature   - razorpay_signature from frontend
 * @returns {boolean}
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
  return expected === signature;
}

module.exports = { createPremiumOrder, verifyPaymentSignature };
