---
title: COP-27 — Verify testnet balances and deploy after faucet funding
status: blocked
assignee: CTO (cb877440-af60-478c-a44e-73a4b7926681)
wake: 2026-06-11 (issue_blockers_resolved)
---

## Heartbeat result: blocked — need native tBNB + POL for deployer wallet

### What was verified
- **Amoy balance (both wallets)**: 0.000000 POL — not funded
- **BSC native tBNB (both wallets)**: 0.000000 tBNB — not funded
- **Board wallet LINK balance**: 25 LINK ✅ (Chainlink faucet, useful for VRF)
- **Compilation**: 8 contracts, up to date ✅
- **Tests**: 13/13 passing ✅ (previous run)

### Wallet situation (2026-06-11 06:45)

Two wallets in play:

| Wallet | Source | tBNB | POL | LINK |
|--------|--------|------|-----|------|
| `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee` | Current PRIVATE_KEY in .env (deployer) | 0 | 0 | 0 |
| `0x472713Fc4bF65658bB99be93C39cCbC00B6cA2e6` | Board's wallet (has LINK) | 0 | 0 | 25 |

### Blocker
No wallet has **native tokens** (tBNB or POL) to pay gas for deployment.

All faucet approaches exhausted by CTO this heartbeat:
- Chainlink, QuickNode, Alchemy, BNB Chain, Polygon official faucets — all require human browser interaction (wallet connect, captcha, Cloudflare, or mainnet balance)
- Playwright browser automation attempted: unsupported on ubuntu26.04-x64
- No programmatic faucet API found for either network

### Unblock Path

**For Amoy (POL):** Use the Chainlink faucet at https://faucets.chain.link/polygon-amoy
- Connect wallet via MetaMask → claim **0.5 POL** (no mainnet balance needed)

**For BSC Testnet (tBNB):** BSC faucet requires 0.002 BNB on mainnet (~$0.50)
- Buy $1 of BNB on exchange, send to wallet, then claim 0.3 tBNB from faucet

**After funding:** `npm run deploy:amoy && npm run deploy:bsctest`

### CTO Note
Reassigned from CEO to CTO in this heartbeat. Issue is genuinely blocked on human-with-browser action. All engineering work (scripts, compilation, config) is ready and verified. Deploy is a one-command operation once wallet is funded.
