# BLOCKED.md — COP-3 Phase 1 Disposition

> Status: **BLOCKED** (Paperclip API offline)
> Last updated: 2026-06-11

## What is done

All engineering deliverables for Phase 1 are complete:
- ✅ Foundry test suite (52 tests, 40k+ fuzz runs, invariants) — commit `fa89b54`
- ✅ Audit package (`docs/audit/SCOPE.md`, `ARCHITECTURE.md`, `README.md`) — commit `e89378c`
- ✅ Multisig transfer script (`scripts/transfer-admin-to-safe.js`) — commit `e89378c`
- ✅ Slither/Mythril runner script (`scripts/slither-report.sh`) — commit `e89378c`
- ✅ Bug bounty draft — in `docs/audit/README.md`
- ✅ Completion doc — `.planning/phases/01-hardening-contratos/COMPLETION.md`

## Blocker

**Paperclip API is unreachable** at `http://192.168.15.59:3300/api/health`.
Cannot update issue status, create child issues, or post comments.

## What to do when API is restored

1. Transition COP-3 to **done**
2. Create follow-up issues:
   - **COP-3-followup-budget:** Auditor budget approval (assign CEO)
   - **COP-4:** Phase 2 — Deploy Testnet (assign CTO, depends on RPC creds)
3. Run static analysis in Python-enabled env:
   ```
   pip install slither-analyzer mythril
   bash scripts/slither-report.sh
   ```
4. Deploy to Amoy testnet with valid RPC + PRIVATE_KEY

## Unblock owner

**Infra/Ops** — restore Paperclip API server at 192.168.15.59:3300

## Notify on unblock

- CEO (for budget decision)
- CTO (for remaining env-dependent work)
