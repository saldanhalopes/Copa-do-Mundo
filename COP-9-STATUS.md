# COP-9 — Phase 7: Beta Mainnet — Status: Blocked

**Owner:** CTO (cb877440-af60-478c-a44e-73a4b7926681)
**Prioridade:** High
**Última verificação:** 2026-06-11T04:33UTC

## Resumo

Beta Mainnet (Phase 7) não é acionável até que as dependências (COP-4, COP-5, COP-6, COP-7) sejam concluídas e a auditoria de segurança seja aprovada pelo board.

Este documento consolida o estado atual de cada dependência, o que já está pronto, o que falta, e os próximos passos concretos.

## Última atualização (2026-06-11T04:33UTC)

- Status atualizado de `in_progress` para `blocked` via API Paperclip
- `blockedByIssueIds` configurado: COP-4, COP-5, COP-6, COP-7
- Recovery action (missing_disposition) resolvida automaticamente
- Comentário detalhado registrado com blockers, what-is-ready, e unblock path

---

## Verification Run (2026-06-11T04:30UTC)

| Check | Result |
|-------|--------|
| `npx hardhat compile --force` | 33 files, 0 warnings |
| `npx hardhat test` | 13/13 passing |
| `node --test backend/test/api.test.js` | 17/17 passing |
| `node --check backend/src/server.js` | OK |
| Solidity contracts | 8 contracts, all verified |

---

## Dependência A: COP-4 — Deploy Testnet (Phase 2)

**Status:** Blocked — external resources needed

### ✅ Pronto
- Deploy script: `scripts/deploy-testnet.js` — deploy completo de 7 contratos + role wiring
- Deploy multichain: `scripts/deploy-multichain.js` — mainnet Polygon + BNB
- Hardhat config: Amoy (chainId 80002) and BSC testnet (chainId 97) configured
- Contracts: 8 contracts compile clean, 13/13 tests pass
- VRF configs for Amoy testnet in deploy script (coordinator + keyHash)

### ❌ Bloqueadores externos
1. **Wallet funding** — carteira com test MATIC na Amoy (≈0.1-1 POL para deploys)
2. **Chainlink VRF Subscription** — criar subscription em `vrf.chain.link` e obter `CHAINLINK_SUB_ID_POLYGON`
3. **Env vars** — `PRIVATE_KEY`, `TREASURY_ADDRESS`, `CHAINLINK_SUB_ID_POLYGON`

### Como desbloquear nas próximas 24h
```bash
# 1. Gerar carteira (ou usar existente)
# 2. Pedir faucet: https://faucet.polygon.technology/
# 3. Criar VRF sub: https://vrf.chain.link/
# 4. Exportar vars:
export PRIVATE_KEY=0x...
export TREASURY_ADDRESS=0x...
export CHAINLINK_SUB_ID_POLYGON=1234
# 5. Deploy:
npx hardhat run scripts/deploy-testnet.js --network amoy
```

### Acceptance Criteria
- [ ] 7 contratos deployed na Amoy testnet
- [ ] Roles configuradas (MINTER → PackStore, MATCH → MatchEscrow)
- [ ] Contratos verificados no Polygonscan
- [ ] `deployments/amoy.json` gerado com endereços
- [ ] VRF subscription linked ao PackStore como consumer

---

## Dependência B: COP-5 — Unity ↔ Blockchain (Phase 3)

**Status:** Blocked on COP-4

### ✅ Pronto
- Full Unity project structure with 18+ C# scripts
- `Web3Service.cs` with all method stubs (ConnectWallet, BuyPack, CreateMatch, etc.)
- ABI loading infrastructure in `Unity/Assets/Resources/ABIs/`
- `ContractConfig` with all 3 networks (Polygon, Amoy, BNB)
- Card system: `CardCatalog.cs`, `CountryDatabase.cs`, `BattleEngine.cs`
- UI screens: Album, PackStore, Trade, Ranking, Match
- Scene builder: `SceneBuilder.cs`

### ❌ Bloqueadores
1. **COP-4 must complete** — testnet contract addresses needed to fill `ContractConfig`
2. **ChainSafe Web3 SDK** — needs NuGet package and integration replacing stubs:
   - `ConnectWallet()` — replace mock `0x9aF2...b41` with real WalletConnect
   - `ReadBalanceOf()` — replace `Task.Delay(10); return 0` with real `balanceOf` call
   - `BuyPack()` — replace simulated tx with real `comprarPacote()` call
   - `CreateMatch()` / `AcceptMatch()` — replace stubs with real MatchEscrow calls
   - `GetElo()` — replace stub with real `RankingSeasons.getRating()`
3. **ABI JSON files** — need to be regenerated from compiled contracts and placed in `Unity/Assets/Resources/ABIs/`

### Próximos passos (pós COP-4)
1. Generate ABIs: `npx hardhat compile && cp artifacts/contracts/*.json unity/Assets/Resources/ABIs/`
2. Fill `ContractConfig.Amoy` with deployed addresses
3. Integrate ChainSafe SDK (WalletConnect + contract calls)
4. Test wallet connect on Amoy with real contract reads

