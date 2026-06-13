import express from "express";
import cors from "cors";
import helmet from "helmet";
import { WebSocketServer } from "ws";
import http from "http";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import config from "./config.js";
import { Matchmaker } from "./matchmaking/Matchmaker.js";
import { authenticate, requireAdmin } from "./middleware/auth.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { requestLogger, metricsMiddleware } from "./middleware/monitor.js";
import {
  getPlayer,
  upsertPlayer,
  getLeaderboard,
  saveMatch,
  getMatchHistory,
  getRecentMatches,
  getDBStatus,
  closeDB,
} from "./db/database.js";
import { registerAge, getVerificationStatus, calculateAge } from "./kyc/ageVerification.js";
import { requireAge, requireAgeWebSocket } from "./middleware/ageGate.js";
import { registerPlayer, logAgeVerification, createParentalConsent, getParentalConsent, confirmParentalConsent, getPurchaseLimits } from "./db/database.js";
import { verifyAgeOnChain } from "./kyc/chainVerification.js";
import { handleProviderWebhook, getKycStatusForUser } from "./kyc/providerKyc.js";
import { enforceTransactionLimit, getLimitsForUser } from "./kyc/transactionLimits.js";
import { logTransaction, getTransactionHistory, getAmlStats } from "./kyc/amlLogger.js";
import { recordTrade, getAlerts, resolveAlert } from "./kyc/washTrading.js";
import { blockPacks, blockStaking, getGeoStatus, getAuditLog } from "./middleware/geofence.js";
import { getBlockedJurisdictions, reloadJurisdictions, isBlockedForStaking, getCountryName } from "./services/geolocation.js";

const app = express();
const server = http.createServer(app);
const matchmaker = new Matchmaker();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));
app.use(express.json());
app.use(requestLogger);

const defaultRateLimit = rateLimit();
const authRateLimit = rateLimit({ windowMs: 60000, max: 20 });

app.get("/health", defaultRateLimit, async (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    db: getDBStatus(),
    matchmaking: await matchmaker.stats(),
    env: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/metrics", defaultRateLimit, metricsMiddleware);

app.post("/auth/login", authRateLimit, (req, res) => {
  const { address, role = "user" } = req.body;
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  const token = jwt.sign(
    { address: address.toLowerCase(), role, iat: Math.floor(Date.now() / 1000) },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  res.json({ token, address: address.toLowerCase(), role });
});

app.post("/auth/register", authRateLimit, (req, res) => {
  const { address, dateOfBirth, role = "user" } = req.body;
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }
  if (!dateOfBirth) {
    return res.status(400).json({ error: "dateOfBirth is required" });
  }

  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  const age = calculateAge(dateOfBirth);
  if (age < 0 || age > 120) {
    return res.status(400).json({ error: "Invalid date of birth" });
  }

  if (age < 13) {
    return res.status(403).json({
      error: "COPPA_REQUIRED",
      message: "Users under 13 require parental consent. Please use the parental consent flow first.",
    });
  }

  const player = registerPlayer({ address, dateOfBirth });
  logAgeVerification(address, { action: "registration", age, method: "self_declared" });

  const token = jwt.sign(
    { address: address.toLowerCase(), role, iat: Math.floor(Date.now() / 1000) },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    address: address.toLowerCase(),
    role,
    age,
    purchaseLimits: getPurchaseLimits(age),
  });
});

app.post("/auth/register-coppa", authRateLimit, (req, res) => {
  const { address, dateOfBirth, parentEmail, consentToken, role = "user" } = req.body;
  if (!address || !dateOfBirth || !parentEmail || !consentToken) {
    return res.status(400).json({ error: "address, dateOfBirth, parentEmail, and consentToken are required" });
  }

  const age = calculateAge(dateOfBirth);
  if (age >= 13) {
    return res.status(400).json({ error: "COPPA flow only applies to users under 13" });
  }

  const consent = getParentalConsent(address);
  if (!consent || !consent.consent_granted) {
    return res.status(403).json({ error: "Parental consent not granted yet" });
  }
  if (consent.consent_token !== consentToken) {
    return res.status(403).json({ error: "Invalid consent token" });
  }

  const player = registerPlayer({ address, dateOfBirth });
  logAgeVerification(address, { action: "registration_coppa", age, method: "parental_consent" });

  const token = jwt.sign(
    { address: address.toLowerCase(), role, iat: Math.floor(Date.now() / 1000) },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    address: address.toLowerCase(),
    role,
    age,
    purchaseLimits: getPurchaseLimits(age),
    parentalConsent: true,
  });
});

