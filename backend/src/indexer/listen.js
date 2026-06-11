import config from "../config.js";
import { Indexer } from "./Indexer.js";

function main() {
  const addresses = {
    PackStore: config.CONTRACT_ADDRESSES.PackStore,
    MatchEscrow: config.CONTRACT_ADDRESSES.MatchEscrow,
    Ranking: config.CONTRACT_ADDRESSES.Ranking,
  };

  const rpcUrl = config.RPC_URLS.polygon;
  if (!rpcUrl) {
    console.error("[Indexer] No RPC URL configured (RPC_POLYGON)");
    process.exit(1);
  }

  const startBlock = parseInt(process.env.INDEXER_START_BLOCK, 10) || 0;

  const indexer = new Indexer({
    rpcUrl,
    addresses,
    startBlock,
  });

  const shutdown = (signal) => {
    console.log(`\n[Indexer] ${signal} received. Stopping...`);
    indexer.stop();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  indexer.start().catch((err) => {
    console.error("[Indexer] Fatal error:", err);
    process.exit(1);
  });
}

main();
