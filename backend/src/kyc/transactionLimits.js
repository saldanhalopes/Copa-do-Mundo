import { getKycGate, getJurisdictionLimit, checkPurchaseLimit } from "./providerKyc.js";
import { logAmlTransaction } from "../db/database.js";

const DAILY_LIMITS = {
  none: { daily: 0, perTx: 0 },
  basic: { daily: 1000, perTx: 300 },
  advanced: { daily: 10000, perTx: 3000 },
  verified: { daily: 50000, perTx: 10000 },
};

const LIMIT_TRACKER = new Map();

function getDailyUsage(address) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${address.toLowerCase()}:${today}`;
  return LIMIT_TRACKER.get(key) || 0;
}

function addDailyUsage(address, amount) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${address.toLowerCase()}:${today}`;
  const current = LIMIT_TRACKER.get(key) || 0;
  LIMIT_TRACKER.set(key, current + amount);
}

setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const key of LIMIT_TRACKER.keys()) {
    if (!key.includes(today)) {
      LIMIT_TRACKER.delete(key);
    }
  }
}, 3600000);

export function enforceTransactionLimit(address, amountUsd, countryCode, ipAddress, txType) {
  const kycGate = getKycGate(address);
  const limit = getJurisdictionLimit(countryCode);

  if (!kycGate.ok) {
    if (amountUsd > limit.maxWithoutKyc) {
      const result = { allowed: false, reason: "kyc_required", requiresKyc: true, limit: limit.maxWithoutKyc };
      logAmlTransaction({
        walletAddress: address,
        txType,
        amountUsd,
        jurisdiction: countryCode,
        ipAddress,
        flagged: 1,
        flagReason: `KYC required: amount $${amountUsd} exceeds $${limit.maxWithoutKyc} limit for ${countryCode}`,
      });
      return result;
    }
    logAmlTransaction({
      walletAddress: address,
      txType,
      amountUsd,
      jurisdiction: countryCode,
      ipAddress,
    });
    addDailyUsage(address, amountUsd);
    return { allowed: true, limit: limit.maxWithoutKyc };
  }

  const kycLevel = kycGate.status.kyc_level;
  const dailyLimits = DAILY_LIMITS[kycLevel] || DAILY_LIMITS.none;

  if (amountUsd > dailyLimits.perTx) {
    return {
      allowed: false,
      reason: "per_tx_limit_exceeded",
      maxPerTx: dailyLimits.perTx,
      kycLevel,
    };
  }

  const dailyUsed = getDailyUsage(address);
  if (dailyUsed + amountUsd > dailyLimits.daily) {
    return {
      allowed: false,
      reason: "daily_limit_exceeded",
      dailyUsed,
      maxDaily: dailyLimits.daily,
      kycLevel,
    };
  }

  logAmlTransaction({
    walletAddress: address,
    txType,
    amountUsd,
    jurisdiction: countryCode,
    ipAddress,
  });
  addDailyUsage(address, amountUsd);
  return { allowed: true, dailyUsed: dailyUsed + amountUsd, maxDaily: dailyLimits.daily, kycLevel };
}

export function getLimitsForUser(address) {
  const kycGate = getKycGate(address);
  if (!kycGate.ok) {
    return { kycLevel: "none", limits: DAILY_LIMITS.none, kycRequired: true };
  }
  return { kycLevel: kycGate.status.kyc_level, limits: DAILY_LIMITS[kycGate.status.kyc_level] || DAILY_LIMITS.none };
}

export { DAILY_LIMITS };