app.get("/leaderboard", defaultRateLimit, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;
  const data = getLeaderboard({ limit, offset });
  res.json({ data, limit, offset });
});

app.get("/elo/:address", defaultRateLimit, (req, res) => {
  const player = getPlayer(req.params.address);
  if (!player) {
    return res.json({ address: req.params.address.toLowerCase(), elo: 1000 });
  }
  res.json({ address: player.address, elo: player.elo });
});

app.get("/history/:address", defaultRateLimit, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const data = getMatchHistory(req.params.address, { limit, offset });
  res.json({ data, limit, offset });
});

app.get("/matches", defaultRateLimit, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const data = getRecentMatches({ limit, offset });
  res.json({ data, limit, offset });
});

app.post("/kyc/age", authRateLimit, authenticate, async (req, res) => {
  const { dateOfBirth, method } = req.body;
  if (!dateOfBirth) {
    return res.status(400).json({ error: "dateOfBirth is required" });
  }
  const result = registerAge(req.user.address, { dateOfBirth, method });
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  logAgeVerification(req.user.address, { action: "kyc_verify", age: result.age, method: method || "self_declared" });
  const chainResult = await verifyAgeOnChain(req.user.address, result.age);
  res.json({ ok: true, age: result.age, chain: chainResult });
});

app.get("/kyc/age-status", defaultRateLimit, authenticate, (req, res) => {
  const status = getVerificationStatus(req.user.address);
  res.json(status);
});

app.post("/kyc/parental-consent/init", authRateLimit, (req, res) => {
  const { minorAddress, parentEmail } = req.body;
  if (!minorAddress || !parentEmail) {
    return res.status(400).json({ error: "minorAddress and parentEmail are required" });
  }
  if (!parentEmail.includes("@")) {
    return res.status(400).json({ error: "Valid parent email is required" });
  }

  const consentToken = uuidv4();
  const result = createParentalConsent(minorAddress, parentEmail, consentToken);

  logAgeVerification(minorAddress, {
    action: "parental_consent_init",
    age: null,
    method: "email",
    metadata: { parentEmail },
  });

  res.json({
    ok: true,
    minorAddress: result.minorAddress,
    parentEmail: result.parentEmail,
    expiresAt: result.expiresAt,
    message: "Parental consent request sent. Use the consent token to complete registration.",
    consentToken,
  });
});

app.post("/kyc/parental-consent/confirm", authRateLimit, (req, res) => {
  const { consentToken } = req.body;
  if (!consentToken) {
    return res.status(400).json({ error: "consentToken is required" });
  }

  const confirmed = confirmParentalConsent(consentToken);
  if (!confirmed) {
    return res.status(404).json({ error: "Invalid or already confirmed consent token" });
  }

  res.json({ ok: true, message: "Parental consent confirmed. User can now complete registration." });
});

app.get("/kyc/purchase-limits", defaultRateLimit, authenticate, (req, res) => {
  const status = getVerificationStatus(req.user.address);
  if (!status.verified) {
    return res.json({ limits: getPurchaseLimits(null), verified: false });
  }
  res.json({ limits: getPurchaseLimits(status.age), verified: true, age: status.age });
});

app.post("/kyc/provider-webhook/:provider", defaultRateLimit, async (req, res) => {
  const { provider } = req.params;
  const result = handleProviderWebhook(provider, req.body, req.headers);
  res.status(result.status).json(result);
});

