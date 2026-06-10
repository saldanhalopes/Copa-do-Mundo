require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "1".repeat(64);

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    amoy:       { url: process.env.RPC_AMOY || "https://rpc-amoy.polygon.technology", chainId: 80002, accounts: [PRIVATE_KEY] },
    bscTestnet: { url: "https://data-seed-prebsc-1-s1.binance.org:8545", chainId: 97, accounts: [PRIVATE_KEY] },
    polygon:    { url: process.env.RPC_POLYGON || "https://polygon-rpc.com", chainId: 137, accounts: [PRIVATE_KEY] },
    bnb:        { url: process.env.RPC_BNB || "https://bsc-dataseed1.binance.org", chainId: 56, accounts: [PRIVATE_KEY], gasPrice: 3000000000 },
  },
};
