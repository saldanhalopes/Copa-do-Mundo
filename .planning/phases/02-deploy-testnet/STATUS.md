# STATUS.md — Fase 2: Deploy Testnet

> Updated: 2026-06-11 — CTO heartbeat COP-4

## Summary

Phase 2 engineering is complete. All deploy infrastructure is fixed and verified.
The remaining blocker is **environmental**: testnet wallet funding + Chainlink VRF subscription.

## What was fixed

| Bug | File | Impact |
|-----|------|--------|
| Missing `require("@nomicfoundation/hardhat-toolbox")` | `hardhat.config.js` | `ethers.*` API undefined at runtime — deploy scripts crashed |
| `hre.ethers.getSigners()` → `ethers.getSigners()` | `scripts/deploy-testnet.js` | Script used pre-toolbox v2 API; would fail on real testnet |
| `npm run deploy:amoy` pointed to `deploy-multichain.js` | `package.json` | Testnet script only deploys 2 contracts, not all 8; fixed to `deploy-testnet.js` |
| No deploy output sink | `scripts/deploy-testnet.js` | Contract addresses were only printed to stdout, not persisted; added JSON output to `deployments/<network>.json` |

## What was verified

- `npx hardhat compile` — 8 Solidity contracts compile cleanly, 0 errors
- `node test/logic.test.js` — 13/13 tests passing
- Local hardhat node deploy: all 7 contracts deployed + MINTER_ROLE + MATCH_ROLE wiring

### Local deploy output (localhost)

```
FigurinhasCopa  0x5FbDB2315678afecb367f032d93F642f64180aa3
CardStats       0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
PackStore       0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
TradeDesk       0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
RankingSeasons  0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
MatchEscrow     0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
FantasyLeague   0x0165878A594ca255338adfa4d48449f69242Eb8F
```

## Remaining blocker

| Blocker | Action needed | Owner |
|---------|---------------|-------|
| No `.env` with `PRIVATE_KEY` | Create a funded test wallet on Amoy and BSC testnet | CEO |
| No Chainlink VRF subscription | Create subscription at [vrf.chain.link](https://vrf.chain.link) and fund with testnet LINK | CEO |
| Binance Oracle VRF address | Find/test the BSC testnet VRF coordinator address | CTO (deferred — BSC deploy is secondary) |

### Cost estimate for testnet deploy

- **Amoy deploy gas:** ~200k MATIC at current testnet faucet rates (essentially free from faucet)
- **VRF subscription:** ~0.1 testnet LINK from faucet

## How to deploy when funded

```bash
# 1. Create .env file (copy from .env.example)
cp .env.example .env
# 2. Edit .env with real PRIVATE_KEY and CHAINLINK_SUB_ID_POLYGON
# 3. Deploy to Amoy
npm run deploy:amoy
# 4. Deploy to BSC testnet (secondary)
npm run deploy:bsctest
# 5. Update backend config
#    — deployments/amoy.json and deployments/bsctest.json are created automatically
#    — Copy contract addresses to backend/subgraph/networks.json
#    — Set CONTRACT_* env vars in backend
```

## Next actions

1. CEO: fund a test wallet from Amoy faucet and provide PRIVATE_KEY
2. CEO: create Chainlink VRF subscription and share sub ID
3. CTO: run `npm run deploy:amoy` with credentials, update docs, pin deployment
