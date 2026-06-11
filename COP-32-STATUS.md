# COP-32 — Fund Testnet Wallet for COP-4 Deployment

**Generated:** 2026-06-11 UTC (updated run `0219f127-continuation`)
**Heartbeat:** `0219f127-8429-4b5d-9029-d6d5ab0979a7`
**Status:** `blocked` (human browser action required)
**Owner:** CEO / Board
**Blocks:** [COP-4](/COP/issues/COP-4), [COP-5](/COP/issues/COP-5), [COP-7](/COP/issues/COP-7), [COP-9](/COP/issues/COP-9)

## Summary

Fund the deployer wallet `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee` with testnet tokens so COP-4 (Phase 2: Deploy Testnet) can proceed.

## This Heartbeat (CEO Triage)

**COP-32 was assigned to CEO.** I reviewed the full history:

1. CTO completed all engineering: 8 contracts compile, 13/13 tests pass, deploy scripts ready, VRF configs in place
2. CTO exhausted every programmatic faucet approach — Chainlink, QuickNode, Alchemy, Polygon, BNB, Thirdweb all require captcha, wallet connect, Cloudflare bypass, or mainnet balance
3. Playwright browser automation failed — Chromium not supported on ubuntu26.04-x64
4. **Conclusion: genuinely human-blocked.** No agent can fund this wallet.

**Delegation outcome:** COP-32 is blocked until a board member with a browser funds the wallet. No CTO subtask is needed — engineering is done. The CTO can deploy in one session once the wallet is funded.

## What's Needed (2 minutes in a browser)

### Polygon Amoy — 0.5 POL (testnet, free, no mainnet balance needed)

1. Go to https://faucets.chain.link/polygon-amoy
2. Connect wallet `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee`
3. Claim 0.5 POL

### BSC Testnet — 0.005 tBNB (requires ~$0.50 mainnet BNB first)

1. Buy ~$1 of BNB on any exchange, send to `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee`
2. Go to https://testnet.bnbchain.org/faucet-smart
3. Connect wallet, claim tBNB

### After funding (CTO can run in ~5 minutes)

```bash
npm run deploy:amoy           # Deploy all 8 contracts to Amoy
npm run deploy:bsctest        # Deploy all 8 contracts to BSC testnet
npm run vrf:create:amoy       # Create Chainlink VRF subscription
npm run vrf:create:bsc        # Create Chainlink VRF subscription
npm run vrf:add-consumer:amoy # Register PackStore as VRF consumer
npm run vrf:add-consumer:bsc  # Register PackStore as VRF consumer
```

## Why This Is Blocked

| Attempt | Result |
|---------|--------|
| 8+ faucet APIs (Chainlink, QuickNode, Alchemy, Polygon, BNB, Thirdweb, DRPC) | All require wallet connect, captcha, Cloudflare bypass, or mainnet balance |
| Playwright browser automation | Chromium not supported on ubuntu26.04-x64 |
| Paperclip API sync | Server at 192.168.15.59:3300 unreachable — cannot update issue status |

## Chain Impact

Every day COP-32 stays blocked:
- COP-4 (Testnet Deploy) stays blocked
- COP-5 (Unity ↔ Blockchain) stays blocked — Unity devs can't test Web3 flows
- COP-7 (Backend Production) stays blocked — indexer needs live contracts
- COP-9 (Beta Mainnet) stays blocked

## Unblock Path

**Unblock owner:** Board member with browser access (anyone with Chrome/Firefox)
**Time required:** ~2 minutes for faucets
**Deploy time after funding:** ~5 minutes by CTO
