# 06-03 KYC/AML via Payment Provider — Completion

**Issue:** COP-16
**Status:** Done
**Verification:** All modules implemented, imports resolve, KYC endpoints registered, tests cover consent/age flow

## What was built

### 1. Provider KYC Delegation (`backend/src/kyc/providerKyc.js`)
- Crossmint webhook integration (wallet-based KYC status sync)
- MoonPay webhook integration (customer-based KYC level mapping)
- Binance Pay webhook integration (buyerOpenId KYC verification)
- Webhook signature verification (HMAC-SHA256 with per-provider secrets)
- `KYC_LEVELS` hierarchy: none → basic → advanced → verified
- Per-jurisdiction purchase limits config (`JURISDICTION_LIMITS`):
  - US: $0 without KYC, requires "verified" level
  - UK: £250 threshold, requires "basic"
  - Germany: €100 threshold, requires "basic"
  - France: €100 threshold, requires "basic"
  - Brazil: R$~3k equivalent, requires "basic"
  - Default international: $300 threshold, requires "basic"
- `getKycGate()` — blocks tx if KYC not verified or level insufficient
- `checkPurchaseLimit()` — dual check: amount vs jurisdiction limit + KYC gate
- `getKycStatusForUser()` — public status endpoint

### 2. Transaction Limits (`backend/src/kyc/transactionLimits.js`)
- Tiered daily/per-tx limits by KYC level:
  - none: $0 daily, $0 per tx
  - basic: $1,000 daily, $300 per tx
  - advanced: $10,000 daily, $3,000 per tx
  - verified: $50,000 daily, $10,000 per tx
- In-memory daily usage tracker with hourly cleanup
- `enforceTransactionLimit()` — checks KYC status + jurisdiction limit + daily cap
- Automatic AML logging for blocked transactions
- `getLimitsForUser()` — public limits query

### 3. Wash Trading Detection (`backend/src/kyc/washTrading.js`)
- `detectRoundTrip()` — identifies circular trades (A→B, B→A within time window)
- `detectSameIpCycles()` — detects wallet cycling from same IP address
- Configurable thresholds from `config.js`:
  - `roundTripThreshold` (default: 2)
  - `timeWindowMinutes` (default: 60)
  - `sameIpThreshold` (default: 3)
- In-memory recent trade buffer (10k max)
- Automatic `wash_trading_alerts` DB creation on detection
- `getAlerts()` / `resolveAlert()` — admin alert management

### 4. AML Transaction Logging (`backend/src/kyc/amlLogger.js`)
- Risk scoring engine with configurable thresholds (0.2 LOW, 0.5 MEDIUM, 0.8 HIGH)
- High-risk jurisdiction detection (KP, IR, CU, SY, MM, RU)
- High-risk transaction type detection (withdrawal, p2p_trade, stake)
- Automatic flagging at MEDIUM+ risk level
- Structured flag reasons (e.g. "high_value, high_risk_jurisdiction")
- `getTransactionHistory()` — paginated query with flagged filter
- `getAmlStats()` — public thresholds/jurisdictions exposure

### 5. Database Schema (`backend/src/db/database.js`)
- `kyc_status` table: address, provider, provider_user_id, kyc_level, kyc_status, country_code, verified_at
- `aml_transactions` table: tx_hash, wallet_address, counterparty, tx_type, asset, amount_usd, jurisdiction, ip, user_agent, risk_score, flagged, flag_reason
- `wash_trading_alerts` table: alert_type, wallet_addresses, round_trip_count, volume_usd, resolved_at
- Indexes on wallet_address, created_at, flagged for query performance

### 6. Backend Integration (`backend/src/server.js`)
- `POST /kyc/age` — register DOB verification (authenticated)
- `GET /kyc/age-status` — query verification status (authenticated)
- `GET /kyc/purchase-limits` — get age-based purchase limits (authenticated)
- `GET /kyc/provider-status` — get KYC provider verification status (authenticated)
- `GET /kyc/limits` — get KYC-based transaction limits (authenticated)
- `POST /kyc/provider-webhook/:provider` — provider KYC webhook receiver
- `POST /kyc/parental-consent/init` — COPPA consent request
- `POST /kyc/parental-consent/confirm` — COPPA consent confirmation
- `POST /purchase/check` — pre-purchase KYC/AML/geofence validation (authenticated)
- `GET /aml/transactions` — admin AML transaction log (authenticated + admin)
- `GET /aml/stats` — admin AML stats (authenticated + admin)
- `POST /marketplace/trade-record` — record P2P trade for wash detection (authenticated)
- `GET /marketplace/wash-alerts` — admin wash alerts (authenticated + admin)
- `POST /marketplace/wash-alerts/:id/resolve` — admin resolve alert (authenticated + admin)

## Trade-offs (CTO lenses)

- **Cost of delay:** Without KYC limits, users could bypass jurisdictional purchase caps. High legal risk. Implemented now.
- **Build vs reuse:** KYC verification delegated to Crossmint/MoonPay/Binance Pay. Only the webhook receiver and limits engine are custom. Correct approach for Ring 2.
- **In-memory limits tracker:** Daily usage tracking is in-memory (Map), lost on restart. Acceptable for Ring 2 — migrate to DB on mainnet.
- **Wash trading detection:** In-memory trade buffer (10k) + heuristic (round-trip, same-IP). Not production-grade ML. Sufficient for Ring 2 marketplace monitoring.
- **Security surface:** Webhook signatures verified with timing-safe compare. KYC status only writable via webhook (signed). Read operations authenticated via JWT.
- **Two-way door:** All KYC provider interfaces are abstracted through `handleProviderWebhook()` — adding a new provider is a case addition. Daily limits are configurable constants.

## Files created/updated

| File | Action |
|------|--------|
| `backend/src/kyc/providerKyc.js` | created |
| `backend/src/kyc/transactionLimits.js` | created |
| `backend/src/kyc/washTrading.js` | created |
| `backend/src/kyc/amlLogger.js` | created |
| `backend/src/kyc/ageVerification.js` | created |
| `backend/src/kyc/chainVerification.js` | created |
| `backend/src/db/database.js` | updated (KYC + AML + wash tables) |
| `backend/src/server.js` | updated (all KYC/AML endpoints) |
| `backend/src/config.js` | updated (KYC webhook secrets, AML/WASH config) |
| `backend/test/api.test.js` | updated (KYC endpoint tests) |
