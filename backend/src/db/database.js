import { createRequire } from "module";
import config from "../config.js";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

let db;

function createSQLiteDB() {
  const filePath = config.DATABASE_URL
    ? new URL(config.DATABASE_URL).pathname
    : "./cryptoalbum.db";
  const d = new Database(filePath);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  return d;
}

function initTables(d) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS players (
      address TEXT PRIMARY KEY,
      elo INTEGER NOT NULL DEFAULT 1000,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      date_of_birth TEXT,
      age_verified_at TEXT,
      age_verification_method TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT UNIQUE,
      player_a TEXT NOT NULL,
      player_b TEXT NOT NULL,
      winner TEXT,
      stake INTEGER NOT NULL DEFAULT 0,
      score TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (player_a) REFERENCES players(address),
      FOREIGN KEY (player_b) REFERENCES players(address)
    );

    CREATE INDEX IF NOT EXISTS idx_matches_player_a ON matches(player_a);
    CREATE INDEX IF NOT EXISTS idx_matches_player_b ON matches(player_b);
    CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

    CREATE TABLE IF NOT EXISTS age_verification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      action TEXT NOT NULL,
      age INTEGER,
      method TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS parental_consent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      minor_address TEXT NOT NULL UNIQUE,
      parent_email TEXT NOT NULL,
      consent_token TEXT NOT NULL,
      consent_granted INTEGER NOT NULL DEFAULT 0,
      granted_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_age_log_address ON age_verification_log(address);
    CREATE INDEX IF NOT EXISTS idx_parental_consent_minor ON parental_consent(minor_address);

    CREATE TABLE IF NOT EXISTS kyc_status (
      address TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_user_id TEXT,
      kyc_level TEXT NOT NULL DEFAULT 'none',
      kyc_status TEXT NOT NULL DEFAULT 'pending',
      country_code TEXT,
      verified_at TEXT,
      expires_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (address) REFERENCES players(address)
    );

    CREATE TABLE IF NOT EXISTS aml_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_hash TEXT,
      wallet_address TEXT NOT NULL,
      counterparty_address TEXT,
      tx_type TEXT NOT NULL,
      asset TEXT,
      amount_usd REAL NOT NULL DEFAULT 0,
      jurisdiction TEXT,
      ip_address TEXT,
      user_agent TEXT,
      risk_score REAL DEFAULT 0,
      flagged INTEGER NOT NULL DEFAULT 0,
      flag_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_aml_wallet ON aml_transactions(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_aml_created ON aml_transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_aml_flagged ON aml_transactions(flagged);

    CREATE TABLE IF NOT EXISTS wash_trading_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      counterparty_address TEXT,
      trade_desk_offer_id INTEGER,
      tokens_involved TEXT,
      round_trip_count INTEGER DEFAULT 0,
      total_volume_usd REAL DEFAULT 0,
      time_window_minutes INTEGER,
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved INTEGER NOT NULL DEFAULT 0,
      resolved_at TEXT,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_wash_wallet ON wash_trading_alerts(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_wash_detected ON wash_trading_alerts(detected_at);

    CREATE VIEW IF NOT EXISTS leaderboard AS
    SELECT
      address,
      elo,
      wins,
      losses,
      draws,
      (wins + losses + draws) as total_games,
      CASE WHEN (wins + losses) > 0
        THEN ROUND(CAST(wins AS REAL) / (wins + losses) * 100, 1)
        ELSE 0
      END as win_rate
    FROM players
    ORDER BY elo DESC;
  `);
}

function openDB() {
  const d = createSQLiteDB();
  initTables(d);
  return d;
}

function getDB() {
  if (!db) {
    db = openDB();
  }
  return db;
}

export function getPlayer(address) {
  const d = getDB();
  const stmt = d.prepare("SELECT * FROM players WHERE address = ?");
  return stmt.get(address.toLowerCase()) || null;
}

export function upsertPlayer({ address, elo, winsDelta = 0, lossesDelta = 0, drawsDelta = 0 }) {
  const d = getDB();
  const addr = address.toLowerCase();
  const existing = getPlayer(addr);

  if (existing) {
    const stmt = d.prepare(`
      UPDATE players
      SET elo = ?, wins = wins + ?, losses = losses + ?, draws = draws + ?,
          updated_at = datetime('now')
      WHERE address = ?
    `);
    stmt.run(elo ?? existing.elo, winsDelta, lossesDelta, drawsDelta, addr);
  } else {
    const stmt = d.prepare(`
      INSERT INTO players (address, elo, wins, losses, draws)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(addr, elo ?? 1000, Math.max(0, winsDelta), Math.max(0, lossesDelta), Math.max(0, drawsDelta));
  }

  return getPlayer(addr);
}

