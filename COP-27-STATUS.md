# COP-27 — Verify Testnet Balances and Deploy After Faucet Funding

**Status:** blocked
**Owner:** CTO
**Generated:** 2026-06-11 05:48 UTC

## Verification evidence

| Check | Result |
|-------|--------|
| Compilation (8 contracts) | ✅ OK — up to date |
| Unit tests (13) | ✅ 13/13 passing |
| Amoy wallet balance | ❌ 0.000000 POL |
| BSC Testnet wallet balance | ❌ 0.000000 tBNB |
| Signer address matches expected | ✅ `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee` |
| BNB tx receipt (b0f8ea63) | ⚠️ Funds went to address `0x472713fc4bf65658bb99be93c39ccbc00b6ca2e6`, NOT our wallet |

## Latest heartbeat (2026-06-11 05:48 UTC)

The board provided BNB tx `0xea5ebc0a1e8c4f9eda39bc59be695441a3b31158de379092690c8a269ed2733c` and later commented that their wallet is `0x472713Fc4bF65658bB99be93C39cCbC00B6cA2e6`.

**Analysis:**
- Transaction confirmed in block `112696692`
- Sent **25 LINK tokens** (not tBNB) from Chainlink faucet (`0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06`)
- Recipient: `0x472713Fc4bF65658bB99be93C39cCbC00B6cA2e6` (board's wallet) — confirmed ✅
- Our deployer (from .env PRIVATE_KEY): `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee` — does NOT match board's wallet
- Both wallets have 0 native tBNB and 0 POL
- Board's wallet has 25 LINK ✅ (useful for Chainlink VRF subscriptions)

## Current state

**Two wallets in play:**

| Wallet | Source | tBNB | POL | LINK |
|--------|--------|------|-----|------|
| `0xD489A8a0347b1803Ce9aE9e1519E3e1056F781Ee` | Current PRIVATE_KEY in .env | 0 | 0 | 0 |
| `0x472713Fc4bF65658bB99be93C39cCbC00B6cA2e6` | Board's wallet | 0 | 0 | 25 |

**Deploy scripts:** Ready and tested (COP-4 verified full local deploy of all 7 contracts + role wiring)
**Toolchain:** `hardhat compile` passes, `npm test` passes

## Blocker: Faucets require mainnet balance (anti-bot)

The board tried the QuickNode faucet — it requires the wallet to have mainnet balance (e.g., 0.001 ETH on Ethereum mainnet). I checked all major faucets:

| Faucet | Amoy POL | BSC tBNB | Requirement |
|--------|----------|----------|-------------|
| **Chainlink** (faucets.chain.link) | ✅ 0.5 POL | ❌ LINK only | Wallet connect (no mainnet needed) |
| **BNB Chain official** (testnet.bnbchain.org) | ❌ | ✅ 0.3 tBNB | 0.002 BNB on **mainnet** |
| QuickNode | ❌ rejected | ❌ rejected | Mainnet balance |
| Alchemy | ❌ rejected | ❌ N/A | 0.001 ETH on mainnet |

**Path for Amoy (POL):** ✅ Use Chainlink faucet
- Visit https://faucets.chain.link/polygon-amoy
- Connect wallet → claim **0.5 POL** (enough for deployment gas)
- No mainnet balance needed

**Path for BSC Testnet (tBNB):** ❌ Needs mainnet BNB
- Official faucet requires 0.002 BNB on BSC mainnet (~$0.50)
- Board needs to get $1 of BNB on mainnet, or ask in BNB Chain Discord

**Which wallet to use:**
- Board's wallet `0x472713Fc4bF65658bB99be93C39cCbC00B6cA2e6` already has 25 LINK ✅
- If using this wallet, need to update .env PRIVATE_KEY to match it
- Then claim POL from Chainlink faucet + tBNB from BSC faucet

**After funding:**
```bash
npm run deploy:amoy
npm run deploy:bsctest
```

## Post-deploy follow-up

After successful testnet deploy, proceed with:
- [COP-26](/COP/issues/COP-26) — Configure Chainlink VRF subscriptions
- COP-28 — Verify deployed contracts on block explorer
