// src/config.js — configuração do backend (lê env + endereços dos contratos)
import fs from "fs";

function loadDeployments() {
  const p = process.env.DEPLOYMENTS_PATH;
  if (p && fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      console.warn(`[config] Falha ao ler ${p}: ${e.message}`);
    }
  }
  return null;
}

const deployments = loadDeployments();

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  rpcUrl: process.env.RPC_LOCAL || "http://localhost:8545",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "",
  ipfsApi: process.env.IPFS_API || "http://localhost:5001",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "*",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 100),
  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "",
  WASH_TRADING: {
    roundTripThreshold: Number(process.env.WASH_ROUND_TRIP_THRESHOLD || 3),
    timeWindowMinutes: Number(process.env.WASH_TIME_WINDOW_MINUTES || 1440),
    sameIpThreshold: Number(process.env.WASH_SAME_IP_THRESHOLD || 5),
  },
  RPC_URLS: {
    polygon: process.env.RPC_POLYGON || process.env.RPC_AMOY || "",
    bsc: process.env.RPC_BNB || "",
  },
  CONTRACT_ADDRESSES: {
    PackStore: process.env.ADDR_PACKSTORE || "",
    MatchEscrow: process.env.ADDR_MATCH || "",
    Ranking: process.env.ADDR_RANKING || "",
  },
  AGE_VERIFIER_PRIVATE_KEY: process.env.AGE_VERIFIER_PRIVATE_KEY || "",
  MIN_AGE_STAKED_PVP: Number(process.env.MIN_AGE_STAKED_PVP || 18),

  // endereços dos contratos (do deploy local ou env)
  contracts: deployments?.contracts || {
    FigurinhasCopa: process.env.ADDR_FIGURINHAS || "",
    PackStore: process.env.ADDR_PACKSTORE || "",
    MatchEscrow: process.env.ADDR_MATCH || "",
    RankingSeasons: process.env.ADDR_RANKING || "",
    TradeDesk: process.env.ADDR_TRADE || "",
  },
  chainId: deployments?.chainId || 31337,
};

export default config;

export function logConfig() {
  console.log("[config] ambiente:", config.nodeEnv);
  console.log("[config] RPC:", config.rpcUrl);
  console.log("[config] contratos carregados:", deployments ? "sim (deployments/local.json)" : "não (usando env/vazios)");
  if (deployments) {
    for (const [k, v] of Object.entries(config.contracts)) {
      console.log(`         ${k}: ${v}`);
    }
  }
}