app.get("/kyc/provider-status", defaultRateLimit, authenticate, (req, res) => {
  const status = getKycStatusForUser(req.user.address);
  res.json(status);
});

app.get("/kyc/limits", defaultRateLimit, authenticate, (req, res) => {
  const limits = getLimitsForUser(req.user.address);
  res.json(limits);
});

app.post("/purchase/check", authRateLimit, authenticate, blockPacks(), (req, res) => {
  const { amountUsd, countryCode, ipAddress, txType = "purchase" } = req.body;
  if (!amountUsd || amountUsd <= 0) {
    return res.status(400).json({ error: "Valid amountUsd is required" });
  }
  const result = enforceTransactionLimit(req.user.address, amountUsd, countryCode || null, ipAddress || req.ip, txType);
  res.json(result);
});

app.get("/aml/transactions", defaultRateLimit, authenticate, requireAdmin, (req, res) => {
  const { walletAddress, flagged, limit, offset } = req.query;
  const data = getTransactionHistory({
    walletAddress,
    flagged: flagged !== undefined ? parseInt(flagged) : undefined,
    limit: Math.min(parseInt(limit) || 100, 500),
    offset: parseInt(offset) || 0,
  });
  res.json({ data, count: data.length });
});

app.get("/aml/stats", defaultRateLimit, authenticate, requireAdmin, (req, res) => {
  res.json(getAmlStats());
});

app.post("/marketplace/trade-record", authRateLimit, authenticate, (req, res) => {
  const { counterpartyAddress, tradeDeskOfferId, tokensInvolved, ipAddress, amountUsd } = req.body;
  if (!counterpartyAddress) {
    return res.status(400).json({ error: "counterpartyAddress is required" });
  }

  const trade = { walletAddress: req.user.address, counterpartyAddress, tradeDeskOfferId, tokensInvolved, ipAddress, amountUsd };

  logTransaction({
    walletAddress: req.user.address,
    counterpartyAddress,
    txType: "p2p_trade",
    asset: tokensInvolved ? tokensInvolved.join(",") : null,
    amountUsd: amountUsd || 0,
    ipAddress: ipAddress || req.ip,
  });

  const alerts = recordTrade(trade);
  res.json({ ok: true, alertsGenerated: alerts.length > 0, alertCount: alerts.length });
});

app.get("/marketplace/wash-alerts", defaultRateLimit, authenticate, requireAdmin, (req, res) => {
  const alerts = getAlerts();
  res.json({ data: alerts, count: alerts.length });
});

app.post("/marketplace/wash-alerts/:id/resolve", defaultRateLimit, authenticate, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid alert ID" });
  resolveAlert(id);
  res.json({ ok: true });
});

// ─── Geofencing & Compliance ─────────────────────────────────────

app.get("/compliance/geofence-status", defaultRateLimit, async (req, res) => {
  const status = getGeoStatus(req);
  res.json({
    ...status,
    blockedJurisdictions: getBlockedJurisdictions(),
  });
});

app.get("/compliance/geofence-audit", defaultRateLimit, authenticate, requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  res.json({ data: getAuditLog(limit) });
});

app.post("/compliance/geofence-reload", defaultRateLimit, authenticate, requireAdmin, async (req, res) => {
  reloadJurisdictions();
  res.json({ ok: true, message: "Jurisdiction config reloaded" });
});

app.get("/compliance/blocked-jurisdictions", defaultRateLimit, async (req, res) => {
  res.json(getBlockedJurisdictions());
});

app.get("/contracts", defaultRateLimit, async (req, res) => {
  try {
    const depPath = process.env.DEPLOYMENTS_PATH || "../deployments/local.json";
    const fs = await import("fs");
    const path = await import("path");
    const absPath = path.resolve(depPath);
    const data = JSON.parse(fs.readFileSync(absPath, "utf8"));
    res.json(data.contracts);
  } catch (e) {
    res.status(500).json({ error: "Deployments not found", details: e.message });
  }
});

