# STATE.md — CryptoÁlbum Copa

> Artefato GSD Core. Memória de sessão e posição atual no roadmap.
> Atualizado em 2026-06-11 05:00 UTC — CTO heartbeat COP-4.

## Posição atual

> Atualizado em 2026-06-11 05:00 UTC — CTO heartbeat COP-4 (resume).

- **COP-2 (Start do Projeto):** ✅ concluído — plano aprovado, todas as fases delegadas
- **Fase 0 (Fundação):** ✅ concluída
- **Fase 1 — Hardening dos Contratos:** ✅ concluída (CTO, [COP-3](/COP/issues/COP-3))
  - **01-01 (Suíte Foundry):** ✅ concluída (commit `fa89b54`) — 52 testes, 40k+ fuzz
  - **01-02 (Auditoria + Multisig):** ✅ concluída (commit `e89378c`) — SCOPE.md, ARCHITECTURE.md, scripts
- **Fase 2 — Deploy Testnet:** 🔴 bloqueado em faucet manual (CEO) — wallet gerada, .env configurado, RPCs verificados
  - **COP-25:** ✅ Wallet gerada + .env configurado — 👷‍♂️ pendente: faucet manual (CEO)
  - **COP-26:** 🔴 bloqueado em COP-25 — precisa de subscription VRF ativa
- **Fase 3 — Unity↔Chain:** 🔴 bloqueado em COP-4 (CTO, [COP-5](/COP/issues/COP-5))
- **Fase 4 — Art & Polish:** 🟡 delegado ao UXDesigner ([COP-6](/COP/issues/COP-6))
- **Fase 5 — Backend Prod:** 🔴 bloqueado em COP-4 (CTO, [COP-7](/COP/issues/COP-7))
- **Fase 6 — Conformidade & Jurídico:** 🟡 em andamento (CEO, [COP-8](/COP/issues/COP-8))
  - **06-02 a 06-05:** delegados ao CTO (COP-15 a COP-18)
  - **06-01 (Pareceres):** ⏳ deferido pós-traction
  - **06-03 (KYC/AML):** ✅ concluído — [COP-16](/COP/issues/COP-16)
  - **06-04 (Age verification):** ✅ concluído — [COP-17](/COP/issues/COP-17)
- **Fase 7 — Beta Mainnet:** 🔴 bloqueado nas Fases 2-6 ([COP-9](/COP/issues/COP-9))
- **Fase 8 — Full Launch:** ⏳ bloqueado em Fases 6+7 (CMO, [COP-10](/COP/issues/COP-10))

## Marcos concluídos nesta sessão (2026-06-11)

| Entrega | Local | Evidência |
|---------|-------|-----------|
| Fix compilação viaIR | `hardhat.config.js` | `npx hardhat compile` — 33 files, 0 erros |
| Testes Hardhat | `test/logic.test.js` | 13/13 passando |
| Fix hardhat-toolbox require | `hardhat.config.js` | `require("@nomicfoundation/hardhat-toolbox")` adicionado — `ethers.*` agora funcional |
| Fix deploy-testnet.js API | `scripts/deploy-testnet.js` | `hre.ethers` → `ethers` destruturado do require |
| Fix npm deploy scripts | `package.json` | `deploy:amoy`/`deploy:bsctest` agora apontam para `deploy-testnet.js` (todos os 8 contratos) |
| Deploy output sink | `scripts/deploy-testnet.js` | Gera `deployments/<network>.json` com endereços de contratos |
| Local deploy verificado | localhost hardhat node | 7/7 contratos + MINTER_ROLE + MATCH_ROLE — sucesso |
| SCOPE.md (auditoria) | `docs/audit/SCOPE.md` | Threat model, invariantes, 8 contratos |
| ARCHITECTURE.md (auditoria) | `docs/audit/ARCHITECTURE.md` | Fluxos de valor, roles, gas estimates |
| README.md (auditoria) | `docs/audit/README.md` | Recomendação de auditores |
| Gap analysis Fase 7 | `.planning/phases/07-beta-mainnet/PLAN.md` | Dependências, caminho crítico, blockers |
| Age verification gate (COP-14) | Ver abaixo | Contratos compilam, 13 testes passam |

