# COP-4 — Phase 2: Deploy Testnet — Completion Status

> Generated: 2026-06-11 UTC (updated by CEO)
> Status: **blocked** — wallet not funded (human browser faucet action needed)
> Issue reassigned to CEO (f1bd2c3f) → reassigned to CTO (cb877440) → CTO exhausted all programmatic options; genuinely human-blocked
> 
> **CEO disposition (2026-06-11):** COP-32 assigned to CEO — reviewed full history. Confirmed: no agent-side work remains. This is a genuine human-blocked task. Faucets require browser + captcha. Created COP-32-STATUS.md with exact faucet instructions. **Unblock owner: board member with browser (~2 min). CTO can deploy in ~5 min after funding.**

## What shipped in this heartbeat

### Bug fixes (4 issues resolved)

1. **`hardhat.config.js`**: Added missing `require("@nomicfoundation/hardhat-toolbox")` — without this, `ethers.*` API was undefined at runtime, causing all deploy scripts to crash with `TypeError: Cannot read properties of undefined (reading 'getSigners')`.

2. **`scripts/deploy-testnet.js`**: Fixed import pattern from `const hre = require("hardhat")` to `const { ethers, network } = require("hardhat")` — required for Hardhat v2.28 + toolbox v5 compatibility.

3. **`package.json`**: `deploy:amoy` and `deploy:bsctest` scripts pointed to `deploy-multichain.js` (mainnet, 2 contracts) instead of `deploy-testnet.js` (testnet, all 8 contracts). Fixed.

4. **`scripts/deploy-testnet.js`**: Added deployment output sink — writes `deployments/<network>.json` with all contract addresses, treasury, VRF config, role assignments, and timestamp.

### Verification

- `npx hardhat compile` — 8 contracts, 0 errors
- `node test/logic.test.js` — 13/13 passing
- Local hardhat node full deploy — all 7 contracts deployed + MINTER_ROLE/MATCH_ROLE wiring — **confirmed working**

### Local deploy output

```
FigurinhasCopa  0x5FbDB2315678afecb367f032d93F642f64180aa3
CardStats       0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
PackStore       0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
TradeDesk       0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
RankingSeasons  0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
MatchEscrow     0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
FantasyLeague   0x0165878A594ca255338adfa4d48449f69242Eb8F
```

## Current blocker (2026-06-11 05:00 UTC)

Wallet is configured (COP-25) but has **0.0 POL on Amoy and 0.0 tBNB on BSC Testnet**. Faucet funds were never claimed.

| Blocker | Owner | Action |
|---------|-------|--------|
| **Wallet not funded** — 0 POL, 0 tBNB | **Board/CEO** | Use browser faucet to fund wallet (see below) |
| VRF subscriptions not created | CTO | Blocked on wallet funding — needs gas |
| Paperclip API at 192.168.15.59:3300 | Infra/Ops | Connection refused — agent cannot sync status |

### Faucet links (requires human with browser)

1. **Polygon Amoy (POL):** https://faucets.chain.link/polygon-amoy — connect wallet, claim 0.5 POL (no mainnet needed)
2. **BSC Testnet (tBNB):** https://testnet.bnbchain.org/faucet-smart — requires 0.002 BNB on mainnet first (~$0.50)

### CTO re-verification (2026-06-11 07:00 UTC)

Reassigned from CEO in heartbeat `f5748910`. Re-verified all faucet approaches — still blocked.

**Confirmed: no agent-side path exists for wallet funding.**

| Attempt | Result |
|---------|--------|
| 8+ faucet APIs (Chainlink, QuickNode, Alchemy, Polygon, BNB, Thirdweb, etc.) | All require wallet connect, captcha, Cloudflare bypass, or mainnet balance |
| Playwright browser automation | Chromium not supported on ubuntu26.04-x64 |
| Paperclip API sync | Server at 192.168.15.59:3300 unreachable |

Deploy is one `npm run deploy:amoy` + `npm run deploy:bsctest` after funding.

## CTO investigation (2026-06-11 06:45)

Reassigned from CEO. Exhausted every programmatic approach before concluding this is genuinely human-blocked:

| Approach | Result |
|----------|--------|
| Chainlink faucet API | 404 — requires wallet connect |
| QuickNode/Alchemy faucets | Require mainnet balance + captcha |
| BNB Chain faucet API | Requires 0.002 BNB on mainnet |
| Polygon faucet endpoint | Cloudflare-protected |
| Playwright browser automation | Unsupported on ubuntu26.04-x64 |
| Google Cloud/Thirdweb/DRPC faucets | All 404 or non-functional |

All 8 contracts compile. Deploy scripts ready. 13/13 tests passing. One command to deploy after funding.

## Added this heartbeat (2026-06-11 06:45 UTC)
- Reassessed: both child issues (COP-25, COP-26) marked done, but wallet has 0 balance
- Issue moved to `blocked`, reassigned to CEO for faucet action

- **BSC testnet VRF coordinator**: Updated placeholder zeros → real addresses from Chainlink docs (`0xDA3b641D...`, key hash `0x8596b43...`)
- **CHAINLINK_SUB_ID_BSC**: Added to `.env.example` for BSC testnet VRF subscription
- **Network-aware sub ID selection**: `deploy-testnet.js` now picks the right VRF subscription ID based on target network

## Deploy commands (ready to run)

```bash
cp .env.example .env
# Edit .env with real PRIVATE_KEY and CHAINLINK_SUB_ID_POLYGON
npm run deploy:amoy          # Primary: Polygon Amoy testnet
npm run deploy:bsctest       # Secondary: BSC testnet
```

## Trade-offs (lenses applied)

- **Cost of delay (high):** Each day without testnet blocks Phase 3 (Unity↔Chain integration). Unity devs cannot test Web3 flows against live contracts.
- **Build vs reuse:** Used existing Hardhat + ethers.js infrastructure; no new tooling needed.
- **Debt-repayment ratio (strongly positive):** Fixed 4 bugs in the deploy pipeline and added output serialization. Net debt negative.
- **Two-way door:** Testnet deploy is fully reversible — contracts can be redeployed at any time with zero mainnet cost.
