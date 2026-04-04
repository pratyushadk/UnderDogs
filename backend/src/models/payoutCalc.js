/**
 * Model 4: Payout Compensation Formula
 * SRS Section 4.4
 *
 * Calculates the precise income replacement amount for each qualifying rider.
 * The coverage ratio (C_ratio < 1.0) ensures payout is always marginally
 * less than full earnings — preventing moral hazard.
 *
 * Formula:
 *   Payout (INR) = E_avg × H_lost × C_ratio
 *
 * Where:
 *   E_avg   = Rider's average net hourly earnings (INR/hr)
 *   H_lost  = max(0, shift_end_time - event_trigger_time) in decimal hours
 *   C_ratio = Coverage ratio, default 0.85 (caps payout at 85% of earnings)
 */

/**
 * Calculate hours remaining in a shift from event trigger time.
 * @param {string} shiftEnd      - "HH:MM" (24-hour format, e.g. "21:00")
 * @param {Date}   triggerTime   - Moment disruption was confirmed
 * @returns {number} H_lost in decimal hours (≥ 0)
 */
function computeHoursLost(shiftEnd, triggerTime = new Date()) {
  const [endHour, endMin] = shiftEnd.split(':').map(Number);

  const shiftEndMs = new Date(triggerTime);
  shiftEndMs.setHours(endHour, endMin, 0, 0);

  const diffMs = shiftEndMs.getTime() - triggerTime.getTime();
  const hLost = Math.max(0, diffMs / (1000 * 60 * 60));

  return Math.round(hLost * 100) / 100;
}

/**
 * Compute the payout amount for a qualifying rider.
 *
 * @param {number} eAvg        - Average hourly earnings (INR/hr)
 * @param {number} hLost       - Hours remaining in shift (from computeHoursLost)
 * @param {number} [cRatio]    - Coverage ratio (default from env or 0.85)
 * @returns {{ payoutINR: number, eAvg: number, hLost: number, cRatio: number, formula: string }}
 */
function computePayout(eAvg, hLost, cRatio) {
  const ratio = cRatio ?? parseFloat(process.env.C_RATIO) ?? 0.85;

  if (eAvg < 0) throw new Error('E_avg cannot be negative');
  if (hLost < 0) throw new Error('H_lost cannot be negative');
  if (ratio <= 0 || ratio > 1) throw new Error('C_ratio must be between 0 and 1');

  const payoutINR = Math.round(eAvg * hLost * ratio * 100) / 100;

  return {
    payoutINR,
    eAvg,
    hLost,
    cRatio: ratio,
    formula: `${eAvg} × ${hLost} × ${ratio} = ₹${payoutINR}`,
  };
}

module.exports = { computePayout, computeHoursLost };
