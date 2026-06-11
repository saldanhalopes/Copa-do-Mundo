# ROADMAP.md — CryptoÁlbum Copa

> Artefato GSD Core. Fases de implementação mapeadas aos requisitos.
> Cada fase tem: Goal, Requirements, Success Criteria, Skills/Agentes.

```
8 fases | 38 requisitos mapeados | MVP nas fases 1-4 · Launch nas 5-8
```

| # | Fase | Goal | Requisitos | Status |
|---|---|---|---|---|
| 0 | Fundação (feito) | Contratos, geradores, protótipos, docs | COL-*, PACK-*, GAME-*, RANK-*, TRADE-* | ✅ concluída |
| 1 | Hardening dos contratos | Testes completos + auditoria + multisig | NFR-SEC-01/02 | ❌ pendente |
| 2 | Deploy testnet | Subir e fiar contratos na Amoy/BSC testnet | NFR-INFRA-02, COL-05 | ❌ |
| 3 | Integração Unity↔chain | Ligar ChainSafe real (carteira, NFTs, partidas) | UI-03/04, PACK-06 | ❌ |
| 4 | Arte & polish | Arte final das cartas, sons, identidade | UI-05, COL-05 | 🟡 |
| 5 | Backend de produção | Matchmaking escalável, subgraph, oráculo real | NFR-PERF-02, GAME-06, NFR-INFRA-01 | 🟡 |
| 6 | Conformidade & jurídico | Pareceres, termos, geofencing, KYC, idade | NFR-LEGAL-* | ❌ |
| 7 | Beta mainnet (sem aposta) | Lançamento controlado: coleção+trocas, PvP por glória | UI-01, mainnet | ❌ |
| 8 | Launch completo | PvP com aposta onde legal, marketing, lojas | todos | ❌ |

---

## Fase 1 — Hardening dos Contratos

**Goal:** Contratos prontos para mainnet — cobertura de testes ≥95%, auditoria externa, admin via multisig.

**Requisitos:** NFR-SEC-01, NFR-SEC-02, NFR-SEC-03 (parcial)

**Success Criteria:**
- [ ] Suíte Hardhat/Foundry com fuzzing, cobertura ≥95%
- [ ] Relatório de auditoria (CertiK/Hacken/Trail of Bits) sem issues críticas
- [ ] Admin migrado para Gnosis Safe 3/5
- [ ] Bug bounty publicado (Immunefi)

**Skills:** Solidity sênior, segurança de smart contracts, Foundry/fuzzing
**Agentes GSD:** `solidity-security-researcher`, `test-coverage-executor`, `audit-prep-checker`

---

## Fase 2 — Deploy Testnet

**Goal:** Todos os contratos no ar na testnet, configurados e fiados.

**Requisitos:** NFR-INFRA-02, COL-05, PACK-02

**Success Criteria:**
- [ ] 8 contratos deployados na Amoy (Polygon testnet) e BSC testnet
- [ ] `configurarFigurinhas` + `setStatsBatch` para as 1.352 cartas
- [ ] Arte e metadados no IPFS/Arweave, `freezeMetadata`/`freezeStats`
- [ ] Subscription Chainlink VRF criada, PackStore como consumer
- [ ] Contratos verificados (PolygonScan/BscScan)

**Skills:** DevOps blockchain, Hardhat, IPFS/Pinata, Chainlink
**Agentes GSD:** `deploy-orchestrator`, `ipfs-uploader`, `contract-verifier`

---

## Fase 3 — Integração Unity ↔ Blockchain

**Goal:** Cliente Unity falando com os contratos reais via ChainSafe.

**Requisitos:** UI-03, UI-04, PACK-06, GAME-04

**Success Criteria:**
- [ ] Conexão de carteira real (MetaMask/Trust/Binance/embedded) no Unity
- [ ] `LoadOwnedCards` lê `balanceOfBatch` real
- [ ] Compra de pacote dispara `comprarPacote` + callback VRF
- [ ] PvP cria/aceita partida no `MatchEscrow`
- [ ] Pagamento fiat via Crossmint/Binance Pay

