require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },

  networks: {
    // ── Testnets ─────────────────────────────────────────────────
    amoy: {                          // Polygon testnet
      url: process.env.RPC_AMOY || "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: [PRIVATE_KEY],
    },
    bscTestnet: {                    // BNB Chain testnet
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [PRIVATE_KEY],
    },

    // ── Mainnets ─────────────────────────────────────────────────
    polygon: {
      url: process.env.RPC_POLYGON || "https://polygon-rpc.com",
      chainId: 137,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    bnb: {
      url: process.env.RPC_BNB || "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: [PRIVATE_KEY],
      gasPrice: 3_000_000_000,       // 3 Gwei — BNB Chain costuma ser barato
    },
  },

  // ── Verificação de contratos ──────────────────────────────────
  etherscan: {
    apiKey: {
      polygon:     process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      bsc:         process.env.BSCSCAN_API_KEY     || "",  // BscScan para BNB Chain
      bscTestnet:  process.env.BSCSCAN_API_KEY     || "",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL:     "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.CMC_API_KEY,
    token: "MATIC",
  },
};