export function registerPlayer({ address, dateOfBirth }) {
  const d = getDB();
  const addr = address.toLowerCase();
  const existing = getPlayer(addr);
  if (existing) {
    const stmt = d.prepare(`
      UPDATE players
      SET date_of_birth = ?, age_verified_at = datetime('now'),
          age_verification_method = 'self_declared',
          updated_at = datetime('now')
      WHERE address = ?
    `);
    stmt.run(dateOfBirth, addr);
    return getPlayer(addr);
  }
  const stmt = d.prepare(`
    INSERT INTO players (address, elo, wins, losses, draws, date_of_birth, age_verified_at, age_verification_method)
    VALUES (?, 1000, 0, 0, 0, ?, datetime('now'), 'self_declared')
  `);
  stmt.run(addr, dateOfBirth);
  return getPlayer(addr);
}

export function setAgeVerification(address, { dateOfBirth, method = "self_declared" }) {
  const d = getDB();
  const addr = address.toLowerCase();
  const stmt = d.prepare(`
    UPDATE players
    SET date_of_birth = ?, age_verified_at = datetime('now'), age_verification_method = ?,
        updated_at = datetime('now')
    WHERE address = ?
  `);
  stmt.run(dateOfBirth, method, addr);
  return getPlayer(addr);
}

export function getAgeStatus(address) {
  const d = getDB();
  const stmt = d.prepare(`
    SELECT date_of_birth, age_verified_at, age_verification_method FROM players WHERE address = ?
  `);
  return stmt.get(address.toLowerCase()) || null;
}

export function getLeaderboard({ limit = 100, offset = 0 } = {}) {
  const d = getDB();
  const stmt = d.prepare("SELECT * FROM leaderboard LIMIT ? OFFSET ?");
  return stmt.all(limit, offset);
}