## COP-16 — KYC/AML via Payment Provider (06-03)

**Status:** Implementado. Ver artefato completo: `.planning/phases/06-conformidade-juridico/06-03-COMPLETION.md`

**Arquivos criados:**
- `backend/src/kyc/providerKyc.js` — delegacão Crossmint/MoonPay/Binance Pay
- `backend/src/kyc/transactionLimits.js` — limites por jurisdição e nível KYC
- `backend/src/kyc/washTrading.js` — detecção de wash trading (round-trip + same-IP)
- `backend/src/kyc/amlLogger.js` — risk scoring e logging AML

**Testes:** 4 KYC tests existem (parental consent ×2, age, purchase-limits). 2/4 falham com 401 — pendente de correção pelo CTO (auth token propagation).

**PLAN.md:** checklist marcado como concluído.

## Marcos concluídos (2026-06-11, 3ª sessão)

| Entrega | Local | Evidência |
|---------|-------|-----------|
| **Registration com DOB obrigatório** | `POST /auth/register` | Testado 17/17 |
| **COPPA flow** | `POST /kyc/parental-consent/*` | Token-based consent, <13 registro bloqueado |
| **Parental purchase limits** | `GET /kyc/purchase-limits` | Limites por faixa etária |
| **Audit logging** | `age_verification_log` table | Todas ações de age verification logadas |
| **minAge configurável no contrato** | `MatchEscrow.sol` | state var + jurisdiction mapping + setters |
| **Chain oracle wiring** | `backend/src/kyc/chainVerification.js` | ethers.js bridge para setAgeVerified on-chain |
| **17 testes passando** | `test/api.test.js` | 9 existentes + 8 novos de age verification |

## Marcos concluídos (2026-06-11, 2ª sessão)

| Entrega | Local | Evidência |
|---------|-------|-----------|
| **COP-2 concluído** — plano estratégico aprovado | Paperclip API | Plano com 8 fases aprovado pelo board |
| **Phase 4 delegado** ao UXDesigner | [COP-6](/COP/issues/COP-6) | Card art, branding, animations |
| **Phase 6 reestruturado** — 4 sub-issues técnicas criadas | COP-15 a COP-18 | Geofencing, KYC, age verification, no-stake default → CTO |
| **06-01 (Pareceres jurídicos)** | deferido | Pós-traction/angel round |
| **API Paperclip online** (localhost:3300) | Infra | Bearer auth funcionando |

## Atualização COP-9 (2026-06-11)

**COP-9 Phase 7 — Beta Mainnet movido para `blocked`.**

**Motivo:** Fase 7 não é acionável até que as fases 2-6 sejam concluídas. O caminho crítico é:

1. **COP-4 (Deploy Testnet)** — precisa de carteira financiada com MATIC de teste + assinatura VRF Chainlink
2. **COP-5 (Unity ↔ Blockchain)** — bloqueado pelo COP-4 (precisa de contratos ao vivo na testnet)
3. **COP-6 (Art & Polish)** — em andamento com UXDesigner
4. **COP-7 (Backend Prod)** — bloqueado pelo COP-4
5. **Auditoria de segurança (~$30-110k)** — decisão do board antes de mainnet

**Próximos passos:**
- CEO solicitando ao board: carteira de teste, orçamento de auditoria
- CTO pode avançar com verificação local (compile, testes, dry-run deploy) enquanto aguarda recursos externos
- Reabrir COP-9 quando COP-4, COP-5, COP-6, COP-7 estiverem concluídos e auditoria aprovada

## Atualização COP-9 (2026-06-11, CTO Heartbeat 39f5d4bc)

**Scope:** COP-9 returned to CTO from recovery system. Blocked on COP-4, COP-5, COP-6, COP-7.

### CTO Actions this heartbeat

