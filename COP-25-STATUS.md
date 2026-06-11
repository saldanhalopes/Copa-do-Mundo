# COP-25 — Acquire Testnet Wallet Credentials (Faucet Funds)

**Status:** Blocked on manual faucet claim
**Owner:** CTO
**Delivered:** Wallet generated + `.env` configured
**Blocker:** Faucets require browser interaction (captcha/wallet connect/tweet)

## What was done

### 1. Wallet generated (✓)
- **Address:** `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee`
- **Private key:** saved to `.env` (gitignored)
- **Mnemonic:** backed up in `COP-25-STATUS.md` below

```
dolphin rough couch actor property follow pride chat then thumb talent more
```

### 2. `.env` configured (✓)
- `PRIVATE_KEY` — deploy wallet private key
- `DEPLOYER_ADDRESS` — `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee`
- `TREASURY_ADDRESS` — same wallet (can be changed later)
- `RPC_AMOY` — `https://rpc-amoy.polygon.technology`
- `RPC_POLYGON` — `https://polygon-rpc.com`
- `RPC_BNB` — `https://bsc-dataseed1.binance.org`
- `CHAINLINK_SUB_ID_POLYGON` — (empty, needs VRF subscription)
- `CHAINLINK_SUB_ID_BSC` — (empty, needs VRF subscription)

### 3. RPC connectivity verified (✓)
- **Polygon Amoy** (chainId: 80002) — reachable
- **BSC Testnet** (chainId: 97) — reachable
- Current balance on both: **0.0**

## Blocker: faucet claim requires browser

All testnet faucets require browser-based interaction (wallet connect, captcha, social login).

### How to fund the wallet (manual step — CEO)

1. **Polygon Amoy (POL):**
   - Go to [QuickNode Amoy Faucet](https://faucet.quicknode.com/polygon/amoy)
   - Connect wallet or paste address: `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee`
   - Alternative: [Chainlink Faucet](https://faucets.chain.link/polygon-amoy)

2. **BSC Testnet (tBNB):**
   - Go to [BNB Chain Faucet](https://testnet.bnbchain.org/faucet-smart)
   - Paste address and solve captcha
   - Alternative: [QuickNode BSC Faucet](https://faucet.quicknode.com/binance-smart-chain)

3. **Verify balance after funding:**
   ```bash
   cd /home/rafael/Copa-do-Mundo && node -e "
   const e = require('ethers');
   const w = new e.Wallet('0x3cd8cc56053ee99367878d31f0484bf759fe94f3f1a7511c2dfbcfd33f85e3fc');
   const amoy = new e.JsonRpcProvider('https://rpc-amoy.polygon.technology');
   const bsc = new e.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');
   Promise.all([
     amoy.getBalance(w.address).then(b => console.log('POL:', e.formatEther(b))),
     bsc.getBalance(w.address).then(b => console.log('tBNB:', e.formatEther(b)))
   ]);
   "
   ```

## Post-funding next steps

When wallet is funded, run the testnet deploy:

```bash
# Deploy to Amoy
npx hardhat run scripts/deploy-testnet.js --network amoy

# Then deploy to BSC Testnet
npx hardhat run scripts/deploy-testnet.js --network bscTestnet
```

After deploy, proceed to [COP-26](/COP/issues/COP-26) — Configure Chainlink VRF subscriptions.

## Exhaustive programmatic faucet search (2026-06-11)
All approaches tested by agent — **none worked without human browser interaction**:

- QuickNode Faucet — requires wallet connect + mainnet ETH balance
- Polygon Faucet — Cloudflare anti-bot protection
- BNB Chain Faucet — hCaptcha + wallet connect
- Chainlink Faucets — browser wallet connect required
- Alchemy Faucet — Mumbai only (deprecated)
- Google Cloud Faucet — 405 Bad Request
- Chainbase Faucet — requires API key
- Circle / DripHub / GetBlock / AllThatNode / Chainstack / BlockVision / Thirdweb — all require browser interaction or paid API keys
- PoW faucets / 0xfaucet / faucet.egorfine / Infura / Coinbase — no response or 404
- Hardhat faucet task — not available

**Verdict:** No programmatic faucet exists for Polygon Amoy or BSC Testnet. Human must use browser.

## Verification evidence
- Wallet generated and `.env` written (gitignored)
- RPCs reachable for both Amoy and BSC Testnet
- Current balance: 0 POL, 0 tBNB
- Deploy script verified in prior sessions (7/7 contracts + role wiring)

## Trade-offs
| Lens | Assessment |
|------|------------|
| **Cost of delay** | Phase 2 blocked until this is resolved. Entire roadmap (COP-5 through COP-9) gated on testnet deploy. |
| **Build vs buy / reuse** | All faucets are free; no build alternative for getting testnet tokens. |
| **Two-way door** | Wallet can be replaced later. This is a testnet key — no real funds at risk. |