export function saveMatch({ matchId, playerA, playerB, winner, stake = 0, score = null, status = "pending" }) {
  const d = getDB();
  const stmt = d.prepare(`
    INSERT INTO matches (match_id, player_a, player_b, winner, stake, score, status, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const completedAt = status === "completed" ? new Date().toISOString() : null;
  const info = stmt.run(
    matchId || null,
    playerA.toLowerCase(),
    playerB.toLowerCase(),
    winner ? winner.toLowerCase() : null,
    stake,
    score,
    status,
    completedAt
  );
  return { id: info.lastInsertRowid };
}

export function getMatchHistory(address, { limit = 50, offset = 0 } = {}) {
  const d = getDB();
  const addr = address.toLowerCase();
  const stmt = d.prepare(`
    SELECT * FROM matches
    WHERE player_a = ? OR player_b = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(addr, addr, limit, offset);
}

export function getRecentMatches({ limit = 50, offset = 0 } = {}) {
  const d = getDB();
  const stmt = d.prepare(`
    SELECT * FROM matches
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset);
}

export function updateMatchResult(matchId, { winner, score, status = "completed" }) {
  const d = getDB();
  const stmt = d.prepare(`
    UPDATE matches
    SET winner = ?, score = ?, status = ?, completed_at = datetime('now')
    WHERE match_id = ?
  `);
  stmt.run(winner ? winner.toLowerCase() : null, score, status, matchId);
}

export function logAgeVerification(address, { action, age, method = null, metadata = null }) {
  const d = getDB();
  const stmt = d.prepare(`
    INSERT INTO age_verification_log (address, action, age, method, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(address.toLowerCase(), action, age, method, metadata ? JSON.stringify(metadata) : null);
}

export function createParentalConsent(minorAddress, parentEmail, consentToken) {
  const d = getDB();
  const addr = minorAddress.toLowerCase();
  const stmt = d.prepare(`
    INSERT INTO parental_consent (minor_address, parent_email, consent_token, expires_at)
    VALUES (?, ?, ?, datetime('now', '+30 days'))
  `);
  stmt.run(addr, parentEmail, consentToken);
  return { minorAddress: addr, parentEmail, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() };
}

export function getParentalConsent(minorAddress) {
  const d = getDB();
  const stmt = d.prepare("SELECT * FROM parental_consent WHERE minor_address = ?");
  return stmt.get(minorAddress.toLowerCase()) || null;
}

export function confirmParentalConsent(token) {
  const d = getDB();
  const stmt = d.prepare(`
    UPDATE parental_consent
    SET consent_granted = 1, granted_at = datetime('now')
    WHERE consent_token = ? AND consent_granted = 0
  `);
  const info = stmt.run(token);
  return info.changes > 0;
}

export function getPurchaseLimits(age) {
  if (age < 13) return { maxDaily: 0, maxMonthly: 0, requireParental: true };
  if (age < 16) return { maxDaily: 10, maxMonthly: 50, requireParental: true };
  if (age < 18) return { maxDaily: 25, maxMonthly: 200, requireParental: false };
  return { maxDaily: null, maxMonthly: null, requireParental: false };
}

export function upsertKycStatus({ address, provider, providerUserId, kycLevel, kycStatus, countryCode }) {
  const d = getDB();
  const stmt = d.prepare(`
    INSERT INTO kyc_status (address, provider, provider_user_id, kyc_level, kyc_status, country_code, verified_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?,
      CASE WHEN ? = 'verified' THEN datetime('now') ELSE NULL END,
      datetime('now'))
    ON CONFLICT(address) DO UPDATE SET
      provider = excluded.provider,
      provider_user_id = COALESCE(excluded.provider_user_id, kyc_status.provider_user_id),
      kyc_level = excluded.kyc_level,
      kyc_status = excluded.kyc_status,
      country_code = COALESCE(excluded.country_code, kyc_status.country_code),
      verified_at = CASE WHEN excluded.kyc_status = 'verified' AND kyc_status.kyc_status != 'verified' THEN datetime('now') ELSE kyc_status.verified_at END,
      updated_at = datetime('now')
  `);
  stmt.run(address.toLowerCase(), provider, providerUserId || null, kycLevel, kycStatus, countryCode || null, kycStatus);
  return getKycStatus(address);
}

export function getKycStatus(address) {
  const d = getDB();
  const stmt = d.prepare("SELECT * FROM kyc_status WHERE address = ?");
  return stmt.get(address.toLowerCase()) || null;
}

export function getKycStatusByProvider(provider, providerUserId) {
  const d = getDB();
  const stmt = d.prepare("SELECT * FROM kyc_status WHERE provider = ? AND provider_user_id = ?");
  return stmt.get(provider, providerUserId) || null;
}

export function logAmlTransaction({ txHash, walletAddress, counterpartyAddress, txType, asset, amountUsd, jurisdiction, ipAddress, userAgent, riskScore = 0, flagged = 0, flagReason = null }) {
  const d = getDB();
  const stmt = d.prepare(`
    INSERT INTO aml_transactions (tx_hash, wallet_address, counterparty_address, tx_type, asset, amount_usd, jurisdiction, ip_address, user_agent, risk_score, flagged, flag_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    txHash || null,
    walletAddress.toLowerCase(),
    counterpartyAddress ? counterpartyAddress.toLowerCase() : null,
    txType,
    asset || null,
    amountUsd,
    jurisdiction || null,
    ipAddress || null,
    userAgent || null,
    riskScore,
    flagged,
    flagReason
  );
}

export function queryAmlTransactions({ walletAddress, flagged, limit = 100, offset = 0 }) {
  const d = getDB();
  let sql = "SELECT * FROM aml_transactions WHERE 1=1";
  const params = [];

  if (walletAddress) {
    sql += " AND wallet_address = ?";
    params.push(walletAddress.toLowerCase());
  }
  if (flagged !== undefined) {
    sql += " AND flagged = ?";
    params.push(flagged ? 1 : 0);
  }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const stmt = d.prepare(sql);
  return stmt.all(...params);
}

export function createWashTradingAlert({ alertType, walletAddress, counterpartyAddress, tradeDeskOfferId, tokensInvolved, roundTripCount, totalVolumeUsd, timeWindowMinutes }) {
  const d = getDB();
  const stmt = d.prepare(`
    INSERT INTO wash_trading_alerts (alert_type, wallet_address, counterparty_address, trade_desk_offer_id, tokens_involved, round_trip_count, total_volume_usd, time_window_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    alertType,
    walletAddress.toLowerCase(),
    counterpartyAddress ? counterpartyAddress.toLowerCase() : null,
    tradeDeskOfferId || null,
    tokensInvolved ? JSON.stringify(tokensInvolved) : null,
    roundTripCount || 0,
    totalVolumeUsd || 0,
    timeWindowMinutes || null
  );
}

export function getActiveWashAlerts(limit = 50) {
  const d = getDB();
  const stmt = d.prepare("SELECT * FROM wash_trading_alerts WHERE resolved = 0 ORDER BY detected_at DESC LIMIT ?");
  return stmt.all(limit);
}

export function resolveWashAlert(id) {
  const d = getDB();
  const stmt = d.prepare("UPDATE wash_trading_alerts SET resolved = 1, resolved_at = datetime('now') WHERE id = ?");
  return stmt.run(id);
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDBStatus() {
  try {
    const d = getDB();
    const row = d.prepare("SELECT COUNT(*) as count FROM players").get();
    const matchRow = d.prepare("SELECT COUNT(*) as count FROM matches").get();
    return { connected: true, players: row.count, matches: matchRow.count };
  } catch {
    return { connected: false, players: 0, matches: 0 };
  }
}