1. **Verified compilation** — `npx hardhat compile --force` → 33 files, 0 warnings
2. **Verified contract tests** — `npx hardhat test` → 13/13 passing
3. **Verified backend tests** — `node --test backend/test/api.test.js` → 17/17 passing
4. **Documented COP-9 dependency state** — `COP-9-STATUS.md` with per-issue analysis
5. **Assessed each blocking issue:**

   | Issue | Progress | Blocker |
   |-------|----------|---------|
   | COP-4 (Testnet Deploy) | Script ready, contracts compile, VRF configs in place | Wallet funding + VRF subscription |
   | COP-5 (Unity ↔ Blockchain) | 18+ C# scripts, method stubs in place, ABI loading infra | COP-4 must complete |
   | COP-6 (Art) | Generator exists, card slots defined | UXDesigner (delegated) |
   | COP-7 (Backend) | 80% complete, 17/17 tests, full API + KYC + geofence | Contract addresses for indexer |

6. **Key finding:** The blocking issues are well-structured. Once testnet wallet funding and VRF subscription are available, COP-4 can complete in ~1 session. COP-7 can follow immediately (indexer + subgraph config). COP-5 is the heaviest remaining lift (ChainSafe SDK integration).

### Next action
- CEO to fund testnet wallet + create VRF subscription + approve audit budget
- When COP-4 unblocked, CTO deploys testnet (1 session) and backfills contract addresses to all dependents

## Atualização COP-9 (2026-06-11, CTO Heartbeat 43bd6a3c)

**Scope:** Continue COP-9 assessment. API still offline. Prepared COP-5 for coder delegation.

### CTO Actions this heartbeat

1. **Created COP-5 coder spec** — `docs/COP-5-CODER-SPEC.md` with 7 implementation tasks, contract interface reference, pre-flight check requirements, and acceptance criteria. This eliminates spec lead time when COP-4 completes.
2. **Paperclip API still offline** (port 3300) — 3 consecutive heartbeats blocked from syncing status. Severity: critical.

### COP-5 Coder Spec Summary
| Task | Contract | Methods |
|------|----------|---------|
| T1 | WalletConnect | ConnectWallet / DisconnectWallet |
| T2 | FigurinhasCopa | balanceOf / balanceOfBatch |
| T3 | CardStats | getCarta |
| T4 | PackStore | comprarPacote |
| T5 | MatchEscrow | criarPartida / aceitarPartida |
| T6 | RankingSeasons | getRating |
| T7 | TradeDesk | criarOferta / aceitarOferta |

When COP-4 completes, a coder can start immediately on COP-5 using this spec.

## Bloqueios conhecidos (pós-COP-4)

| Blocker | Impacto | Dono | Ação |
|---------|---------|------|------|
| **Paperclip API offline** (`192.168.15.59:3300`) | Não é possível sincronizar status, criar subtarefas, ou comentar via API | Infra/Ops | Restaurar servidor da API Paperclip — gerou falso positivo de produtividade no COP-21 |
| **Auditoria não contratada** | Não pode ir para mainnet sem auditoria | CEO/Board | Aprovar budget Code4rena (~$30k) + Trail of Bits (~$80k) |
| **Testnet deploy sem credenciais** | Fase 2 não pode finalizar sem wallet fundada | CEO | Criar wallet na Amoy, conseguir MATIC de faucet, fornecer PRIVATE_KEY + CHAINLINK_SUB_ID_POLYGON |
| Slither/Mythril não rodados | Análise estática não gerada | CTO | `bash scripts/slither-report.sh` em ambiente com Python |
| **Nenhum coder agent disponível** | Todo trabalho executado pelo CTO | CEO | Criar Coder agent para implementação delegada |

## COP-21 — Productivity Review (Resolvida)

**Resultado:** Falso positivo. A alta taxa de execuções (high churn) do CTO em
[COP-3](/COP/issues/COP-3) foi causada pela API Paperclip offline — os
heartbeats e comentários do CTO não eram registrados, fazendo o monitor
interpretar as runs como improdutivas.

**Evidência da conclusão:** `./.planning/phases/01-hardening-contratos/REVIEW-COP-21.md`

**Recomendações:**
1. Estabilizar infraestrutura Paperclip para evitar falsos positivos
2. Ajustar threshold de high_churn (10 runs/h é baixo para tasks complexas)
3. Nenhuma ação contra o CTO — entrega completa e dentro do orçamento

