# Fase 7 — Beta Mainnet: Gap Analysis & Execution Plan

> Atualizado: 2026-06-11
> Autor: CTO
> Issue: [COP-9](/COP/issues/COP-9)

## TL;DR

Phase 7 (Beta Mainnet) is **not directly actionable** — all 6 prior phases have incomplete dependencies. The critical path to mainnet runs through: **Hardening (Phase 1) → Deploy testnet (Phase 2) → Unity integration (Phase 3)**. This document captures the current state, gaps, and a parallelized execution plan.

## Current Verified State

### ✅ Done & Verified
| Area | Evidence |
|------|----------|
| 8 Solidity contracts compile | `npx hardhat compile` — 33 files, 0 errors (viaIR fix applied) |
| Hardhat tests pass | 13/13 integration tests passing |
| Audit docs created | `docs/audit/SCOPE.md`, `ARCHITECTURE.md`, `README.md` |
| Backend matchmaking server | `backend/src/server.js` — Express + WS + SQLite + Redis |
| Backend indexer | `backend/src/indexer/Indexer.js` — event listener |
| Backend oracle | `backend/src/oracle/SportsOracle.js` |
| Deploy scripts | `scripts/deploy-testnet.js`, `deploy-multichain.js` |
| Unity client (6 screens) | `unity/Assets/Scripts/` |
| React prototype | `CryptoAlbumCopa.jsx` |
| Card generator + art renderer | `generator/generate_catalog.py`, `render_pro.py` |
| Legal/compliance doc | `JURIDICO-CONFORMIDADE.md` |
| Foundry tests exist | 52 tests per commit log (forge not available in this env to run) |

### 🔧 Fixed This Session
- `hardhat.config.js` — added `viaIR: true` (was missing, caused Stack Too Deep error)
- `docs/audit/` — created SCOPE.md, ARCHITECTURE.md, README.md for audit submission

## Critical Gap: Dependency Chain

```
Phase 1 ──> Phase 2 ──┬─> Phase 3 ──┐
                       │             ├─> Phase 7 ──> Phase 8
Phase 4 ───────────────┤             │
Phase 5 ───────────────┘             │
Phase 6 ─────────────────────────────┘
```

### Phase 1 — Hardening (Blocks everything)
- **01-01 (Foundry tests):** ✅ 100% done
- **01-02 (Audit + Multisig):** 🟡 Gap analysis created, slither/mythril not run, no Gnosis Safe deployed
- **Cost of delay:** Cannot deploy to any network without audit. **This is the critical bottleneck.**

### Phase 2 — Deploy Testnet
- Contracts never deployed to Amoy or BSC testnet
- No Chainlink VRF subscription created
- No IPFS upload of metadata
- **Blocks:** Phase 3 (Unity needs live contracts to test)

### Phase 3 — Unity Integration
- ChainSafe wallet connection is stub (not wired to real contracts)
- `LoadOwnedCards` reads mock data, not `balanceOfBatch`
- **Blocks:** Phase 7 (beta needs real wallet + contract interaction)

### Phase 4 — Art & Polish
- Generator works, produces placeholder cards
- No final art for 1,352 cards
- **Can run in parallel** with Phase 1-3

### Phase 5 — Backend Production
- Code exists and is well-structured
- Missing: `.env` configuration, Docker/cloud deployment, subgraph setup
- **Can run in parallel** with Phase 1-2

### Phase 6 — Legal
- `JURIDICO-CONFORMIDADE.md` exists as a reference doc
- No formal legal review, no KYC/geofencing implemented
- **Can start in parallel** but blocks mainnet launch

## Recommended Execution Path

### Track A — Critical Path (CTO-led, sequential)
```
Week 1-2:  Phase 1-02 completion (Slither → fix findings → Gnosis Safe deploy)
Week 3-4:  Phase 2 (deploy to Amoy testnet, configure VRF, upload IPFS)
Week 5-6:  Phase 3 (wire ChainSafe to testnet contracts, wallet flow)
Week 7-8:  Phase 7 (beta build, testnet verification → Polygon mainnet)
```

### Track B — Parallel (can start immediately)
```
Phase 4:  Art pipeline — commission/complete 1,352 card illustrations
Phase 5:  Backend ops — Docker setup, CI/CD, domain, SSL, monitoring
Phase 6:  Legal — formal review, KYC provider integration, terms of service
```

## Phase 7 Success Criteria (from ROADMAP.md)

- [ ] Builds Android/iOS/WebGL published (closed beta)
- [ ] Collection, packs and trades live on Polygon mainnet
- [ ] PvP by ranking/glory (no stake)
- [ ] Telemetry and user feedback loop

## Concrete Next Actions

1. **Run static analysis** — Install Slither + Mythril, run against all 8 contracts, document findings
2. **Deploy Gnosis Safe** — On Amoy testnet, 3/5 signers, document addresses
3. **Deploy testnet** — Run `npx hardhat run scripts/deploy-testnet.js --network amoy`
4. **Upload metadata to IPFS** — Pinata/Web3.Storage, run generator, freeze metadata
5. **Wire Unity wallet** — Connect ChainSafe to testnet contracts, test full flow

## Blockers

| Blocker | Impact | Unblock Path |
|---------|--------|-------------|
| Paperclip API offline (192.168.15.59:3300) | Cannot post comments, create child issues, update status | Restart Paperclip server or switch adapter |
| Forge not installed in current env | Cannot run Foundry tests (52 tests) | `foundryup` install |
| Slither/Mythril not installed | Static analysis not run | `pip install slither-analyzer mythril` |
| No .env configured | Cannot deploy to testnet | Create .env with PRIVATE_KEY, RPC URLs, TREASURY_ADDRESS, CHAINLINK_SUB_ID |
