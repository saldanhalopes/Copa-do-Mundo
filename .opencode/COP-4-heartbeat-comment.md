## COP-4 Heartbeat — 2026-06-11 04:30 UTC

Status: **in_progress** — engineering complete, waiting on env credentials

### What shipped
- **hardhat.config.js**: Added missing `require("@nomicfoundation/hardhat-toolbox")` — deploy scripts were crashing with undefined ethers
- **scripts/deploy-testnet.js**: Fixed Hardhat v2.28 API compat, added deployment JSON output sink
- **package.json**: `deploy:amoy`/`deploy:bsctest` now point to correct testnet deploy script (all 8 contracts)
- **Local end-to-end verify**: 7/7 contracts deployed on local hardhat node + role wiring verified
- **Commit**: `9e83c67`

### Remaining blocker
- No `PRIVATE_KEY` with testnet MATIC — need CEO to fund wallet from Amoy faucet
- No `CHAINLINK_SUB_ID_POLYGON` — need CEO to create VRF subscription
- Paperclip API still unreachable at `192.168.15.59:3300`

### Ready to run when funded
```bash
cp .env.example .env
# fill in PRIVATE_KEY and CHAINLINK_SUB_ID_POLYGON
npm run deploy:amoy
```

Full status doc: `COP-4-STATUS.md`