---

## Dependência C: COP-6 — Art & Polish (Phase 4)

**Status:** Delegated to UXDesigner (not CTO scope)

### ✅ Pronto (from CTO perspective)
- Card generator: `/generator/generate_cards.py` + `render_pro.py`
- 680 card slots defined in `CardCatalog.cs` with countries/positions
- Battle effects and UI framework in Unity

### Pendente
- Final card art (2D illustrations for 680 cards)
- Logo/branding
- Sound design and animations
- IPFS upload of final assets

---

## Dependência D: COP-7 — Backend Production (Phase 5)

**Status:** 80% complete. Blocked on COP-4.

### ✅ Pronto
- Express server with full REST API (19 routes)
- WebSocket matchmaking (Matchmaker.js with ELO/stake queue)
- Age verification gate (COP-14): DOB registration, COPPA flow, parental consent
- KYC/AML (COP-16): provider webhooks, transaction limits, wash trading detection
- Geofencing: jurisdiction blocking for packs/staking
- SQLite database with players, matches, verification logs
- Rate limiting, JWT auth, Prometheus metrics
- 17/17 API tests passing

### ❌ Bloqueadores
1. **COP-4 must complete** — contract addresses needed for Indexer config
2. **Indexer (`backend/src/indexer/Indexer.js`)** — needs real RPC + contract addresses to start listening
3. **Subgraph** — skeleton exists (`backend/subgraph/`) with full schema + event handlers, but needs deployed address + hosted service

### Próximos passos (pós COP-4)
1. Set `CONTRACT_PACK_STORE`, `CONTRACT_MATCH_ESCROW`, `CONTRACT_RANKING` env vars
2. Start indexer: `node src/indexer/listen.js`
3. Deploy subgraph: `cd subgraph && npm run build && npm run deploy`
4. Add PostgreSQL migration (SQLite is dev-only)
5. Set up Redis for production matchmaking

---

## Bloqueador Transversal: Paperclip API Offline

**Problema:** `http://192.168.15.59:3300` — Connection refused.

**Impacto:**
- Não é possível sincronizar status de issues via API
- Não é possível criar subtarefas ou comentar
- CEO e recovery system não recebem atualizações de progresso
- Causou falso positivo no COP-21 (productivity review)

**Dono:** CEO / Infra
**Ação:** Reiniciar servidor Paperclip
**Comando quando voltar:**
```bash
# Verificar status:
curl -s http://192.168.15.59:3300/api/agents/me -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

---

## Bloqueador Transversal: Auditoria de Segurança

**Problema:** Nenhuma auditoria de segurança contratada.

**Impacto:** Fase 7 (Beta Mainnet) não pode deployar em produção sem auditoria. Risco de exploit em mainnet Polygon com valor real.

**Custo estimado:**
- Code4rena: ~$30k (audit contest, ampla cobertura)
- Trail of Bits: ~$80k (P1 focado)
- Total: ~$30-110k

**Dono:** CEO / Board
**Ação:** Aprovar budget de auditoria

---

## Caminho Crítico para COP-9

```
Timeline (estimado, com 1-2 engenheiros):
  Semana 1:  COP-4 (Deploy Testnet) — 1-2 dias se wallet/VRF funding disponível
  Semana 1-2: COP-7 (Backend) — indexar testnet, configurar subgraph
  Semana 2-4: COP-5 (Unity) — ChainSafe SDK, substituir stubs, testar com testnet
  Semana 3-6: COP-6 (Art) — paralelo com COP-5
  Semana 6+:  COP-9 (Beta Mainnet) — após auditoria aprovada + todas fases concluídas
```

---

## Resumo de Arquivos por Issue

### COP-4 relevant files
- `scripts/deploy-testnet.js` — deploy script ready
- `scripts/deploy-multichain.js` — mainnet deploy
- `hardhat.config.js` — network config (Amoy, BSC testnet, Polygon, BNB)
- All 8 contracts in `contracts/`

### COP-5 relevant files
- `unity/Assets/Scripts/Web3/Web3Service.cs` — stubs to replace
- `unity/Assets/Scripts/Web3/` — Web3 integration layer
- `unity/Assets/Scripts/Battle/BattleEngine.cs` — PvP battle logic
- `unity/Assets/Scripts/UI/Screens/*.cs` — UI screens

### COP-7 relevant files
- `backend/src/server.js` — main API server
- `backend/src/indexer/Indexer.js` — on-chain event indexer
- `backend/src/matchmaking/Matchmaker.js` — PvP matchmaking
- `backend/src/kyc/*.js` — KYC/Age/AML pipeline
- `backend/src/middleware/*.js` — auth, rate-limit, geofence, monitor
- `backend/subgraph/` — The Graph subgraph
- `backend/test/*.test.js` — 17 passing tests