app.get("/compliance/contract-addresses", defaultRateLimit, authenticate, async (req, res) => {
  const geo = getGeoStatus(req);
  const overrides = getBlockedJurisdictions().contractOverrides || {};
  const resolved = {};
  for (const [contract, cfg] of Object.entries(overrides)) {
    if (geo.countryCode && cfg.jurisdictions?.[geo.countryCode]) {
      resolved[contract] = cfg.jurisdictions[geo.countryCode];
    } else {
      resolved[contract] = cfg.default;
    }
  }
  res.json({
    countryCode: geo.countryCode,
    addresses: resolved,
  });
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  let authenticated = false;
  let userAddress = null;
  const geo = getGeoStatus(req);

  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.send(JSON.stringify({ type: "error", message: "Authentication timeout" }));
      ws.close();
    }
  }, 10000);

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "auth") {
      try {
        const decoded = jwt.verify(msg.token, config.JWT_SECRET);
        authenticated = true;
        userAddress = decoded.address;
        clearTimeout(authTimeout);
        ws.send(JSON.stringify({
          type: "authenticated",
          address: userAddress,
          geo: {
            countryCode: geo.countryCode,
            stakingAllowed: geo.stakingAllowed,
            packsAllowed: geo.packsAllowed,
          },
        }));
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
      }
      return;
    }

    if (!authenticated) {
      ws.send(JSON.stringify({ type: "error", message: "Authenticate first with { type: 'auth', token: '...' }" }));
      return;
    }

    switch (msg.type) {
      case "queue": {
        if (msg.address && msg.address.toLowerCase() !== userAddress) {
          ws.send(JSON.stringify({ type: "error", message: "Address mismatch" }));
          return;
        }
        const address = userAddress;
        if (msg.stake > 0) {
          const ageCheck = requireAgeWebSocket(address);
          if (!ageCheck.allowed) {
            ws.send(JSON.stringify({ type: "error", message: ageCheck.error }));
            return;
          }
          if (geo.countryCode && isBlockedForStaking(geo.countryCode)) {
            ws.send(JSON.stringify({
              type: "error",
              message: `Staked matches not available in ${getCountryName(geo.countryCode)}`,
            }));
            return;
          }
        }
        ws.send(JSON.stringify({ type: "queued", stake: msg.stake }));
        try {
          const result = await matchmaker.enqueue({
            address,
            elo: msg.elo,
            stake: msg.stake,
            lineupHash: msg.lineupHash,
          });

          if (result.timeout || result.cancelled) {
            ws.send(JSON.stringify({ type: "timeout", message: "Match not found" }));
          } else {
            ws.send(JSON.stringify({ type: "matched", ...result }));
          }
        } catch (err) {
          ws.send(JSON.stringify({ type: "error", message: err.message }));
        }
        break;
      }
      case "cancel": {
        if (userAddress) {
          await matchmaker.dequeue(userAddress);
        }
        ws.send(JSON.stringify({ type: "cancelled" }));
        break;
      }
    }
  });

  ws.on("close", () => {
    clearTimeout(authTimeout);
    if (userAddress) {
      matchmaker.dequeue(userAddress);
    }
  });
});

setInterval(() => matchmaker.tick(), 2000);

function gracefulShutdown(signal) {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  wss.close(() => console.log("[Server] WebSocket server closed"));
  server.close(() => {
    closeDB();
    console.log("[Server] HTTP server closed. Goodbye!");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

server.listen(config.port, () => {
  console.log(`\n⚽ CryptoÁlbum Copa backend rodando na porta ${config.port}`);
  console.log(`   REST:  http://localhost:${config.port}/health`);
  console.log(`   WS:    ws://localhost:${config.port} (matchmaking)`);
  console.log(`   Env:   ${config.nodeEnv}`);
});

export { app, server };