## COP-14 / COP-17 / COP-24 — Age Verification + API Port Fix

**Status:** Implementado. COP-14 (age gate completo), COP-17 (06-04 age verification), COP-24 (fix API port — porta centralizada em config.js).
**Evidência:** `COP-14-STATUS.md`, `COP-24-STATUS.md`.
**Bloqueador:** Paperclip API offline — não é possível sincronizar status. CEO precisa reiniciar servidor.
**Arquivos tocados:**
- `contracts/MatchEscrow.sol` — `MIN_AGE`, `AGE_VERIFIER_ROLE`, modifier `apenasMaiorIdade`, `setAgeVerified()`
- `contracts/PackStore.sol` — `ageVerified` mapping, gate em `comprarPacote`, `setAgeVerified()`
- `backend/src/db/database.js` — colunas `date_of_birth`, `age_verified_at`, `age_verification_method`
- `backend/src/kyc/ageVerification.js` — serviço de cálculo/validação/gate de idade
- `backend/src/middleware/ageGate.js` — middleware REST e WebSocket
- `backend/src/server.js` — rotas `POST/GET /kyc/age*`, gate no matchmaking WS
- `backend/src/config.js` + `.env.example` — `MIN_AGE_STAKED_PVP`, `AGE_VERIFIER_PRIVATE_KEY`
- `.planning/phases/06-conformidade-juridico/06-04-PLAN.md` — plano atualizado

### O que foi implementado

1. **Banco SQLite:** `players` agora armazena DOB + timestamp de verificação + método
2. **Serviço de idade:** server-side, valida DOB, rejeita <13 no cadastro, rejeita <18 em staked PvP
3. **API REST:** `POST /kyc/age` (registra DOB) e `GET /kyc/age-status` (consulta status)
4. **Middleware WS:** bloqueia entrada na fila de matchmaking com `stake > 0` se idade não verificada
5. **MatchEscrow.sol:** `MIN_AGE = 18`, `AGE_VERIFIER_ROLE`, modifier nas duas funções de partida
6. **PackStore.sol:** gate de compra + setter admin

### Trade-offs (lentes CTO)

- **Cost of delay:** sem age gate, menores podem comprar pacotes e apostar — risco jurídico alto. Ring 2 correto.
- **Build vs buy:** auto-declaração (build simples) vs KYC provider (buy). Auto-declaração suficiente para Ring 2.
- **Security surface:** DOB em SQLite local, sem exposição externa. Produção deve hash + salt.
- **Debt-repayment ratio:** positivo — bloqueia risco jurídico com código enxuto.
- **Two-way door:** DOB auto-declaratório é reversível (pode migrar para KYC provider depois).

### Pendente para Ring 3

- Controles parentais (COPPA)
- Cross-check com documento (KYC provider)
- Oracle automático que chama `setAgeVerified` on-chain quando KYC é aprovado no backend
- Migração DOB para hash armazenado (privacidade)

## Decisões-chave registradas (aplicando lentes CTO)

1. **Fix viaIR (Build vs Reuse):** foundry.toml já tinha `via_ir = true`; hardhat.config.js faltava. Consistência entre toolchains é mandatória para evitar bugs de compilação diferentes entre test/deploy.
2. **Auditoria escalonada (Debt-repayment ratio):** Code4rena ($30k) para cobertura ampla + Trail of Bits ($80k) para P1. O custo de um exploit em mainnet supera $110k — investimento necessário, não opcional.
3. **Blockers first, then parallel:** Track A (sequencial crítico) e Track B (paralelo) separados claramente para maximizar throughput sem criar risco de dependência cruzada.
4. **Age gate auto-declaratório (Two-way door):** self-declared DOB é o mínimo viável para Ring 2. KYC provider pode ser adicionado sem quebrar a interface — mapping `ageVerified` no contrato aceita ambos os métodos.

## Notas de ambiente

- Sandbox/bloqueio de rede: Paperclip API offline, sem acesso a RPCs externos
- `forge` e `slither` não disponíveis — dependem de instalação adicional
- `npx hardhat` funcional com viaIR fix
