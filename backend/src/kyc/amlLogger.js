import { logAmlTransaction, queryAmlTransactions } from "../db/database.js";

const RISK_THRESHOLDS = {
  LOW: 0.2,
  MEDIUM: 0.5,
  HIGH: 0.8,
};

const HIGH_RISK_JURISDICTIONS = new Set(["KP", "IR", "CU", "SY", "MM", "RU"]);
const HIGH_RISK_TX_TYPES = new Set(["withdrawal", "p2p_trade", "stake"]);

function calculateRiskScore({ amountUsd, jurisdiction, txType, isNewWallet, isRapidTrade }) {
  let score = 0;

  if (amountUsd > 10000) score += 0.3;
  else if (amountUsd > 3000) score += 0.15;
  else if (amountUsd > 500) score += 0.05;

  if (HIGH_RISK_JURISDICTIONS.has(jurisdiction)) score += 0.4;
  if (HIGH_RISK_TX_TYPES.has(txType)) score += 0.2;
  if (isNewWallet) score += 0.15;
  if (isRapidTrade) score += 0.25;

  return Math.min(score, 1.0);
}

function getRiskLabel(score) {
  if (score >= RISK_THRESHOLDS.HIGH) return "HIGH";
  if (score >= RISK_THRESHOLDS.MEDIUM) return "MEDIUM";
  if (score >= RISK_THRESHOLDS.LOW) return "LOW";
  return "NEGLIGIBLE";
}

export function logTransaction({ txHash, walletAddress, counterpartyAddress, txType, asset, amountUsd, jurisdiction, ipAddress, userAgent, isNewWallet = false, isRapidTrade = false }) {
  const riskScore = calculateRiskScore({ amountUsd, jurisdiction, txType, isNewWallet, isRapidTrade });
  const flagged = riskScore >= RISK_THRESHOLDS.MEDIUM ? 1 : 0;

  const flagReason = flagged
    ? `Risk score ${riskScore.toFixed(2)} (${getRiskLabel(riskScore)}): ${[
        amountUsd > 10000 ? "high_value" : null,
        HIGH_RISK_JURISDICTIONS.has(jurisdiction) ? "high_risk_jurisdiction" : null,
        HIGH_RISK_TX_TYPES.has(txType) ? "high_risk_tx_type" : null,
        isRapidTrade ? "rapid_trade" : null,
      ].filter(Boolean).join(", ")}`
    : null;

  try {
    logAmlTransaction({
      txHash,
      walletAddress,
      counterpartyAddress,
      txType,
      asset,
      amountUsd,
      jurisdiction,
      ipAddress,
      userAgent,
      riskScore,
      flagged,
      flagReason,
    });
  } catch (err) {
    console.error("[AML] Failed to log transaction:", err.message);
  }

  return { riskScore, riskLabel: getRiskLabel(riskScore), flagged };
}

export function getTransactionHistory({ walletAddress, flagged, limit = 100, offset = 0 }) {
  return queryAmlTransactions({ walletAddress, flagged, limit, offset });
}

export function getAmlStats() {
  return {
    thresholds: RISK_THRESHOLDS,
    highRiskJurisdictions: [...HIGH_RISK_JURISDICTIONS],
    highRiskTxTypes: [...HIGH_RISK_TX_TYPES],
  };
}

export { RISK_THRESHOLDS, calculateRiskScore, getRiskLabel };
