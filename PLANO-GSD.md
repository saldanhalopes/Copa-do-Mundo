# 📋 Plano Completo de Implementação — CryptoÁlbum Copa
### Documentado com GSD Core (Git. Ship. Done)

> Este documento consolida o roadmap GSD, requisitos técnicos, skills e agentes
> necessários por fase. Os artefatos GSD detalhados estão em `.planning/`.
>
> **Sobre o GSD:** o framework [open-gsd/gsd-core](https://github.com/open-gsd/gsd-core)
> é um sistema de *spec-driven development* que organiza projetos em um loop de 5 passos
> (Discuss → Plan → Execute → Verify → Ship), rodando trabalho pesado em sub-agentes de
> contexto limpo. Aplicamos sua **estrutura e convenções** (`.planning/`, REQ-IDs, fases
> com Success Criteria). *Nota: o pacote npm não foi instalado e nenhum token foi usado —
> a comunidade reporta que o token $GSD foi ligado a um rug-pull; usamos apenas a metodologia.*

---

## Como o GSD organiza este projeto

```
.planning/
├── config.json              ← workflow (milestone, 4 research agents, waves paralelas)
├── PROJECT.md               ← visão e escopo
├── REQUIREMENTS.md          ← 38 REQ-IDs (COL, PACK, GAME, RANK, TRADE, UI, NFR)
├── ROADMAP.md               ← 8 fases mapeadas aos requisitos
├── STATE.md                 ← posição atual (Fase 0 ✅ → próxima: Fase 1)
└── phases/
    └── 01-hardening-contratos/
        ├── CONTEXT.md        ← decisões de implementação
        ├── 01-01-PLAN.md     ← tarefa atômica: suíte Foundry + fuzzing
        └── 01-02-PLAN.md     ← tarefa atômica: auditoria + multisig
```

O loop por fase: **/gsd-discuss-phase** → **/gsd-plan-phase** → **/gsd-execute-phase** → **/gsd-verify-work** → **/gsd-ship**.

---

## Visão geral das 8 fases

| Fase | Goal | Esforço¹ | Bloqueia | Skills-chave |
|---|---|---|---|---|
| **0. Fundação** ✅ | Contratos, geradores, clientes, docs | — feito | — | full-stack Web3, Unity, Solidity |
| **1. Hardening** | Testes + auditoria + multisig | 4-8 sem | tudo com $ | Solidity sec, Foundry |
| **2. Deploy testnet** | Subir e fiar contratos | 1-2 sem | 3, 7 | DevOps blockchain, IPFS |
| **3. Unity↔chain** | Ligar ChainSafe real | 3-5 sem | 7 | Unity C#, ChainSafe |
| **4. Arte & polish** | Arte final, som, marca | 4-8 sem | 7 | direção de arte, ilustração |
| **5. Backend prod** | Subgraph, matchmaking escalável, oráculo | 3-6 sem | 7 | Node, The Graph, infra |
| **6. Conformidade** | Pareceres, termos, KYC, geofencing | 6-12 sem² | 7, 8 | jurídico cripto/gaming |
| **7. Beta mainnet** | Launch sem aposta | 2-4 sem | 8 | Unity build, QA |
| **8. Launch** | PvP com aposta, lojas, marketing | contínuo | — | growth, ops, economia |

¹ Estimativas para um time pequeno (3-5 pessoas), paralelizável. ² Lead time jurídico longo — começar cedo.

---

## Requisitos técnicos por fase

### Fase 1 — Hardening dos Contratos
- **Stack:** Foundry (forge/fuzzing) + Hardhat (integração/deploy), Slither, Mythril
- **Entregas:** cobertura ≥95%, relatório de auditoria, Gnosis Safe 3/5, bug bounty Immunefi
- **Invariantes (fuzzing):** supply ≤ maxSupply, Σprobabilidades=10000, pote=2×stake, ELO≥0, freeze irreversível

### Fase 2 — Deploy Testnet
- **Stack:** Hardhat deploy, ethers, Pinata (IPFS), Arweave, Chainlink VRF subscription
- **Entregas:** 8 contratos na Amoy + BSC testnet, 1.352 cartas configuradas, metadados congelados, contratos verificados

### Fase 3 — Integração Unity ↔ Blockchain
- **Stack:** ChainSafe Web3.unity SDK, ABIs dos contratos, WalletConnect
- **Entregas:** conexão de carteira real, `balanceOfBatch` real, compra de pacote on-chain, PvP no MatchEscrow, fiat via Crossmint/Binance Pay
- **Substituir:** os stubs em `Web3Service.cs` pela API real do ChainSafe

### Fase 4 — Arte & Polish
- **Stack:** pipeline de arte (gerador `render_pro.py` como base), Figma, ferramentas de motion/áudio
- **Entregas:** arte final das 1.352 cartas, logo/marca, sons, animações, upload IPFS definitivo

### Fase 5 — Backend de Produção
- **Stack:** NestJS, PostgreSQL, Redis, The Graph (subgraph), API esportiva (Sportradar/API-Football)
- **Entregas:** subgraph indexando tudo, matchmaking escalável (Redis), oráculo esportivo real (álbum vivo), API com auth/rate-limit/monitoramento

### Fase 6 — Conformidade & Jurídico
- **Stack:** provedores KYC (delegado), geofencing (Cloudflare/IP), gestão de consentimento
- **Entregas:** pareceres por jurisdição, termos+privacidade (LGPD/GDPR), geofencing de pacotes/apostas, KYC no on-ramp, verificação de idade
- **Referência:** `JURIDICO-CONFORMIDADE.md`

### Fase 7 — Beta Mainnet (sem aposta)
- **Stack:** Unity build pipeline (Android/iOS/WebGL), TestFlight/Play Console (beta), telemetria
- **Entregas:** builds beta publicados, coleção+pacotes+trocas na mainnet Polygon, PvP por ranking, feedback

### Fase 8 — Launch Completo
- **Stack:** Google Play, App Store, WebGL hosting, ferramentas de growth/analytics
- **Entregas:** PvP com aposta onde legal, listagem nas lojas, coleção verificada OpenSea/Binance NFT, economia balanceada

---

## Skills necessárias (humanas)

| Skill | Fases | Criticidade |
|---|---|---|
| Solidity sênior + segurança | 1, 2 | 🔴 crítica |
| DevOps blockchain (deploy, IPFS, VRF) | 2, 3 | 🔴 crítica |
| Unity C# + ChainSafe Web3 | 3, 7 | 🔴 crítica |
| Direção de arte + ilustração | 4 | 🟡 alta |
| Backend Node/NestJS + The Graph | 5 | 🟡 alta |
| Jurídico cripto/gaming | 6 | 🔴 crítica |
| Sound design / motion | 4 | 🟢 média |
| Growth / go-to-market | 8 | 🟡 alta |
| Economia de jogos / tokenomics | 8 | 🟡 alta |

---

## Agentes GSD por fase (sub-agentes de execução)

O GSD roda trabalho em sub-agentes de contexto limpo. Agentes sugeridos:

| Fase | Agentes GSD |
|---|---|
| 1 | `solidity-security-researcher`, `test-coverage-executor`, `audit-prep-checker` |
| 2 | `deploy-orchestrator`, `ipfs-uploader`, `contract-verifier` |
| 3 | `unity-web3-integrator`, `abi-binding-generator`, `wallet-flow-tester` |
| 4 | `art-pipeline-builder`, `asset-optimizer` |
| 5 | `subgraph-author`, `backend-scaler`, `oracle-integrator` |
| 6 | `compliance-mapper`, `geofence-implementer` |
| 7 | `build-pipeline`, `qa-runner`, `telemetry-setup` |
| 8 | `store-submitter`, `economy-balancer`, `launch-coordinator` |

> No GSD real, esses agentes são spawnados com `/gsd-plan-phase` (4 researchers em paralelo)
> e `/gsd-execute-phase` (executores em waves, cada um com contexto limpo de 200k tokens).

---

## Caminho crítico

```
Fase 1 (auditoria) ──> Fase 2 ──> Fase 3 ──┐
                                            ├──> Fase 7 ──> Fase 8
Fase 6 (jurídico, começar JÁ) ──────────────┘
```

- **Fase 1 é o gargalo absoluto** — nada com dinheiro real avança sem auditoria.
- **Fase 6 tem o maior lead time** — iniciar os pareceres jurídicos em paralelo, desde já.
- **Fases 4 e 5 paralelizam** com 1-3 (não dependem da auditoria).

---

## Próximo passo concreto (GSD)

```bash
# instalar o GSD Core (ambiente real, fora deste sandbox)
npx @opengsd/gsd-core@latest      # escolher Claude Code + local

# iniciar o loop da Fase 1
/gsd-discuss-phase 1              # já há um CONTEXT.md de referência em .planning/
/gsd-plan-phase 1                 # já há 2 planos atômicos de referência
/gsd-execute-phase 1
/gsd-verify-work 1
/gsd-ship 1
```

Os artefatos em `.planning/phases/01-hardening-contratos/` servem de ponto de partida
para o discuss/plan da Fase 1.
