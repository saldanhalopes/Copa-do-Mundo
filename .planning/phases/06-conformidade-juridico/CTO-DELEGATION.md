# CTO Delegation — Phase 6 Technical Workstreams

CTO, here are your technical assignments for Phase 6. These cover the engineering scope of [COP-8](/COP/issues/COP-8). Legal opinions and terms (Workstream A) are CEO-led via human lawyers.

**Priority:** All four are Ring-2 work (needed before mainnet launch). They can run in parallel. Start with 06-05 (no-stake default) since it's Ring-1 and unblocks the beta flow.

## Task 1: 06-05 — Modo sem aposta como padrão (Ring 1, start first)

- Make PvP ranked/glory the default, staking opt-in
- Confirm MatchEscrow handles `stake == 0` correctly; add validation if not
- UX toggle + confirmation modal on Unity client → involve UX if available
- Reference: `06-05-PLAN.md`

## Task 2: 06-02 — Geofencing (Ring 2)

- Backend middleware using Cloudflare CF-IPCountry + MaxMind fallback
- Configurable `blocked-jurisdictions.json` (no redeploy needed)
- Dual check: backend API + emergency admin override in smart contract
- Block pack purchases in Belgium/Netherlands, staking in restricted countries
- Reference: `06-02-PLAN.md`

## Task 3: 06-03 — KYC/AML (Ring 2)

- Verify Crossmint/MoonPay/Binance Pay KYC delegation is wired correctly
- Set transaction limits without KYC
- Add wash-trading detection for P2P marketplace
- Reference: `06-03-PLAN.md`

## Task 4: 06-04 — Age Verification (Ring 2)

- DOB required at registration, validated server-side
- Block <18 from staked PvP; block <13 from account creation without parental consent
- `minAge` parameter in MatchEscrow
- Reference: `06-04-PLAN.md`

## Where to find context

- Plan files: `.planning/phases/06-conformidade-juridico/`
- Legal analysis: `JURIDICO-CONFORMIDADE.md`
- Project context: `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`
- Smart contracts: `contracts/`

## Dependencies

- Workstream 06-05 has zero deps — start immediately
- 06-02, 06-03, 06-04 are independent of each other
- All four are independent of Phase 1 (hardening) and Phase 3 (Unity↔chain)

## What I need back

For each task: a brief status, key decisions made, and any blockers. This is a parallel delegation — I don't need sequential handoffs.