**Skills:** Unity C#, ChainSafe Web3.unity, ethers/ABI
**Agentes GSD:** `unity-web3-integrator`, `abi-binding-generator`, `wallet-flow-tester`

---

## Fase 4 — Arte & Polish

**Goal:** Identidade visual de produção.

**Requisitos:** UI-05, COL-05

**Success Criteria:**
- [ ] Arte final das 1.352 cartas (ilustrador + gerador como base)
- [ ] Logo, identidade de marca, paleta
- [ ] Sons, música, animações de abertura de pacote e batalha
- [ ] Upload definitivo no IPFS

**Skills:** Direção de arte, ilustração, motion, sound design
**Agentes GSD:** `art-pipeline-builder`, `asset-optimizer` (humanos: ilustrador, sound designer)

---

## Fase 5 — Backend de Produção

**Goal:** Infra escalável para milhares de jogadores simultâneos.

**Requisitos:** NFR-PERF-02, GAME-06, NFR-INFRA-01

**Success Criteria:**
- [ ] Subgraph (The Graph) indexando coleção, partidas, ranking
- [ ] Matchmaking em produção (Redis, horizontal scaling)
- [ ] Oráculo esportivo com API licenciada (Sportradar/API-Football) → álbum vivo
- [ ] API com autenticação, rate limiting, monitoramento

**Skills:** Backend Node/NestJS, The Graph, Redis, infra cloud
**Agentes GSD:** `subgraph-author`, `backend-scaler`, `oracle-integrator`

---

## Fase 6 — Conformidade & Jurídico

**Goal:** Destravar o lançamento comercial legalmente.

**Requisitos:** NFR-LEGAL-01/02/03/04

**Success Criteria:**
- [ ] Pareceres jurídicos por jurisdição-alvo (BR, UE, EUA)
- [ ] Termos de Uso + Política de Privacidade (LGPD/GDPR)
- [ ] Geofencing para bloquear pacotes/apostas onde ilegal
- [ ] KYC/AML integrado no on-ramp
- [ ] Verificação de idade

**Skills:** Jurídico cripto/gaming, compliance, integração KYC
**Agentes GSD:** `compliance-mapper`, `geofence-implementer` (humanos: advogados)

---

## Fase 7 — Beta Mainnet (sem aposta)

**Goal:** Lançamento controlado na mainnet, sem dinheiro em risco no PvP.

**Requisitos:** UI-01, todos os COL/TRADE

**Success Criteria:**
- [ ] Builds Android/iOS/WebGL publicados (beta fechado)
- [ ] Coleção, pacotes e trocas reais na mainnet (Polygon)
- [ ] PvP por ranking/glória (sem stake)
- [ ] Telemetria e feedback de usuários beta

**Skills:** Unity build/release, QA, gestão de beta
**Agentes GSD:** `build-pipeline`, `qa-runner`, `telemetry-setup`

---

## Fase 8 — Launch Completo

**Goal:** Produto completo no mercado.

**Requisitos:** todos

**Success Criteria:**
- [ ] PvP com aposta ativado nas jurisdições aprovadas
- [ ] Listagem nas lojas (Google Play, App Store) + WebGL
- [ ] Coleção verificada na OpenSea e Binance NFT
- [ ] Marketing, parcerias, economia balanceada e monitorada

**Skills:** Go-to-market, growth, economia de jogos, ops
**Agentes GSD:** `store-submitter`, `economy-balancer`, `launch-coordinator`

---

## Dependências entre fases

```
Fase 0 (✅) ─┬─> Fase 1 ──> Fase 2 ──┬─> Fase 3 ──┐
             │                        │            ├─> Fase 7 ──> Fase 8
             └─> Fase 4 ──────────────┤            │
                                      └─> Fase 5 ──┘
                       Fase 6 ────────────────────────┘ (bloqueia 7-8)
```

Fase 1 é o gargalo crítico (auditoria). Fases 4 e 5 podem correr em paralelo com 1-3.
Fase 6 (jurídico) deve começar cedo pois tem lead time longo.
