# CONTEXT.md — Fase 1: Hardening dos Contratos

> Artefato GSD Core. Decisões de implementação capturadas antes do planejamento.

## Goal da fase

Contratos prontos para mainnet — cobertura ≥95%, auditoria externa, admin via multisig.

## Implementation Decisions

### Framework de testes
- **Decisão:** Foundry (forge) para testes de unidade + fuzzing, Hardhat para testes de integração e deploy.
- **Razão:** Foundry tem fuzzing nativo rápido (essencial para o `MatchEscrow` e `PackStore`); Hardhat integra melhor com scripts de deploy e verificação.

### Escopo da auditoria
- **Prioridade 1 (lida com dinheiro):** `MatchEscrow`, `PackStore`, `RankingSeasons` (paga prêmios).
- **Prioridade 2:** `FigurinhasCopa`, `FigurinhasCopaBNB`, `CardStats`, `TradeDesk`, `FantasyLeague`.
- **Decisão:** auditar o conjunto completo, mas o relatório deve destacar os de prioridade 1.

### Multisig
- **Decisão:** Gnosis Safe 3-de-5. Signatários: 3 founders + 2 advisors técnicos.
- Migrar `DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE` e o tesouro para o Safe antes do mainnet.

### Anti-fraude (escopo parcial nesta fase)
- **Decisão:** nesta fase, só o que é on-chain: limites por carteira no `PackStore` (já existe), e validação de posse no `MatchEscrow` (já existe). Anti-bot de aplicação fica na Fase 5 (backend).

### Invariantes a testar (fuzzing)
- Supply nunca excede `maxSupply` (COL-01).
- Soma das probabilidades de raridade = 10000.
- Pote do `MatchEscrow` sempre = 2× stake; vencedor + taxa = pote.
- ELO nunca fica negativo; soma de variações ELO de uma partida ≈ 0.
- `freezeStats`/`freezeMetadata` são irreversíveis.

## Riscos
- Achados de auditoria podem exigir refatoração → reservar buffer de tempo.
- Custo de auditoria de tier-1 é alto → considerar auditoria community + tier-1 só nos críticos.
