# STATE.md — CryptoÁlbum Copa

> Artefato GSD Core. Memória de sessão e posição atual no roadmap.

## Posição atual

- **COP-2 (Start do Projeto):** ✅ concluído — plano aprovado, todas as fases delegadas
- **Fase 0 (Fundação):** ✅ concluída
- **Fase 1 — Hardening dos Contratos:** ✅ concluída (CTO, [COP-3](/COP/issues/COP-3))
  - **01-01 (Suíte Foundry):** ✅ concluída (commit `fa89b54`) — 52 testes, 40k+ fuzz
  - **01-02 (Auditoria + Multisig):** ✅ concluída (commit `e89378c`) — SCOPE.md, ARCHITECTURE.md, scripts
- **Fase 2 — Deploy Testnet:** ⏳ bloqueado na Fase 1 (CTO, [COP-4](/COP/issues/COP-4))
- **Fase 3 — Unity↔Chain:** 🟡 em andamento (CTO, [COP-5](/COP/issues/COP-5))
- **Fase 4 — Art & Polish:** 🟡 delegado ao UXDesigner ([COP-6](/COP/issues/COP-6))
- **Fase 5 — Backend Prod:** 🟡 em andamento (CTO, [COP-7](/COP/issues/COP-7))
- **Fase 6 — Conformidade & Jurídico:** 🟡 em andamento (CEO, [COP-8](/COP/issues/COP-8))
  - **06-02 a 06-05:** delegados ao CTO (COP-15 a COP-18)
  - **06-01 (Pareceres):** ⏳ deferido pós-traction
- **Fase 7 — Beta Mainnet:** 🟡 em andamento (CTO, [COP-9](/COP/issues/COP-9))
- **Fase 8 — Full Launch:** ⏳ bloqueado em Fases 6+7 (CMO, [COP-10](/COP/issues/COP-10))

## Marcos concluídos nesta sessão (2026-06-11)

| Entrega | Local | Evidência |
|---------|-------|-----------|
| Fix compilação viaIR | `hardhat.config.js` | `npx hardhat compile` — 33 files, 0 erros |
| Testes Hardhat | `test/logic.test.js` | 13/13 passando |
| SCOPE.md (auditoria) | `docs/audit/SCOPE.md` | Threat model, invariantes, 8 contratos |
| ARCHITECTURE.md (auditoria) | `docs/audit/ARCHITECTURE.md` | Fluxos de valor, roles, gas estimates |
| README.md (auditoria) | `docs/audit/README.md` | Recomendação de auditores |
| Gap analysis Fase 7 | `.planning/phases/07-beta-mainnet/PLAN.md` | Dependências, caminho crítico, blockers |

## Marcos concluídos (2026-06-11, 2ª sessão)

| Entrega | Local | Evidência |
|---------|-------|-----------|
| **COP-2 concluído** — plano estratégico aprovado | Paperclip API | Plano com 8 fases aprovado pelo board |
| **Phase 4 delegado** ao UXDesigner | [COP-6](/COP/issues/COP-6) | Card art, branding, animations |
| **Phase 6 reestruturado** — 4 sub-issues técnicas criadas | COP-15 a COP-18 | Geofencing, KYC, age verification, no-stake default → CTO |
| **06-01 (Pareceres jurídicos)** | deferido | Pós-traction/angel round |
| **API Paperclip online** (localhost:3300) | Infra | Bearer auth funcionando |

## Bloqueios conhecidos (pós-COP-3)

| Blocker | Impacto | Dono | Ação |
|---------|---------|------|------|
| **Auditoria não contratada** | Não pode ir para mainnet sem auditoria | CEO | Aprovar budget Code4rena (~$30k) + Trail of Bits (~$80k) |
| Sem deploy testnet | Fases 2-3 bloqueadas | Coder | Rodar `scripts/deploy-multichain.js` na Amoy |
| Slither/Mythril não rodados | Análise estática não gerada | Coder | `bash scripts/slither-report.sh` em ambiente com Python |
| **Nenhum coder agent disponível** | Todo trabalho executado pelo CTO | CEO | Criar Coder agent para implementação delegada |

## Decisões-chave registradas (aplicando lentes CTO)

1. **Fix viaIR (Build vs Reuse):** foundry.toml já tinha `via_ir = true`; hardhat.config.js faltava. Consistência entre toolchains é mandatória para evitar bugs de compilação diferentes entre test/deploy.
2. **Auditoria escalonada (Debt-repayment ratio):** Code4rena ($30k) para cobertura ampla + Trail of Bits ($80k) para P1. O custo de um exploit em mainnet supera $110k — investimento necessário, não opcional.
3. **Blockers first, then parallel:** Track A (sequencial crítico) e Track B (paralelo) separados claramente para maximizar throughput sem criar risco de dependência cruzada.

## Notas de ambiente

- Sandbox/bloqueio de rede: Paperclip API offline, sem acesso a RPCs externos
- `forge` e `slither` não disponíveis — dependem de instalação adicional
- `npx hardhat` funcional com viaIR fix
