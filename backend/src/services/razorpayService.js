/**
 * Razorpay Service
 * Executes simulated payout disbursements via Razorpay Sandbox.
 * Per SRS FR-5.3: Retry 3× with exponential backoff (2s, 4s, 8s).
 * Per SRS NFR-13: Claims that fail all retries → SETTLEMENT_FAILED.
 */

const axios = require('axios');

const RAZORPAY_BASE = 'https://api.razorpay.com/v1';
const MAX_RETRIES = 3;

/**
 * Sleep helper for exponential backoff.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a payout via Razorpay Sandbox.
 * @param {object} params
 * @param {number} params.amountPaise   - Amount in paise (INR × 100)
 * @param {string} params.riderId       - UUID for reference
 * @param {string} params.claimId       - UUID for reference
 * @param {string} [params.narration]
 * @returns {Promise<{ success: boolean, razorpayTxnId: string|null, error: string|null }>}
 */
async function disbursePayout({ amountPaise, riderId, claimId, narration = 'WorkSafe Income Protection Claim' }) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        `${RAZORPAY_BASE}/payouts`,
        {
          account_number: '2323230041626905', // Razorpay sandbox account
          amount: amountPaise,
          currency: 'INR',
          mode: 'IMPS',
          purpose: 'payout',
          queue_if_low_balance: true,
          narration,
          reference_id: claimId,
          notes: { rider_id: riderId, claim_id: claimId },
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );

      console.log(`[Razorpay] Payout SUCCESS on attempt ${attempt} — txn: ${response.data.id}`);
      return { success: true, razorpayTxnId: response.data.id, error: null };
    } catch (err) {
      lastError = err.response?.data?.error?.description ?? err.message;
      console.warn(`[Razorpay] Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError}`);

      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[Razorpay] Retrying in ${backoffMs / 1000}s...`);
        await sleep(backoffMs);
      }
    }
  }

  console.error(`[Razorpay] All ${MAX_RETRIES} attempts failed for claim ${claimId}: ${lastError}`);
  return { success: false, razorpayTxnId: null, error: lastError };
}

module.exports = { disbursePayout };
