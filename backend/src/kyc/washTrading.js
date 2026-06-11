import config from "../config.js";
import { getActiveWashAlerts, createWashTradingAlert, resolveWashAlert } from "../db/database.js";

const ROUND_TRIP_THRESHOLD = config.WASH_TRADING.roundTripThreshold;
const TIME_WINDOW_MINUTES = config.WASH_TRADING.timeWindowMinutes;
const SAME_IP_THRESHOLD = config.WASH_TRADING.sameIpThreshold;

const recentTrades = [];
const MAX_RECENT_TRADES = 10000;

export function recordTrade({ walletAddress, counterpartyAddress, tradeDeskOfferId, tokensInvolved, ipAddress, amountUsd }) {
  const trade = {
    walletAddress: walletAddress.toLowerCase(),
    counterpartyAddress: counterpartyAddress ? counterpartyAddress.toLowerCase() : null,
    tradeDeskOfferId,
    tokensInvolved,
    ipAddress,
    amountUsd,
    timestamp: Date.now(),
  };

  recentTrades.push(trade);
  if (recentTrades.length > MAX_RECENT_TRADES) {
    recentTrades.splice(0, recentTrades.length - MAX_RECENT_TRADES);
  }

  const alerts = [];

  const roundTripAlert = detectRoundTrip(trade);
  if (roundTripAlert) alerts.push(roundTripAlert);

  const sameIpAlert = detectSameIpCycles(trade);
  if (sameIpAlert) alerts.push(sameIpAlert);

  return alerts;
}

function detectRoundTrip(trade) {
  if (!trade.counterpartyAddress) return null;

  const windowStart = trade.timestamp - TIME_WINDOW_MINUTES * 60 * 1000;
  const relevantTrades = [];

  for (let i = recentTrades.length - 2; i >= 0; i--) {
    const t = recentTrades[i];
    if (t.timestamp < windowStart) break;

    const isReturnTrade =
      t.walletAddress === trade.counterpartyAddress &&
      t.counterpartyAddress === trade.walletAddress &&
      Math.abs(t.timestamp - trade.timestamp) < TIME_WINDOW_MINUTES * 60 * 1000;

    if (isReturnTrade) {
      relevantTrades.push(t);
    }
  }

  if (relevantTrades.length >= ROUND_TRIP_THRESHOLD) {
    const totalVolume = relevantTrades.reduce((sum, t) => sum + (t.amountUsd || 0), 0) + (trade.amountUsd || 0);

    const alert = createWashTradingAlert({
      alertType: "round_trip",
      walletAddress: trade.walletAddress,
      counterpartyAddress: trade.counterpartyAddress,
      tradeDeskOfferId: trade.tradeDeskOfferId,
      tokensInvolved: trade.tokensInvolved,
      roundTripCount: relevantTrades.length + 1,
      totalVolumeUsd: totalVolume,
      timeWindowMinutes: TIME_WINDOW_MINUTES,
    });

    console.warn(`[WashTrading] Round-trip detected: ${trade.walletAddress} <-> ${trade.counterpartyAddress} (${relevantTrades.length + 1} trades, $${totalVolume.toFixed(2)})`);
    return alert;
  }

  return null;
}

function detectSameIpCycles(trade) {
  if (!trade.ipAddress) return null;

  const windowStart = trade.timestamp - TIME_WINDOW_MINUTES * 60 * 1000;
  let sameIpCount = 0;
  const wallets = new Set();

  for (let i = recentTrades.length - 2; i >= 0; i--) {
    const t = recentTrades[i];
    if (t.timestamp < windowStart) break;

    if (t.ipAddress === trade.ipAddress) {
      sameIpCount++;
      wallets.add(t.walletAddress);
      if (t.counterpartyAddress) wallets.add(t.counterpartyAddress);
    }
  }

  if (sameIpCount >= SAME_IP_THRESHOLD && wallets.size >= 2) {
    const alert = createWashTradingAlert({
      alertType: "same_ip_cycling",
      walletAddress: trade.walletAddress,
      ipAddress: trade.ipAddress,
      tokensInvolved: trade.tokensInvolved,
      roundTripCount: sameIpCount + 1,
      totalVolumeUsd: trade.amountUsd || 0,
      timeWindowMinutes: TIME_WINDOW_MINUTES,
    });

    console.warn(`[WashTrading] Same-IP cycling detected: ${trade.ipAddress} — ${sameIpCount + 1} trades, ${wallets.size} wallets`);
    return alert;
  }

  return null;
}

export function getAlerts(includeResolved = false) {
  return getActiveWashAlerts();
}

export function resolveAlert(alertId) {
  return resolveWashAlert(alertId);
}
