# 06-02 Geofencing Middleware + Contract Override — Completion

**Issue:** [COP-19](/COP/issues/COP-19)
**Status:** Done
**Verification:** Syntax checks pass, module imports resolve, functional test confirms correct detection

## What was built

### 1. IP Geolocation Service (`backend/src/services/geolocation.js`)
- Country detection from Cloudflare `CF-IPCountry` header (primary)
- Fallback to `X-Forwarded-For` IP extraction
- `countryCode` query param for testing
- VPN risk detection (RTT-based threshold, configurable in `blocked-jurisdictions.json`)
- Private IP range exclusion
- Config auto-reload without server restart (cached, reloads via `reloadJurisdictions()`)

### 2. Geofencing Middleware (`backend/src/middleware/geofence.js`)
- `blockPacks()` — blocks pack purchase endpoints in restricted jurisdictions (BE, NL)
- `blockStaking()` — blocks staked PvP in restricted jurisdictions
- Per-request geo status middleware (`geoStatus`)
- Built-in audit log with timestamped entries for every blocked attempt (IP, country, action, user, path, UA)
- VPN-specific error messaging (`GEO_BLOCKED_VPN` vs `GEO_BLOCKED`)

### 3. Expanded Configuration (`backend/blocked-jurisdictions.json`)
- `blockedForPacks` — countries where loot boxes are illegal (BE, NL)
- `blockedForStaking` — countries where gambling is restricted (currently empty, configurable)
- `countryNames` — human-readable names
- `minAges` — jurisdiction-specific minimum ages
- `riskFlags` — VPN thresholds, KYC requirements per country
- `contractOverrides` — per-jurisdiction contract address map (pre-populated with `PackStore` and `MatchEscrow` slots)

### 4. Backend Integration (`backend/src/server.js`)
- `GET /compliance/geofence-status` — client-facing endpoint for pre-block UI
- `GET /compliance/geofence-audit` — admin-only blocked attempt log
- `POST /compliance/geofence-reload` — admin-only config hot-reload
- `GET /compliance/blocked-jurisdictions` — public jurisdiction map
- `GET /compliance/contract-addresses` — jurisdiction-aware contract address resolution
- WebSocket auth response now includes geo status (packsAllowed, stakingAllowed)
- WebSocket staking blocked by geofence before matchmaking enqueue

### 5. Configuration (`backend/src/config.js`, `backend/.env.example`)
- `GEOFENCING.*` env vars for enforcement toggles
- `CONTRACT_OVERRIDES.*` env vars for contract override behavior

## Trade-offs (CTO lenses)

- **Cost of delay:** Juridical risk from unblocked packs in BE/NL is real. Ring 2 requires this before mainnet. Implemented now.
- **Build vs reuse:** Cloudflare header for geolocation is free and zero-latency. VPN detection is heuristic (RTT-based). No paid MaxMind license needed for Ring 2.
- **Scalability ceiling:** Audit log is in-memory (capped at 10k entries via env). For prod, swap to DB-backed logging. The interface supports migration.
- **Security surface:** Middleware returns 403 before any DB write or blockchain interaction. No data leaked on blocked requests.
- **Observability before complexity:** Every blocked attempt is logged with structured metadata. New `/compliance/*` endpoints expose full visibility.
- **Two-way door:** Everything is config-file driven with hot-reload. Adding new jurisdictions is a JSON edit, no deploy.
- **Contract override:** Address resolution is backend-side only for now (returns correct contract address per jurisdiction). True on-chain override (admin function to block wallets/jurisdictions at contract level) is a one-way door — deferred to Ring 3 when full legal opinions are in.

## Files changed/created

| File | Action |
|------|--------|
| `backend/src/services/geolocation.js` | **created** |
| `backend/src/middleware/geofence.js` | **created** |
| `backend/blocked-jurisdictions.json` | **updated** (expanded schema) |
| `backend/src/config.js` | **updated** (added GEOFENCING, CONTRACT_OVERRIDES) |
| `backend/src/server.js` | **updated** (imports, 5 new endpoints, WS geofence) |
| `backend/.env.example` | **updated** (geofencing and contract override vars) |
