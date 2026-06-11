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
